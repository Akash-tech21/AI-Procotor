"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@proctor/ui/components/dropdown-menu";
import { Skeleton } from "@proctor/ui/components/skeleton";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { formatDate, formatDuration, titleCase } from "@/lib/format";
import { recommendationStyles, statusStyles } from "@/lib/styles";

interface InterviewListItem {
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
}

type StatusFilter = "all" | "scheduled" | "in_progress" | "completed" | "failed";

const statusLabels: Record<StatusFilter, string> = {
  all: "All",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  failed: "Failed",
};

export default function AdminDashboard({
  session,
}: {
  session: typeof authClient.$Infer.Session;
}) {
  const router = useRouter();
  const [interviews, setInterviews] = useState<InterviewListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");

  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/interviews?page=1&limit=50", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch interviews");
      const payload = (await res.json()) as {
        data: Array<{
          interview: {
            id: string;
            candidateId: string;
            livekitRoom: string;
            status: InterviewListItem["status"];
            startedAt: string | null;
            endedAt: string | null;
            durationSecs: number | null;
            createdAt: string;
          };
          candidate: { name: string; email: string } | null;
          assessment: {
            overallScore: number;
            recommendation: string;
          } | null;
        }>;
      };
      setInterviews(
        payload.data.map((row) => ({
          id: row.interview.id,
          candidateId: row.interview.candidateId,
          candidateName: row.candidate?.name ?? "Unknown",
          candidateEmail: row.candidate?.email ?? "",
          livekitRoom: row.interview.livekitRoom,
          status: row.interview.status,
          startedAt: row.interview.startedAt,
          endedAt: row.interview.endedAt,
          durationSecs: row.interview.durationSecs,
          createdAt: row.interview.createdAt,
          overallScore: row.assessment?.overallScore ?? null,
          recommendation: row.assessment?.recommendation ?? null,
        })),
      );
    } catch (err) {
      toast.error("Failed to load interviews");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const filtered =
    filter === "all" ? interviews : interviews.filter((i) => i.status === filter);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      {/* Header */}
      <div className="animate-in-view flex items-end justify-between" style={{ "--stagger": 0 } as React.CSSProperties}>
        <div>
          <p className="text-[13px] font-medium tracking-widest uppercase text-muted-foreground">
            Admin
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            Interviews
          </h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/50 bg-transparent px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            {statusLabels[filter]}
            <ChevronDown className="size-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(statusLabels) as StatusFilter[]).map((key) => (
              <DropdownMenuItem key={key} onSelect={() => setFilter(key)}>
                {statusLabels[key]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div
        className="animate-in-view mt-8"
        style={{ "--stagger": 1 } as React.CSSProperties}
      >
        {loading ? (
          <div className="flex flex-col gap-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full border-b border-border/20" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border-t border-border/50 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {filter === "all"
                ? "No interviews yet."
                : `No ${statusLabels[filter].toLowerCase()} interviews.`}
            </p>
          </div>
        ) : (
          <div>
            {/* Column headers */}
            <div className="hidden border-b border-border/50 sm:grid sm:grid-cols-[1fr_100px_72px_88px_72px_100px_20px] sm:items-center sm:gap-4 sm:px-0 sm:py-2.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Candidate
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Date
              </span>
              <span className="text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Duration
              </span>
              <span className="text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </span>
              <span className="text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Score
              </span>
              <span className="text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Rec.
              </span>
              <span />
            </div>

            {/* Rows */}
            {filtered.map((interview) => (
              <button
                key={interview.id}
                type="button"
                onClick={() => router.push(`/admin/${interview.id}`)}
                className="grid w-full grid-cols-[1fr_auto] items-center gap-4 border-b border-border/30 px-0 py-3 text-left transition-colors hover:bg-muted/20 sm:grid-cols-[1fr_100px_72px_88px_72px_100px_20px]"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="truncate text-sm font-medium">
                    {interview.candidateName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {interview.candidateEmail}
                  </span>
                </div>

                <span className="hidden text-xs tabular-nums text-muted-foreground sm:block">
                  {formatDate(interview.createdAt)}
                </span>

                <span className="hidden text-right font-mono text-xs tabular-nums text-muted-foreground sm:block">
                  {formatDuration(interview.durationSecs)}
                </span>

                <span className="hidden sm:flex sm:justify-center">
                  <span
                    className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium ${statusStyles[interview.status] ?? statusStyles.scheduled}`}
                  >
                    {titleCase(interview.status)}
                  </span>
                </span>

                <span className="hidden sm:flex sm:justify-center">
                  {interview.overallScore != null ? (
                    <span className="font-mono text-sm tabular-nums">
                      {interview.overallScore}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">&mdash;</span>
                  )}
                </span>

                <span className="hidden sm:flex sm:justify-center">
                  {interview.recommendation ? (
                    <span
                      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium ${recommendationStyles[interview.recommendation] ?? ""}`}
                    >
                      {titleCase(interview.recommendation)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">&mdash;</span>
                  )}
                </span>

                <ChevronRight className="size-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Count */}
      {!loading && filtered.length > 0 && (
        <p className="mt-4 text-xs text-muted-foreground">
          {filtered.length} interview{filtered.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
