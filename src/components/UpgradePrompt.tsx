"use client";

import Link from "next/link";

interface Props {
  feature: "analysis" | "coverLetter" | "outreach" | "pipeline" | "tailored";
  remaining?: number;
}

const FEATURE_LABELS: Record<Props["feature"], string> = {
  analysis: "AI resume analyses",
  coverLetter: "AI cover letters",
  outreach: "cold outreach emails",
  pipeline: "automation pipeline",
  tailored: "tailored resume generation",
};

const FEATURE_LIMITS: Partial<Record<Props["feature"], number>> = {
  analysis: 3,
  coverLetter: 3,
  outreach: 2,
};

export function UpgradePrompt({ feature, remaining }: Props) {
  const label = FEATURE_LABELS[feature];
  const limit = FEATURE_LIMITS[feature];

  if (remaining !== undefined && remaining > 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <span>⚠️</span>
        <span>{remaining} free {label} remaining this month.</span>
        <Link href="/pricing" className="font-semibold underline hover:text-amber-900">Upgrade for unlimited →</Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 text-center space-y-3">
      <div className="text-3xl">🔒</div>
      <div>
        <p className="font-semibold text-indigo-900">
          {limit ? `You've used your ${limit} free ${label} this month` : `${label} is a Pro feature`}
        </p>
        <p className="text-sm text-indigo-700 mt-1">
          Upgrade to Pro for unlimited access — ₹499/month
        </p>
      </div>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
      >
        View Pricing →
      </Link>
    </div>
  );
}
