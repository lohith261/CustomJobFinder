import type { TailorInput, TailorSuggestion } from "@/types";

export interface TailorResult {
  matchScore: number;
  presentKeywords: string[];
  missingKeywords: string[];
  suggestions: TailorSuggestion[];
  summary: string;
}

// ─── Claude-powered analysis ───────────────────────────────────────────────────

function buildPrompt(input: TailorInput): string {
  const { resumeText, jobTitle, jobDescription, jobTags } = input;

  return `You are an expert technical recruiter and resume analyst. Analyze how well this resume matches the job description.

Return ONLY valid JSON (no markdown code blocks, no extra text) in exactly this format:
{
  "matchScore": <integer 0-100>,
  "presentKeywords": ["<keyword>", ...],
  "missingKeywords": ["<keyword>", ...],
  "suggestions": [
    {"original": "<existing resume bullet or pattern>", "improved": "<stronger quantified version>", "reason": "<why this change matters>"}
  ],
  "summary": "<2-3 sentence honest assessment of fit>"
}

Rules:
- matchScore: holistic fit % considering skills alignment, experience level, seniority, and domain context
- presentKeywords: important technical skills/tools from the job that appear in the resume (max 20, lowercase)
- missingKeywords: important skills/tools from the job description absent from the resume (max 20, lowercase)
- suggestions: exactly 2-3 actionable bullet rewrites. "original" should reflect a generic resume pattern, "improved" must be specific, quantified, and reference technologies from the job's stack
- summary: include a fit label (strong / moderate / partial) and name the 2-3 most critical gaps

Job Title: ${jobTitle}
Required Tags: ${jobTags.join(", ") || "none"}

Job Description:
${jobDescription.slice(0, 3000)}

Resume:
${resumeText.slice(0, 4000)}`;
}

function parseClaudeResponse(text: string): TailorResult {
  // Strip markdown code fences if Claude wraps the JSON
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  return {
    matchScore: Math.min(100, Math.max(0, Math.round(Number(parsed.matchScore) || 0))),
    presentKeywords: (Array.isArray(parsed.presentKeywords) ? parsed.presentKeywords : [])
      .slice(0, 20)
      .map(String),
    missingKeywords: (Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [])
      .slice(0, 20)
      .map(String),
    suggestions: (Array.isArray(parsed.suggestions) ? parsed.suggestions : [])
      .slice(0, 3)
      .map((s: Record<string, string>) => ({
        original: String(s.original ?? ""),
        improved: String(s.improved ?? ""),
        reason: String(s.reason ?? ""),
      })),
    summary: String(parsed.summary ?? ""),
  };
}

// ─── Keyword extraction (fallback path) ───────────────────────────────────────

const TECH_KEYWORDS = [
  // Languages
  "python", "javascript", "typescript", "java", "go", "golang", "rust",
  "kotlin", "swift", "ruby", "php", "c++", "c#", "scala", "elixir",
  // Frontend
  "react", "nextjs", "next.js", "vue", "angular", "svelte", "tailwind",
  "css", "html", "webpack", "vite", "redux", "graphql",
  // Backend
  "node", "nodejs", "express", "fastapi", "django", "rails", "spring",
  "grpc", "rest", "api", "microservices", "serverless",
  // Cloud & Infra
  "aws", "gcp", "azure", "kubernetes", "k8s", "docker", "terraform",
  "ci/cd", "github actions", "jenkins", "linux", "bash",
  // Data
  "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
  "kafka", "spark", "pandas", "numpy", "etl", "data pipelines",
  // AI/ML
  "machine learning", "deep learning", "pytorch", "tensorflow", "llm",
  "nlp", "computer vision", "mlops", "feature engineering",
  // Practices
  "agile", "scrum", "tdd", "unit testing", "code review", "git",
  "system design", "distributed systems", "observability", "monitoring",
  // Soft skills
  "communication", "leadership", "mentoring", "cross-functional",
  "stakeholder", "collaboration", "product sense",
];

function extractKeywords(text: string): Set<string> {
  const lower = text.toLowerCase();
  const found = new Set<string>();

  for (const kw of TECH_KEYWORDS) {
    if (lower.includes(kw)) {
      found.add(kw);
    }
  }

  // Also capture capitalized acronyms and 2-4 letter tech terms
  const acronyms = text.match(/\b[A-Z]{2,5}\b/g) ?? [];
  for (const a of acronyms) {
    found.add(a.toLowerCase());
  }

  return found;
}

// ─── Bullet suggestion templates (fallback path) ──────────────────────────────

const SUGGESTION_TEMPLATES: Array<{
  context: string[];
  original: string;
  improved: (kw: string) => string;
  reason: string;
}> = [
  {
    context: ["engineer", "developer", "software"],
    original: "Worked on backend services and APIs.",
    improved: (kw) =>
      `Designed and implemented scalable ${kw} REST APIs serving 50M+ requests/day, reducing latency by 40%.`,
    reason: "Quantify impact and mention specific technologies from the job description.",
  },
  {
    context: ["frontend", "ui", "react"],
    original: "Built user interfaces using React.",
    improved: (kw) =>
      `Built responsive ${kw} component library used across 12 product teams, reducing UI development time by 30%.`,
    reason: "Add scope (cross-team impact) and measurable outcome.",
  },
  {
    context: ["data", "analytics", "ml", "machine learning"],
    original: "Analyzed data and built models.",
    improved: (kw) =>
      `Trained and deployed ${kw} models achieving 94% accuracy, directly driving a 15% uplift in conversion.`,
    reason: "Include accuracy metric and business outcome to stand out.",
  },
  {
    context: ["lead", "manager", "senior"],
    original: "Led a team of engineers.",
    improved: (kw) =>
      `Led a cross-functional team of 6 engineers to deliver ${kw} platform on time and 20% under budget.`,
    reason: "Specify team size and tie leadership to concrete delivery.",
  },
  {
    context: ["cloud", "aws", "infrastructure", "devops"],
    original: "Managed cloud infrastructure.",
    improved: (kw) =>
      `Architected ${kw} infrastructure reducing cloud spend by $200k/year while improving uptime from 99.5% to 99.99%.`,
    reason: "Cost savings and uptime figures are highly valued by hiring managers.",
  },
  {
    context: ["startup", "product", "growth"],
    original: "Contributed to product development.",
    improved: (kw) =>
      `Owned end-to-end ${kw} feature development from ideation to launch, increasing DAU by 25% in Q3.`,
    reason: "Show ownership and tie to a key growth metric.",
  },
];

function analyzeWithMock(input: TailorInput): TailorResult {
  const { resumeText, jobTitle, jobDescription, jobTags } = input;

  const jobText = [jobTitle, jobDescription, ...jobTags].join(" ");
  const resumeKeywords = extractKeywords(resumeText);
  const jobKeywords = extractKeywords(jobText);

  for (const tag of jobTags) {
    jobKeywords.add(tag.toLowerCase());
  }

  const presentKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const kw of Array.from(jobKeywords)) {
    if (resumeKeywords.has(kw)) {
      presentKeywords.push(kw);
    } else {
      missingKeywords.push(kw);
    }
  }

  const totalJobKws = jobKeywords.size;
  const matchedCount = presentKeywords.length;
  const rawScore = totalJobKws > 0 ? (matchedCount / totalJobKws) * 100 : 50;
  const matchScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  const jobLower = jobText.toLowerCase();
  const relevantSuggestions = SUGGESTION_TEMPLATES.filter((t) =>
    t.context.some((c) => jobLower.includes(c))
  );

  const topSuggestions = relevantSuggestions.slice(0, 3);
  const primaryKw = presentKeywords[0] ?? jobTags[0] ?? jobTitle.split(" ")[0];

  const suggestions: TailorSuggestion[] = topSuggestions.map((t) => ({
    original: t.original,
    improved: t.improved(primaryKw),
    reason: t.reason,
  }));

  if (suggestions.length === 0) {
    suggestions.push({
      original: "Responsible for implementing features.",
      improved: `Delivered ${jobTitle.toLowerCase()} features end-to-end, collaborating with product and design to ship 3 major milestones per quarter.`,
      reason: "Generic bullets weaken your application — tie achievements to the role title.",
    });
  }

  const scoreLabel =
    matchScore >= 75 ? "strong" : matchScore >= 50 ? "moderate" : "partial";

  const missingTopKws = missingKeywords.slice(0, 3).join(", ");
  const summary =
    matchScore >= 75
      ? `Your resume shows a ${scoreLabel} match for this ${jobTitle} role, covering most of the key technical requirements. To further strengthen your application, consider adding experience with ${missingTopKws || "any listed tools"}.`
      : matchScore >= 50
      ? `Your resume has a ${scoreLabel} match for this ${jobTitle} position. While your core skills align, there are notable gaps in ${missingTopKws || "some required areas"} that the job emphasizes.`
      : `Your resume shows a ${scoreLabel} match for this ${jobTitle} role. Significant gaps in ${missingTopKws || "key required skills"} may require tailoring your experience narrative or upskilling before applying.`;

  return {
    matchScore,
    presentKeywords: presentKeywords.slice(0, 20),
    missingKeywords: missingKeywords.slice(0, 20),
    suggestions,
    summary,
  };
}

// ─── Grok (xAI) API call ──────────────────────────────────────────────────────

async function callGrok(prompt: string): Promise<string> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) throw new Error("GROK_API_KEY not set");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Grok API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? "";
}

// ─── Main analysis function ────────────────────────────────────────────────────

export async function analyzeTailor(input: TailorInput): Promise<TailorResult> {
  // Use Grok API when key is configured
  if (process.env.GROK_API_KEY) {
    try {
      const text = await callGrok(buildPrompt(input));
      return parseClaudeResponse(text);
    } catch (err) {
      console.error("[analyzeTailor] Grok API error, falling back to mock:", err);
    }
  }

  // Fallback: keyword-matching mock (works without API key)
  return analyzeWithMock(input);
}
