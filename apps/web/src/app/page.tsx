"use client";

import Link from "next/link";
import { Button } from "@proctor/ui/components/button";

const dimensions = [
  { number: "01", label: "Communication Clarity" },
  { number: "02", label: "Patience & Warmth" },
  { number: "03", label: "Simplification Ability" },
  { number: "04", label: "Teaching Enthusiasm" },
  { number: "05", label: "English Fluency" },
] as const;

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      {/* Hero */}
      <section className="animate-in-view pb-20" style={{ "--stagger": 0 } as React.CSSProperties}>
        <p className="mb-4 text-[13px] font-medium tracking-widest uppercase text-muted-foreground">
          Tutor Screening Platform
        </p>
        <h1 className="font-display text-4xl font-semibold leading-[1.15] tracking-tight sm:text-5xl">
          Find the right
          <br />
          tutors, faster.
        </h1>
        <p className="mt-6 max-w-[48ch] text-base leading-relaxed text-muted-foreground">
          A 10-minute voice interview powered by AI. Candidates speak with an
          intelligent interviewer that evaluates teaching ability, communication,
          and warmth.
        </p>
        <div className="mt-10 flex gap-4">
          <Button size="lg" render={<Link href="/interview" />}>
            Start Interview
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/admin" />}>
            Admin
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section className="animate-in-view border-t border-border/50 py-16" style={{ "--stagger": 1 } as React.CSSProperties}>
        <p className="mb-10 text-[13px] font-medium tracking-widest uppercase text-muted-foreground">
          How it works
        </p>
        <div className="grid gap-12 sm:grid-cols-3">
          <Step number="01" title="Sign up" description="Create an account and confirm your details." />
          <Step number="02" title="Speak" description="Have a natural conversation with the AI interviewer for about 10 minutes." />
          <Step number="03" title="Review" description="Receive a structured assessment across five evaluation dimensions." />
        </div>
      </section>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <span className="mb-3 block font-mono text-xs tabular-nums text-muted-foreground">
        {number}
      </span>
      <h3 className="font-display text-base font-semibold tracking-tight">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
