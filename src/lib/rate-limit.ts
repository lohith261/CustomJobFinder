/**
 * Per-user AI rate limiter — stored in the DB so it works across serverless instances.
 *
 * Rules:
 *  - Minimum 10 seconds between any two AI calls from the same user
 *  - Pro users: same cooldown (still protects against bug exploitation)
 *
 * Call checkAiRateLimit() BEFORE every AI API call.
 * The quota system (quota.ts) enforces monthly limits; this enforces burst protection.
 */

import { prisma } from "@/lib/db";

/** Minimum ms between consecutive AI calls per user */
const COOLDOWN_MS = 10_000;

export async function checkAiRateLimit(userId: string): Promise<
  { allowed: true } | { allowed: false; retryAfterMs: number; retryAfterSec: number }
> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiLastCallAt: true },
  });

  if (!user) return { allowed: false, retryAfterMs: 0, retryAfterSec: 0 };

  if (user.aiLastCallAt) {
    const elapsed = Date.now() - user.aiLastCallAt.getTime();
    if (elapsed < COOLDOWN_MS) {
      const retryAfterMs = COOLDOWN_MS - elapsed;
      return {
        allowed: false,
        retryAfterMs,
        retryAfterSec: Math.ceil(retryAfterMs / 1000),
      };
    }
  }

  // Stamp the timestamp before the AI call so concurrent requests are blocked
  await prisma.user.update({
    where: { id: userId },
    data: { aiLastCallAt: new Date() },
  });

  return { allowed: true };
}
