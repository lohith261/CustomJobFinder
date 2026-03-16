import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseTimeline } from "@/lib/json-arrays";
import { randomUUID } from "crypto";
import type { TimelineEvent } from "@/types";
import { JOB_SELECT, serializeApplication } from "@/lib/serialize-application";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const app = await prisma.application.findUnique({
      where: { id: params.id },
      include: { job: { select: JOB_SELECT } },
    });

    if (!app) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      serializeApplication(app as unknown as Record<string, unknown>)
    );
  } catch (err) {
    console.error("GET /api/applications/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status, confirmedApplied = false, appliedAt, followUpDate, ...rest } = body;

    const app = await prisma.application.findUnique({
      where: { id: params.id },
    });
    if (!app) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Approval gate
    if (status === "applied" && !confirmedApplied) {
      return NextResponse.json(
        { error: "Applied status requires confirmedApplied: true" },
        { status: 400 }
      );
    }

    // Build timeline update if status is changing
    let updatedTimeline = parseTimeline(app.timeline);
    if (status && status !== app.status) {
      const labels: Record<string, string> = {
        bookmarked: "Bookmarked",
        applied: "Applied",
        interview: "Interview",
        offer: "Offer",
        rejected: "Rejected",
      };
      const event: TimelineEvent = {
        id: randomUUID(),
        type: "status_change",
        description: `Moved to ${labels[status] ?? status}`,
        timestamp: new Date().toISOString(),
      };
      updatedTimeline = [...updatedTimeline, event];
    }

    const updateData: Record<string, unknown> = {
      ...rest,
      timeline: JSON.stringify(updatedTimeline),
    };
    if (status) updateData.status = status;
    if (appliedAt !== undefined)
      updateData.appliedAt = appliedAt ? new Date(appliedAt) : null;
    if (followUpDate !== undefined)
      updateData.followUpDate = followUpDate ? new Date(followUpDate) : null;

    const updated = await prisma.application.update({
      where: { id: params.id },
      data: updateData,
      include: { job: { select: JOB_SELECT } },
    });

    return NextResponse.json(
      serializeApplication(updated as unknown as Record<string, unknown>)
    );
  } catch (err) {
    console.error("PATCH /api/applications/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.application.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/applications/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    );
  }
}
