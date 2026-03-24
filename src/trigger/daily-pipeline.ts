import { schedules, logger } from "@trigger.dev/sdk/v3";
import { prisma } from "@/lib/db";
import { userPipelineTask } from "./user-pipeline";

/**
 * Scheduled daily pipeline — runs at 8 AM UTC every day for all verified users.
 *
 * This replaces the Vercel cron job (vercel.json) once Trigger.dev is connected.
 * Each user's pipeline runs as an isolated subtask with its own retry logic.
 *
 * To activate:
 *  1. Set TRIGGER_SECRET_KEY in your environment
 *  2. Deploy with: npx trigger.dev@latest deploy
 *  3. Remove the cron entry from vercel.json to avoid duplicate runs
 */
export const dailyPipelineTask = schedules.task({
  id: "daily-pipeline",
  // 8 AM UTC daily — same as current Vercel cron schedule
  cron: "0 8 * * *",
  run: async () => {
    const users = await prisma.user.findMany({
      where: { emailVerified: true },
      select: { id: true },
    });

    logger.info(`Daily pipeline starting`, { userCount: users.length });

    const threshold = parseInt(process.env.PIPELINE_SCORE_THRESHOLD ?? "65");
    const maxJobs = parseInt(process.env.PIPELINE_MAX_JOBS ?? "10");

    // Trigger all users in parallel — each runs independently with its own retries
    const results = await userPipelineTask.batchTriggerAndWait(
      users.map((u) => ({
        payload: {
          userId: u.id,
          threshold,
          maxJobs,
          tone: "professional" as const,
        },
      }))
    );

    const succeeded = results.runs.filter((r) => r.ok).length;
    const failed = results.runs.filter((r) => !r.ok).length;

    logger.info(`Daily pipeline complete`, { succeeded, failed });

    return { userCount: users.length, succeeded, failed };
  },
});
