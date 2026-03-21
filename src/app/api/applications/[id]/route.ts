import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseTimeline } from "@/lib/json-arrays";
import { randomUUID } from "crypto";
import type { TimelineEvent } from "@/types";
import { JOB_SELECT, serializeApplication } from "@/lib/serialize-application";
import { formatDateLabel, getSuggestedFollowUpDate } from "@/lib/follow-up";
import { getRequiredUserId } from "@/lib/auth-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getRequiredUserId();
    if ("error" in auth) return auth.error;
    const { userId } = auth;

    const app = await prisma.application.findFirst({
      where: { id: params.id, job: { userId } },
      include: { job: { select: JOB_SELECT } },
    });

    if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    return NextResponse.json(serializeApplication(app as unknown as Record<string, unknown>));
  } catch (err) {
    console.error("GET /api/applications/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch application" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getRequiredUserId();
    if ("error" in auth) return auth.error;
    const { userId } = auth;

    const body = await req.json();
    // Explicitly destructure all allowed fields — never spread arbitrary body fields into DB
    const {
      status,
      confirmedApplied = false,
      appliedAt,
      followUpDate,
      notes,
      recruiterName,
      recruiterEmail,
      recruiterLinkedIn,
    } = body;
    const rest = { notes, recruiterName, recruiterEmail, recruiterLinkedIn };

    const app = await prisma.application.findFirst({
      where: { id: params.id, job: { userId } },
    });
    if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

    if (status === "applied" && !confirmedApplied) {
      return NextResponse.json({ error: "Applied status requires confirmedApplied: true" }, { status: 400 });
    }

    let updatedTimeline = parseTimeline(app.timeline);
    if (status && status !== app.status) {
      const labels: Record<string, string> = {
        bookmarked: "Bookmarked", applied: "Applied", interview: "Interview",
        offer: "Offer", rejected: "Rejected",
      };
      const event: TimelineEvent = {
        id: randomUUID(),
        type: "status_change",
        description: `Moved to ${labels[status] ?? status}`,
        timestamp: new Date().toISOString(),
      };
      updatedTimeline = [...updatedTimeline, event];
    }

    const effectiveAppliedAt =
      appliedAt !== undefined ? (appliedAt ? new Date(appliedAt) : null) : app.appliedAt;

    let effectiveFollowUpDate =
      followUpDate !== undefined ? (followUpDate ? new Date(followUpDate) : null) : app.followUpDate;

    if (status === "applied" && (followUpDate === undefined || followUpDate === null) && !app.followUpDate) {
      effectiveFollowUpDate = getSuggestedFollowUpDate(effectiveAppliedAt);
    }

    const priorFollowUpIso = app.followUpDate ? app.followUpDate.toISOString().slice(0, 10) : null;
    const nextFollowUpIso = effectiveFollowUpDate ? effectiveFollowUpDate.toISOString().slice(0, 10) : null;

    if (priorFollowUpIso !== nextFollowUpIso) {
      const description = effectiveFollowUpDate
        ? `Follow-up scheduled for ${formatDateLabel(effectiveFollowUpDate)}`
        : "Follow-up reminder cleared";
      updatedTimeline = [...updatedTimeline, {
        id: randomUUID(), type: "follow_up_set", description, timestamp: new Date().toISOString(),
      }];
    }

    const recruiterFields = [
      { key: "recruiterName", label: "name" },
      { key: "recruiterEmail", label: "email" },
      { key: "recruiterLinkedIn", label: "LinkedIn" },
    ] as const;
    const recruiterChanges = recruiterFields
      .filter(({ key }) => key in rest && String(rest[key] ?? "") !== String(app[key] ?? ""))
      .map(({ label, key }) =>
        String(rest[key] ?? "").trim() ? `Recruiter ${label} updated` : `Recruiter ${label} cleared`
      );

    if (recruiterChanges.length > 0) {
      updatedTimeline = [...updatedTimeline, ...recruiterChanges.map((description) => ({
        id: randomUUID(), type: "recruiter_added" as const, description, timestamp: new Date().toISOString(),
      }))];
    }

    // Build update payload from the explicit allowlist only
    const updateData: Record<string, unknown> = { timeline: JSON.stringify(updatedTimeline) };
    if (notes !== undefined) updateData.notes = notes;
    if (recruiterName !== undefined) updateData.recruiterName = recruiterName;
    if (recruiterEmail !== undefined) updateData.recruiterEmail = recruiterEmail;
    if (recruiterLinkedIn !== undefined) updateData.recruiterLinkedIn = recruiterLinkedIn;
    if (status) updateData.status = status;
    if (appliedAt !== undefined || (status === "applied" && !app.appliedAt)) {
      updateData.appliedAt = effectiveAppliedAt;
    }
    if (followUpDate !== undefined || (status === "applied" && !app.followUpDate)) {
      updateData.followUpDate = effectiveFollowUpDate;
    }

    // updateMany supports relation filters — prevents writing to rows we don't own even in a race
    await prisma.application.updateMany({
      where: { id: params.id, job: { userId } },
      data: updateData,
    });

    // Re-fetch with full include after the write
    const updated = await prisma.application.findFirst({
      where: { id: params.id, job: { userId } },
      include: { job: { select: JOB_SELECT } },
    });

    if (!updated) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    return NextResponse.json(serializeApplication(updated as unknown as Record<string, unknown>));
  } catch (err) {
    console.error("PATCH /api/applications/[id] error:", err);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getRequiredUserId();
    if ("error" in auth) return auth.error;
    const { userId } = auth;

    const result = await prisma.application.deleteMany({
      where: { id: params.id, job: { userId } },
    });
    if (result.count === 0) return NextResponse.json({ error: "Application not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/applications/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
  }
}
