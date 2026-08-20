"use client";

/**
 * MediaPickerDialog — reusing modal pre výber média z celej galérie.
 *
 * FUNKCIE:
 * - Načíta všetky media items z `/api/admin/media?fileType=image`
 * - Grid 2-5 stĺpcov responsive s náhľadmi (thumbnailUrl fallback na url)
 * - Filter podľa kategórie (všetky / concert / portrait / press / iné)
 * - Vyhľadávanie v title a altText
 * - Sort: featured prvé, potom podľa order
 * - Hover preview s title + kategóriou + rozmermi
 * - Klik = vyberie URL a zatvorí modal
 * - Tlačidlo "Žiadna fotka" pre vymazanie výberu
 * - Tlačidlo "Otvoriť správcu médií" ako fallback ak je galéria prázdna
 *
 * POUŽITIE:
 *   const [pickerOpen, setPickerOpen] = useState(false);
 *   <MediaPickerDialog
 *     open={pickerOpen}
 *     onOpenChange={setPickerOpen}
 *     currentUrl={photo}
 *     onSelect={(url) => setPhoto(url)}
 *   />
 */

import { useEffect, useState, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/admin/empty-state";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search, ImageOff, Check, X, Star, RefreshCw,
  ImageIcon, AlertCircle,
} from "lucide-react";

export type MediaItem = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string | null;
  category: string;
  caption?: string | null;
  altText?: string | null;
  credits?: string | null;
  featured?: boolean;
  order?: number;
  fileType?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Aktuálne vybraná URL (pre highlight v gride) */
  currentUrl?: string | null;
  /** Callback s vybranou URL po kliku na obrázok */
  onSelect: (url: string) => void;
  /** Voliteľný filter — ak je "image", zobrazí len obrázky (default) */
  fileTypeFilter?: string;
  /** Voliteľný titulok modalu */
  title?: string;
  /** Voliteľný popis */
  description?: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  concert: "Koncertné",
  portrait: "Portréty",
  press: "PR materiály",
  logo: "Logá",
  stageplan: "Stage plany",
  document: "Dokumenty",
  other: "Iné",
};

const CATEGORY_COLORS: Record<string, string> = {
  concert: "text-neon-red border-neon-red/40 bg-neon-red/10",
  portrait: "text-warm-yellow border-warm-yellow/40 bg-warm-yellow/10",
  press: "text-sky-400 border-sky-400/40 bg-sky-400/10",
  logo: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
  stageplan: "text-purple-400 border-purple-400/40 bg-purple-400/10",
  document: "text-orange-400 border-orange-400/40 bg-orange-400/10",
  other: "text-silver border-charcoal bg-charcoal/40",
};

export function MediaPickerDialog({
  open,
  onOpenChange,
  currentUrl,
  onSelect,
  fileTypeFilter = "image",
  title = "Vybrať fotografiu z galérie",
  description = "Klikni na obrázok pre výber. Zobrazené sú všetky médiá z fotoportfólia.",
}: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = fileTypeFilter
        ? `/api/admin/media?fileType=${encodeURIComponent(fileTypeFilter)}`
        : "/api/admin/media";
      const res = await fetch(url);
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "Načítanie zlyhalo");
        setItems([]);
      } else {
        // Filter iba na obrázky — bez ohľadu na to čo vráti API (pre istotu)
        const imgs = (d.items || []).filter(
          (i: MediaItem) => !i.fileType || i.fileType === "image"
        );
        setItems(imgs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Neznáma chyba");
    } finally {
      setLoading(false);
    }
  }, [fileTypeFilter]);

  useEffect(() => {
    if (open) {
      void load();
      setSearch("");
      setCategory("all");
    }
  }, [open, load]);

  // Dostupné kategórie z načítaných dát
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) set.add(it.category);
    return Array.from(set).sort();
  }, [items]);

  // Filter + sort
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items;
    if (category !== "all") list = list.filter(i => i.category === category);
    if (q) {
      list = list.filter(i =>
        (i.title || "").toLowerCase().includes(q) ||
        (i.altText || "").toLowerCase().includes(q) ||
        (i.caption || "").toLowerCase().includes(q)
      );
    }
    // Featured prvé, potom podľa order, potom podľa createdAt (id ako proxy)
    return [...list].sort((a, b) => {
      if (!!b.featured !== !!a.featured) return b.featured ? 1 : -1;
      const ao = a.order ?? 0;
      const bo = b.order ?? 0;
      if (ao !== bo) return ao - bo;
      return a.id.localeCompare(b.id);
    });
  }, [items, search, category]);

  const handleSelect = (url: string) => {
    onSelect(url);
    toast.success("Fotka vybraná", { description: url });
    onOpenChange(false);
  };

  const handleClear = () => {
    onSelect("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-neon-red" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 border-b border-charcoal pb-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Hľadať podľa názvu, alt textu alebo popisu…"
              className="pl-8 h-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-off-white"
                aria-label="Vyčistiť vyhľadávanie"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category filter */}
          {availableCategories.length > 1 && (
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setCategory("all")}
                className={cn(
                  "px-2.5 h-9 text-xs font-medium border transition-all rounded-sm",
                  category === "all"
                    ? "bg-neon-red/10 text-neon-red border-neon-red"
                    : "border-charcoal text-muted-foreground hover:text-off-white hover:border-charcoal/80"
                )}
              >
                Všetky ({items.length})
              </button>
              {availableCategories.map(cat => {
                const count = items.filter(i => i.category === cat).length;
                const label = CATEGORY_LABELS[cat] || cat;
                const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.other;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "px-2.5 h-9 text-xs font-medium border transition-all rounded-sm",
                      category === cat ? colors : "border-charcoal text-muted-foreground hover:text-off-white"
                    )}
                  >
                    {label} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
            className="h-9"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>

        {/* Items count */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {loading
              ? "Načítavam…"
              : filtered.length === 0
                ? "Žiadne médiá"
                : `${filtered.length} ${filtered.length === 1 ? "položka" : filtered.length < 5 ? "položky" : "položiek"}`}
            {currentUrl && " · aktuálne vybraná je zvýraznená"}
          </span>
          {currentUrl && (
            <span className="font-mono text-[10px] truncate max-w-[300px]" title={currentUrl}>
              {currentUrl}
            </span>
          )}
        </div>

        {/* Grid */}
        <ScrollArea className="flex-1 -mx-1 px-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 py-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="py-8">
              <EmptyState
                title="Nepodarilo sa načítať galériu"
                description={error}
                icon={AlertCircle}
              />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8">
              <EmptyState
                title={search || category !== "all" ? "Žiadne výsledky" : "Galéria je prázdna"}
                description={
                  search || category !== "all"
                    ? "Skús zmeniť filter alebo vyhľadávanie."
                    : "Pridaj obrázky v sekcii Médiá najprv."
                }
                icon={ImageOff}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 py-2">
              {filtered.map(item => {
                const isSelected = currentUrl === item.url;
                const thumb = item.thumbnailUrl || item.url;
                const catLabel = CATEGORY_LABELS[item.category] || item.category;
                const catColors = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.url)}
                    className={cn(
                      "group relative aspect-square overflow-hidden border-2 transition-all rounded-sm",
                      isSelected
                        ? "border-neon-red ring-2 ring-neon-red/40"
                        : "border-charcoal hover:border-neon-red/60"
                    )}
                    title={item.title || item.altText || item.url}
                  >
                    <img
                      src={thumb}
                      alt={item.altText || item.title || ""}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Selected overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-neon-red/30 flex items-center justify-center">
                        <div className="bg-neon-red text-white rounded-full p-1.5">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    )}
                    {/* Featured star */}
                    {item.featured && (
                      <div className="absolute top-1 right-1 bg-warm-yellow text-ink rounded-full p-0.5">
                        <Star className="h-3 w-3 fill-current" />
                      </div>
                    )}
                    {/* Hover info overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] font-semibold text-off-white line-clamp-1">{item.title}</p>
                      <Badge variant="outline" className={cn("mt-1 h-4 text-[8px] px-1 py-0", catColors)}>
                        {catLabel}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="border-t border-charcoal pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentUrl ? (
              <div className="flex items-center gap-2">
                <img
                  src={currentUrl}
                  alt=""
                  className="h-10 w-10 object-cover border border-charcoal rounded-sm"
                />
                <span className="text-xs text-muted-foreground">
                  Aktuálna: <span className="font-mono">{currentUrl.split("/").pop()}</span>
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Žiadna fotka vybraná</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentUrl && (
              <Button variant="outline" size="sm" onClick={handleClear}>
                <ImageOff className="h-4 w-4" />
                Odstrániť fotku
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Zrušiť
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
