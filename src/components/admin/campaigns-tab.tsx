"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Mail, Plus, Trash2, X, Loader2, Users, Calendar, Send,
  FileText, Tag, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";

type Campaign = {
  id: string;
  name: string;
  type: string;
  subject: string | null;
  body: string;
  status: string;
  segmentId: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  aiGenerated: boolean;
  createdAt: string;
};

type Segment = {
  id: string;
  name: string;
  description: string | null;
  criteria: string;
  subscriberIds: string[];
  aiGenerated: boolean;
  createdAt: string;
};

const CAMPAIGN_TYPES = [
  { value: "newsletter", label: "Newsletter" },
  { value: "social", label: "Social media" },
  { value: "email", label: "Email" },
];

const CAMPAIGN_STATUS = [
  { value: "draft", label: "Draft", color: "border-charcoal text-silver" },
  { value: "scheduled", label: "Naplánovaná", color: "border-warm-yellow/40 text-warm-yellow" },
  { value: "sent", label: "Odoslaná", color: "border-green-500/40 text-green-400" },
];

export function CampaignsTab() {
  const [subtab, setSubtab] = useState<"campaigns" | "segments">("campaigns");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Campaign | Segment | null>(null);
  const [formType, setFormType] = useState<"campaign" | "segment">("campaign");

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      fetch("/api/admin/campaigns").then(r => r.json()).catch(() => ({ items: [] })),
      fetch("/api/admin/segments").then(r => r.json()).catch(() => ({ items: [] })),
    ]).then(([cData, sData]) => {
      setCampaigns(cData.items ?? []);
      setSegments(sData.items ?? []);
      setLoading(false);
    }).catch(() => { setError(true); setLoading(false); });
  }, []);

  useEffect(() => { Promise.resolve().then(() => load()); }, [load]);

  const removeCampaign = async (id: string) => {
    if (!confirm("Zmazať kampaň?")) return;
    try {
      await fetch(`/api/admin/campaigns/${id}`, { method: "DELETE" });
      setCampaigns(arr => arr.filter(c => c.id !== id));
      toast.success("Zmazané.");
    } catch { toast.error("Chyba."); }
  };

  const removeSegment = async (id: string) => {
    if (!confirm("Zmazať segment?")) return;
    try {
      await fetch(`/api/admin/segments/${id}`, { method: "DELETE" });
      setSegments(arr => arr.filter(s => s.id !== id));
      toast.success("Zmazané.");
    } catch { toast.error("Chyba."); }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse bg-charcoal" />)}
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Nepodarilo sa načítať dáta." onRetry={load} />;
  }

  return (
    <div>
      {/* Sub-tabs */}
      <div className="mb-4 flex gap-1 border-b border-charcoal">
        <button
          onClick={() => setSubtab("campaigns")}
          className={cn(
            "border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
            subtab === "campaigns" ? "border-neon-red text-neon-red" : "border-transparent text-silver hover:text-off-white"
          )}
        >
          <Mail className="mr-2 inline h-4 w-4" />
          Kampane ({campaigns.length})
        </button>
        <button
          onClick={() => setSubtab("segments")}
          className={cn(
            "border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
            subtab === "segments" ? "border-neon-red text-neon-red" : "border-transparent text-silver hover:text-off-white"
          )}
        >
          <Users className="mr-2 inline h-4 w-4" />
          Segmenty ({segments.length})
        </button>
        <button
          onClick={() => { setEditing(null); setFormType(subtab === "campaigns" ? "campaign" : "segment"); setShowForm(true); }}
          className="ml-auto inline-flex items-center gap-2 bg-neon-red px-3 py-1.5 text-xs font-bold uppercase text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          {subtab === "campaigns" ? "Nová kampaň" : "Nový segment"}
        </button>
      </div>

      {/* Campaigns list */}
      {subtab === "campaigns" && (
        campaigns.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="Žiadne kampane"
            description="Vytvorte newsletter, social media alebo email kampane pre fanúšikov."
            action={{ label: "Nová kampaň", onClick: () => { setEditing(null); setFormType("campaign"); setShowForm(true); } }}
          />
        ) : (
          <div className="max-h-[65vh] space-y-2 overflow-y-auto scroll-dora pr-1">
            {campaigns.map(c => {
              const statusInfo = CAMPAIGN_STATUS.find(s => s.value === c.status) || CAMPAIGN_STATUS[0];
              return (
                <div key={c.id} className="flex items-center gap-3 border border-charcoal bg-dark-gray p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-neon-red/20 text-neon-red">
                    {c.type === "newsletter" ? <Mail className="h-4 w-4" /> : c.type === "social" ? <Sparkles className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("border px-1.5 py-0.5 font-mono-brand text-[9px] uppercase", statusInfo.color)}>
                        {statusInfo.label}
                      </span>
                      {c.aiGenerated && <span className="font-mono-brand text-[8px] uppercase text-warm-yellow/60">AI</span>}
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-off-white">{c.name}</p>
                    <p className="truncate text-xs text-silver">
                      {CAMPAIGN_TYPES.find(t => t.value === c.type)?.label || c.type}
                      {c.subject && ` · ${c.subject}`}
                    </p>
                    {c.scheduledAt && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-warm-yellow">
                        <Calendar className="h-2.5 w-2.5" />
                        {new Date(c.scheduledAt).toLocaleString("sk-SK")}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => { setEditing(c); setFormType("campaign"); setShowForm(true); }}
                      className="inline-flex h-7 w-7 items-center justify-center border border-charcoal text-silver hover:border-neon-red hover:text-neon-red"
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeCampaign(c.id)}
                      className="inline-flex h-7 w-7 items-center justify-center border border-charcoal text-silver hover:border-neon-red hover:text-neon-red"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Segments list */}
      {subtab === "segments" && (
        segments.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Žiadne segmenty"
            description="Vytvorte fanúšikovské segmenty pre cielené kampane (lokálni fanúšikovia, superfans, press, bookers)."
            action={{ label: "Nový segment", onClick: () => { setEditing(null); setFormType("segment"); setShowForm(true); } }}
          />
        ) : (
          <div className="max-h-[65vh] space-y-2 overflow-y-auto scroll-dora pr-1">
            {segments.map(s => (
              <div key={s.id} className="flex items-center gap-3 border border-charcoal bg-dark-gray p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-warm-yellow/20 text-warm-yellow">
                  <Tag className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-off-white">{s.name}</p>
                    {s.aiGenerated && <span className="font-mono-brand text-[8px] uppercase text-warm-yellow/60">AI</span>}
                  </div>
                  {s.description && <p className="truncate text-xs text-silver">{s.description}</p>}
                  <p className="mt-0.5 font-mono-brand text-[9px] uppercase text-silver/50">
                    {Array.isArray(s.subscriberIds) ? s.subscriberIds.length : 0} odberateľov
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => { setEditing(s); setFormType("segment"); setShowForm(true); }}
                    className="inline-flex h-7 w-7 items-center justify-center border border-charcoal text-silver hover:border-neon-red hover:text-neon-red"
                  >
                    <FileText className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeSegment(s.id)}
                    className="inline-flex h-7 w-7 items-center justify-center border border-charcoal text-silver hover:border-neon-red hover:text-neon-red"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Form modal */}
      {showForm && (
        formType === "campaign"
          ? <CampaignForm item={editing as Campaign | null} segments={segments} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={() => { setShowForm(false); setEditing(null); load(); }} />
          : <SegmentForm item={editing as Segment | null} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={() => { setShowForm(false); setEditing(null); load(); }} />
      )}
    </div>
  );
}

function CampaignForm({ item, segments, onClose, onSaved }: { item: Campaign | null; segments: Segment[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: item?.name || "",
    type: item?.type || "newsletter",
    subject: item?.subject || "",
    body: item?.body || "",
    status: item?.status || "draft",
    segmentId: item?.segmentId || "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name) { toast.error("Názov je povinný."); return; }
    setSaving(true);
    try {
      const url = item ? `/api/admin/campaigns/${item.id}` : "/api/admin/campaigns";
      const method = item ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Zlyhalo.");
      toast.success(item ? "Kampaň upravená." : "Kampaň vytvorená.");
      onSaved();
    } catch { toast.error("Chyba."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto scroll-dora border border-charcoal bg-dark-gray p-6" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-off-white">{item ? "Upraviť kampaň" : "Nová kampaň"}</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-silver" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Názov *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Typ</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white">
                {CAMPAIGN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white">
                {CAMPAIGN_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Predmet</label>
            <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
          </div>
          {segments.length > 0 && (
            <div>
              <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Segment</label>
              <select value={form.segmentId} onChange={e => setForm({ ...form, segmentId: e.target.value })} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white">
                <option value="">— Žiadny —</option>
                {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Telo</label>
            <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={5} className="w-full resize-y border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
          </div>
          <button onClick={save} disabled={saving || !form.name} className="w-full bg-neon-red py-2.5 text-sm font-bold uppercase text-white disabled:opacity-50">
            {saving ? "Ukladám..." : "Uložiť"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SegmentForm({ item, onClose, onSaved }: { item: Segment | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: item?.name || "",
    description: item?.description || "",
    criteria: item?.criteria || "{}",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name) { toast.error("Názov je povinný."); return; }
    setSaving(true);
    try {
      const url = item ? `/api/admin/segments/${item.id}` : "/api/admin/segments";
      const method = item ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Zlyhalo.");
      toast.success(item ? "Segment upravený." : "Segment vytvorený.");
      onSaved();
    } catch { toast.error("Chyba."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto scroll-dora border border-charcoal bg-dark-gray p-6" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-off-white">{item ? "Upraviť segment" : "Nový segment"}</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-silver" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Názov *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="napr. Lokálni fanúšikovia" className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
          </div>
          <div>
            <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Popis</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
          </div>
          <div>
            <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Kritériá (JSON)</label>
            <textarea value={form.criteria} onChange={e => setForm({ ...form, criteria: e.target.value })} rows={3} className="w-full resize-y border border-charcoal bg-ink px-3 py-2 font-mono-brand text-xs text-off-white" />
          </div>
          <button onClick={save} disabled={saving || !form.name} className="w-full bg-neon-red py-2.5 text-sm font-bold uppercase text-white disabled:opacity-50">
            {saving ? "Ukladám..." : "Uložiť"}
          </button>
        </div>
      </div>
    </div>
  );
}
