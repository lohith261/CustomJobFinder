import type { RawJob, SearchConfigData } from "@/types";

const WEIGHTS = {
  title: 30,
  location: 20,
  salary: 15,
  keywords: 20,
  experience: 10,
  blacklist: 5,
};

const EXPERIENCE_LEVELS = ["intern", "junior", "mid", "senior", "lead", "executive"];

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function scoreTitleMatch(job: RawJob, config: SearchConfigData): number {
  if (config.titles.length === 0) return WEIGHTS.title;

  const jobTitle = normalize(job.title);

  for (const title of config.titles) {
    const configTitle = normalize(title);
    if (jobTitle === configTitle) return 30;
  }

  for (const title of config.titles) {
    const configTitle = normalize(title);
    if (jobTitle.includes(configTitle) || configTitle.includes(jobTitle)) return 20;
  }

  // Check for related terms — split both sides into words and look for overlap
  const jobWords = new Set(jobTitle.split(/\s+/));
  for (const title of config.titles) {
    const configWords = normalize(title).split(/\s+/);
    const overlap = configWords.filter((w) => jobWords.has(w));
    if (overlap.length > 0) return 10;
  }

  return 0;
}

function scoreLocationMatch(job: RawJob, config: SearchConfigData): number {
  if (config.locations.length === 0 && !config.locationType) return WEIGHTS.location;

  // Remote match
  const jobIsRemote =
    normalize(job.locationType ?? "").includes("remote") ||
    normalize(job.location ?? "").includes("remote");
  const userWantsRemote = normalize(config.locationType ?? "").includes("remote");

  if (jobIsRemote && userWantsRemote) return 20;

  if (config.locations.length === 0) return 0;

  const jobLocation = normalize(job.location ?? "");
  if (!jobLocation) return 0;

  // Exact city match
  for (const loc of config.locations) {
    const configLoc = normalize(loc);
    if (jobLocation.includes(configLoc) || configLoc.includes(jobLocation)) return 20;
  }

  // Same country heuristic — compare the last comma-separated segment
  const jobCountry = jobLocation.split(",").pop()?.trim() ?? "";
  for (const loc of config.locations) {
    const configCountry = normalize(loc).split(",").pop()?.trim() ?? "";
    if (jobCountry && configCountry && jobCountry === configCountry) return 10;
  }

  return 0;
}

function scoreSalaryMatch(job: RawJob, config: SearchConfigData): number {
  const hasConfigRange = config.salaryMin != null || config.salaryMax != null;
  if (!hasConfigRange) return WEIGHTS.salary;

  const hasJobSalary = job.salaryMin != null || job.salaryMax != null;
  if (!hasJobSalary) return 8; // benefit of doubt

  const jobMin = job.salaryMin ?? 0;
  const jobMax = job.salaryMax ?? Infinity;
  const configMin = config.salaryMin ?? 0;
  const configMax = config.salaryMax ?? Infinity;

  // Fully within range
  if (jobMin >= configMin && jobMax <= configMax) return 15;

  // Overlapping
  if (jobMin <= configMax && jobMax >= configMin) return 10;

  return 0;
}

function scoreKeywordsMatch(job: RawJob, config: SearchConfigData): number {
  const searchableText = normalize(
    [job.title, job.description, ...(job.tags ?? [])].filter(Boolean).join(" ")
  );

  let score = 0;

  // Include keywords — proportional scoring
  if (config.includeKeywords.length > 0) {
    const pointsPerKeyword = WEIGHTS.keywords / config.includeKeywords.length;
    for (const keyword of config.includeKeywords) {
      if (searchableText.includes(normalize(keyword))) {
        score += pointsPerKeyword;
      }
    }
  } else {
    score = WEIGHTS.keywords;
  }

  // Exclude keywords — each found subtracts 10 from total
  for (const keyword of config.excludeKeywords) {
    if (searchableText.includes(normalize(keyword))) {
      score -= 10;
    }
  }

  return score;
}

function scoreExperienceMatch(job: RawJob, config: SearchConfigData): number {
  if (!config.experienceLevel) return WEIGHTS.experience;
  if (!job.experienceLevel) return 0;

  const jobLevel = normalize(job.experienceLevel);
  const configLevel = normalize(config.experienceLevel);

  if (jobLevel === configLevel) return 10;

  const jobIndex = EXPERIENCE_LEVELS.indexOf(jobLevel);
  const configIndex = EXPERIENCE_LEVELS.indexOf(configLevel);

  if (jobIndex !== -1 && configIndex !== -1 && Math.abs(jobIndex - configIndex) === 1) {
    return 5;
  }

  return 0;
}

function scoreBlacklist(job: RawJob, config: SearchConfigData): number {
  if (config.blacklistedCompanies.length === 0) return WEIGHTS.blacklist;

  const jobCompany = normalize(job.company);

  for (const company of config.blacklistedCompanies) {
    if (jobCompany === normalize(company)) return -100;
  }

  return WEIGHTS.blacklist;
}

export function calculateMatchScore(job: RawJob, config: SearchConfigData): number {
  const titleScore = scoreTitleMatch(job, config);
  const locationScore = scoreLocationMatch(job, config);
  const salaryScore = scoreSalaryMatch(job, config);
  const keywordsScore = scoreKeywordsMatch(job, config);
  const experienceScore = scoreExperienceMatch(job, config);
  const blacklistScore = scoreBlacklist(job, config);

  const total = titleScore + locationScore + salaryScore + keywordsScore + experienceScore + blacklistScore;

  return Math.max(0, Math.min(100, Math.round(total)));
}
