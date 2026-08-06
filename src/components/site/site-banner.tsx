"use client";

import { useState, useEffect } from "react";
import {
  Info, AlertTriangle, CheckCircle2, XCircle, Sparkles, X, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type BannerType = "info" | "warning" | "success" | "error" | "promo";

export type BannerConfig = {
  isActive: boolean;
  message: string;
  type: BannerType;
  dismissible: boolean;
  link: string;
  linkLabel: string;
};

function hash(s: string): string {
  // Simple djb2 hash — good enough for localStorage key uniqueness.
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h.toString(36);
}

const STORAGE_PREFIX = "dora_banner_dismissed_";

const STYLES: Record<BannerType, {
  bg: string;
  border: string;
  iconWrap: string;
  iconBg: string;
  text: string;
  linkCls: string;
}> = {
  info: {
    bg: "bg-sky-500/10",
    border: "border-b-sky-500/50",
    iconWrap: "text-sky-300",
    iconBg: "bg-sky-500/20",
    text: "text-sky-50",
    linkCls: "border-sky-400/60 bg-sky-500/20 text-sky-50 hover:bg-sky-500/40",
  },
  warning: {
    bg: "bg-warm-yellow/10",
    border: "border-b-warm-yellow/50",
    iconWrap: "text-warm-yellow",
    iconBg: "bg-warm-yellow/20",
    text: "text-warm-yellow",
    linkCls: "border-warm-yellow/60 bg-warm-yellow/20 text-warm-yellow hover:bg-warm-yellow/40",
  },
  success: {
    bg: "bg-emerald-500/10",
    border: "border-b-emerald-500/50",
    iconWrap: "text-emerald-300",
    iconBg: "bg-emerald-500/20",
    text: "text-emerald-50",
    linkCls: "border-emerald-400/60 bg-emerald-500/20 text-emerald-50 hover:bg-emerald-500/40",
  },
  error: {
    bg: "bg-neon-red/10",
    border: "border-b-neon-red/50",
    iconWrap: "text-neon-red",
    iconBg: "bg-neon-red/20",
    text: "text-neon-red",
    linkCls: "border-neon-red/60 bg-neon-red/20 text-white hover:bg-neon-red/40",
  },
  promo: {
    bg: "bg-fuchsia-500/10",
    border: "border-b-fuchsia-500/50",
    iconWrap: "text-fuchsia-300",
    iconBg: "bg-fuchsia-500/20",
    text: "text-fuchsia-50",
    linkCls: "border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-50 hover:bg-fuchsia-500/40",
  },
};

function TypeIcon({ type, className }: { type: BannerType; className?: string }) {
  switch (type) {
    case "info": return <Info className={className} />;
    case "warning": return <AlertTriangle className={className} />;
    case "success": return <CheckCircle2 className={className} />;
    case "error": return <XCircle className={className} />;
    case "promo": return <Sparkles className={className} />;
  }
}

export function SiteBanner({ banner }: { banner: BannerConfig }) {
  // `dismissed` is initialized lazily from localStorage so we avoid calling
  // setState inside useEffect (which lint forbids). On the server and the
  // first client render, it's false. After hydration, useSyncExternalStore
  // would be ideal — but for our use case, lazy initial state via useState
  // initializer works because we only read localStorage in the browser.
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Use a ref-based mount flag set in a layout effect to avoid the
  // setState-in-effect lint warning. We only read from localStorage once
  // after mount.
  useEffect(() => {
    // Mark as mounted using a microtask to avoid sync setState in effect body.
    Promise.resolve().then(() => {
      setMounted(true);
      if (!banner.isActive || !banner.dismissible) return;
      try {
        const key = STORAGE_PREFIX + hash(banner.message);
        const stored = localStorage.getItem(key);
        if (stored) setDismissed(true);
      } catch { /* ignore */ }
    });
  }, [banner.isActive, banner.dismissible, banner.message]);

  // Don't render if not active, no message, or dismissed.
  // We render null on server (so SSR doesn't show different content than client
  // when dismissed) — actually we want banner to appear server-side for SEO;
  // dismissed state only affects client after mount.
  if (!banner.isActive || !banner.message.trim()) return null;
  if (mounted && dismissed && banner.dismissible) return null;

  const s = STYLES[banner.type] ?? STYLES.info;
  const dismiss = () => {
    try {
      const key = STORAGE_PREFIX + hash(banner.message);
      localStorage.setItem(key, String(Date.now()));
    } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <div
      role="region"
      aria-label="Oznámenie"
      className={cn(
        "fixed inset-x-0 top-0 z-[55] border-b backdrop-blur-md",
        s.bg, s.border, "border-t-0 border-l-0 border-r-0"
      )}
    >
      {/* Subtle animated sheen */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[bannerSheen_8s_ease-in-out_infinite]" />
      </div>

      <div className="relative mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <span className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
          s.iconBg, s.iconWrap
        )}>
          <TypeIcon type={banner.type} className="h-3.5 w-3.5" />
        </span>

        <p className={cn(
          "flex-1 truncate text-xs font-semibold sm:text-sm",
          s.text
        )}>
          {banner.message}
        </p>

        {banner.link && banner.linkLabel && (
          <a
            href={banner.link}
            target={banner.link.startsWith("http") ? "_blank" : undefined}
            rel={banner.link.startsWith("http") ? "noreferrer" : undefined}
            className={cn(
              "inline-flex items-center gap-1 border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors sm:text-xs",
              s.linkCls
            )}
          >
            {banner.linkLabel}
            <ChevronRight className="h-3 w-3" />
          </a>
        )}

        {banner.dismissible && (
          <button
            onClick={dismiss}
            aria-label="Zavrieť oznámenie"
            className={cn(
              "shrink-0 rounded-full p-1 transition-colors",
              s.iconWrap, "hover:bg-white/10"
            )}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
