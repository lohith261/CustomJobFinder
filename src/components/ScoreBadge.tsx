"use client";

export function ScoreBadge({ score }: { score: number }) {
  const colorClass =
    score >= 70
      ? "score-high"
      : score >= 40
        ? "score-medium"
        : "score-low";

  return (
    <span className={`score-badge ${colorClass}`}>
      {score}%
    </span>
  );
}
