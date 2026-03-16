import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runAllScrapers } from "@/lib/scrapers";
import { calculateMatchScore } from "@/lib/scoring";
import { fromJsonArray, toJsonArray } from "@/lib/json-arrays";
import type { SearchConfigData } from "@/types";

export async function POST() {
  try {
    let config = await prisma.searchConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      config = await prisma.searchConfig.create({
        data: {
          name: "Default",
          titles: toJsonArray(["Software Engineer"]),
          locations: toJsonArray(["Remote"]),
          locationType: "remote",
          includeKeywords: toJsonArray([]),
          excludeKeywords: toJsonArray([]),
          blacklistedCompanies: toJsonArray([]),
          industries: toJsonArray([]),
        },
      });
    }

    const searchConfig: SearchConfigData = {
      titles: fromJsonArray(config.titles),
      locations: fromJsonArray(config.locations),
      locationType: config.locationType || undefined,
      experienceLevel: config.experienceLevel || undefined,
      salaryMin: config.salaryMin || undefined,
      salaryMax: config.salaryMax || undefined,
      companySize: config.companySize || undefined,
      industries: fromJsonArray(config.industries),
      includeKeywords: fromJsonArray(config.includeKeywords),
      excludeKeywords: fromJsonArray(config.excludeKeywords),
      blacklistedCompanies: fromJsonArray(config.blacklistedCompanies),
    };

    const result = await runAllScrapers(searchConfig);
    const uniqueJobs = result.jobs;

    let newJobCount = 0;
    for (const job of uniqueJobs) {
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
          update: {
            description: job.description,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            matchScore: score,
          },
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
        newJobCount++;
      } catch {
        // Skip duplicates
      }
    }

    return NextResponse.json({
      success: true,
      scraped: result.totalBeforeDedup,
      unique: result.totalAfterDedup,
      newJobs: newJobCount,
    });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: "Scraping failed", details: String(error) },
      { status: 500 }
    );
  }
}
