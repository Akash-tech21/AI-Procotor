"use client";

import { formatDate, formatDuration, titleCase } from "@/lib/format";
import { recommendationStyles } from "@/lib/styles";

interface AssessmentCardProps {
  assessment: {
    overallScore: number;
    recommendation: string;
    summary: string;
  };
  candidate: {
    name: string;
    email: string;
  };
  interview: {
    createdAt: string;
    durationSecs: number | null;
  };
}

export default function AssessmentCard({
  assessment,
  candidate,
  interview,
}: AssessmentCardProps) {
  const recStyle =
    recommendationStyles[assessment.recommendation] ?? recommendationStyles.maybe;

  return (
    <div>
      {/* Top row: score, recommendation, metadata */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-baseline gap-6">
          <div className="flex flex-col items-center gap-1">
            <span className="font-display text-5xl font-semibold tabular-nums tracking-tight">
              {assessment.overallScore}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              of 5
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span
              className={`inline-flex w-fit items-center rounded-sm px-2.5 py-1 text-xs font-medium ${recStyle}`}
            >
              {titleCase(assessment.recommendation)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground sm:text-right">
          <span>{candidate.name}</span>
          <span>{candidate.email}</span>
          <span>
            {formatDate(interview.createdAt, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
            {" \u00B7 "}
            {formatDuration(interview.durationSecs)}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-8 border-t border-border/30 pt-6">
        <p className="max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
          {assessment.summary}
        </p>
      </div>
    </div>
  );
}
