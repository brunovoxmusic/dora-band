"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, LogOut, Inbox, CalendarDays, Images, ExternalLink,
  LayoutDashboard, Mail, FileText, Search, Sparkles, Users,
  CheckSquare, Zap, TrendingUp, Settings, Menu, X, ChevronRight,
  Command as CommandIcon, Brain, Music, Activity,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { CommandPalette } from "./command-palette";
import { AiCopilot } from "./ai-copilot";

export type AdminTab =
  | "stats" | "analytics" | "inquiries" | "gigs" | "crm" | "tasks" | "automations"
  | "booking" | "media" | "subscribers" | "content" | "seo" | "ai" | "knowledge" | "songs" | "rehearsals" | "campaigns" | "settings";

type NavGroup = {
  label: string;
  items: { id: AdminTab; label: string; icon: typeof Inbox; hasCount?: boolean }[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Command Center",
    items: [
      { id: "stats", label: "Prehľad", icon: LayoutDashboard },
      { id: "analytics", label: "Analytika", icon: Activity },
    ],
  },
  {
    label: "Live",
    items: [
      { id: "inquiries", label: "Dopyty", icon: Inbox, hasCount: true },
      { id: "gigs", label: "Koncerty", icon: CalendarDays, hasCount: true },
      { id: "booking", label: "Pipeline", icon: TrendingUp },
    ],
  },
  {
    label: "CRM",
    items: [
      { id: "crm", label: "Kontakty", icon: Users },
      { id: "subscribers", label: "Newsletter", icon: Mail, hasCount: true },
    ],
  },
  {
    label: "Práca",
    items: [
      { id: "tasks", label: "Úlohy", icon: CheckSquare },
    ],
  },
  {
    label: "Obsah",
    items: [
      { id: "content", label: "CMS", icon: FileText },
      { id: "media", label: "Médiá", icon: Images, hasCount: true },
      { id: "seo", label: "SEO", icon: Search },
      { id: "campaigns", label: "Kampane", icon: Mail },
    ],
  },
  {
    label: "AI",
    items: [
      { id: "ai", label: "AI nástroje", icon: Sparkles },
      { id: "automations", label: "AI Agenti", icon: Zap },
      { id: "knowledge", label: "Knowledge", icon: Brain },
    ],
  },
  {
    label: "Hudba",
    items: [
      { id: "songs", label: "Skladby", icon: Music },
      { id: "rehearsals", label: "Skúšky", icon: CalendarDays },
    ],
  },
  {
    label: "Systém",
    items: [
      { id: "settings", label: "Nastavenia", icon: Settings },
    ],
  },
];

type Counts = { inquiries: number; gigs: number; media: number; subscribers: number };

export function AdminShell({
  children,
  activeTab,
  onTabChange,
  userEmail,
}: {
  children: React.ReactNode;
  activeTab: AdminTab;
  onTabChange: (t: AdminTab) => void;
  userEmail: string | null;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [counts, setCounts] = useState<Counts>({ inquiries: 0, gigs: 0, media: 0, subscribers: 0 });
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  // Load counts + session
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) {
          router.replace("/admin/login");
        } else {
          setChecking(false);
          setEmail(d.user.email);
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
          }).catch(() => {});
        }
      })
      .catch(() => router.replace("/admin/login"));
  }, [router]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    toast.success("Odhlásený.");
    router.replace("/admin/login");
  };

  const refreshCount = useCallback((key: keyof Counts, n: number) => {
    setCounts((c) => ({ ...c, [key]: n }));
  }, []);

  // Expose refreshCount to parent via window (for child components)
  useEffect(() => {
    (window as unknown as { __refreshAdminCount?: (key: string, n: number) => void }).__refreshAdminCount = (key: string, n: number) => {
      if (key in counts) refreshCount(key as keyof Counts, n);
    };
  }, [counts, refreshCount]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <Loader2 className="h-6 w-6 animate-spin text-neon-red" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink bg-noise">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-charcoal bg-ink/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo + ⌘K hint */}
        <div className="flex h-16 items-center justify-between border-b border-charcoal px-4">
          <div className="flex items-center gap-3">
            <img src="/dora-mark.svg" alt="" className="h-8 w-8" />
            <div>
              <p className="font-display text-sm font-extrabold text-neon-red">D.O.R.A. OS</p>
              <p className="font-mono-brand text-[8px] uppercase tracking-[0.2em] text-silver">
                Command Center
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              // Trigger ⌘K by simulating keyboard event
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: navigator.platform.includes("Mac") }));
            }}
            className="hidden items-center gap-1 border border-charcoal px-2 py-1 font-mono-brand text-[9px] uppercase tracking-wider text-silver/60 hover:border-neon-red hover:text-neon-red lg:inline-flex"
            title="Otvoriť príkazovú paletu"
          >
            <CommandIcon className="h-3 w-3" />
            K
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-silver hover:text-off-white lg:hidden"
            aria-label="Zavrieť menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex h-[calc(100vh-4rem)] flex-col overflow-y-auto scroll-dora py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="px-4 mb-1.5 font-mono-brand text-[9px] uppercase tracking-[0.2em] text-silver/40">
                {group.label}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      "group flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "border-l-2 border-neon-red bg-neon-red/10 text-neon-red"
                        : "border-l-2 border-transparent text-off-white/60 hover:bg-charcoal/40 hover:text-off-white"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-neon-red" : "text-silver group-hover:text-off-white")} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.hasCount && (
                      <span
                        className={cn(
                          "rounded-sm px-1.5 py-0.5 font-mono-brand text-[10px]",
                          isActive ? "bg-neon-red/20 text-neon-red" : "bg-charcoal text-silver"
                        )}
                      >
                        {counts[item.id as keyof Counts] ?? 0}
                      </span>
                    )}
                    {isActive && <ChevronRight className="h-3 w-3 text-neon-red" />}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Footer actions */}
          <div className="mt-auto border-t border-charcoal p-4 space-y-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs font-semibold text-off-white/60 transition-colors hover:text-neon-red"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Zobraziť web
            </a>
            <div className="flex items-center justify-between">
              <p className="truncate text-xs text-silver">{userEmail}</p>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1 text-xs font-semibold text-silver hover:text-neon-red"
                aria-label="Odhlásiť"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-charcoal bg-ink/90 backdrop-blur-xl px-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center text-off-white"
            aria-label="Otvoriť menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/dora-mark.svg" alt="" className="h-7 w-7" />
            <p className="font-display text-sm font-extrabold text-neon-red">D.O.R.A. OS</p>
          </div>
          <div className="w-10" />
        </header>

        {/* Content area */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Command Palette (⌘K) */}
      <CommandPalette onNavigate={onTabChange} userEmail={email} />

      {/* D.O.R.A. AI Copilot (Ctrl+Shift+A) */}
      <AiCopilot />
    </div>
  );
}
