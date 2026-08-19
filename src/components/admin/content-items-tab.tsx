"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import {
  FileText, Plus, Pencil, Trash2, RefreshCw, Sparkles, Clock,
  CheckCircle2, AlertCircle, Eye,
} from "lucide-react";
import { toast } from "sonner";

type ContentItem = {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  language: string;
  body: string;
  excerpt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  keywords?: string | null;
  aiGenerated: boolean;
  aiQualityScore?: number | null;
  author?: string | null;
  publishAt?: string | null;
  publishedAt?: string | null;
  version: number;
  approvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

const TYPE_LABELS: Record<string, string> = {
  blog: "Blog",
  news: "News",
  event: "Event",
  press: "Press release",
  page: "Stránka",
  faq: "FAQ",
  bio: "Bio",
};

const TYPE_ICONS: Record<string, string> = {
  blog: "📝",
  news: "📰",
  event: "🎤",
  press: "📢",
  page: "📄",
  faq: "❓",
  bio: "👤",
};

// Workflow: idea → draft → ai_generated → ai_check → fact_check → human_review → approved → scheduled → published → analyzed
const STATUS_FLOW = [
  { value: "idea", label: "Idea", color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300", icon: "💡" },
  { value: "draft", label: "Draft", color: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300", icon: "✏️" },
  { value: "ai_generated", label: "AI generované", color: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300", icon: "🤖" },
  { value: "ai_check", label: "AI kontrola", color: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300", icon: "🔍" },
  { value: "fact_check", label: "Fakt check", color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300", icon: "⚠️" },
  { value: "human_review", label: "Ľudská kontrola", color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300", icon: "👤" },
  { value: "approved", label: "Schválené", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", icon: "✅" },
  { value: "scheduled", label: "Naplánované", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300", icon: "📅" },
  { value: "published", label: "Publikované", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", icon: "🚀" },
  { value: "analyzed", label: "Analyzované", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", icon: "📊" },
];

const STATUS_LABELS = Object.fromEntries(STATUS_FLOW.map((s) => [s.value, s.label]));
const STATUS_COLORS = Object.fromEntries(STATUS_FLOW.map((s) => [s.value, s.color]));

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `pred ${min}min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `pred ${hr}h`;
  return `pred ${Math.floor(hr / 24)}d`;
}

function getNextStatus(current: string): string | null {
  const idx = STATUS_FLOW.findIndex((s) => s.value === current);
  if (idx < 0 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1].value;
}

export function ContentItemsTab() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = statusFilter !== "all" ? `/api/admin/content-items?status=${statusFilter}` : "/api/admin/content-items";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Načítanie zlyhalo");
      const d = await res.json();
      setItems(d.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neznáma chyba");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { void load(); }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  const counts = items.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-sky-500" />
            Structured Content
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            CMS obsah s AI workflow: Idea → Draft → AI → Fakt check → Schválené → Publikované
          </p>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4" />
          Nový obsah
        </Button>
      </div>

      {/* Workflow vizualizácia */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {STATUS_FLOW.map((s, idx) => (
              <div key={s.value} className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setStatusFilter(statusFilter === s.value ? "all" : s.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs whitespace-nowrap transition-all ${
                    statusFilter === s.value ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"
                  }`}
                >
                  <span>{s.icon}</span>
                  <span className="font-medium">{s.label}</span>
                  {counts[s.value] && (
                    <Badge variant="secondary" className="text-[9px] h-4 ml-1">{counts[s.value]}</Badge>
                  )}
                </button>
                {idx < STATUS_FLOW.length - 1 && (
                  <span className="text-muted-foreground">→</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Items grid */}
      {loading ? (
        <LoadingSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          title={statusFilter !== "all" ? `Žiadny obsah v stave "${STATUS_LABELS[statusFilter]}"` : "Žiadny obsah"}
          description={statusFilter !== "all" ? "Skúš iný filter." : "Vytvor prvý content item."}
          icon={FileText}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const nextStatus = getNextStatus(item.status);
            return (
              <Card key={item.id} className="flex flex-col">
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-2xl">{TYPE_ICONS[item.type] || "📄"}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{item.title}</h3>
                      <div className="text-[10px] text-muted-foreground font-mono truncate">{item.slug}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    <Badge variant="outline" className={`text-[9px] ${STATUS_COLORS[item.status] || ""}`}>
                      {STATUS_FLOW.find((s) => s.value === item.status)?.icon} {STATUS_LABELS[item.status] || item.status}
                    </Badge>
                    <Badge variant="secondary" className="text-[9px]">
                      {TYPE_LABELS[item.type] || item.type}
                    </Badge>
                    {item.aiGenerated && (
                      <Badge variant="outline" className="text-[9px] bg-violet-50 dark:bg-violet-950/30">
                        <Sparkles className="h-2.5 w-2.5 mr-0.5" />AI
                      </Badge>
                    )}
                    {item.language !== "sk" && (
                      <Badge variant="outline" className="text-[9px]">{item.language}</Badge>
                    )}
                  </div>

                  {item.excerpt && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.excerpt}</p>
                  )}

                  <div className="text-[10px] text-muted-foreground mt-auto pt-2 border-t">
                    {item.publishedAt ? `Publikované ${fmtRelative(item.publishedAt)}` :
                     item.publishAt ? `Naplánované ${new Date(item.publishAt).toLocaleDateString("sk-SK")}` :
                     `Upravené ${fmtRelative(item.updatedAt)}`}
                    {item.aiQualityScore != null && ` · AI: ${item.aiQualityScore}/100`}
                  </div>

                  <div className="flex gap-1 mt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs flex-1"
                      onClick={() => { setEditing(item); setShowForm(true); }}
                    >
                      <Pencil className="h-3 w-3" /> Upraviť
                    </Button>
                    {nextStatus && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30"
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/admin/content-items/${item.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: nextStatus }),
                            });
                            if (!res.ok) throw new Error();
                            toast.success(`Status → ${STATUS_LABELS[nextStatus]}`);
                            void load();
                          } catch {
                            toast.error("Aktualizácia zlyhala");
                          }
                        }}
                      >
                        → {STATUS_LABELS[nextStatus]}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-red-500 hover:text-red-600"
                      onClick={async () => {
                        if (!confirm(`Zmazať "${item.title}"?`)) return;
                        const res = await fetch(`/api/admin/content-items/${item.id}`, { method: "DELETE" });
                        if (res.ok) { toast.success("Zmazané"); void load(); }
                        else toast.error("Zmazanie zlyhalo");
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form dialog */}
      <ContentFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        item={editing}
        onSaved={() => { setShowForm(false); void load(); }}
      />
    </div>
  );
}

function ContentFormDialog({
  open, onOpenChange, item, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: ContentItem | null;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState("blog");
  const [status, setStatus] = useState("idea");
  const [language, setLanguage] = useState("sk");
  const [body, setBody] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setSlug(item.slug);
      setType(item.type);
      setStatus(item.status);
      setLanguage(item.language);
      setBody(item.body);
      setExcerpt(item.excerpt || "");
      setSeoTitle(item.seoTitle || "");
      setSeoDescription(item.seoDescription || "");
      setKeywords(item.keywords || "");
    } else {
      setTitle(""); setSlug(""); setType("blog"); setStatus("idea"); setLanguage("sk");
      setBody(""); setExcerpt(""); setSeoTitle(""); setSeoDescription(""); setKeywords("");
    }
  }, [item, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body_data = {
        title, slug: slug || undefined, type, status, language,
        body, excerpt: excerpt || undefined,
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
        keywords: keywords || undefined,
      };
      const url = item ? `/api/admin/content-items/${item.id}` : "/api/admin/content-items";
      const method = item ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body_data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Uloženie zlyhalo");
      }
      toast.success(item ? "Obsah aktualizovaný" : "Obsah vytvorený");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Upraviť obsah" : "Nový obsah"}</DialogTitle>
          <DialogDescription>
            {item ? `Upravuješ: ${item.title}` : "Vytvor nový content item s workflow sledovaním"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Názov</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Blog článok..." />
            </div>
            <div>
              <Label className="text-sm">Slug (URL)</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generované" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-sm">Typ</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{TYPE_ICONS[v]} {l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_FLOW.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.icon} {s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Jazyk</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sk">🇸🇰 Slovenčina</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-sm">Excerpt (krátky popis)</Label>
            <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="1-2 vety pre náhľad..." />
          </div>
          <div>
            <Label className="text-sm">Telo obsahu</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Plný text obsahu..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">SEO Title</Label>
              <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Meta title..." />
            </div>
            <div>
              <Label className="text-sm">Keywords</Label>
              <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="kľúčové slová" />
            </div>
          </div>
          <div>
            <Label className="text-sm">SEO Description</Label>
            <Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={2} placeholder="Meta description..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Zrušiť</Button>
          <Button onClick={handleSave} disabled={saving || !title}>
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
            {item ? "Uložiť zmeny" : "Vytvoriť obsah"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
    </div>
  );
}
