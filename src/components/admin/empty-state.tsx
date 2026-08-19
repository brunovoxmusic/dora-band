"use client";

import { Inbox, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Empty State — konzistentný prázdny stav pre admin taby.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = "Žiadne dáta",
  description = "Zatiaľ tu nie sú žiadne záznamy.",
  action,
}: {
  icon?: typeof Inbox;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-charcoal py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-charcoal bg-dark-gray text-silver">
        <Icon className="h-7 w-7" />
      </div>
      <p className="font-display text-base font-bold text-off-white">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-silver/70">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-2 bg-neon-red px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-deep-red"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Error State — konzistentný chybový stav s retry.
 */
export function ErrorState({
  message = "Nepodarilo sa načítať dáta.",
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center border border-neon-red/30 bg-neon-red/5 py-12 text-center", className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-neon-red/40 bg-neon-red/10 text-neon-red">
        <AlertCircle className="h-6 w-6" />
      </div>
      <p className="text-sm font-semibold text-off-white">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 border border-charcoal px-4 py-2 text-xs font-semibold text-off-white/80 transition-colors hover:border-neon-red hover:text-neon-red"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Skúsiť znova
        </button>
      )}
    </div>
  );
}
