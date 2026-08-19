"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import {
  Newspaper, Plus, Sparkles, RefreshCw, Pencil, Trash2, Send, Eye, Clock,
  CheckCircle2, AlertCircle, FileText, Zap,
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
  author?: string | null;
  publishAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

const TYPE_LABELS: Record<string, string> = {
  blog: "📝 Blog", news: "📰 News", press: "📢 Press", event: "🎤 Event", page: "📄 Stránka",
};

const STATUS_FLOW = [
  { value: "idea", label: "💡 Idea", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30" },
  { value: "draft", label: "✏️ Draft", color: "bg-sky-500/10 text-sky-300 border-sky-500/30" },
  { value: "ai_generated", label: "🤖 AI generované", color: "bg-violet-500/10 text-violet-300 border-violet-500/30" },
  { value: "fact_check", label: "⚠️ Fakt check", color: "bg-amber-500/10 text-amber-300 border-amber-500/30" },
  { value: "approved", label: "✅ Schválené", color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" },
  { value: "published", label: "🚀 Publikované", color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" },
];
const STATUS_LABELS = Object.fromEntries(STATUS_FLOW.map(s => [s.value, s.label]));
const STATUS_COLORS = Object.fromEntries(STATUS_FLOW.map(s => [s.value, s.color]));

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `pred ${min}min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `pred ${hr}h`;
  return `pred ${Math.floor(hr / 24)}d`;
}

export function BlogTab() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAI, setShowAI] = useState(false);

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

  const counts = items.reduce((acc, i) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-warm-yellow" />
            Blog & Novinky
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Správa článkov, noviniek a press releases s AI generovaním
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Obnoviť
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setShowAI(true); }} className="border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20">
            <Sparkles className="h-4 w-4 text-violet-400" />
            AI Generovať
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="h-4 w-4" />
            Nový článok
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground">Spolu</p><p className="text-2xl font-bold tabular-nums">{items.length}</p></div>
            <FileText className="h-5 w-5 text-sky-400" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground">Publikované</p><p className="text-2xl font-bold text-emerald-500 tabular-nums">{counts.published || 0}</p></div>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground">AI generované</p><p className="text-2xl font-bold text-violet-500 tabular-nums">{items.filter(i => i.aiGenerated).length}</p></div>
            <Sparkles className="h-5 w-5 text-violet-400" />
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-muted-foreground">Drafts</p><p className="text-2xl font-bold text-sky-500 tabular-nums">{(counts.draft || 0) + (counts.idea || 0)}</p></div>
            <Clock className="h-5 w-5 text-sky-400" />
          </div>
        </CardContent></Card>
      </div>

      {/* Status filter */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="all">Všetko ({items.length})</TabsTrigger>
          <TabsTrigger value="published">Publikované</TabsTrigger>
          <TabsTrigger value="draft">Drafty</TabsTrigger>
          <TabsTrigger value="idea">Idey</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-4">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="Žiadne články"
              description="Vytvor nový článok alebo použi AI generovanie."
              icon={Newspaper}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const nextStatus = STATUS_FLOW.find(s => s.value === item.status);
                const idx = STATUS_FLOW.findIndex(s => s.value === item.status);
                const next = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
                return (
                  <Card key={item.id} className="flex flex-col">
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-2xl">{TYPE_LABELS[item.type]?.split(" ")[0] || "📄"}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{item.title}</h3>
                          <p className="text-[10px] text-muted-foreground font-mono truncate">{item.slug}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
                        <Badge variant="outline" className={`text-[9px] ${STATUS_COLORS[item.status] || ""}`}>
                          {STATUS_LABELS[item.status] || item.status}
                        </Badge>
                        {item.aiGenerated && (
                          <Badge variant="outline" className="text-[9px] bg-violet-500/10 text-violet-300 border-violet-500/30">
                            <Sparkles className="h-2 w-2 mr-0.5" />AI
                          </Badge>
                        )}
                      </div>

                      {item.excerpt && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.excerpt}</p>}

                      <div className="text-[10px] text-muted-foreground mt-auto pt-2 border-t">
                        {item.publishedAt ? `Publikované ${fmtRelative(item.publishedAt)}` : `Upravené ${fmtRelative(item.updatedAt)}`}
                      </div>

                      <div className="flex gap-1 mt-2">
                        <Button size="sm" variant="ghost" className="h-7 text-xs flex-1" onClick={() => { setEditing(item); setShowForm(true); }}>
                          <Pencil className="h-3 w-3" /> Upraviť
                        </Button>
                        {next && (
                          <Button size="sm" variant="outline" className="h-7 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/admin/content-items/${item.id}`, {
                                  method: "PATCH", headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: next.value }),
                                });
                                if (!res.ok) throw new Error();
                                toast.success(`→ ${STATUS_LABELS[next.value]}`);
                                void load();
                              } catch { toast.error("Aktualizácia zlyhala"); }
                            }}>
                            → {STATUS_LABELS[next.value]?.split(" ")[0]}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-600"
                          onClick={async () => {
                            if (!confirm(`Zmazať "${item.title}"?`)) return;
                            const res = await fetch(`/api/admin/content-items/${item.id}`, { method: "DELETE" });
                            if (res.ok) { toast.success("Zmazané"); void load(); } else toast.error("Zmazanie zlyhalo");
                          }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Article form dialog */}
      <ArticleFormDialog open={showForm} onOpenChange={setShowForm} item={editing} onSaved={() => { setShowForm(false); void load(); }} />

      {/* AI generate dialog */}
      <AIGenerateDialog open={showAI} onOpenChange={setShowAI} onGenerated={(article) => {
        // Vytvor nový ContentItem z AI article (bez ID = nový článok)
        const newItem: ContentItem = {
          id: "",
          title: article.title || "",
          slug: article.slug || "",
          type: article.type || "blog",
          status: "ai_generated",
          language: "sk",
          body: article.body || "",
          excerpt: article.excerpt || null,
          seoTitle: article.seoTitle || null,
          seoDescription: article.seoDescription || null,
          keywords: article.keywords || null,
          aiGenerated: true,
          author: null,
          publishAt: null,
          publishedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setEditing(newItem);
        setShowAI(false);
        setShowForm(true);
      }} />
    </div>
  );
}

// =====================================================
// ARTICLE FORM DIALOG
// =====================================================

function ArticleFormDialog({ open, onOpenChange, item, onSaved }: {
  open: boolean; onOpenChange: (v: boolean) => void; item: ContentItem | null; onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState("blog");
  const [status, setStatus] = useState("draft");
  const [body, setBody] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title); setSlug(item.slug); setType(item.type); setStatus(item.status);
      setBody(item.body); setExcerpt(item.excerpt || ""); setSeoTitle(item.seoTitle || "");
      setSeoDescription(item.seoDescription || ""); setKeywords(item.keywords || "");
    } else {
      setTitle(""); setSlug(""); setType("blog"); setStatus("idea"); setBody("");
      setExcerpt(""); setSeoTitle(""); setSeoDescription(""); setKeywords("");
    }
  }, [item, open]);

  // Sync AI-generated data when coming from AI dialog
  useEffect(() => {
    if (item?.aiGenerated && item.body) {
      setBody(item.body);
      setExcerpt(item.excerpt || "");
      setSeoTitle(item.seoTitle || "");
      setSeoDescription(item.seoDescription || "");
      setKeywords(item.keywords || "");
      setStatus("ai_generated");
    }
  }, [item]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        title, slug: slug || undefined, type, status, language: "sk",
        body, excerpt: excerpt || undefined, seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined, keywords: keywords || undefined,
        aiGenerated: item?.aiGenerated,
      };
      // Ak máme item s ID → PATCH (uprav existujúci), inak POST (vytvor nový)
      const hasId = item && item.id && item.id.length > 0;
      const url = hasId ? `/api/admin/content-items/${item!.id}` : "/api/admin/content-items";
      const method = hasId ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Uloženie zlyhalo");
      }
      toast.success(hasId ? "Článok aktualizovaný" : "Článok vytvorený");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba");
    } finally {
      setSaving(false);
    }
  };

  const [aiRegenerating, setAiRegenerating] = useState(false);

  // AI Regenerate — regeneruje obsah existujúceho článku
  const handleAIRegenerate = async () => {
    if (!title) { toast.error("Najprv zadaj nadpis"); return; }
    setAiRegenerating(true);
    try {
      const res = await fetch("/api/admin/blog/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type, topic: title, tone: "punk", length: "medium",
          context: excerpt || body.slice(0, 200),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "AI regenerácia zlyhala");
      }
      const d = await res.json();
      if (d.article) {
        setBody(d.article.body || body);
        setExcerpt(d.article.excerpt || excerpt);
        setSeoTitle(d.article.seoTitle || seoTitle);
        setSeoDescription(d.article.seoDescription || seoDescription);
        setKeywords(d.article.keywords || keywords);
        setStatus("ai_generated");
        toast.success("Obsah regenerovaný AI");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba");
    } finally {
      setAiRegenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{item && item.id ? "Upraviť článok" : "Nový článok"}</span>
            {item && item.id && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAIRegenerate}
                disabled={aiRegenerating || !title}
                className="border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20"
              >
                {aiRegenerating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                AI Regenerovať
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {item?.aiGenerated && <span className="flex items-center gap-1 text-violet-400"><Sparkles className="h-3 w-3" /> AI generovaný obsah — skontrolujte pred publikovaním</span>}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-sm">Nadpis</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div><Label className="text-sm">Slug</Label><Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="auto" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-sm">Typ</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_FLOW.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              {status === "published" && <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30"><Send className="h-2.5 w-2.5 mr-1" />Publikovať</Badge>}
            </div>
          </div>
          <div><Label className="text-sm">Perex</Label><Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} /></div>
          <div><Label className="text-sm">Telo článku</Label><Textarea value={body} onChange={e => setBody(e.target.value)} rows={8} className="font-mono text-xs" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-sm">SEO Title</Label><Input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} /></div>
            <div><Label className="text-sm">Kľúčové slová</Label><Input value={keywords} onChange={e => setKeywords(e.target.value)} /></div>
          </div>
          <div><Label className="text-sm">SEO Description</Label><Textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Zrušiť</Button>
          <Button onClick={handleSave} disabled={saving || !title}>
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
            {item ? "Uložiť zmeny" : "Vytvoriť článok"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// AI GENERATE DIALOG
// =====================================================

function AIGenerateDialog({ open, onOpenChange, onGenerated }: {
  open: boolean; onOpenChange: (v: boolean) => void; onGenerated: (article: Partial<ContentItem>) => void;
}) {
  const [type, setType] = useState("blog");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("punk");
  const [length, setLength] = useState("medium");
  const [keywords, setKeywords] = useState("");
  const [context, setContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<Partial<ContentItem> | null>(null);

  const handleGenerate = async () => {
    if (!topic) { toast.error("Zadajte tému"); return; }
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/blog/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, topic, tone, length, keywords, context }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Generovanie zlyhalo");
      }
      const d = await res.json();
      setResult(d.article);
      toast.success("Článok vygenerovaný!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba");
    } finally {
      setGenerating(false);
    }
  };

  const handleUse = () => {
    if (result) onGenerated(result);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-400" />
            AI generovanie článku
          </DialogTitle>
          <DialogDescription>Vygeneruj profesionálny článok pomocou AI s rozšírenými možnosťami</DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            {/* AI Settings */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Typ článku</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blog">📝 Blog</SelectItem>
                    <SelectItem value="news">📰 News</SelectItem>
                    <SelectItem value="press">📢 Press release</SelectItem>
                    <SelectItem value="event">🎤 Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Tón</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="punk">🤘 Punkový (energický)</SelectItem>
                    <SelectItem value="casual">😊 Uvoľnený</SelectItem>
                    <SelectItem value="professional">💼 Profesionálny</SelectItem>
                    <SelectItem value="formal">📋 Formálny</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm">Téma článku *</Label>
              <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="napr. Koncert na Crossover Fest 2026" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Dĺžka</Label>
                <Select value={length} onValueChange={setLength}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Krátka (100-200 slov)</SelectItem>
                    <SelectItem value="medium">Stredná (200-400 slov)</SelectItem>
                    <SelectItem value="long">Dlhá (400-600 slov)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Kľúčové slová (voliteľné)</Label>
                <Input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="funky-punk, Púchov, koncert" />
              </div>
            </div>

            <div>
              <Label className="text-sm">Kontext / Dodatočné info (voliteľné)</Label>
              <Textarea value={context} onChange={e => setContext(e.target.value)} rows={2} placeholder="napr. Koncert sa koná 12.9.2026 v Žiline na Zimnom štadióne" />
            </div>

            {/* AI info banner */}
            <div className="flex items-start gap-2 p-3 border border-violet-500/20 bg-violet-500/5 rounded-md">
              <AlertCircle className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
              <p className="text-xs text-violet-200/70">
                AI generovaný obsah je návrh — pred publikovaním skontrolujte fakty a upravte podľa potreby.
                Status sa automaticky nastaví na "AI generované".
              </p>
            </div>

            <Button onClick={handleGenerate} disabled={generating || !topic} className="w-full bg-violet-600 hover:bg-violet-700">
              {generating ? <><RefreshCw className="h-4 w-4 animate-spin" /> Generujem...</> : <><Zap className="h-4 w-4" /> Vygenerovať článok</>}
            </Button>
          </div>
        ) : (
          /* AI Result preview */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge className="bg-violet-500/10 text-violet-300 border-violet-500/30">
                <Sparkles className="h-2.5 w-2.5 mr-1" /> AI vygenerované
              </Badge>
              <Button size="sm" variant="ghost" onClick={() => setResult(null)}>
                <RefreshCw className="h-3 w-3" /> Generovať znova
              </Button>
            </div>

            <div className="space-y-2 p-4 border border-charcoal bg-muted/30 rounded-md">
              <div>
                <Label className="text-xs text-muted-foreground">Nadpis</Label>
                <p className="font-display text-lg font-bold text-off-white">{result.title}</p>
              </div>
              {result.excerpt && (
                <div>
                  <Label className="text-xs text-muted-foreground">Perex</Label>
                  <p className="text-sm text-silver/80">{result.excerpt}</p>
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">Telo ({result.body?.split(/\s+/).length || 0} slov)</Label>
                <ScrollArea className="h-48 rounded border border-charcoal p-3">
                  <div className="text-xs leading-relaxed text-off-white/70 whitespace-pre-wrap">{result.body}</div>
                </ScrollArea>
              </div>
              {result.seoTitle && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">SEO Title:</span> {result.seoTitle}</div>
                  <div><span className="text-muted-foreground">Keywords:</span> {result.keywords}</div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setResult(null)}>
                <RefreshCw className="h-4 w-4" /> Znova
              </Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleUse}>
                <CheckCircle2 className="h-4 w-4" /> Použiť a upraviť
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
