"use client";

import { useState, useEffect } from "react";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { ShoppingCart, Star, Package } from "lucide-react";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category: string;
  price: number;
  stock: number;
  sizes: string[];
  colors: string[];
  imageUrl?: string | null;
  bestSeller: boolean;
  orderCount: number;
};

const CATEGORY_EMOJI: Record<string, string> = {
  "t-shirt": "👕",
  "vinyl": "💿",
  "cd": "🎵",
  "poster": "🖼️",
  "sticker": "✨",
  "other": "📦",
};

const CATEGORY_LABEL: Record<string, string> = {
  "t-shirt": "Tričká",
  "vinyl": "Vinyly",
  "cd": "CD",
  "poster": "Plagáty",
  "sticker": "Nálepky",
  "other": "Ostatné",
};

function fmtPrice(n: number): string {
  return `${n.toFixed(2)}€`;
}

export function MerchSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/merch")
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => {
        setProducts(d.items || []);
        setLoading(false);
      })
      .catch(() => {
        setProducts([]);
        setLoading(false);
      });
  }, []);

  const categories = Array.from(new Set(products.map(p => p.category)));
  const filtered = filter === "all" ? products : products.filter(p => p.category === filter);

  if (!loading && products.length === 0) return null;

  return (
    <section id="merch" className="relative scroll-mt-20 border-t border-charcoal bg-ink py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            number="10"
            eyebrow="Merch & Obchod"
            title="Vezmi si kúsok D.O.R.A. domov"
            description="Tričká, vinyly, plagáty a ďalší merch priamo od kapely. Kúp na koncerte alebo objednaj online."
          />
        </Reveal>

        {/* Category filter */}
        {categories.length > 1 && (
          <Reveal delay={100}>
            <div className="mt-8 flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("all")}
                className={cn(
                  "px-4 py-2 text-xs font-mono-brand uppercase tracking-wider transition-all",
                  filter === "all"
                    ? "bg-neon-red text-white"
                    : "border border-charcoal text-silver hover:border-neon-red/40 hover:text-off-white"
                )}
              >
                Všetko ({products.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={cn(
                    "px-4 py-2 text-xs font-mono-brand uppercase tracking-wider transition-all",
                    filter === cat
                      ? "bg-neon-red text-white"
                      : "border border-charcoal text-silver hover:border-neon-red/40 hover:text-off-white"
                  )}
                >
                  {CATEGORY_EMOJI[cat] || "📦"} {CATEGORY_LABEL[cat] || cat}
                </button>
              ))}
            </div>
          </Reveal>
        )}

        {/* Products grid */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading
            ? // Loading skeleton
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-72 animate-pulse border border-charcoal bg-ink/50" />
              ))
            : filtered.map((p, i) => (
                <Reveal key={p.id} delay={i * 50}>
                  <div className="group relative flex h-full flex-col overflow-hidden border border-charcoal bg-dark-gray transition-all hover:border-neon-red/40 clip-corner">
                    {/* Best seller badge */}
                    {p.bestSeller && (
                      <div className="absolute right-3 top-3 z-10 flex items-center gap-1 border border-warm-yellow/40 bg-warm-yellow/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-warm-yellow">
                        <Star className="h-2.5 w-2.5 fill-warm-yellow text-warm-yellow" />
                        Bestseller
                      </div>
                    )}

                    {/* Product image / emoji */}
                    <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-ink to-dark-gray">
                      <div className="absolute inset-0 bg-noise opacity-10" />
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <span className="text-6xl opacity-50 transition-all group-hover:scale-125 group-hover:opacity-80">
                          {CATEGORY_EMOJI[p.category] || "📦"}
                        </span>
                      )}
                    </div>

                    {/* Product info */}
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-sm font-bold leading-tight text-off-white">
                          {p.name}
                        </h3>
                        <span className="shrink-0 font-display text-lg font-black text-neon-red">
                          {fmtPrice(p.price)}
                        </span>
                      </div>

                      {p.description && (
                        <p className="text-xs leading-relaxed text-silver/70 line-clamp-2">
                          {p.description}
                        </p>
                      )}

                      {/* Sizes */}
                      {p.sizes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {p.sizes.slice(0, 5).map(s => (
                            <span
                              key={s}
                              className="border border-charcoal px-1.5 py-0.5 text-[9px] font-mono-brand text-silver"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Stock + sold */}
                      <div className="mt-auto flex items-center justify-between pt-2 border-t border-charcoal">
                        <span className="flex items-center gap-1 text-[10px] text-silver/60">
                          <Package className="h-3 w-3" />
                          {p.stock > 0 ? `${p.stock} ks skladom` : "Vypredané"}
                        </span>
                        {p.orderCount > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-warm-yellow/60">
                            <ShoppingCart className="h-3 w-3" />
                            {p.orderCount}× predané
                          </span>
                        )}
                      </div>

                      {/* CTA */}
                      <a
                        href="#kontakt"
                        className="mt-3 flex items-center justify-center gap-2 border border-charcoal bg-ink px-4 py-2 text-xs font-mono-brand uppercase tracking-wider text-silver transition-all hover:border-neon-red hover:bg-neon-red hover:text-white"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Objednať
                      </a>
                    </div>
                  </div>
                </Reveal>
              ))}
        </div>

        {/* Empty state */}
        {!loading && filtered.length === 0 && products.length > 0 && (
          <div className="mt-10 text-center text-sm text-silver/60">
            Žiadne produkty v tejto kategórii.
          </div>
        )}
      </div>
    </section>
  );
}
