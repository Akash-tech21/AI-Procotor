"use client";

const scoreColors: Record<number, string> = {
  1: "text-red-400",
  2: "text-orange-400",
  3: "text-yellow-400",
  4: "text-green-400",
  5: "text-emerald-400",
};

export default function ScoreBadge({ score }: { score: number }) {
  const clamped = Math.max(1, Math.min(5, Math.round(score)));
  const colorClass = scoreColors[clamped] ?? scoreColors[3];

  return (
    <span className={`font-mono text-sm font-medium tabular-nums ${colorClass}`}>
      {score}
    </span>
  );
}
