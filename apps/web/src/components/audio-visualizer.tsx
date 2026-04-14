"use client";

interface AudioVisualizerProps {
  frequencies: number[];
  isAgent?: boolean;
  className?: string;
}

export default function AudioVisualizer({
  frequencies,
  isAgent = false,
  className = "",
}: AudioVisualizerProps) {
  const barCount = Math.max(frequencies.length, 7);

  return (
    <div className={`flex items-center justify-center gap-[3px] ${className}`}>
      {Array.from({ length: barCount }).map((_, i) => {
        const value = frequencies[i] ?? 0;
        const height = Math.max(3, value * 64);
        return (
          <div
            key={i}
            className="w-[3px] rounded-full transition-all duration-75"
            style={{
              height: `${height}px`,
              backgroundColor: isAgent
                ? `oklch(0.78 ${0.04 + value * 0.1} 70)`
                : `oklch(0.78 ${0.04 + value * 0.1} 70 / ${0.5 + value * 0.5})`,
            }}
          />
        );
      })}
    </div>
  );
}
