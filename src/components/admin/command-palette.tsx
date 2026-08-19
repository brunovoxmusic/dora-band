"use client";

import { useState, useEffect, useCallback } from "react";
import { Command } from "cmdk";
import {
  LayoutDashboard, Inbox, CalendarDays, TrendingUp, Users, Mail,
  CheckSquare, FileText, Images, Search, Sparkles, Zap, Settings,
  ExternalLink, LogOut, Brain, Music, Activity, ListMusic, DollarSign, Mic2, ShoppingCart, Newspaper,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AdminTab } from "./admin-shell";

type CommandAction = {
  id: string;
  label: string;
  icon: typeof Inbox;
  group: string;
  action: () => void;
  keywords?: string;
};

/**
 * Command Palette (⌘K / Ctrl+K)
 *
 * Global search + quick actions. Opens with Cmd+K or Ctrl+K.
 * Navigates to admin tabs + external actions.
 */
export function CommandPalette({
  onNavigate,
  userEmail,
}: {
  onNavigate: (tab: AdminTab) => void;
  userEmail: string | null;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      // Escape closes
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const navigate = useCallback((tab: AdminTab) => {
    onNavigate(tab);
    setOpen(false);
  }, [onNavigate]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }, [router]);

  const actions: CommandAction[] = [
    // Navigation
    { id: "nav-stats", label: "Prehľad", icon: LayoutDashboard, group: "Navigácia", action: () => navigate("stats") },
    { id: "nav-analytics", label: "Analytika", icon: Activity, group: "Navigácia", action: () => navigate("analytics"), keywords: "analytics štatistiky KPI" },
    { id: "nav-predictions", label: "Predikcie (AI)", icon: Sparkles, group: "Navigácia", action: () => navigate("predictions"), keywords: "predictions predictive ai forecast analýza budúcnosť" },
    { id: "nav-inquiries", label: "Dopyty", icon: Inbox, group: "Navigácia", action: () => navigate("inquiries"), keywords: "booking dopyty inquiries" },
    { id: "nav-gigs", label: "Koncerty", icon: CalendarDays, group: "Navigácia", action: () => navigate("gigs"), keywords: "koncerty gigs events" },
    { id: "nav-booking", label: "Pipeline", icon: TrendingUp, group: "Navigácia", action: () => navigate("booking"), keywords: "pipeline booking kanban" },
    { id: "nav-crm", label: "Kontakty", icon: Users, group: "Navigácia", action: () => navigate("crm"), keywords: "crm kontakty contacts" },
    { id: "nav-subscribers", label: "Newsletter", icon: Mail, group: "Navigácia", action: () => navigate("subscribers"), keywords: "newsletter subscribers" },
    { id: "nav-tasks", label: "Úlohy", icon: CheckSquare, group: "Navigácia", action: () => navigate("tasks"), keywords: "úlohy tasks" },
    { id: "nav-content", label: "CMS obsah", icon: FileText, group: "Navigácia", action: () => navigate("content"), keywords: "content cms obsah" },
    { id: "nav-content-items", label: "Structured Content", icon: FileText, group: "Navigácia", action: () => navigate("content-items"), keywords: "content items structured blog news press workflow" },
    { id: "nav-blog", label: "Blog & Novinky (AI)", icon: Newspaper, group: "Navigácia", action: () => navigate("blog"), keywords: "blog news articles ai generate content" },
    { id: "nav-members", label: "Členovia kapely", icon: Users, group: "Navigácia", action: () => navigate("members"), keywords: "members členovia kapela band photos" },
    { id: "nav-media", label: "Médiá", icon: Images, group: "Navigácia", action: () => navigate("media"), keywords: "media médiá fotky" },
    { id: "nav-seo", label: "SEO", icon: Search, group: "Navigácia", action: () => navigate("seo") },
    { id: "nav-ai", label: "AI nástroje", icon: Sparkles, group: "Navigácia", action: () => navigate("ai"), keywords: "ai nástroje tools" },
    { id: "nav-ai-usage", label: "AI Náklady", icon: DollarSign, group: "Navigácia", action: () => navigate("ai-usage"), keywords: "ai cost tracking náklady tokeny usage" },
    { id: "nav-automations", label: "AI Agenti", icon: Zap, group: "Navigácia", action: () => navigate("automations"), keywords: "agenti automations" },
    { id: "nav-approvals", label: "Schválenia AI", icon: CheckSquare, group: "Navigácia", action: () => navigate("approvals"), keywords: "approvals schválenia HITL human-in-the-loop queue pending" },
    { id: "nav-knowledge", label: "Knowledge Base", icon: Brain, group: "Navigácia", action: () => navigate("knowledge"), keywords: "knowledge fakty base brain" },
    { id: "nav-songs", label: "Skladby", icon: Music, group: "Navigácia", action: () => navigate("songs"), keywords: "songs skladby music" },
    { id: "nav-rehearsals", label: "Skúšky", icon: CalendarDays, group: "Navigácia", action: () => navigate("rehearsals"), keywords: "rehearsals skúšky rehearsals" },
    { id: "nav-setlists", label: "Setlisty", icon: ListMusic, group: "Navigácia", action: () => navigate("setlists"), keywords: "setlists setlisty zostava" },
    { id: "nav-concert-mode", label: "Concert Mode (Live OS)", icon: Mic2, group: "Navigácia", action: () => navigate("concert-mode"), keywords: "concert live mode koncert stage live performance" },
    { id: "nav-merch", label: "Merchandise", icon: ShoppingCart, group: "Navigácia", action: () => navigate("merch"), keywords: "merch merchandise products orders shop store ecommerce" },
    { id: "nav-campaigns", label: "Kampane", icon: Mail, group: "Navigácia", action: () => navigate("campaigns"), keywords: "campaigns kampane segments" },
    { id: "nav-settings", label: "Nastavenia", icon: Settings, group: "Navigácia", action: () => navigate("settings"), keywords: "nastavenia settings" },
    // Actions
    { id: "act-web", label: "Otvoriť verejný web", icon: ExternalLink, group: "Akcie", action: () => window.open("/", "_blank") },
    { id: "act-logout", label: "Odhlásiť sa", icon: LogOut, group: "Akcie", action: logout },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Command palette */}
      <div className="relative w-full max-w-xl border border-charcoal bg-dark-gray shadow-2xl">
        <Command className="flex flex-col">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-charcoal px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-silver" />
            <Command.Input
              autoFocus
              placeholder="Zadaj príkaz alebo vyhľadaj..."
              className="flex-1 bg-transparent text-sm text-off-white outline-none placeholder:text-silver/50"
            />
            <kbd className="font-mono-brand text-[9px] uppercase tracking-wider text-silver/40">ESC</kbd>
          </div>

          {/* Results */}
          <Command.List className="max-h-[50vh] overflow-y-auto scroll-dora">
            <Command.Empty className="px-4 py-8 text-center text-sm text-silver/50">
              Žiadne výsledky.
            </Command.Empty>

            {/* Group actions by group label */}
            {Array.from(new Set(actions.map(a => a.group))).map((group) => (
              <Command.Group
                key={group}
                heading={group}
                className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-mono-brand [&_[cmdk-group-heading]]:text-[9px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:text-silver/40"
              >
                {actions.filter(a => a.group === group).map((action) => {
                  const Icon = action.icon;
                  return (
                    <Command.Item
                      key={action.id}
                      value={`${action.label} ${action.keywords || ""}`}
                      onSelect={() => action.action()}
                      className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-off-white/80 transition-colors data-[selected=true]:bg-neon-red/10 data-[selected=true]:text-neon-red"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-silver data-[selected=true]:text-neon-red" />
                      <span className="flex-1">{action.label}</span>
                      {action.keywords && (
                        <span className="font-mono-brand text-[9px] text-silver/30">
                          {action.keywords.split(" ").slice(0, 2).join(" ")}
                        </span>
                      )}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            ))}

            {/* User info at bottom */}
            {userEmail && (
              <div className="border-t border-charcoal px-4 py-2">
                <p className="font-mono-brand text-[9px] uppercase tracking-wider text-silver/40">
                  Prihlásený: {userEmail}
                </p>
              </div>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
