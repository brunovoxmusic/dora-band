"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ListMusic, Plus, Trash2, X, Loader2, Music, Clock, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState } from "@/components/admin/empty-state";

type Setlist = {
  id: string;
  gigId: string | null;
  name: string;
  items: string;
  totalDuration: string | null;
  trackCount: number;
  status: string;
  notes: string | null;
  createdAt: string;
};

type Song = {
  id: string;
  title: string;
  duration: string | null;
  genre: string;
  status: string;
  inSetlist: boolean;
};

const SETLIST_STATUS = [
  { value: "draft", label: "Draft", color: "border-charcoal text-silver" },
  { value: "confirmed", label: "Potvrdený", color: "border-warm-yellow/40 text-warm-yellow" },
  { value: "performed", label: "Odohraný", color: "border-green-500/40 text-green-400" },
];

function parseItems(raw: string): Array<{ songId: string; note?: string }> {
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
}

export function SetlistsTab() {
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Setlist | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      fetch("/api/admin/setlists").then(r => r.json()).catch(() => ({ items: [] })),
      fetch("/api/admin/songs").then(r => r.json()).catch(() => ({ items: [] })),
    ]).then(([sData, songData]) => {
      setSetlists(sData.items ?? []);
      setSongs(songData.items ?? []);
      setLoading(false);
    }).catch(() => { setError(true); setLoading(false); });
  }, []);

  useEffect(() => { Promise.resolve().then(() => load()); }, [load]);

  const remove = async (id: string) => {
    if (!confirm("Zmazať setlist?")) return;
    try {
      await fetch(`/api/admin/setlists/${id}`, { method: "DELETE" });
      setSetlists(arr => arr.filter(s => s.id !== id));
      toast.success("Zmazané.");
    } catch { toast.error("Chyba."); }
  };

  if (loading) return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse bg-charcoal" />)}</div>;
  if (error) return <ErrorState message="Nepodarilo sa načítať setlisty." onRetry={load} />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListMusic className="h-5 w-5 text-warm-yellow" />
          <div>
            <p className="text-sm font-bold text-off-white">Setlists</p>
            <p className="text-xs text-silver">{setlists.length} setlistov · {songs.length} skladieb v databáze</p>
          </div>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-2 bg-neon-red px-4 py-2 text-sm font-bold uppercase text-white">
          <Plus className="h-4 w-4" /> Nový setlist
        </button>
      </div>

      {setlists.length === 0 ? (
        <EmptyState icon={ListMusic} title="Žiadne setlisty" description="Vytvorte setlist z existujúcich skladieb pre konkrétny koncert." action={{ label: "Nový setlist", onClick: () => { setEditing(null); setShowForm(true); } }} />
      ) : (
        <div className="space-y-3">
          {setlists.map(sl => {
            const items = parseItems(sl.items);
            const statusInfo = SETLIST_STATUS.find(s => s.value === sl.status) || SETLIST_STATUS[0];
            return (
              <div key={sl.id} className="border border-charcoal bg-dark-gray p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("border px-1.5 py-0.5 font-mono-brand text-[9px] uppercase", statusInfo.color)}>{statusInfo.label}</span>
                      {sl.totalDuration && <span className="flex items-center gap-1 text-xs text-silver"><Clock className="h-2.5 w-2.5" /> {sl.totalDuration}</span>}
                    </div>
                    <p className="mt-1.5 font-display text-base font-bold text-off-white">{sl.name}</p>
                    <p className="text-xs text-silver">{sl.trackCount} skladieb</p>
                    {items.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {items.slice(0, 5).map((it, i) => {
                          const song = songs.find(s => s.id === it.songId);
                          return (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span className="font-mono-brand text-silver/40 w-5">{i + 1}.</span>
                              <Music className="h-2.5 w-2.5 text-warm-yellow" />
                              <span className="text-off-white/80">{song?.title || "Neznáma skladba"}</span>
                              {song?.duration && <span className="text-silver/40">{song.duration}</span>}
                            </div>
                          );
                        })}
                        {items.length > 5 && <p className="text-xs text-silver/40">+ {items.length - 5} ďalších...</p>}
                      </div>
                    )}
                    {sl.notes && <p className="mt-2 text-xs text-silver/60">{sl.notes}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button onClick={() => { setEditing(sl); setShowForm(true); }} className="inline-flex h-7 w-7 items-center justify-center border border-charcoal text-silver hover:border-neon-red hover:text-neon-red">
                      <Plus className="h-3.5 w-3.5 rotate-45" />
                    </button>
                    <button onClick={() => remove(sl.id)} className="inline-flex h-7 w-7 items-center justify-center border border-charcoal text-silver hover:border-neon-red hover:text-neon-red">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <SetlistForm setlist={editing} songs={songs} onClose={() => { setShowForm(false); setEditing(null); }} onSaved={() => { setShowForm(false); setEditing(null); load(); }} />}
    </div>
  );
}

function SetlistForm({ setlist, songs, onClose, onSaved }: { setlist: Setlist | null; songs: Song[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: setlist?.name || "",
    gigId: setlist?.gigId || "",
    status: setlist?.status || "draft",
    notes: setlist?.notes || "",
  });
  const [selectedSongs, setSelectedSongs] = useState<string[]>(
    setlist ? parseItems(setlist.items).map(i => i.songId) : []
  );
  const [saving, setSaving] = useState(false);

  const toggleSong = (songId: string) => {
    setSelectedSongs(prev => prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId]);
  };

  const save = async () => {
    if (!form.name) { toast.error("Názov je povinný."); return; }
    setSaving(true);
    try {
      const items = selectedSongs.map((songId, order) => ({ songId, order }));
      const url = setlist ? `/api/admin/setlists/${setlist.id}` : "/api/admin/setlists";
      const method = setlist ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items, gigId: form.gigId || null }),
      });
      if (!res.ok) throw new Error("Zlyhalo.");
      toast.success(setlist ? "Setlist upravený." : "Setlist vytvorený.");
      onSaved();
    } catch { toast.error("Chyba."); }
    finally { setSaving(false); }
  };

  const totalDuration = selectedSongs.reduce((acc, id) => {
    const song = songs.find(s => s.id === id);
    if (!song?.duration) return acc;
    const [m, s] = song.duration.split(":").map(Number);
    return acc + (m * 60 + s);
  }, 0);
  const formatDuration = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto scroll-dora border border-charcoal bg-dark-gray p-6" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-off-white">{setlist ? "Upraviť setlist" : "Nový setlist"}</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-silver" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Názov *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white">
                {SETLIST_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Trvanie</label>
              <div className="flex h-[38px] items-center border border-charcoal bg-ink px-3">
                <Clock className="h-3 w-3 text-warm-yellow mr-2" />
                <span className="text-sm text-off-white">{selectedSongs.length > 0 ? formatDuration(totalDuration) : "—"}</span>
                <span className="ml-auto text-xs text-silver">{selectedSongs.length} skladieb</span>
              </div>
            </div>
          </div>

          {/* Song picker */}
          <div>
            <label className="mb-2 block font-mono-brand text-[10px] uppercase text-silver">Skladby (klikni pre pridanie/odstránenie)</label>
            <div className="max-h-48 space-y-1 overflow-y-auto scroll-dora border border-charcoal bg-ink p-2">
              {songs.length === 0 ? (
                <p className="py-4 text-center text-xs text-silver/50">Žiadne skladby v databáze. Najprv pridaj skladby v tabe Skladby.</p>
              ) : (
                songs.map(song => {
                  const selected = selectedSongs.includes(song.id);
                  const order = selectedSongs.indexOf(song.id) + 1;
                  return (
                    <button
                      key={song.id}
                      onClick={() => toggleSong(song.id)}
                      className={cn(
                        "flex w-full items-center gap-2 border px-2 py-1.5 text-left text-xs transition-colors",
                        selected ? "border-neon-red/40 bg-neon-red/10" : "border-charcoal hover:border-off-white/20"
                      )}
                    >
                      {selected ? (
                        <span className="flex h-4 w-4 items-center justify-center bg-neon-red text-white font-mono-brand text-[9px]">{order}</span>
                      ) : (
                        <Music className="h-3 w-3 text-silver/40" />
                      )}
                      <span className={cn("flex-1 truncate", selected ? "text-neon-red" : "text-off-white/80")}>{song.title}</span>
                      {song.duration && <span className="text-silver/40">{song.duration}</span>}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Poznámky</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full resize-y border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
          </div>
          <button onClick={save} disabled={saving || !form.name} className="w-full bg-neon-red py-2.5 text-sm font-bold uppercase text-white disabled:opacity-50">
            {saving ? "Ukladám..." : "Uložiť"}
          </button>
        </div>
      </div>
    </div>
  );
}
