"use client";

import { Button } from "@proctor/ui/components/button";
import { useRouter } from "next/navigation";

export default function InterviewComplete() {
  const router = useRouter();

  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="animate-in-view">
          <p className="text-[13px] font-medium tracking-widest uppercase text-muted-foreground">
            Complete
          </p>
          <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">
            Thank you
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Your responses have been recorded. We&apos;ll review your interview
            and follow up within 3&ndash;5 business days.
          </p>
        </div>
        <div
          className="animate-in-view mt-8"
          style={{ "--stagger": 1 } as React.CSSProperties}
        >
          <Button
            variant="outline"
            onClick={() => router.push("/interview")}
          >
            Return to interviews
          </Button>
        </div>
      </div>
    </div>
  );
}
