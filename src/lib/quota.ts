import { prisma } from "@/lib/db";

const FREE_LIMITS = {
  analysis: 3,
  coverLetter: 3,
  outreach: 2,
} as const;

type QuotaType = keyof typeof FREE_LIMITS;

export async function checkQuota(userId: string, type: QuotaType): Promise<
  { allowed: true; remaining: number | null } |
  { allowed: false; reason: "free_limit_reached"; remaining: 0 }
> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      aiAnalysisCount: true,
      aiCoverLetterCount: true,
      aiOutreachCount: true,
      aiUsageResetAt: true,
    },
  });
  if (!user) return { allowed: false, reason: "free_limit_reached", remaining: 0 };

  // Pro users have unlimited access
  if (user.subscriptionStatus === "active") return { allowed: true, remaining: null };

  // Reset monthly counter if needed
  const now = new Date();
  const resetAt = user.aiUsageResetAt;
  const needsReset = !resetAt || now > resetAt;

  if (needsReset) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        aiAnalysisCount: 0,
        aiCoverLetterCount: 0,
        aiOutreachCount: 0,
        aiUsageResetAt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      },
    });
    // After reset, increment and allow
    await incrementQuota(userId, type);
    return { allowed: true, remaining: FREE_LIMITS[type] - 1 };
  }

  const currentCount = type === "analysis"
    ? user.aiAnalysisCount
    : type === "coverLetter"
    ? user.aiCoverLetterCount
    : user.aiOutreachCount;

  if (currentCount >= FREE_LIMITS[type]) {
    return { allowed: false, reason: "free_limit_reached", remaining: 0 };
  }

  await incrementQuota(userId, type);
  return { allowed: true, remaining: FREE_LIMITS[type] - currentCount - 1 };
}

async function incrementQuota(userId: string, type: QuotaType) {
  const field = type === "analysis"
    ? "aiAnalysisCount"
    : type === "coverLetter"
    ? "aiCoverLetterCount"
    : "aiOutreachCount";
  await prisma.user.update({
    where: { id: userId },
    data: { [field]: { increment: 1 } },
  });
}

export async function getUserPlan(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      subscriptionPlan: true,
      subscriptionEndsAt: true,
      aiAnalysisCount: true,
      aiCoverLetterCount: true,
      aiOutreachCount: true,
      aiUsageResetAt: true,
    },
  });
}
