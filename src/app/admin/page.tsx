"use client";

import { useState, useCallback } from "react";
import { AdminShell, type AdminTab } from "@/components/admin/admin-shell";
import { InquiriesTab } from "@/components/admin/inquiries-tab";
import { GigsTab } from "@/components/admin/gigs-tab";
import { MediaTab } from "@/components/admin/media-tab";
import { StatsTab } from "@/components/admin/stats-tab";
import { SubscribersTab } from "@/components/admin/subscribers-tab";
import { ContentTab } from "@/components/admin/content-tab";
import { SeoTab } from "@/components/admin/seo-tab";
import { AiTab } from "@/components/admin/ai-tab";
import { AiUsageTab } from "@/components/admin/ai-usage-tab";
import { CrmTab } from "@/components/admin/crm-tab";
import { TasksTab } from "@/components/admin/tasks-tab";
import { AutomationsTab } from "@/components/admin/automations-tab";
import { BookingTab } from "@/components/admin/booking-tab";
import { SettingsTab } from "@/components/admin/settings-tab";
import { KnowledgeTab } from "@/components/admin/knowledge-tab";
import { SongsTab } from "@/components/admin/songs-tab";
import { CampaignsTab } from "@/components/admin/campaigns-tab";
import { RehearsalsTab } from "@/components/admin/rehearsals-tab";
import { AnalyticsTab } from "@/components/admin/analytics-tab";
import { PredictionsTab } from "@/components/admin/predictions-tab";
import { SetlistsTab } from "@/components/admin/setlists-tab";
import { ConcertModeTab } from "@/components/admin/concert-mode-tab";
import { MerchTab } from "@/components/admin/merch-tab";

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("stats");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Capture email from AdminShell's session check
  // (AdminShell does the auth check; we just pass userEmail for display)
  const handleTabChange = useCallback((t: AdminTab) => setTab(t), []);

  return (
    <AdminShell activeTab={tab} onTabChange={handleTabChange} userEmail={userEmail}>
      {tab === "stats" && <StatsTab />}
      {tab === "analytics" && <AnalyticsTab />}
      {tab === "predictions" && <PredictionsTab />}
      {tab === "inquiries" && <InquiriesTab onChange={(n) => {
        if (typeof window !== "undefined") {
          (window as unknown as { __refreshAdminCount?: (key: string, n: number) => void }).__refreshAdminCount?.("inquiries", n);
        }
      }} />}
      {tab === "gigs" && <GigsTab onChange={(n) => {
        if (typeof window !== "undefined") {
          (window as unknown as { __refreshAdminCount?: (key: string, n: number) => void }).__refreshAdminCount?.("gigs", n);
        }
      }} />}
      {tab === "crm" && <CrmTab />}
      {tab === "booking" && <BookingTab />}
      {tab === "tasks" && <TasksTab />}
      {tab === "automations" && <AutomationsTab />}
      {tab === "media" && <MediaTab onChange={(n) => {
        if (typeof window !== "undefined") {
          (window as unknown as { __refreshAdminCount?: (key: string, n: number) => void }).__refreshAdminCount?.("media", n);
        }
      }} />}
      {tab === "subscribers" && <SubscribersTab onChange={(n) => {
        if (typeof window !== "undefined") {
          (window as unknown as { __refreshAdminCount?: (key: string, n: number) => void }).__refreshAdminCount?.("subscribers", n);
        }
      }} />}
      {tab === "content" && <ContentTab />}
      {tab === "seo" && <SeoTab />}
      {tab === "ai" && <AiTab />}
      {tab === "ai-usage" && <AiUsageTab />}
      {tab === "knowledge" && <KnowledgeTab />}
      {tab === "songs" && <SongsTab />}
      {tab === "rehearsals" && <RehearsalsTab />}
      {tab === "setlists" && <SetlistsTab />}
      {tab === "concert-mode" && <ConcertModeTab />}
      {tab === "merch" && <MerchTab />}
      {tab === "campaigns" && <CampaignsTab />}
      {tab === "settings" && <SettingsTab />}
    </AdminShell>
  );
}
