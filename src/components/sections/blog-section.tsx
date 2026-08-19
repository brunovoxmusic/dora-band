"use client";

import { useState, useEffect, useCallback } from "react";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { Calendar, Clock, Sparkles, ChevronRight, X, ArrowRight, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

type BlogItem = {
  id: string;
  title: string;
  slug: string;
  type: string;
  excerpt?: string | null;
  body?: string | null;
  publishedAt: string | null;
  author?: string | null;
  aiGenerated: boolean;
};

const TYPE_META: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  blog:   { label: "Blog",   color: "text-sky-300",     bg: "bg-sky-500/10 border-sky-500/30",         emoji: "📝" },
  news:   { label: "News",   color: "text-warm-yellow",  bg: "bg-warm-yellow/10 border-warm-yellow/30", emoji: "📰" },
  press:  { label: "Press",  color: "text-neon-red",     bg: "bg-neon-red/10 border-neon-red/30",       emoji: "📢" },
  event:  { label: "Event",  color: "text-emerald-300",  bg: "bg-emerald-500/10 border-emerald-500/30", emoji: "🎤" },
  page:   { label: "Stránka",color: "text-silver",       bg: "bg-charcoal/50 border-charcoal",           emoji: "📄" },
};

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("sk-SK", { day: "numeric", month: "long", year: "numeric" });
}

function fmtRelative(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "dnes";
  if (days === 1) return "včera";
  if (days < 7) return `pred ${days} dňami`;
  if (days < 30) return `pred ${Math.floor(days / 7)} týždňami`;
  return fmtDate(iso);
}

function readingTime(text?: string | null): string {
  if (!text) return "1 min";
  const words = text.split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}

export function BlogSection() {
  const [items, setItems] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BlogItem | null>(null);

  const load = useCallback(() => {
    fetch("/api/blog?limit=7")
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => { setItems(d.items || []); setLoading(false); })
      .catch(() => { setItems([]); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!loading && items.length === 0) return null;

  const featured = items[0];
  const rest = items.slice(1);

  return (
    <>
      <section id="blog" className="relative scroll-mt-20 border-t border-charcoal bg-ink py-20 sm:py-28">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0 bg-noise opacity-20" />
        <div className="pointer-events-none absolute left-0 top-1/2 h-96 w-96 -translate-y-1/2 bg-neon-red/5 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              number="11"
              eyebrow="Blog & Novinky"
              title="Čo je nové u D.O.R.A."
              description="Najnovšie články, novinky, tlačové správy a recenzie koncertov."
            />
          </Reveal>

          {loading ? (
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              <div className="h-96 animate-pulse border border-charcoal bg-dark-gray/50 lg:col-span-2" />
              <div className="h-96 animate-pulse border border-charcoal bg-dark-gray/50" />
            </div>
          ) : (
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {/* Featured article — 2 columns */}
              {featured && (
                <Reveal className="lg:col-span-2">
                  <article
                    onClick={() => setSelected(featured)}
                    className="group relative flex h-full cursor-pointer flex-col overflow-hidden border border-charcoal bg-dark-gray transition-all hover:border-neon-red/40 clip-corner"
                  >
                    {/* Top bar with type + AI badge */}
                    <div className="flex items-center justify-between p-5 pb-0">
                      <span className={cn(
                        "flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-mono-brand uppercase tracking-wider",
                        TYPE_META[featured.type]?.bg || TYPE_META.page.bg
                      )}>
                        <span>{TYPE_META[featured.type]?.emoji || "📄"}</span>
                        <span className={TYPE_META[featured.type]?.color || "text-silver"}>
                          {TYPE_META[featured.type]?.label || "Stránka"}
                        </span>
                      </span>
                      {featured.aiGenerated && (
                        <span className="flex items-center gap-1 text-[9px] text-violet-400/60">
                          <Sparkles className="h-2.5 w-2.5" />
                          AI asist.
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col gap-4 p-5">
                      <h3 className="font-display text-2xl font-black leading-tight text-off-white transition-colors group-hover:text-neon-red sm:text-3xl">
                        {featured.title}
                      </h3>

                      {featured.excerpt && (
                        <p className="text-sm leading-relaxed text-silver/70 line-clamp-3 sm:text-base">
                          {featured.excerpt}
                        </p>
                      )}

                      {/* Meta bar */}
                      <div className="mt-auto flex flex-wrap items-center gap-4 pt-4 border-t border-charcoal">
                        {featured.publishedAt && (
                          <span className="flex items-center gap-1.5 text-xs text-silver/50">
                            <Calendar className="h-3.5 w-3.5" />
                            {fmtDate(featured.publishedAt)}
                            <span className="text-charcoal">·</span>
                            <span className="text-warm-yellow/60">{fmtRelative(featured.publishedAt)}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 text-xs text-silver/50">
                          <Clock className="h-3.5 w-3.5" />
                          {readingTime(featured.body)}
                        </span>
                        {featured.author && (
                          <span className="text-xs text-silver/50">· {featured.author}</span>
                        )}
                      </div>

                      {/* CTA */}
                      <div className="flex items-center gap-1.5 text-sm font-mono-brand uppercase tracking-wider text-neon-red transition-colors group-hover:gap-2.5">
                        Čítať celý článok
                        <ArrowRight className="h-4 w-4 transition-all group-hover:translate-x-1" />
                      </div>
                    </div>

                    {/* Bottom accent */}
                    <span className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-neon-red via-warm-yellow to-transparent transition-transform duration-500 group-hover:scale-x-100" />
                  </article>
                </Reveal>
              )}

              {/* Side articles — 1 column, stacked */}
              <div className="flex flex-col gap-4">
                {rest.slice(0, 3).map((item, i) => {
                  const meta = TYPE_META[item.type] || TYPE_META.page;
                  return (
                    <Reveal key={item.id} delay={i * 80}>
                      <article
                        onClick={() => setSelected(item)}
                        className="group flex h-full cursor-pointer items-start gap-4 border border-charcoal bg-dark-gray/50 p-4 transition-all hover:border-neon-red/30 hover:bg-dark-gray clip-corner"
                      >
                        {/* Emoji */}
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-charcoal bg-ink text-lg">
                          {meta.emoji}
                        </span>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className={cn("text-[9px] font-mono-brand uppercase tracking-wider", meta.color)}>
                              {meta.label}
                            </span>
                            {item.aiGenerated && (
                              <span className="flex items-center gap-0.5 text-[8px] text-violet-400/50">
                                <Sparkles className="h-2 w-2" />
                              </span>
                            )}
                          </div>
                          <h4 className="font-display text-sm font-bold leading-tight text-off-white transition-colors group-hover:text-neon-red line-clamp-2">
                            {item.title}
                          </h4>
                          {item.excerpt && (
                            <p className="mt-1 text-xs leading-relaxed text-silver/60 line-clamp-2">
                              {item.excerpt}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-2 text-[10px] text-silver/40">
                            {item.publishedAt && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-2.5 w-2.5" />
                                {fmtRelative(item.publishedAt)}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              {readingTime(item.body)}
                            </span>
                          </div>
                        </div>

                        <ChevronRight className="h-4 w-4 shrink-0 text-silver/30 transition-all group-hover:translate-x-0.5 group-hover:text-neon-red" />
                      </article>
                    </Reveal>
                  );
                })}

                {/* View all link */}
                {items.length > 4 && (
                  <Reveal delay={300}>
                    <button
                      onClick={() => setSelected(items[3])}
                      className="flex w-full items-center justify-center gap-2 border border-charcoal bg-dark-gray/30 py-3 text-xs font-mono-brand uppercase tracking-wider text-silver transition-all hover:border-neon-red/30 hover:text-neon-red"
                    >
                      <Newspaper className="h-3.5 w-3.5" />
                      Zobraziť ďalšie články
                    </button>
                  </Reveal>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Article modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/80 p-4 backdrop-blur-md"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto border border-charcoal bg-dark-gray clip-corner"
          >
            {/* Close button */}
            <button
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center border border-charcoal bg-ink/80 text-silver transition-colors hover:border-neon-red hover:text-neon-red"
              aria-label="Zavrieť"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-mono-brand uppercase tracking-wider",
                  TYPE_META[selected.type]?.bg || TYPE_META.page.bg
                )}>
                  <span>{TYPE_META[selected.type]?.emoji || "📄"}</span>
                  <span className={TYPE_META[selected.type]?.color || "text-silver"}>
                    {TYPE_META[selected.type]?.label || "Stránka"}
                  </span>
                </span>
                {selected.aiGenerated && (
                  <span className="flex items-center gap-1 text-[9px] text-violet-400/60">
                    <Sparkles className="h-2.5 w-2.5" />
                    AI asistované
                  </span>
                )}
              </div>

              <h2 className="mt-4 font-display text-2xl font-black leading-tight text-off-white sm:text-3xl">
                {selected.title}
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-silver/50">
                {selected.publishedAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {fmtDate(selected.publishedAt)}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {readingTime(selected.body)}
                </span>
                {selected.author && (
                  <span>· {selected.author}</span>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="border-t border-charcoal px-6 py-6 sm:px-8">
              {selected.excerpt && (
                <p className="mb-4 text-base font-medium leading-relaxed text-warm-yellow/80">
                  {selected.excerpt}
                </p>
              )}
              {selected.body && (
                <div className="space-y-4 text-sm leading-relaxed text-off-white/80 sm:text-base">
                  {selected.body.split("\n").filter(Boolean).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-charcoal px-6 py-4 sm:px-8">
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-2 text-xs font-mono-brand uppercase tracking-wider text-silver transition-colors hover:text-neon-red"
              >
                <X className="h-3 w-3" />
                Zavrieť článok
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
