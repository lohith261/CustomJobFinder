import { getRequiredUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

async function requireAdmin(callerId: string) {
  const user = await prisma.user.findUnique({ where: { id: callerId }, select: { isAdmin: true, email: true } });
  const adminEmail = process.env.ADMIN_EMAIL;
  return user?.isAdmin || user?.email === adminEmail;
}

export async function POST(req: Request, { params }: { params: { userId: string } }) {
  const result = await getRequiredUserId();
  if ("error" in result) return result.error;
  if (!(await requireAdmin(result.userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const target = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { subscriptionPlan: true },
  });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const months = target.subscriptionPlan === "annual" ? 12 : 1;
  const endsAt = new Date();
  endsAt.setMonth(endsAt.getMonth() + months);

  const updated = await prisma.user.update({
    where: { id: params.userId },
    data: {
      subscriptionStatus: "active",
      subscriptionEndsAt: endsAt,
      proActivatedAt: new Date(),
      proActivatedBy: "manual",
    },
    select: { email: true, subscriptionPlan: true, subscriptionEndsAt: true },
  });

  return Response.json({ success: true, user: updated });
}
