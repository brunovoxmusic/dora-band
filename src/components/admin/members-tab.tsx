"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";
import {
  Users, Plus, RefreshCw, Pencil, Trash2, ChevronUp, ChevronDown,
  MicVocal, Guitar, Drum, Music2, Save,
} from "lucide-react";
import { toast } from "sonner";

type Member = {
  id: string;
  name: string;
  role: string;
  roleEn?: string | null;
  bio?: string | null;
  initials: string;
  since: string;
  photo?: string | null;
  order: number;
  active: boolean;
  createdAt: string;
};

const ROLE_ICONS: Record<string, typeof MicVocal> = {
  "Vokály": MicVocal, "Gitara": Guitar, "Bicie": Drum, "Basgitara": Music2,
};

function roleIcon(role: string) {
  const r = role.toLowerCase();
  if (r.includes("spev") || r.includes("vokál") || r.includes("rap")) return MicVocal;
  if (r.includes("bice")) return Drum;
  if (r.includes("bas")) return Music2;
  return Guitar;
}

const PORTRAITS = [
  "/gallery/portrait/portrait-01.jpg",
  "/gallery/portrait/portrait-02.jpg",
  "/gallery/portrait/portrait-03.jpg",
  "/gallery/portrait/portrait-04.jpg",
  "/gallery/portrait/portrait-05.jpg",
];

export function MembersTab() {
  const [items, setItems] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Member | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/members");
      if (!res.ok) throw new Error("Načítanie zlyhalo");
      const d = await res.json();
      setItems(d.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neznáma chyba");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const moveOrder = async (id: string, direction: "up" | "down") => {
    const idx = items.findIndex(i => i.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const current = items[idx];
    const swap = items[swapIdx];
    // Swap orders
    await Promise.all([
      fetch(`/api/admin/members/${current.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: swap.order }) }),
      fetch(`/api/admin/members/${swap.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: current.order }) }),
    ]);
    void load();
  };

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-neon-red" />
            Členovia kapely
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Správa profilov členov — mená, roly, fotky, biografie
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Obnoviť
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="h-4 w-4" />
            Nový člen
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4 flex items-center justify-between">
          <div><p className="text-xs text-muted-foreground">Spolu členov</p><p className="text-2xl font-bold tabular-nums">{items.length}</p></div>
          <Users className="h-5 w-5 text-sky-400" />
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center justify-between">
          <div><p className="text-xs text-muted-foreground">Aktívni</p><p className="text-2xl font-bold text-emerald-500 tabular-nums">{items.filter(i => i.active).length}</p></div>
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center justify-between">
          <div><p className="text-xs text-muted-foreground">S fotkou</p><p className="text-2xl font-bold text-warm-yellow tabular-nums">{items.filter(i => i.photo).length}</p></div>
        </CardContent></Card>
      </div>

      {/* Members list */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-96" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="Žiadni členovia" description="Pridaj prvého člena kapely." icon={Users} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((m) => {
            const Icon = roleIcon(m.role);
            return (
              <Card key={m.id} className={m.active ? "" : "opacity-50"}>
                <CardContent className="p-0 flex flex-col">
                  {/* Photo */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-charcoal to-ink">
                    {m.photo ? (
                      <img src={m.photo} alt={m.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="font-display text-5xl font-black text-neon-red/30">{m.initials}</span>
                      </div>
                    )}
                    {/* Order controls */}
                    <div className="absolute right-2 top-2 flex flex-col gap-1">
                      <button onClick={() => moveOrder(m.id, "up")} className="flex h-6 w-6 items-center justify-center border border-charcoal bg-ink/80 text-silver hover:text-neon-red backdrop-blur-sm">
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button onClick={() => moveOrder(m.id, "down")} className="flex h-6 w-6 items-center justify-center border border-charcoal bg-ink/80 text-silver hover:text-neon-red backdrop-blur-sm">
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>
                    {/* Active badge */}
                    {!m.active && (
                      <div className="absolute left-2 top-2">
                        <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-400 border-red-500/30">SKRYTÝ</Badge>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-warm-yellow" />
                      <span className="font-mono-brand text-[10px] uppercase tracking-wider text-warm-yellow">{m.role}</span>
                    </div>
                    <h3 className="font-display text-sm font-bold leading-tight">{m.name}</h3>
                    <p className="text-[10px] text-muted-foreground">Od {m.since}</p>
                    {m.bio && <p className="text-xs text-muted-foreground line-clamp-2">{m.bio}</p>}
                    <div className="flex gap-1 pt-1">
                      <Button size="sm" variant="ghost" className="h-7 text-xs flex-1" onClick={() => { setEditing(m); setShowForm(true); }}>
                        <Pencil className="h-3 w-3" /> Upraviť
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-600"
                        onClick={async () => {
                          if (!confirm(`Zmazať "${m.name}"?`)) return;
                          const res = await fetch(`/api/admin/members/${m.id}`, { method: "DELETE" });
                          if (res.ok) { toast.success("Zmazané"); void load(); } else toast.error("Zmazanie zlyhalo");
                        }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form dialog */}
      <MemberFormDialog open={showForm} onOpenChange={setShowForm} member={editing} onSaved={() => { setShowForm(false); void load(); }} />
    </div>
  );
}

function MemberFormDialog({ open, onOpenChange, member, onSaved }: {
  open: boolean; onOpenChange: (v: boolean) => void; member: Member | null; onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [roleEn, setRoleEn] = useState("");
  const [bio, setBio] = useState("");
  const [initials, setInitials] = useState("");
  const [since, setSince] = useState("—");
  const [photo, setPhoto] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setName(member.name); setRole(member.role); setRoleEn(member.roleEn || "");
      setBio(member.bio || ""); setInitials(member.initials); setSince(member.since);
      setPhoto(member.photo || ""); setActive(member.active);
    } else {
      setName(""); setRole(""); setRoleEn(""); setBio(""); setInitials("");
      setSince("—"); setPhoto(""); setActive(true);
    }
  }, [member, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        name, role, roleEn: roleEn || undefined, bio: bio || undefined,
        initials: initials || name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
        since, photo: photo || undefined, active,
      };
      const url = member ? `/api/admin/members/${member.id}` : "/api/admin/members";
      const method = member ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Uloženie zlyhalo");
      }
      toast.success(member ? "Člen aktualizovaný" : "Člen pridaný");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? "Upraviť člena" : "Nový člen"}</DialogTitle>
          <DialogDescription>{member ? `Upravuješ: ${member.name}` : "Pridaj nového člena kapely"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-sm">Meno *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div><Label className="text-sm">Iniciály</Label><Input value={initials} onChange={e => setInitials(e.target.value)} placeholder="auto" maxLength={3} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-sm">Rola (SK)</Label><Input value={role} onChange={e => setRole(e.target.value)} placeholder="Gitara" /></div>
            <div><Label className="text-sm">Rola (EN)</Label><Input value={roleEn} onChange={e => setRoleEn(e.target.value)} placeholder="Guitar" /></div>
          </div>
          <div><Label className="text-sm">V kapele od</Label><Input value={since} onChange={e => setSince(e.target.value)} placeholder="1996 alebo —" /></div>
          <div><Label className="text-sm">Bio</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} /></div>
          {/* Photo picker */}
          <div>
            <Label className="text-sm">Fotka</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PORTRAITS.map(p => (
                <button key={p} onClick={() => setPhoto(p)}
                  className={`h-16 w-12 overflow-hidden border-2 transition-all ${photo === p ? "border-neon-red" : "border-charcoal hover:border-neon-red/40"}`}>
                  <img src={p} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
              <button onClick={() => setPhoto("")}
                className={`flex h-16 w-12 items-center justify-center border-2 text-xs text-muted-foreground transition-all ${photo === "" ? "border-neon-red bg-neon-red/10" : "border-charcoal hover:border-neon-red/40"}`}>
                Žiadna
              </button>
            </div>
            {photo && <Input value={photo} onChange={e => setPhoto(e.target.value)} className="mt-2 text-xs font-mono" />}
          </div>
          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <Switch checked={active} onCheckedChange={setActive} />
            <Label className="text-sm cursor-pointer" onClick={() => setActive(!active)}>Aktívny (zobrazí sa na webe)</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Zrušiť</Button>
          <Button onClick={handleSave} disabled={saving || !name}>
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {member ? "Uložiť zmeny" : "Pridať člena"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
