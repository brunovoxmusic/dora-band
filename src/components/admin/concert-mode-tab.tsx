"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "@/components/admin/empty-state";
import {
  CalendarDays, MapPin, Music, Play, Pause, SkipForward, SkipBack, RotateCcw,
  Timer, ShoppingCart, DollarSign, FileText, Star, CheckCircle2, Plus, Minus,
  ChevronRight, Clock, Settings2, Volume2, StickyNote, Save, AlertCircle,
  RefreshCw, ListMusic, Mic2,
} from "lucide-react";
import { toast } from "sonner";

type Song = {
  id: string;
  title: string;
  duration?: string | null;
  musicalKey?: string | null;
  bpm?: number | null;
  tuning?: string | null;
  genre?: string;
  isCover?: boolean;
  originalArtist?: string | null;
  status?: string;
};

type SetlistItem = { songId: string; order: number; note?: string };
type Setlist = {
  id: string;
  gigId: string | null;
  name: string;
  items: SetlistItem[];
  totalDuration?: string | null;
  trackCount: number;
  status: string;
  notes?: string | null;
};

type Gig = {
  id: string;
  title: string;
  date: string;
  venue: string;
  city: string;
  country: string;
  ticketUrl?: string | null;
  ticketPrice?: string | null;
  notes?: string | null;
  venueEntity?: { name: string; city?: string; capacity?: number; techInfo?: string | null } | null;
};

type UpcomingGig = {
  id: string;
  title: string;
  date: string;
  venue: string;
  city: string;
  country: string;
  ticketPrice?: string | null;
  notes?: string | null;
};

type MerchItem = { id: string; name: string; price: number; count: number; emoji: string };

// B.5: Nahradené hardcoded merch s dynamic fetch z /api/admin/merch/products
// Fallback ak API nie je dostupné
const FALLBACK_MERCH: MerchItem[] = [
  { id: "fallback-1", name: "Tričká", price: 15, count: 0, emoji: "👕" },
  { id: "fallback-2", name: "Vinyly / CD", price: 12, count: 0, emoji: "💿" },
];

// Mapovanie produkt kategórií na emoji
const CATEGORY_EMOJI: Record<string, string> = {
  "t-shirt": "👕",
  "vinyl": "💿",
  "cd": "🎵",
  "poster": "🖼️",
  "sticker": "✨",
  "other": "📦",
};

const STORAGE_KEY = "dora-concert-mode";

type SessionState = {
  gigId: string | null;
  currentSongIndex: number;
  isPlaying: boolean;
  songElapsed: number; // sekundy
  setElapsed: number; // sekundy
  startedAt: number | null; // timestamp
  notes: string;
  merch: MerchItem[];
};

const DEFAULT_STATE: SessionState = {
  gigId: null,
  currentSongIndex: 0,
  isPlaying: false,
  songElapsed: 0,
  setElapsed: 0,
  startedAt: null,
  notes: "",
  merch: FALLBACK_MERCH,
};

function loadState(): SessionState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed, isPlaying: false }; // nikdy neobnov playing state
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: SessionState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function fmtTime(s: number): string {
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

function parseDuration(d?: string | null): number {
  if (!d) return 0;
  const m = d.match(/^(\d+):(\d+)$/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export function ConcertModeTab() {
  const [state, setState] = useState<SessionState>(DEFAULT_STATE);
  const [upcomingGigs, setUpcomingGigs] = useState<UpcomingGig[]>([]);
  const [gig, setGig] = useState<Gig | null>(null);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSetlistId, setSelectedSetlistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingGig, setLoadingGig] = useState(false);
  const [showPostEvent, setShowPostEvent] = useState(false);
  const [postRating, setPostRating] = useState(5);
  const [postSummary, setPostSummary] = useState("");
  const [postNotes, setPostNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Init: load state from localStorage
  useEffect(() => {
    setState(loadState());
  }, []);

  // Load upcoming gigs (or selected gig)
  const loadData = useCallback(async (gigId: string | null) => {
    setLoading(true);
    try {
      const url = gigId ? `/api/admin/concert-mode?gigId=${gigId}` : "/api/admin/concert-mode";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Načítanie zlyhalo");
      const json = await res.json();
      if (gigId) {
        setGig(json.gig);
        setSetlists(json.setlists || []);
        setSongs(json.songs || []);
        if (json.setlists?.length > 0) {
          setSelectedSetlistId(json.setlists[0].id);
        }
      } else {
        setUpcomingGigs(json.upcomingGigs || []);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData(state.gigId);
  }, [state.gigId, loadData]);

  // B.5: Fetch merch products z API keď sa vyberie gig
  useEffect(() => {
    if (!state.gigId) return;
    fetch("/api/admin/merch/products?active=true")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.items?.length) return;
        const merchItems: MerchItem[] = data.items.map((p: { id: string; name: string; price: number; category: string }) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          count: 0,
          emoji: CATEGORY_EMOJI[p.category] || "📦",
        }));
        // Iba ak sa zmenil zoznam produktov (anti prepísanie počítadiel)
        setState((s) => {
          if (s.merch.length === merchItems.length && s.merch.every((m, i) => m.id === merchItems[i].id)) {
            return s; // zachovaj count
          }
          return { ...s, merch: merchItems };
        });
      })
      .catch(() => {/* fallback už je nastavený */});
  }, [state.gigId]);

  // Timer tick (1 sekunda)
  useEffect(() => {
    if (!state.isPlaying) return;
    const interval = setInterval(() => {
      setState((s) => {
        const next = { ...s, songElapsed: s.songElapsed + 1, setElapsed: s.setElapsed + 1 };
        saveState(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.isPlaying]);

  // Persist state on changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  const selectGig = (gigId: string) => {
    setLoadingGig(true);
    setState((s) => ({ ...s, gigId, currentSongIndex: 0, songElapsed: 0, setElapsed: 0, startedAt: null, isPlaying: false, notes: "", merch: FALLBACK_MERCH }));
  };

  const exitGig = () => {
    setState({ ...DEFAULT_STATE });
    setGig(null);
    setSetlists([]);
    setSelectedSetlistId(null);
    void loadData(null);
  };

  // Player controls
  const togglePlay = () => {
    setState((s) => {
      const isPlaying = !s.isPlaying;
      return { ...s, isPlaying, startedAt: s.startedAt ?? Date.now() };
    });
  };

  const nextSong = () => {
    const items = currentSetlist?.items || [];
    if (!items.length) return;
    setState((s) => ({
      ...s,
      currentSongIndex: Math.min(s.currentSongIndex + 1, items.length - 1),
      songElapsed: 0,
    }));
  };

  const prevSong = () => {
    setState((s) => ({
      ...s,
      currentSongIndex: Math.max(s.currentSongIndex - 1, 0),
      songElapsed: 0,
    }));
  };

  const resetSong = () => {
    setState((s) => ({ ...s, songElapsed: 0 }));
  };

  const jumpToSong = (index: number) => {
    setState((s) => ({ ...s, currentSongIndex: index, songElapsed: 0 }));
  };

  // Merch
  const incMerch = (i: number) => {
    setState((s) => {
      const merch = [...s.merch];
      merch[i] = { ...merch[i], count: merch[i].count + 1 };
      return { ...s, merch };
    });
  };
  const decMerch = (i: number) => {
    setState((s) => {
      const merch = [...s.merch];
      merch[i] = { ...merch[i], count: Math.max(0, merch[i].count - 1) };
      return { ...s, merch };
    });
  };

  const currentSetlist = setlists.find((s) => s.id === selectedSetlistId) || setlists[0];
  const currentItems = currentSetlist?.items || [];
  const currentSongId = currentItems[state.currentSongIndex]?.songId;
  const currentSong = songs.find((s) => s.id === currentSongId);
  const currentSongDuration = parseDuration(currentSong?.duration);
  const songProgress = currentSongDuration > 0 ? Math.min((state.songElapsed / currentSongDuration) * 100, 100) : 0;
  const totalMerchCount = state.merch.reduce((sum, m) => sum + m.count, 0);
  const totalMerchRevenue = state.merch.reduce((sum, m) => sum + m.count * m.price, 0);

  // Loading state
  if (loading) return <LoadingSkeleton />;

  // No gig selected — show picker
  if (!state.gigId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Mic2 className="h-6 w-6 text-rose-500" />
            Concert Mode
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Mobile-first operátorské rozhranie pre live koncert · setlist, timer, merch, post-event
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Nadchádzajúce koncerty
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingGigs.length === 0 ? (
              <EmptyState
                title="Žiadne nadchádzajúce koncerty"
                description="Najprv vytvor koncert v záložke Koncerty, potom ho tu budeš môcť otvoriť v Concert Mode."
                icon={CalendarDays}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {upcomingGigs.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => selectGig(g.id)}
                    disabled={loadingGig}
                    className="text-left p-4 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold truncate">{g.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(g.date).toLocaleDateString("sk-SK", { day: "numeric", month: "long", year: "numeric" })}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" />
                          {g.venue}, {g.city}, {g.country}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                    {g.ticketPrice && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-[10px]">{g.ticketPrice}€</Badge>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Gig loaded — Concert Mode dashboard (mobile-first)
  return (
    <div className="space-y-4 pb-20">
      {/* Sticky mobile-friendly header */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                <span className="relative flex h-2 w-2 mr-1">
                  {state.isPlaying && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />}
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                </span>
                LIVE
              </Badge>
              <h2 className="text-lg font-bold truncate">{gig?.title}</h2>
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{gig && new Date(gig.date).toLocaleDateString("sk-SK")}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{gig?.venue}, {gig?.city}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={exitGig} disabled={loadingGig}>
            <RefreshCw className="h-4 w-4" />
            Zmeniť
          </Button>
        </div>
      </div>

      {/* Setlist picker (if multiple) */}
      {setlists.length > 1 && (
        <Card>
          <CardContent className="p-3">
            <Label className="text-xs text-muted-foreground mb-2 block">Setlist</Label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {setlists.map((sl) => (
                <button
                  key={sl.id}
                  onClick={() => setSelectedSetlistId(sl.id)}
                  className={`px-3 py-1.5 text-xs rounded-md border whitespace-nowrap transition-colors ${selectedSetlistId === sl.id ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"}`}
                >
                  {sl.name} ({sl.trackCount})
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current song — big player */}
      <Card className="bg-gradient-to-br from-rose-950/30 via-card to-card border-rose-500/30">
        <CardContent className="p-5 sm:p-6">
          {currentSong ? (
            <>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Skladba {state.currentSongIndex + 1} / {currentItems.length}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">{currentSong.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentSong.bpm && <Badge variant="outline" className="text-[10px]">{currentSong.bpm} BPM</Badge>}
                    {currentSong.musicalKey && <Badge variant="outline" className="text-[10px]">{currentSong.musicalKey}</Badge>}
                    {currentSong.tuning && currentSong.tuning !== "Standard" && (
                      <Badge variant="outline" className="text-[10px]">{currentSong.tuning}</Badge>
                    )}
                    {currentSong.isCover && (
                      <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        Cover · {currentSong.originalArtist}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Timer big */}
              <div className="text-center mb-4">
                <div className="font-mono text-5xl sm:text-6xl font-bold tabular-nums tracking-tighter">
                  {fmtTime(state.songElapsed)}
                </div>
                {currentSongDuration > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    z {fmtTime(currentSongDuration)} · set celkom {fmtTime(state.setElapsed)}
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {currentSongDuration > 0 && (
                <Progress value={songProgress} className="h-2 mb-4" />
              )}

              {/* Player controls — big tap targets */}
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-full"
                  onClick={prevSong}
                  disabled={state.currentSongIndex === 0}
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={resetSong}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  className="h-20 w-20 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30"
                  onClick={togglePlay}
                >
                  {state.isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={() => setState((s) => ({ ...s, songElapsed: 0 }))}
                  title="Reset časovača"
                >
                  <Timer className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-full"
                  onClick={nextSong}
                  disabled={state.currentSongIndex >= currentItems.length - 1}
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t text-center">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Odhad</div>
                  <div className="text-sm font-semibold tabular-nums">{currentSongDuration > 0 ? fmtTime(currentSongDuration) : "—"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Zostáva</div>
                  <div className="text-sm font-semibold tabular-nums">
                    {currentSongDuration > 0 ? fmtTime(Math.max(0, currentSongDuration - state.songElapsed)) : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Set</div>
                  <div className="text-sm font-semibold tabular-nums">{fmtTime(state.setElapsed)}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Music className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {currentItems.length === 0
                  ? "Tento koncert nemá setlist. Vytvor ho v záložke Setlisty."
                  : "Vyber skladbu zo setlistu nižšie."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setlist overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ListMusic className="h-4 w-4" />
            Setlist ({currentItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {currentItems.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center px-4">
              Žiadne skladby v setliste.
            </div>
          ) : (
            <ScrollArea className="h-72">
              <div className="divide-y">
                {currentItems.map((item, idx) => {
                  const song = songs.find((s) => s.id === item.songId);
                  const isActive = idx === state.currentSongIndex;
                  const isPast = idx < state.currentSongIndex;
                  return (
                    <button
                      key={`${item.songId}-${idx}`}
                      onClick={() => jumpToSong(idx)}
                      className={`w-full text-left p-3 flex items-center gap-3 transition-colors ${
                        isActive ? "bg-rose-500/10 border-l-4 border-rose-500" : "hover:bg-accent/50 border-l-4 border-transparent"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isActive ? "bg-rose-600 text-white" : isPast ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "bg-muted"
                      }`}>
                        {isPast ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`font-medium truncate ${isActive ? "text-rose-700 dark:text-rose-300" : ""}`}>
                          {song?.title || "Neznáma skladba"}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {song?.bpm && <span>{song.bpm} BPM</span>}
                          {song?.musicalKey && <span>· {song.musicalKey}</span>}
                          {song?.duration && <span>· {song.duration}</span>}
                        </div>
                        {item.note && (
                          <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 italic">⚡ {item.note}</div>
                        )}
                      </div>
                      {isActive && (
                        <Badge variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[10px]">
                          AKTUÁLNA
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Two-column: Notes + Merch */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Quick notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-amber-500" />
              Quick notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Poznámky počas koncertu — zvuk, publikum, chyby, nápady..."
              value={state.notes}
              onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
              rows={5}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground text-right">
              {state.notes.length} znakov · ukladané automaticky
            </div>
            <div className="flex gap-2 flex-wrap">
              {["🔥 Päna", "💥 Energičná", "👎 Technický problém", "🎵 Nová skladba", "💬 Frontman rant"].map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setState((s) => ({ ...s, notes: s.notes + (s.notes ? "\n" : "") + `[${new Date().toLocaleTimeString("sk-SK")}] ${preset}` }))}
                >
                  + {preset}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Merch counter */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-emerald-500" />
              Merch counter
            </CardTitle>
            <div className="text-xs text-muted-foreground mt-1">
              Spolu: <strong className="text-emerald-600 dark:text-emerald-400">{totalMerchCount} kusov</strong> ·{" "}
              <strong className="text-emerald-600 dark:text-emerald-400">{totalMerchRevenue.toFixed(2)}€</strong>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {state.merch.map((m, i) => (
              <div key={m.name} className="flex items-center gap-2 p-2 rounded-md border bg-muted/30">
                <div className="text-2xl w-8 text-center">{m.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.price}€ / kus · {(m.count * m.price).toFixed(2)}€</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => decMerch(i)} disabled={m.count === 0}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <div className="w-10 text-center font-mono font-bold tabular-nums">{m.count}</div>
                  <Button variant="outline" size="icon" className="h-8 w-8 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30" onClick={() => incMerch(i)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Venue info / tech rider */}
      {gig?.venueEntity?.techInfo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Tech rider — {gig.venueEntity?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">{gig.venueEntity.techInfo}</pre>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="lg" onClick={() => toast.success("Stav uložený", { description: "Pokračuj v koncerte 🤘" })}>
          <Save className="h-4 w-4" />
          Uložiť stav
        </Button>
        <Button variant="default" size="lg" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowPostEvent(true)}>
          <CheckCircle2 className="h-4 w-4" />
          Ukončiť koncert
        </Button>
      </div>

      {/* Post-event dialog */}
      <Dialog open={showPostEvent} onOpenChange={setShowPostEvent}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Post-event report</DialogTitle>
            <DialogDescription>
              Označ koncert ako dokončený a ulož post-event report (rating, merch, cash).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm">Rating</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setPostRating(n)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star className={`h-7 w-7 ${n <= postRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm">Stručné zhrnutie</Label>
              <Input
                placeholder="Napr.: skvelý koncert, plný klub, publikum spree"
                value={postSummary}
                onChange={(e) => setPostSummary(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm">Poznámky</Label>
              <Textarea
                placeholder="Čo sa podarilo, čo zlepšiť, technické problémy..."
                value={postNotes}
                onChange={(e) => setPostNotes(e.target.value)}
                rows={4}
                className="mt-1.5 resize-none"
              />
            </div>
            <div className="p-3 rounded-md bg-muted/50 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Predaný merch:</span>
                <strong>{totalMerchCount} kusov</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Odhadovaný príjem:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">{totalMerchRevenue.toFixed(2)}€</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Celková dĺžka setu:</span>
                <strong>{fmtTime(state.setElapsed)}</strong>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPostEvent(false)}>Zrušiť</Button>
            <Button
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true);
                try {
                  const res = await fetch("/api/admin/concert-mode", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      gigId: state.gigId,
                      summary: postSummary,
                      merchSold: totalMerchCount,
                      cashCollected: totalMerchRevenue,
                      notes: postNotes + (state.notes ? `\n\nQuick notes: ${state.notes}` : ""),
                      rating: postRating,
                    }),
                  });
                  if (!res.ok) throw new Error("Uloženie zlyhalo");
                  toast.success("Koncert ukončený 🎉", {
                    description: "Post-event report bol uložený.",
                  });
                  setShowPostEvent(false);
                  exitGig();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Chyba");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Uložiť & ukončiť
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-48" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}
