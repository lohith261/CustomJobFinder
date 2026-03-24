import { task, wait, logger } from "@trigger.dev/sdk/v3";
import { sendDay2Email, sendDay6Email } from "@/lib/email";

export interface EmailSequencePayload {
  userId: string;
  email: string;
  name: string;
}

/**
 * Onboarding email sequence — triggered after a user verifies their email.
 *
 * Day 0: Welcome email (sent immediately in verify-email route)
 * Day 2: Pipeline tips — help them get value fast
 * Day 6: Upgrade nudge — highlight Pro features
 *
 * Uses Trigger.dev's wait.for() which is durable — if the process restarts
 * the delay continues from where it left off.
 */
export const emailSequenceTask = task({
  id: "email-sequence",
  run: async (payload: EmailSequencePayload) => {
    logger.info("Email sequence started", { email: payload.email });

    // Day 2: pipeline tips
    await wait.for({ days: 2 });
    try {
      await sendDay2Email(payload.email, payload.name);
      logger.info("Day 2 email sent", { email: payload.email });
    } catch (err) {
      logger.error("Day 2 email failed", { email: payload.email, error: String(err) });
    }

    // Day 6: upgrade nudge (4 more days from Day 2)
    await wait.for({ days: 4 });
    try {
      await sendDay6Email(payload.email, payload.name);
      logger.info("Day 6 email sent", { email: payload.email });
    } catch (err) {
      logger.error("Day 6 email failed", { email: payload.email, error: String(err) });
    }

    return { completed: true };
  },
});
