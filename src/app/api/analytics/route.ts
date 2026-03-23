import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { KANBAN_COLUMNS } from "@/types";
import type {
  AnalyticsData,
  FunnelStage,
  KeywordGap,
  ResumePerformance,
  ScoreBucket,
  SourceConversion,
  TopEntry,
  WeeklyTrend,
} from "@/types";
import { getRequiredUserId } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  try {
    const auth = await getRequiredUserId();
    if ("error" in auth) return auth.error;
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const daysParam = parseInt(searchParams.get("days") ?? "30", 10);
    const days = isNaN(daysParam) ? 30 : daysParam;
    // days === 0 means "all time" — no date filter
    const periodStart = days > 0 ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // For weeklyTrend we show the last N weeks based on the period (min 2, max 52)
    const trendDays = days > 0 ? days : 365;
    const trendIntervalDays = Math.max(trendDays, 14);

    const dateFilter = periodStart ? { gte: periodStart } : undefined;

    const [
      applicationGroups,
      allJobScores,
      rawWeeklyTrend,
      rawTopTitles,
      rawTopCompanies,
      rawSourceJobs,
      allApplicationsWithSource,
      jobsThisPeriod,
      appsThisPeriod,
      interviewsThisPeriod,
      analysesThisPeriod,
      overdueFollowUps,
      avgScoreResult,
      resumesWithAnalyses,
      missingKeywordAnalyses,
    ] = await Promise.all([
      prisma.application.groupBy({
        by: ["status"],
        where: {
          job: { userId },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        _count: { _all: true },
      }),

      prisma.job.findMany({
        where: {
          userId,
          status: { not: "dismissed" },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        select: { matchScore: true },
      }),

      days > 0
        ? prisma.$queryRaw<Array<{ week: string; avgScore: number; jobCount: bigint }>>`
            SELECT
              TO_CHAR(DATE_TRUNC('week', "createdAt"), 'IYYY-"W"IW') AS week,
              CAST(ROUND(AVG("matchScore")) AS INTEGER)               AS "avgScore",
              COUNT(*)                                                AS "jobCount"
            FROM "Job"
            WHERE "createdAt" >= NOW() - (${trendIntervalDays} || ' days')::INTERVAL
              AND status != 'dismissed'
              AND "userId" = ${userId}
            GROUP BY DATE_TRUNC('week', "createdAt")
            ORDER BY DATE_TRUNC('week', "createdAt") ASC
          `
        : prisma.$queryRaw<Array<{ week: string; avgScore: number; jobCount: bigint }>>`
            SELECT
              TO_CHAR(DATE_TRUNC('week', "createdAt"), 'IYYY-"W"IW') AS week,
              CAST(ROUND(AVG("matchScore")) AS INTEGER)               AS "avgScore",
              COUNT(*)                                                AS "jobCount"
            FROM "Job"
            WHERE status != 'dismissed'
              AND "userId" = ${userId}
            GROUP BY DATE_TRUNC('week', "createdAt")
            ORDER BY DATE_TRUNC('week', "createdAt") ASC
          `,

      prisma.job.groupBy({
        by: ["title"],
        where: {
          userId,
          status: { not: "dismissed" },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        _count: { _all: true },
        _avg: { matchScore: true },
        orderBy: { _count: { title: "desc" } },
        take: 8,
      }),

      prisma.job.groupBy({
        by: ["company"],
        where: {
          userId,
          status: { not: "dismissed" },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        _count: { _all: true },
        _avg: { matchScore: true },
        orderBy: { _count: { company: "desc" } },
        take: 8,
      }),

      prisma.job.groupBy({
        by: ["source"],
        where: {
          userId,
          status: { not: "dismissed" },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        _count: { _all: true },
        _avg: { matchScore: true },
      }),

      prisma.application.findMany({
        where: {
          job: { userId },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        include: { job: { select: { source: true } } },
      }),

      prisma.job.count({
        where: {
          userId,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),
      prisma.application.count({
        where: {
          job: { userId },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),
      prisma.application.count({
        where: {
          job: { userId },
          status: "interview",
          ...(dateFilter ? { updatedAt: dateFilter } : {}),
        },
      }),
      prisma.resumeAnalysis.count({
        where: {
          resume: { userId },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),
      prisma.application.count({
        where: {
          job: { userId },
          followUpDate: { lt: today },
          status: { in: ["applied", "interview"] },
        },
      }),
      prisma.job.aggregate({
        where: {
          userId,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        _avg: { matchScore: true },
      }),
      prisma.resume.findMany({
        where: { userId },
        include: { analyses: { select: { matchScore: true } } },
      }),
      prisma.resumeAnalysis.findMany({
        where: {
          resume: { userId },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        select: { missingKeywords: true },
      }),
    ]);

    const funnelMap = new Map(applicationGroups.map((g) => [g.status, g._count._all]));
    const funnel: FunnelStage[] = KANBAN_COLUMNS.map(({ status, label, color }) => ({
      status,
      label,
      count: funnelMap.get(status) ?? 0,
      color,
    }));

    const bucketDefs: Array<[string, number, number]> = [
      ["0–29", 0, 29],
      ["30–49", 30, 49],
      ["50–69", 50, 69],
      ["70–89", 70, 89],
      ["90–100", 90, 100],
    ];
    const scoreBuckets: ScoreBucket[] = bucketDefs.map(([bucket, min, max]) => ({
      bucket,
      count: allJobScores.filter((j) => j.matchScore >= min && j.matchScore <= max).length,
    }));

    const weeklyTrend: WeeklyTrend[] = rawWeeklyTrend.map((row) => ({
      week: row.week,
      avgScore: Number(row.avgScore),
      jobCount: Number(row.jobCount),
    }));

    const topTitles: TopEntry[] = rawTopTitles.map((r) => ({
      name: r.title,
      count: r._count._all,
      avgScore: Math.round(r._avg.matchScore ?? 0),
    }));

    const topCompanies: TopEntry[] = rawTopCompanies.map((r) => ({
      name: r.company,
      count: r._count._all,
      avgScore: Math.round(r._avg.matchScore ?? 0),
    }));

    const appliedBySource = new Map<string, number>();
    const interviewBySource = new Map<string, number>();
    for (const app of allApplicationsWithSource) {
      const src = app.job.source;
      appliedBySource.set(src, (appliedBySource.get(src) ?? 0) + 1);
      if (app.status === "interview" || app.status === "offer") {
        interviewBySource.set(src, (interviewBySource.get(src) ?? 0) + 1);
      }
    }
    const sourceConversions: SourceConversion[] = rawSourceJobs.map((r) => ({
      source: r.source,
      totalJobs: r._count._all,
      appliedCount: appliedBySource.get(r.source) ?? 0,
      interviewCount: interviewBySource.get(r.source) ?? 0,
      avgScore: Math.round(r._avg.matchScore ?? 0),
    }));

    const resumePerformance: ResumePerformance[] = resumesWithAnalyses
      .filter((resume) => resume.analyses.length > 0)
      .map((resume) => {
        const scores = resume.analyses.map((a) => a.matchScore);
        return {
          resumeId: resume.id,
          name: resume.name,
          analysisCount: scores.length,
          avgScore: Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length),
          bestScore: Math.max(...scores),
        };
      })
      .sort((a, b) => b.avgScore !== a.avgScore ? b.avgScore - a.avgScore : b.analysisCount - a.analysisCount)
      .slice(0, 6);

    const missingKeywordCounts = new Map<string, number>();
    for (const analysis of missingKeywordAnalyses) {
      const keywords = parseJsonArray(analysis.missingKeywords);
      for (const keyword of keywords) {
        const normalized = keyword.toLowerCase().trim();
        if (!normalized) continue;
        missingKeywordCounts.set(normalized, (missingKeywordCounts.get(normalized) ?? 0) + 1);
      }
    }
    const topMissingKeywords: KeywordGap[] = Array.from(missingKeywordCounts.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const payload: AnalyticsData = {
      funnel,
      scoreBuckets,
      weeklyTrend,
      topTitles,
      topCompanies,
      sourceConversions,
      resumePerformance,
      topMissingKeywords,
      weeklyActivity: {
        jobsScraped: jobsThisPeriod,
        applicationsCreated: appsThisPeriod,
        interviewsScheduled: interviewsThisPeriod,
        analysesCreated: analysesThisPeriod,
        overdueFollowUps,
        avgMatchScore: Math.round(avgScoreResult._avg.matchScore ?? 0),
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "private, max-age=0, stale-while-revalidate=60" },
    });
  } catch (err) {
    console.error("[analytics] error:", err);
    return NextResponse.json({ error: "Failed to compute analytics" }, { status: 500 });
  }
}

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
