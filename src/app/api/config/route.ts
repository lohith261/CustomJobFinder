import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toJsonArray, serializeConfig } from "@/lib/json-arrays";

export async function GET() {
  let config = await prisma.searchConfig.findFirst({
    where: { isActive: true },
  });

  if (!config) {
    config = await prisma.searchConfig.create({
      data: {
        name: "Default",
        titles: toJsonArray(["Software Engineer", "Frontend Developer"]),
        locations: toJsonArray(["Remote"]),
        locationType: "remote",
        includeKeywords: toJsonArray(["React", "TypeScript", "Node.js"]),
        excludeKeywords: toJsonArray([]),
        blacklistedCompanies: toJsonArray([]),
        industries: toJsonArray([]),
      },
    });
  }

  return NextResponse.json(serializeConfig(config as unknown as Record<string, unknown>));
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  const existing = await prisma.searchConfig.findFirst({
    where: { isActive: true },
  });

  const data = {
    titles: body.titles ? toJsonArray(body.titles) : undefined,
    locations: body.locations ? toJsonArray(body.locations) : undefined,
    locationType: body.locationType ?? undefined,
    experienceLevel: body.experienceLevel ?? undefined,
    salaryMin: body.salaryMin ?? undefined,
    salaryMax: body.salaryMax ?? undefined,
    companySize: body.companySize ?? undefined,
    industries: body.industries ? toJsonArray(body.industries) : undefined,
    includeKeywords: body.includeKeywords ? toJsonArray(body.includeKeywords) : undefined,
    excludeKeywords: body.excludeKeywords ? toJsonArray(body.excludeKeywords) : undefined,
    blacklistedCompanies: body.blacklistedCompanies ? toJsonArray(body.blacklistedCompanies) : undefined,
  };

  // Remove undefined values
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );

  if (existing) {
    const config = await prisma.searchConfig.update({
      where: { id: existing.id },
      data: cleanData,
    });
    return NextResponse.json(serializeConfig(config as unknown as Record<string, unknown>));
  }

  const config = await prisma.searchConfig.create({
    data: {
      titles: toJsonArray(body.titles || []),
      locations: toJsonArray(body.locations || []),
      locationType: body.locationType || "any",
      experienceLevel: body.experienceLevel,
      salaryMin: body.salaryMin,
      salaryMax: body.salaryMax,
      companySize: body.companySize,
      industries: toJsonArray(body.industries || []),
      includeKeywords: toJsonArray(body.includeKeywords || []),
      excludeKeywords: toJsonArray(body.excludeKeywords || []),
      blacklistedCompanies: toJsonArray(body.blacklistedCompanies || []),
    },
  });

  return NextResponse.json(serializeConfig(config as unknown as Record<string, unknown>));
}
