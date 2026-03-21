import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parsePdf } from "@/lib/parsers/pdf";

// GET /api/profile — return the singleton profile
export async function GET() {
  try {
    const profile = await prisma.userProfile.findUnique({ where: { id: "singleton" } });
    return NextResponse.json(profile ?? { id: "singleton", name: "", email: "", phone: "", linkedin: "", github: "", location: "" });
  } catch (err) {
    console.error("GET /api/profile error:", err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// PUT /api/profile — save contact info
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { name = "", email = "", phone = "", linkedin = "", github = "", location = "" } = body;
    const profile = await prisma.userProfile.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", name, email, phone, linkedin, github, location },
      update: { name, email, phone, linkedin, github, location },
    });
    return NextResponse.json(profile);
  } catch (err) {
    console.error("PUT /api/profile error:", err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}

// POST /api/profile — extract contact info from uploaded resume PDF
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const { text } = await parsePdf(buffer);

    // Regex extraction
    const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/(\+?[\d][\d\s\-().]{8,}[\d])/);
    const linkedinMatch = text.match(/(?:linkedin\.com\/in\/)([\w-]+)/i);
    const githubMatch = text.match(/(?:github\.com\/)([\w-]+)/i);

    // Name heuristic: first non-empty line that looks like a name (2-5 words, no special chars)
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const nameLine = lines.find((l) => /^[A-Z][a-zA-Z .'-]{2,50}$/.test(l) && l.split(" ").length >= 2 && l.split(" ").length <= 5);

    // Location heuristic: look for "City, State" or "City, Country" pattern
    const locationMatch = text.match(/\b([A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)\b/);

    return NextResponse.json({
      name: nameLine ?? "",
      email: emailMatch?.[0] ?? "",
      phone: phoneMatch?.[0]?.trim() ?? "",
      linkedin: linkedinMatch ? `linkedin.com/in/${linkedinMatch[1]}` : "",
      github: githubMatch ? `github.com/${githubMatch[1]}` : "",
      location: locationMatch?.[1] ?? "",
    });
  } catch (err) {
    console.error("POST /api/profile (extract) error:", err);
    return NextResponse.json({ error: "Failed to extract from resume" }, { status: 500 });
  }
}
