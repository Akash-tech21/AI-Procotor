"use client";

interface TranscriptMessage {
  role: "agent" | "candidate";
  content: string;
  timestamp: string;
}

export default function TranscriptViewer({
  transcript,
}: {
  transcript: TranscriptMessage[];
}) {
  if (transcript.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">No transcript available.</p>
      </div>
    );
  }

  return (
    <div className="flex max-h-[600px] flex-col gap-0 overflow-y-auto">
      {transcript.map((message, index) => {
        const isAgent = message.role === "agent";
        return (
          <div
            key={index}
            className="flex gap-4 border-b border-border/20 py-4 last:border-b-0"
          >
            <div className="w-16 shrink-0 pt-0.5 text-right">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {isAgent ? "Agent" : "User"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-relaxed text-foreground/90">
                {message.content}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatTimestamp(message.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatTimestamp(ts: string): string {
  try {
    const date = new Date(ts);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return ts;
  }
}
