import { getRequiredUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

async function requireAdmin(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true, email: true } });
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user?.isAdmin && user?.email !== adminEmail) return false;
  return true;
}

export async function GET() {
  const result = await getRequiredUserId();
  if ("error" in result) return result.error;
  const { userId } = result;
  if (!(await requireAdmin(userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const pending = await prisma.user.findMany({
    where: { subscriptionStatus: "pending" },
    select: {
      id: true, email: true, name: true,
      subscriptionPlan: true, upiTransactionId: true,
      subscriptionStatus: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const active = await prisma.user.findMany({
    where: { subscriptionStatus: "active" },
    select: {
      id: true, email: true, name: true,
      subscriptionPlan: true, subscriptionEndsAt: true,
      proActivatedAt: true, proActivatedBy: true,
    },
    orderBy: { proActivatedAt: "desc" },
    take: 20,
  });

  return Response.json({ pending, active });
}
