"use client";

import { Button } from "@proctor/ui/components/button";
import { Skeleton } from "@proctor/ui/components/skeleton";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import AssessmentCard from "@/components/assessment-card";
import ScoreBadge from "@/components/score-badge";
import TranscriptViewer from "@/components/transcript-viewer";

interface InterviewDetail {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  livekitRoom: string;
  status: "scheduled" | "in_progress" | "completed" | "failed";
  startedAt: string | null;
  endedAt: string | null;
  durationSecs: number | null;
  createdAt: string;
  overallScore: number | null;
  recommendation: string | null;
  transcript: Array<{
    role: "agent" | "candidate";
    content: string;
    timestamp: string;
  }> | null;
  assessment: {
    id: string;
    overallScore: number;
    recommendation: string;
    summary: string;
    dimensions: Array<{
      dimension: string;
      score: number;
      evidence: string;
      notes: string;
    }>;
  } | null;
}

const dimensionLabels: Record<string, string> = {
  communication_clarity: "Communication Clarity",
  patience_warmth: "Patience & Warmth",
  simplification_ability: "Simplification Ability",
  english_fluency: "English Fluency",
  teaching_enthusiasm: "Teaching Enthusiasm",
};

export default function ReviewDetail({
  interviewId,
}: {
  interviewId: string;
}) {
  const router = useRouter();
  const [interview, setInterview] = useState<InterviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const fetchInterview = useCallback(async () => {
    try {
      setLoading(true);
      setNotFound(false);
      setLoadError(false);
      const res = await fetch(`/api/interviews/${interviewId}`, {
        credentials: "include",
      });
      if (res.status === 404) {
        setInterview(null);
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch interview");
      const raw = (await res.json()) as {
        interview: {
          id: string;
          candidateId: string;
          livekitRoom: string;
          status: "scheduled" | "in_progress" | "completed" | "failed";
          startedAt: string | null;
          endedAt: string | null;
          durationSecs: number | null;
          createdAt: string;
          transcript: Array<{
            role: "agent" | "candidate";
            content: string;
            timestamp: string;
          }> | null;
        };
        candidate: { name: string; email: string } | null;
        assessment: {
          id: string;
          overallScore: number;
          recommendation: string;
          summary: string;
          dimensions: string | null;
        } | null;
      };

      type Dimension = NonNullable<
        InterviewDetail["assessment"]
      >["dimensions"][number];
      let parsedDimensions: Dimension[] = [];
      if (raw.assessment?.dimensions) {
        try {
          parsedDimensions = JSON.parse(
            raw.assessment.dimensions,
          ) as Dimension[];
        } catch {
          parsedDimensions = [];
        }
      }

      setInterview({
        id: raw.interview.id,
        candidateId: raw.interview.candidateId,
        candidateName: raw.candidate?.name ?? "Unknown",
        candidateEmail: raw.candidate?.email ?? "",
        livekitRoom: raw.interview.livekitRoom,
        status: raw.interview.status,
        startedAt: raw.interview.startedAt,
        endedAt: raw.interview.endedAt,
        durationSecs: raw.interview.durationSecs,
        createdAt: raw.interview.createdAt,
        overallScore: raw.assessment?.overallScore ?? null,
        recommendation: raw.assessment?.recommendation ?? null,
        transcript: raw.interview.transcript,
        assessment: raw.assessment
          ? {
              id: raw.assessment.id,
              overallScore: raw.assessment.overallScore,
              recommendation: raw.assessment.recommendation,
              summary: raw.assessment.summary,
              dimensions: parsedDimensions,
            }
          : null,
      });
    } catch (err) {
      setInterview(null);
      setLoadError(true);
      toast.error("Failed to load interview details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    fetchInterview();
  }, [fetchInterview]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <Skeleton className="mb-8 h-5 w-32" />
        <Skeleton className="mb-4 h-40 w-full" />
        <Skeleton className="mb-4 h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (notFound || loadError || !interview) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </button>
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            {notFound
              ? "Interview not found."
              : "Failed to load interview details."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      {/* Back nav */}
      <div className="animate-in-view" style={{ "--stagger": 0 } as React.CSSProperties}>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to interviews
        </button>
      </div>

      {/* Assessment */}
      {interview.assessment ? (
        <div
          className="animate-in-view mt-10"
          style={{ "--stagger": 1 } as React.CSSProperties}
        >
          <AssessmentCard
            assessment={interview.assessment}
            candidate={{
              name: interview.candidateName,
              email: interview.candidateEmail,
            }}
            interview={{
              createdAt: interview.createdAt,
              durationSecs: interview.durationSecs,
            }}
          />
        </div>
      ) : (
        <div
          className="animate-in-view mt-10 border-t border-border/50 py-12 text-center"
          style={{ "--stagger": 1 } as React.CSSProperties}
        >
          <p className="text-sm text-muted-foreground">
            Assessment not yet available.
          </p>
        </div>
      )}

      {/* Dimensions */}
      {interview.assessment?.dimensions &&
        interview.assessment.dimensions.length > 0 && (
          <div
            className="animate-in-view mt-12"
            style={{ "--stagger": 2 } as React.CSSProperties}
          >
            <p className="mb-6 text-[13px] font-medium tracking-widest uppercase text-muted-foreground">
              Dimensions
            </p>
            <div className="flex flex-col gap-0">
              {interview.assessment.dimensions.map((dim) => (
                <div
                  key={dim.dimension}
                  className="border-b border-border/30 py-5 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-medium">
                      {dimensionLabels[dim.dimension] ?? dim.dimension}
                    </span>
                    <ScoreBadge score={dim.score} />
                  </div>
                  {dim.evidence && (
                    <p className="mt-3 max-w-[55ch] text-[13px] leading-relaxed italic text-muted-foreground">
                      &ldquo;{dim.evidence}&rdquo;
                    </p>
                  )}
                  {dim.notes && (
                    <p className="mt-2 max-w-[55ch] text-[13px] leading-relaxed text-muted-foreground">
                      {dim.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Transcript */}
      {interview.transcript && interview.transcript.length > 0 && (
        <div
          className="animate-in-view mt-12"
          style={{ "--stagger": 3 } as React.CSSProperties}
        >
          <p className="mb-6 text-[13px] font-medium tracking-widest uppercase text-muted-foreground">
            Transcript
          </p>
          <TranscriptViewer transcript={interview.transcript} />
        </div>
      )}
    </div>
  );
}
