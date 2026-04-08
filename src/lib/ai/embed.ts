/**
 * Embedding utilities for semantic job-resume matching.
 * Uses openai/text-embedding-3-small (1536 dims) via OpenRouter.
 * Embeddings are stored as JSON-serialized float[] strings in Prisma.
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const EMBED_MODEL = "openai/text-embedding-3-small";
const EMBED_DIMS = 1536;

export type Embedding = number[];

/**
 * Fetch a single embedding from OpenRouter.
 * Throws on network or API error.
 */
export async function getEmbedding(text: string): Promise<Embedding> {
  if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not set");

  // Truncate to ~8000 chars to stay within token limits
  const input = text.slice(0, 8000);

  const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBED_MODEL, input }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter embedding error ${res.status}: ${body}`);
  }

  const json = await res.json();
  return json.data[0].embedding as Embedding;
}

/** Serialize an embedding for Prisma String storage. */
export function serializeEmbedding(embedding: Embedding): string {
  return JSON.stringify(embedding);
}

/** Deserialize an embedding from Prisma String storage. */
export function deserializeEmbedding(raw: string): Embedding {
  return JSON.parse(raw) as Embedding;
}

/**
 * Cosine similarity between two vectors.
 * Returns a value in [-1, 1]; higher = more similar.
 */
export function cosineSimilarity(a: Embedding, b: Embedding): number {
  if (a.length !== b.length) throw new Error("Embedding dimension mismatch");
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Builds the text to embed for a job listing.
 * Combines title + description + tags into a single string.
 */
export function buildJobEmbedText(job: {
  title: string;
  description?: string | null;
  tags?: string[];
  company?: string;
}): string {
  const parts = [
    job.title,
    job.company ?? "",
    (job.tags ?? []).join(" "),
    (job.description ?? "").slice(0, 6000),
  ];
  return parts.filter(Boolean).join("\n").trim();
}

/**
 * Builds the text to embed for a resume.
 * Uses the full text content (truncated to 8000 chars inside getEmbedding).
 */
export function buildResumeEmbedText(resumeText: string): string {
  return resumeText;
}

/**
 * Calculate semantic similarity score (0–100) between a job and a resume embedding.
 */
export function semanticScore(jobEmbedding: Embedding, resumeEmbedding: Embedding): number {
  const sim = cosineSimilarity(jobEmbedding, resumeEmbedding);
  // Cosine similarity for embeddings from the same model typically ranges 0.2–0.9
  // Map [0, 1] → [0, 100], clamp to valid range
  return Math.min(100, Math.max(0, Math.round(sim * 100)));
}

/**
 * Blended score: 40% keyword-based + 60% semantic.
 */
export function blendedScore(keywordScore: number, semScore: number): number {
  return Math.min(100, Math.max(0, Math.round(0.4 * keywordScore + 0.6 * semScore)));
}

export { EMBED_DIMS };
