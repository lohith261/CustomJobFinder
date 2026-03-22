import { getRequiredUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const result = await getRequiredUserId();
  if ("error" in result) return result.error;
  const { userId } = result;

  const body = await req.json().catch(() => ({}));
  const { transactionId, plan } = body as { transactionId?: string; plan?: string };

  if (!transactionId || typeof transactionId !== "string" || transactionId.trim().length < 6) {
    return NextResponse.json({ error: "Valid UPI transaction ID required" }, { status: 400 });
  }
  if (!plan || !["monthly", "annual"].includes(plan)) {
    return NextResponse.json({ error: "Plan must be monthly or annual" }, { status: 400 });
  }

  // Check for duplicate txn ID
  const existing = await prisma.user.findFirst({
    where: { upiTransactionId: transactionId.trim() },
  });
  if (existing && existing.id !== userId) {
    return NextResponse.json({ error: "This transaction ID has already been submitted" }, { status: 409 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: "pending",
      subscriptionPlan: plan,
      upiTransactionId: transactionId.trim(),
    },
    select: { email: true, name: true },
  });

  // Notify admin via Telegram (best effort)
  await notifyAdmin({ userId, email: user.email, transactionId: transactionId.trim(), plan }).catch(() => {});

  return NextResponse.json({ message: "Payment claim submitted. You will be activated within 1 hour." });
}

async function notifyAdmin({ userId, email, transactionId, plan }: {
  userId: string; email: string; transactionId: string; plan: string;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const amount = plan === "annual" ? "₹3,999" : "₹499";
  const text = [
    "💰 *New Payment Claim*",
    `👤 ${email}`,
    `📦 Plan: ${plan} (${amount})`,
    `🔖 Txn ID: \`${transactionId}\``,
    `🔗 [Activate in Admin](${process.env.NEXTAUTH_URL}/admin)`,
  ].join("\n");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}
