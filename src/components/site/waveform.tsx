import { cn } from "@/lib/utils";

/**
 * Animated audio-visualizer waveform — decorative bars that "play" on a loop.
 * Used on discography cards and music-related UI. Purely decorative (aria-hidden).
 */
export function Waveform({
  bars = 16,
  className,
  color = "neon-red",
  active = true,
}: {
  bars?: number;
  className?: string;
  color?: "neon-red" | "warm-yellow" | "silver";
  active?: boolean;
}) {
  const colorClass = {
    "neon-red": "bg-neon-red",
    "warm-yellow": "bg-warm-yellow",
    silver: "bg-silver",
  }[color];

  // Pseudo-random heights for a natural waveform feel
  const heights = Array.from({ length: bars }, (_, i) => {
    const seed = [0.4, 0.8, 0.55, 0.95, 0.3, 0.7, 0.45, 0.85, 0.6, 0.35, 0.75, 0.5, 0.9, 0.25, 0.65, 0.42];
    return seed[i % seed.length];
  });

  return (
    <div
      className={cn("flex h-8 items-center gap-[2px]", className)}
      aria-hidden
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className={cn("w-[2px] origin-center", colorClass, !active && "opacity-30")}
          style={{
            height: `${h * 100}%`,
            animation: active ? `waveform-bar 1.2s ease-in-out ${i * 0.06}s infinite` : undefined,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes waveform-bar {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
