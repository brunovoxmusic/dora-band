"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Camera, ZoomIn } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { cn } from "@/lib/utils";

type MediaItem = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  category: string;
  caption: string | null;
  credits: string;
};

const TABS = [
  { value: "concert", label: "Koncertné fotografie", short: "Koncert" },
  { value: "portrait", label: "Portrétne / Zákulisné", short: "Portrét" },
] as const;

export function GallerySection() {
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("concert");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/media?category=${tab}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setItems(d.items ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const close = useCallback(() => setLightbox(null), []);
  const next = useCallback(
    () => setLightbox((i) => (i === null ? i : (i + 1) % items.length)),
    [items.length]
  );
  const prev = useCallback(
    () => setLightbox((i) => (i === null ? i : (i - 1 + items.length) % items.length)),
    [items.length]
  );

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, close, next, prev]);

  return (
    <section id="galeria" className="relative scroll-mt-20 border-t border-charcoal bg-ink py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          number="03"
          eyebrow="Fotoportfólio"
          title="Koncertné a portrétne fotografie"
          description="Všetky fotografie sú k dispozícii pre mediálnych partnerov, organizátorov a novinárov. Foto: archív D.O.R.A."
        />

        {/* Tabs */}
        <div className="mt-8 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "border px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-all",
                tab === t.value
                  ? "border-neon-red bg-neon-red text-white glow-red-sm"
                  : "border-charcoal bg-dark-gray text-off-white/70 hover:border-off-white/40 hover:text-off-white"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse bg-charcoal" />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setLightbox(i)}
                className="group relative aspect-square overflow-hidden border border-charcoal bg-dark-gray focus:outline-none focus:ring-2 focus:ring-neon-red"
                aria-label={`Otvoriť fotografiu: ${item.title}`}
              >
                <Image
                  src={item.thumbnailUrl || item.url}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="flex items-center gap-1.5 font-mono-brand text-[10px] uppercase tracking-wider text-off-white/90">
                    <Camera className="h-3 w-3 text-neon-red" />
                    {item.credits}
                  </span>
                  <ZoomIn className="h-4 w-4 text-neon-red" />
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <p className="mt-8 text-sm text-silver">Žiadne fotografie v tejto kategórii.</p>
        )}
      </div>

      {/* Lightbox */}
      {lightbox !== null && items[lightbox] && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 p-4 backdrop-blur"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Náhľad fotografie"
        >
          <button
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center border border-charcoal text-off-white transition-colors hover:border-neon-red hover:text-neon-red"
            onClick={close}
            aria-label="Zavrieť"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            className="absolute left-4 inline-flex h-10 w-10 items-center justify-center border border-charcoal text-off-white transition-colors hover:border-neon-red hover:text-neon-red"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Predchádzajúca"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            className="absolute right-4 inline-flex h-10 w-10 items-center justify-center border border-charcoal text-off-white transition-colors hover:border-neon-red hover:text-neon-red"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Ďalšia"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <figure
            className="relative max-h-[85vh] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={items[lightbox].url}
              alt={items[lightbox].title}
              className="max-h-[78vh] w-auto border border-charcoal object-contain"
            />
            <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-off-white/80">{items[lightbox].caption || items[lightbox].title}</span>
              <span className="font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">
                {items[lightbox].credits} · {lightbox + 1} / {items.length}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
