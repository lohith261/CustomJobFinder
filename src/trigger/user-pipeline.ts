import { task, logger } from "@trigger.dev/sdk/v3";
import { runPipeline } from "@/lib/pipeline";

export interface UserPipelinePayload {
  userId: string;
  threshold?: number;
  maxJobs?: number;
  tone?: "professional" | "conversational" | "enthusiastic";
}

/**
 * Per-user pipeline task — wraps runPipeline() so it runs outside Vercel's
 * 60-second timeout limit with automatic retries and full logging.
 */
export const userPipelineTask = task({
  id: "user-pipeline",
  retry: { maxAttempts: 2 },
  run: async (payload: UserPipelinePayload) => {
    logger.info("Starting pipeline", { userId: payload.userId });

    const result = await runPipeline({
      userId: payload.userId,
      threshold: payload.threshold,
      maxJobs: payload.maxJobs,
      tone: payload.tone,
    });

    logger.info("Pipeline complete", {
      userId: payload.userId,
      newJobs: result.newJobsCount,
      analyzed: result.analyzedCount,
      coverLetters: result.coverLetterCount,
    });

    return result;
  },
});
