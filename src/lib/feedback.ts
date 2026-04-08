/**
 * Feedback loop: analyse user application outcomes to identify what match-score
 * threshold actually predicts success, then suggest recalibrated values.
 *
 * Called after a user records an application outcome (hired / rejected / ghosted).
 */

import { prisma } from "@/lib/db";

export type Outcome = "hired" | "rejected" | "ghosted" | "withdrawn";

interface OutcomePattern {
  userId: string;
  totalOutcomes: number;
  hiredCount: number;
  rejectedCount: number;
  ghostedCount: number;
  withdrawnCount: number;
  avgScoreHired: number | null;
  avgScoreRejected: number | null;
  avgScoreGhosted: number | null;
  /** Suggested threshold: score at or above which outcomes tend to be positive. */
  suggestedThreshold: number | null;
}

/**
 * Aggregate outcome data for a user and derive scoring insights.
 */
export async function getUserOutcomePatterns(userId: string): Promise<OutcomePattern> {
  const applications = await prisma.application.findMany({
    where: { job: { userId }, outcome: { not: null } },
    select: {
      outcome: true,
      interviewCount: true,
      job: { select: { matchScore: true } },
    },
  });

  if (applications.length === 0) {
    return {
      userId,
      totalOutcomes: 0,
      hiredCount: 0,
      rejectedCount: 0,
      ghostedCount: 0,
      withdrawnCount: 0,
      avgScoreHired: null,
      avgScoreRejected: null,
      avgScoreGhosted: null,
      suggestedThreshold: null,
    };
  }

  const hired = applications.filter((a) => a.outcome === "hired");
  const rejected = applications.filter((a) => a.outcome === "rejected");
  const ghosted = applications.filter((a) => a.outcome === "ghosted");
  const withdrawn = applications.filter((a) => a.outcome === "withdrawn");

  const avg = (items: typeof applications): number | null => {
    if (items.length === 0) return null;
    return Math.round(items.reduce((s, a) => s + a.job.matchScore, 0) / items.length);
  };

  const avgScoreHired = avg(hired);
  const avgScoreRejected = avg(rejected);
  const avgScoreGhosted = avg(ghosted);

  // Suggest threshold: midpoint between avg hired and avg rejected/ghosted scores,
  // or fall back to a nudge based on available data.
  let suggestedThreshold: number | null = null;
  const negativeAvg = avg([...rejected, ...ghosted]);
  if (avgScoreHired !== null && negativeAvg !== null) {
    suggestedThreshold = Math.round((avgScoreHired + negativeAvg) / 2);
  } else if (avgScoreHired !== null) {
    // Only positive outcomes — lower threshold slightly to catch more good jobs
    suggestedThreshold = Math.max(40, avgScoreHired - 10);
  } else if (negativeAvg !== null) {
    // Only negative outcomes — raise threshold above average failure score
    suggestedThreshold = Math.min(90, negativeAvg + 10);
  }

  return {
    userId,
    totalOutcomes: applications.length,
    hiredCount: hired.length,
    rejectedCount: rejected.length,
    ghostedCount: ghosted.length,
    withdrawnCount: withdrawn.length,
    avgScoreHired,
    avgScoreRejected,
    avgScoreGhosted,
    suggestedThreshold,
  };
}

/**
 * Returns recalibration advice if enough outcomes exist.
 * Returns null if there is insufficient data (< 5 outcomes).
 */
export async function recalibrateUserThresholds(
  userId: string
): Promise<{ suggestedThreshold: number; reason: string } | null> {
  const MIN_OUTCOMES = 5;
  const patterns = await getUserOutcomePatterns(userId);

  if (patterns.totalOutcomes < MIN_OUTCOMES || patterns.suggestedThreshold === null) {
    return null;
  }

  const parts: string[] = [];
  if (patterns.avgScoreHired !== null) {
    parts.push(`avg score on hired applications: ${patterns.avgScoreHired}`);
  }
  if (patterns.avgScoreRejected !== null) {
    parts.push(`avg score on rejected applications: ${patterns.avgScoreRejected}`);
  }

  const reason = `Based on ${patterns.totalOutcomes} recorded outcomes (${parts.join(", ")}), a threshold of ${patterns.suggestedThreshold} is estimated to maximise quality matches.`;

  return { suggestedThreshold: patterns.suggestedThreshold, reason };
}
