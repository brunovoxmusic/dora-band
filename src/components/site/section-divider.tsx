import { cn } from "@/lib/utils";

/**
 * Animated section divider — a thin neon sweep line with a centered mark.
 * Use between major sections to add visual rhythm.
 */
export function SectionDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-px items-center justify-center bg-charcoal",
        className
      )}
      aria-hidden
    >
      <span className="pointer-events-none absolute inset-0 divider-sweep opacity-60" />
      <span className="relative z-10 flex items-center gap-1.5 bg-ink px-3">
        <span className="h-1.5 w-1.5 bg-neon-red" />
        <span className="h-2 w-2 rotate-45 border border-warm-yellow" />
        <span className="h-1.5 w-1.5 bg-neon-red" />
      </span>
    </div>
  );
}
