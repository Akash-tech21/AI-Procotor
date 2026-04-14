"use client";

import { Button } from "@proctor/ui/components/button";
import {
  RoomAudioRenderer,
  SessionProvider,
  useAgent,
  useAudioWaveform,
  useSession,
  useSessionContext,
} from "@livekit/components-react";
import { TokenSource } from "livekit-client";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import AudioVisualizer from "@/components/audio-visualizer";

import InterviewComplete from "./interview-complete";

interface InterviewData {
  id: string;
  status: string;
}

export default function InterviewRoom({
  interview,
}: {
  interview: InterviewData;
}) {
  if (interview.status === "completed") {
    return <InterviewComplete />;
  }

  return <LiveInterviewView interviewId={interview.id} />;
}

function LiveInterviewView({ interviewId }: { interviewId: string }) {
  const tokenSource = useMemo(
    () =>
      TokenSource.custom(async () => {
        const response = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ interviewId }),
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch LiveKit token (${response.status})`);
        }
        const data = (await response.json()) as {
          token: string;
          serverUrl: string;
        };
        return {
          serverUrl: data.serverUrl,
          participantToken: data.token,
        };
      }),
    [interviewId],
  );

  const session = useSession(tokenSource);

  return (
    <SessionProvider session={session}>
      <ViewController />
      <RoomAudioRenderer />
    </SessionProvider>
  );
}

function ViewController() {
  const session = useSessionContext();
  const hasConnectedRef = useRef(false);
  const [showComplete, setShowComplete] = useState(false);

  useEffect(() => {
    if (session.isConnected) {
      hasConnectedRef.current = true;
    } else if (
      hasConnectedRef.current &&
      session.connectionState === "disconnected"
    ) {
      setShowComplete(true);
    }
  }, [session.isConnected, session.connectionState]);

  const handleEnd = useCallback(() => {
    session.end().catch(() => {});
    setShowComplete(true);
  }, [session]);

  if (showComplete) {
    return <InterviewComplete />;
  }

  if (!session.isConnected) {
    return <WelcomeView onStart={session.start} />;
  }

  return <InterviewActive onEnd={handleEnd} />;
}

function WelcomeView({
  onStart,
}: {
  onStart: (options?: Parameters<ReturnType<typeof useSession>["start"]>[0]) => Promise<void>;
}) {
  const [micPermission, setMicPermission] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");
  const [isStarting, setIsStarting] = useState(false);

  const requestMicPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicPermission("granted");
    } catch {
      setMicPermission("denied");
      toast.error(
        "Microphone access is required. Please allow it in your browser settings.",
      );
    }
  }, []);

  useEffect(() => {
    requestMicPermission();
  }, [requestMicPermission]);

  const handleBegin = useCallback(async () => {
    setIsStarting(true);
    try {
      await onStart({ tracks: { microphone: { enabled: true } } });
    } catch (e) {
      console.error("Failed to start LiveKit session:", e);
      toast.error("Failed to connect. Please try again.");
      setIsStarting(false);
    }
  }, [onStart]);

  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="animate-in-view" style={{ "--stagger": 0 } as React.CSSProperties}>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Ready to begin?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Check your microphone, then start when you&apos;re comfortable.
          </p>
        </div>

        <div
          className="animate-in-view mt-8"
          style={{ "--stagger": 1 } as React.CSSProperties}
        >
          <div className="flex items-center justify-between rounded-md border border-border/50 px-4 py-3">
            <div className="flex items-center gap-3">
              {micPermission === "granted" ? (
                <Mic className="size-4 text-accent" />
              ) : (
                <MicOff className="size-4 text-destructive" />
              )}
              <div className="text-left">
                <p className="text-sm font-medium">Microphone</p>
                <p className="text-xs text-muted-foreground">
                  {micPermission === "granted"
                    ? "Ready"
                    : micPermission === "denied"
                      ? "Access denied"
                      : "Requesting access..."}
                </p>
              </div>
            </div>
            {micPermission === "denied" && (
              <Button variant="outline" size="sm" onClick={requestMicPermission}>
                Retry
              </Button>
            )}
          </div>
        </div>

        <div
          className="animate-in-view mt-8"
          style={{ "--stagger": 2 } as React.CSSProperties}
        >
          <Button
            size="lg"
            className="w-full"
            disabled={micPermission !== "granted" || isStarting}
            onClick={handleBegin}
          >
            {isStarting ? "Connecting..." : "Start interview"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function InterviewActive({ onEnd }: { onEnd: () => void }) {
  const agent = useAgent();
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(Date.now());

  const audioTrack =
    "microphoneTrack" in agent ? agent.microphoneTrack : undefined;
  const { bars: agentBars } = useAudioWaveform(audioTrack, { barCount: 24 });

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeDisplay = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const stateLabel =
    agent.state === "speaking"
      ? "Interviewer speaking"
      : agent.state === "listening"
        ? "Listening"
        : agent.state === "thinking"
          ? "Processing"
          : agent.state === "connecting" ||
              agent.state === "pre-connect-buffering"
            ? "Connecting"
            : "Ready";

  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      {/* Status bar */}
      <div className="animate-in-view mb-16 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="block size-1.5 animate-pulse rounded-full bg-accent" />
          <span>Live</span>
        </div>
        <span className="font-mono tabular-nums">{timeDisplay}</span>
      </div>

      {/* Central visualizer */}
      <div className="animate-in-view flex flex-col items-center gap-6" style={{ "--stagger": 1 } as React.CSSProperties}>
        <AudioVisualizer
          frequencies={agentBars}
          isAgent={true}
          className="h-20"
        />
        <p className="text-[13px] font-medium text-muted-foreground">
          {stateLabel}
        </p>
      </div>

      {/* End button */}
      <div className="animate-in-view mt-16" style={{ "--stagger": 2 } as React.CSSProperties}>
        <Button
          variant="outline"
          size="sm"
          onClick={onEnd}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <PhoneOff className="mr-1.5 size-3.5" />
          End interview
        </Button>
      </div>
    </div>
  );
}
