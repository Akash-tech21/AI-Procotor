"use client";

import { Button } from "@proctor/ui/components/button";
import { Input } from "@proctor/ui/components/input";
import { Label } from "@proctor/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

const preparations = [
  "Quiet space with minimal background noise",
  "Headphones recommended for best audio",
  "About 10 minutes of uninterrupted time",
];

export default function StartInterview({
  session,
}: {
  session: typeof authClient.$Infer.Session;
}) {
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      name: session.user.name ?? "",
      email: session.user.email ?? "",
      phone: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const response = await fetch("/api/interviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: value.name,
            email: value.email,
            phone: value.phone || undefined,
          }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            message?: string;
          } | null;
          throw new Error(
            body?.message ?? `Request failed with status ${response.status}`,
          );
        }

        const data = (await response.json()) as { id: string };
        router.push(`/interview/${data.id}`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to start interview",
        );
      }
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, "Name is required"),
        email: z.email("Invalid email address"),
        phone: z.string(),
      }),
    },
  });

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center px-6 py-16">
      {/* Hero */}
      <div
        className="animate-in-view"
        style={{ "--stagger": 0 } as React.CSSProperties}
      >
        <span className="font-mono text-[11px] text-muted-foreground/40">
          ~10 min
        </span>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight leading-[1.1]">
          Before we begin
        </h1>
        <p className="mt-5 max-w-[48ch] text-[15px] leading-[1.65] text-muted-foreground">
          You&apos;ll have a voice conversation with an AI interviewer covering
          math knowledge, teaching approach, and communication skills.
        </p>
      </div>

      {/* Preparation */}
      <div
        className="animate-in-view mt-12"
        style={{ "--stagger": 1 } as React.CSSProperties}
      >
        <div className="flex flex-col gap-3">
          {preparations.map((item, i) => (
            <div key={i} className="flex items-baseline gap-4">
              <span className="shrink-0 font-mono text-[11px] text-muted-foreground/25">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div
        className="animate-in-view mt-12"
        style={{ "--stagger": 2 } as React.CSSProperties}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="flex flex-col gap-5"
        >
          <form.Field name="name">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor={field.name} className="text-[13px]">
                  Full name
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-xs text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor={field.name} className="text-[13px]">
                  Email
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-xs text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="phone">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor={field.name} className="text-[13px]">
                  Phone{" "}
                  <span className="text-muted-foreground/50">(optional)</span>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="tel"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ canSubmit, isSubmitting }) => (
              <Button
                type="submit"
                size="lg"
                className="mt-4 w-full"
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? "Starting..." : "Begin interview"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </div>
    </div>
  );
}
