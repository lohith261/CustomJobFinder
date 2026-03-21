import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRequiredUserId } from "@/lib/auth-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getRequiredUserId();
    if ("error" in auth) return auth.error;
    const { userId } = auth;

    const record = await prisma.outreachEmail.findFirst({ where: { id: params.id, userId } });
    if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      id: record.id,
      companyUrl: record.companyUrl,
      companyName: record.companyName,
      companyInfo: JSON.parse(record.companyInfo),
      emailSubject: record.emailSubject,
      emailBody: record.emailBody,
      resumeId: record.resumeId,
      replied: record.replied,
      repliedAt: record.repliedAt ? record.repliedAt.toISOString() : null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error("GET /api/outreach/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
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
    const replied: boolean = body.replied;

    const existing = await prisma.outreachEmail.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.outreachEmail.update({
      where: { id: params.id },
      data: {
        replied,
        repliedAt: replied ? new Date() : null,
      },
    });

    return NextResponse.json({
      id: updated.id,
      replied: updated.replied,
      repliedAt: updated.repliedAt ? updated.repliedAt.toISOString() : null,
    });
  } catch (err) {
    console.error("PATCH /api/outreach/[id] error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
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

    const result = await prisma.outreachEmail.deleteMany({ where: { id: params.id, userId } });
    if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/outreach/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
