"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Inbox, CalendarDays, Images, ExternalLink, LayoutDashboard, Mail, FileText, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { InquiriesTab } from "@/components/admin/inquiries-tab";
import { GigsTab } from "@/components/admin/gigs-tab";
import { MediaTab } from "@/components/admin/media-tab";
import { StatsTab } from "@/components/admin/stats-tab";
import { SubscribersTab } from "@/components/admin/subscribers-tab";
import { ContentTab } from "@/components/admin/content-tab";
import { SeoTab } from "@/components/admin/seo-tab";
import { AiTab } from "@/components/admin/ai-tab";

type Tab = "stats" | "inquiries" | "gigs" | "media" | "subscribers" | "content" | "seo" | "ai";

const TABS: { id: Tab; label: string; icon: typeof Inbox; hasCount?: boolean }[] = [
  { id: "stats", label: "Prehľad", icon: LayoutDashboard },
  { id: "inquiries", label: "Dopyty", icon: Inbox, hasCount: true },
  { id: "gigs", label: "Koncerty", icon: CalendarDays, hasCount: true },
  { id: "media", label: "Médiá", icon: Images, hasCount: true },
  { id: "subscribers", label: "Newsletter", icon: Mail, hasCount: true },
  { id: "content", label: "Obsah", icon: FileText },
  { id: "seo", label: "SEO", icon: Search },
  { id: "ai", label: "AI nástroje", icon: Sparkles },
];

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [tab, setTab] = useState<Tab>("stats");
  const [counts, setCounts] = useState<{ inquiries: number; gigs: number; media: number; subscribers: number }>({
    inquiries: 0,
    gigs: 0,
    media: 0,
    subscribers: 0,
  });

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) {
          router.replace("/admin/login");
        } else {
          setUser(d.user);
          setChecking(false);
          // load counts
          Promise.all([
            fetch("/api/admin/inquiries").then((r) => r.json()),
            fetch("/api/admin/gigs").then((r) => r.json()),
            fetch("/api/admin/media").then((r) => r.json()),
            fetch("/api/admin/subscribers").then((r) => r.json()),
          ]).then(([inq, gigs, media, subs]) => {
            setCounts({
              inquiries: inq.items?.length ?? 0,
              gigs: gigs.items?.length ?? 0,
              media: media.items?.length ?? 0,
              subscribers: subs.items?.length ?? 0,
            });
          });
        }
      })
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Odhlásený.");
    router.replace("/admin/login");
  };

  const refreshCount = (t: Tab, n: number) => setCounts((c) => ({ ...c, [t]: n }));

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Loader2 className="h-6 w-6 animate-spin text-neon-red" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink bg-noise">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-charcoal bg-ink/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/dora-mark.svg" alt="" className="h-9 w-9" />
            <div>
              <p className="font-display text-base font-extrabold text-neon-red">D.O.R.A. Admin</p>
              <p className="font-mono-brand text-[9px] uppercase tracking-[0.2em] text-silver">
                CMS Dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              className="hidden items-center gap-1.5 border border-charcoal px-3 py-2 text-xs font-semibold text-off-white/80 transition-colors hover:border-neon-red hover:text-neon-red sm:inline-flex"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Zobraziť web
            </a>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-off-white">{user?.email}</p>
              <p className="font-mono-brand text-[9px] uppercase tracking-wider text-silver">Admin</p>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 border border-charcoal px-3 py-2 text-xs font-semibold text-off-white/80 transition-colors hover:border-neon-red hover:text-neon-red"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Odhlásiť</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-2 border px-4 py-2.5 text-sm font-semibold transition-all",
                  isActive
                    ? "border-neon-red bg-neon-red text-white glow-red-sm"
                    : "border-charcoal bg-dark-gray text-off-white/70 hover:border-off-white/40 hover:text-off-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
                {t.hasCount && (
                  <span
                    className={cn(
                      "ml-1 rounded-sm px-1.5 py-0.5 font-mono-brand text-[10px]",
                      isActive ? "bg-white/20 text-white" : "bg-charcoal text-silver"
                    )}
                  >
                    {counts[t.id as keyof typeof counts] ?? 0}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {tab === "stats" && <StatsTab />}
        {tab === "inquiries" && <InquiriesTab onChange={(n) => refreshCount("inquiries", n)} />}
        {tab === "gigs" && <GigsTab onChange={(n) => refreshCount("gigs", n)} />}
        {tab === "media" && <MediaTab onChange={(n) => refreshCount("media", n)} />}
        {tab === "subscribers" && <SubscribersTab onChange={(n) => refreshCount("subscribers", n)} />}
        {tab === "content" && <ContentTab />}
        {tab === "seo" && <SeoTab />}
        {tab === "ai" && <AiTab />}
      </div>
    </div>
  );
}
