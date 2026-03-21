import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeConfig } from "@/lib/json-arrays";
import { getRequiredUserId } from "@/lib/auth-helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getRequiredUserId();
  if ("error" in auth) return auth.error;
  const { userId } = auth;

  const { id } = await params;
  const body = await req.json();

  // Verify config belongs to user
  const config = await prisma.searchConfig.findFirst({
    where: { id, userId },
  });
  if (!config) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.activate === true) {
    await prisma.$transaction([
      prisma.searchConfig.updateMany({
        where: { userId },
        data: { isActive: false },
      }),
      prisma.searchConfig.update({
        where: { id },
        data: { isActive: true },
      }),
    ]);
    return NextResponse.json({ success: true, id });
  }

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    }
    const updated = await prisma.searchConfig.update({
      where: { id },
      data: { name },
    });
    return NextResponse.json(
      serializeConfig(updated as unknown as Record<string, unknown>)
    );
  }

  return NextResponse.json({ error: "No valid operation specified" }, { status: 400 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getRequiredUserId();
  if ("error" in auth) return auth.error;
  const { userId } = auth;

  const { id } = await params;

  // Verify config belongs to user
  const config = await prisma.searchConfig.findFirst({
    where: { id, userId },
  });
  if (!config) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Count total configs for user
  const total = await prisma.searchConfig.count({ where: { userId } });
  if (total <= 1) {
    return NextResponse.json(
      { error: "Cannot delete the only profile" },
      { status: 400 }
    );
  }

  await prisma.searchConfig.delete({ where: { id } });

  // If the deleted config was active, activate the most recent remaining one
  if (config.isActive) {
    const mostRecent = await prisma.searchConfig.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (mostRecent) {
      await prisma.searchConfig.update({
        where: { id: mostRecent.id },
        data: { isActive: true },
      });
    }
  }

  return NextResponse.json({ success: true });
}
