import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fromJsonArray } from "@/lib/json-arrays";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resume = await prisma.resume.findUnique({
      where: { id: params.id },
      include: {
        analyses: {
          orderBy: { createdAt: "desc" },
          include: {
            job: {
              select: {
                id: true,
                title: true,
                company: true,
                location: true,
                locationType: true,
                matchScore: true,
              },
            },
          },
        },
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: resume.id,
      name: resume.name,
      fileName: resume.fileName,
      format: resume.format,
      isPrimary: resume.isPrimary,
      wordCount: resume.wordCount,
      createdAt: resume.createdAt.toISOString(),
      updatedAt: resume.updatedAt.toISOString(),
      analyses: resume.analyses.map((a) => ({
        id: a.id,
        resumeId: a.resumeId,
        jobId: a.jobId,
        matchScore: a.matchScore,
        presentKeywords: fromJsonArray(a.presentKeywords),
        missingKeywords: fromJsonArray(a.missingKeywords),
        suggestions: (() => {
          try {
            return JSON.parse(a.suggestions);
          } catch {
            return [];
          }
        })(),
        summary: a.summary,
        createdAt: a.createdAt.toISOString(),
        job: a.job,
      })),
    });
  } catch (err) {
    console.error("GET /api/resumes/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch resume" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    if (body.isPrimary === true) {
      // Clear primary from all others first
      await prisma.resume.updateMany({ data: { isPrimary: false } });
    }

    const resume = await prisma.resume.update({
      where: { id: params.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.isPrimary !== undefined && { isPrimary: body.isPrimary }),
      },
    });

    return NextResponse.json({
      id: resume.id,
      name: resume.name,
      isPrimary: resume.isPrimary,
    });
  } catch (err) {
    console.error("PATCH /api/resumes/[id] error:", err);
    return NextResponse.json({ error: "Failed to update resume" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.resume.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/resumes/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete resume" }, { status: 500 });
  }
}
