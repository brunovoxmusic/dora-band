"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Music, Plus, Trash2, X, Loader2, Search, Pencil, Clock,
  Play, Disc3, CheckCircle2, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";

type Song = {
  id: string;
  title: string;
  altTitle: string | null;
  bpm: number | null;
  musicalKey: string | null;
  tuning: string | null;
  genre: string;
  status: string;
  duration: string | null;
  lyrics: string | null;
  notes: string | null;
  releaseYear: string | null;
  releaseName: string | null;
  videoId: string | null;
  inSetlist: boolean;
  isCover: boolean;
  originalArtist: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUSES = [
  { value: "all", label: "Všetko" },
  { value: "idea", label: "Idea" },
  { value: "demo", label: "Demo" },
  { value: "arrangement", label: "Aranžmán" },
  { value: "rehearsal", label: "Skúška" },
  { value: "recording", label: "Nahrávka" },
  { value: "mix", label: "Mix" },
  { value: "master", label: "Master" },
  { value: "released", label: "Vydané" },
];

const STATUS_COLORS: Record<string, string> = {
  idea: "border-charcoal text-silver",
  demo: "border-sky-500/40 text-sky-400",
  arrangement: "border-purple-500/40 text-purple-400",
  rehearsal: "border-warm-yellow/40 text-warm-yellow",
  recording: "border-orange-500/40 text-orange-400",
  mix: "border-cyan-500/40 text-cyan-400",
  master: "border-indigo-500/40 text-indigo-400",
  released: "border-green-500/40 text-green-400",
};

export function SongsTab() {
  const [items, setItems] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Song | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/admin/songs?status=${filter}`)
      .then(r => r.json())
      .then(d => { setItems(d.items ?? []); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [filter]);

  useEffect(() => { Promise.resolve().then(() => load()); }, [load]);

  const remove = async (id: string) => {
    if (!confirm("Zmazať skladbu?")) return;
    try {
      await fetch(`/api/admin/songs/${id}`, { method: "DELETE" });
      setItems(arr => arr.filter(s => s.id !== id));
      toast.success("Zmazané.");
    } catch { toast.error("Chyba."); }
  };

  const toggleSetlist = async (song: Song) => {
    const inSetlist = !song.inSetlist;
    try {
      await fetch(`/api/admin/songs/${song.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inSetlist }),
      });
      setItems(arr => arr.map(s => s.id === song.id ? { ...s, inSetlist } : s));
      toast.success(inSetlist ? "Pridané do setlistu" : "Odstránené zo setlistu");
    } catch { toast.error("Chyba."); }
  };

  const filtered = items.filter(s =>
    !search ||
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.genre.toLowerCase().includes(search.toLowerCase()) ||
    (s.releaseName || "").toLowerCase().includes(search.toLowerCase())
  );

  const setlistCount = items.filter(s => s.inSetlist).length;
  const releasedCount = items.filter(s => s.status === "released").length;

  if (loading) {
    return (
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 animate-pulse bg-charcoal" />)}
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Nepodarilo sa načítať skladby." onRetry={load} />;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Music className="h-5 w-5 text-warm-yellow" />
          <div>
            <p className="text-sm font-bold text-off-white">Song Database</p>
            <p className="text-xs text-silver">
              {items.length} skladieb · {releasedCount} vydaných · {setlistCount} v setliste
            </p>
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 bg-neon-red px-4 py-2 text-sm font-bold uppercase text-white"
        >
          <Plus className="h-4 w-4" /> Pridať skladbu
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-silver" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Hľadať..."
            className="w-40 border border-charcoal bg-dark-gray py-2 pl-8 pr-2 text-xs text-off-white outline-none focus:border-neon-red sm:w-56"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={cn(
                "border px-2.5 py-1.5 text-xs font-semibold",
                filter === s.value ? "border-neon-red bg-neon-red/10 text-neon-red" : "border-charcoal text-silver hover:text-off-white"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Songs grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Music}
          title="Žiadne skladby"
          description="Pridajte skladby kapely s metadatami: BPM, tónina, žáner, texty, stav."
          action={{ label: "Pridať prvú skladbu", onClick: () => { setEditing(null); setShowForm(true); } }}
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(song => (
            <div
              key={song.id}
              className="group border border-charcoal bg-dark-gray p-3 transition-colors hover:border-off-white/20"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "inline-block border px-1.5 py-0.5 font-mono-brand text-[8px] uppercase",
                      STATUS_COLORS[song.status] || STATUS_COLORS.idea
                    )}>
                      {STATUSES.find(s => s.value === song.status)?.label || song.status}
                    </span>
                    {song.inSetlist && (
                      <span className="flex items-center gap-1 font-mono-brand text-[8px] uppercase text-neon-red">
                        <Play className="h-2.5 w-2.5" /> Setlist
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 truncate text-sm font-semibold text-off-white">{song.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-silver">
                    <span className="font-mono-brand">{song.genre}</span>
                    {song.bpm && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" /> {song.bpm} BPM
                      </span>
                    )}
                    {song.musicalKey && <span className="font-mono-brand">{song.musicalKey}</span>}
                  </div>
                  {song.duration && (
                    <p className="mt-1 font-mono-brand text-[9px] text-silver/50">{song.duration}</p>
                  )}
                  {song.releaseName && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-silver/60">
                      <Disc3 className="h-2.5 w-2.5" /> {song.releaseName}
                      {song.releaseYear && ` (${song.releaseYear})`}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    onClick={() => toggleSetlist(song)}
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center border transition-colors",
                      song.inSetlist
                        ? "border-neon-red/40 bg-neon-red/10 text-neon-red"
                        : "border-charcoal text-silver hover:border-neon-red hover:text-neon-red"
                    )}
                    title={song.inSetlist ? "Odstrániť zo setlistu" : "Pridať do setlistu"}
                  >
                    <Play className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => { setEditing(song); setShowForm(true); }}
                    className="inline-flex h-6 w-6 items-center justify-center border border-charcoal text-silver hover:border-neon-red hover:text-neon-red"
                    title="Upraviť"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => remove(song.id)}
                    className="inline-flex h-6 w-6 items-center justify-center border border-charcoal text-silver hover:border-neon-red hover:text-neon-red"
                    title="Zmazať"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <SongForm
          song={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function SongForm({ song, onClose, onSaved }: { song: Song | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    title: song?.title || "",
    altTitle: song?.altTitle || "",
    bpm: song?.bpm || "",
    musicalKey: song?.musicalKey || "",
    tuning: song?.tuning || "",
    genre: song?.genre || "Funky-Punk",
    status: song?.status || "idea",
    duration: song?.duration || "",
    lyrics: song?.lyrics || "",
    notes: song?.notes || "",
    releaseYear: song?.releaseYear || "",
    releaseName: song?.releaseName || "",
    videoId: song?.videoId || "",
    inSetlist: song?.inSetlist || false,
    isCover: song?.isCover || false,
    originalArtist: song?.originalArtist || "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.title) { toast.error("Názov je povinný."); return; }
    setSaving(true);
    try {
      const url = song ? `/api/admin/songs/${song.id}` : "/api/admin/songs";
      const method = song ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          bpm: form.bpm ? parseInt(String(form.bpm)) : undefined,
        }),
      });
      if (!res.ok) throw new Error("Zlyhalo.");
      toast.success(song ? "Skladba upravená." : "Skladba pridaná.");
      onSaved();
    } catch { toast.error("Chyba."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto scroll-dora border border-charcoal bg-dark-gray p-6" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-off-white">
            {song ? "Upraviť skladbu" : "Nová skladba"}
          </h3>
          <button onClick={onClose}><X className="h-5 w-5 text-silver" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Názov *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">BPM</label>
              <input type="number" value={form.bpm} onChange={e => setForm({ ...form, bpm: e.target.value })} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
            </div>
            <div>
              <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Tónina</label>
              <input value={form.musicalKey} onChange={e => setForm({ ...form, musicalKey: e.target.value })} placeholder="napr. Am" className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Žáner</label>
              <input value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
            </div>
            <div>
              <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Ladenie</label>
              <input value={form.tuning} onChange={e => setForm({ ...form, tuning: e.target.value })} placeholder="Standard" className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white">
                {STATUSES.filter(s => s.value !== "all").map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Dĺžka</label>
              <input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="3:42" className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Release rok</label>
              <input value={form.releaseYear} onChange={e => setForm({ ...form, releaseYear: e.target.value })} placeholder="2005" className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
            </div>
            <div>
              <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Release názov</label>
              <input value={form.releaseName} onChange={e => setForm({ ...form, releaseName: e.target.value })} placeholder="TCHO SME NAHLAVU?" className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
            </div>
          </div>
          <div>
            <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">YouTube ID</label>
            <input value={form.videoId} onChange={e => setForm({ ...form, videoId: e.target.value })} placeholder="dQw4w9WgXcQ" className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
          </div>
          <div>
            <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Texty</label>
            <textarea value={form.lyrics} onChange={e => setForm({ ...form, lyrics: e.target.value })} rows={3} className="w-full resize-y border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
          </div>
          <div>
            <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Poznámky</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full resize-y border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.inSetlist} onChange={e => setForm({ ...form, inSetlist: e.target.checked })} className="h-4 w-4" />
              <span className="text-sm text-off-white/80">V setliste</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isCover} onChange={e => setForm({ ...form, isCover: e.target.checked })} className="h-4 w-4" />
              <span className="text-sm text-off-white/80">Cover</span>
            </label>
          </div>
          {form.isCover && (
            <div>
              <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Pôvodný interpret</label>
              <input value={form.originalArtist} onChange={e => setForm({ ...form, originalArtist: e.target.value })} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
            </div>
          )}
          <button onClick={save} disabled={saving || !form.title} className="w-full bg-neon-red py-2.5 text-sm font-bold uppercase text-white disabled:opacity-50">
            {saving ? "Ukladám..." : "Uložiť"}
          </button>
        </div>
      </div>
    </div>
  );
}
