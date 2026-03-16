import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMockJobs } from "@/lib/scrapers/mock";
import { calculateMatchScore } from "@/lib/scoring";
import { fromJsonArray, toJsonArray } from "@/lib/json-arrays";
import type { SearchConfigData } from "@/types";

export async function POST() {
  try {
    const config = await prisma.searchConfig.findFirst({
      where: { isActive: true },
    });

    const searchConfig: SearchConfigData = {
      titles: fromJsonArray(config?.titles),
      locations: fromJsonArray(config?.locations),
      locationType: config?.locationType || "remote",
      includeKeywords: fromJsonArray(config?.includeKeywords),
      excludeKeywords: fromJsonArray(config?.excludeKeywords),
      blacklistedCompanies: fromJsonArray(config?.blacklistedCompanies),
      industries: fromJsonArray(config?.industries),
    };

    const mockJobs = getMockJobs();
    let count = 0;

    for (const job of mockJobs) {
      const score = calculateMatchScore(job, searchConfig);
      try {
        await prisma.job.upsert({
          where: {
            title_company_source: {
              title: job.title,
              company: job.company,
              source: job.source,
            },
          },
          update: { matchScore: score },
          create: {
            title: job.title,
            company: job.company,
            location: job.location,
            locationType: job.locationType,
            url: job.url,
            source: job.source,
            description: job.description,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            salaryCurrency: job.salaryCurrency,
            experienceLevel: job.experienceLevel,
            companySize: job.companySize,
            industry: job.industry,
            tags: toJsonArray(job.tags || []),
            postedAt: job.postedAt,
            matchScore: score,
            status: "new",
          },
        });
        count++;
      } catch {
        // Skip duplicates
      }
    }

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Seeding failed", details: String(error) },
      { status: 500 }
    );
  }
}
