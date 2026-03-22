import { getRequiredUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

async function requireAdmin(callerId: string) {
  const user = await prisma.user.findUnique({ where: { id: callerId }, select: { isAdmin: true, email: true } });
  return user?.isAdmin || user?.email === process.env.ADMIN_EMAIL;
}

export async function POST(_req: Request, { params }: { params: { userId: string } }) {
  const result = await getRequiredUserId();
  if ("error" in result) return result.error;
  if (!(await requireAdmin(result.userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.user.update({
    where: { id: params.userId },
    data: { subscriptionStatus: "free", upiTransactionId: null },
  });

  return Response.json({ success: true });
}
