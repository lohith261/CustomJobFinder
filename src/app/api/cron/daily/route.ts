import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { runPipeline } from "@/lib/pipeline";

export async function GET(req: NextRequest) {
  // Fail-closed: if CRON_SECRET is not configured, deny all requests
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/daily] CRON_SECRET is not set — rejecting request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;

  // Timing-safe comparison to prevent secret enumeration via response-time
  let authorized = false;
  try {
    const a = Buffer.from(authHeader);
    const b = Buffer.from(expected);
    authorized = a.length === b.length && timingSafeEqual(a, b);
  } catch {
    authorized = false;
  }

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    const results = await Promise.allSettled(
      users.map((user) =>
        runPipeline({
          userId: user.id,
          threshold: parseInt(process.env.PIPELINE_SCORE_THRESHOLD ?? "65"),
          maxJobs: parseInt(process.env.PIPELINE_MAX_JOBS ?? "10"),
          tone: "professional",
        })
      )
    );

    const summary = results.map((r, i) => ({
      userId: users[i].id,
      status: r.status,
      ...(r.status === "fulfilled" ? { runId: r.value.id } : { error: "Pipeline error" }),
    }));

    console.log(`[cron/daily] Completed for ${users.length} users`);
    return NextResponse.json({ success: true, summary });
  } catch (err) {
    console.error("[cron/daily] Pipeline failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
