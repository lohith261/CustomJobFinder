import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: Request) {
  const { token } = await req.json().catch(() => ({}));
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { verifyToken: token, verifyTokenExpiry: { gt: new Date() } },
  });

  if (!user) {
    return NextResponse.json({ error: "Verification link is invalid or has expired." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verifyToken: null, verifyTokenExpiry: null },
  });

  // Send welcome email (best effort)
  sendWelcomeEmail(user.email, user.name).catch(() => {});

  return NextResponse.json({ success: true });
}
