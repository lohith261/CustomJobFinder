import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toJsonArray, fromJsonArray, serializeConfig } from "@/lib/json-arrays";
import { getRequiredUserId } from "@/lib/auth-helpers";

export async function GET() {
  const auth = await getRequiredUserId();
  if ("error" in auth) return auth.error;
  const { userId } = auth;

  const configs = await prisma.searchConfig.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const result = configs.map((c) => ({
    id: c.id,
    name: c.name,
    isActive: c.isActive,
    titles: fromJsonArray(c.titles),
    locationType: c.locationType ?? "",
    createdAt: c.createdAt,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = await getRequiredUserId();
  if ("error" in auth) return auth.error;
  const { userId } = auth;

  const body = await req.json();
  const name: string = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // Copy current active config settings as defaults
  const activeConfig = await prisma.searchConfig.findFirst({
    where: { isActive: true, userId },
  });

  const newConfig = await prisma.searchConfig.create({
    data: {
      userId,
      name,
      isActive: false,
      titles: activeConfig?.titles ?? toJsonArray([]),
      locations: activeConfig?.locations ?? toJsonArray([]),
      locationType: activeConfig?.locationType ?? "any",
      experienceLevel: activeConfig?.experienceLevel ?? null,
      salaryMin: activeConfig?.salaryMin ?? null,
      salaryMax: activeConfig?.salaryMax ?? null,
      companySize: activeConfig?.companySize ?? null,
      industries: activeConfig?.industries ?? toJsonArray([]),
      includeKeywords: activeConfig?.includeKeywords ?? toJsonArray([]),
      excludeKeywords: activeConfig?.excludeKeywords ?? toJsonArray([]),
      blacklistedCompanies: activeConfig?.blacklistedCompanies ?? toJsonArray([]),
    },
  });

  return NextResponse.json(
    serializeConfig(newConfig as unknown as Record<string, unknown>),
    { status: 201 }
  );
}
