"use client";

import { useState, useEffect } from "react";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { Calendar, Clock, Tag, Sparkles, ChevronRight } from "lucide-react";
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

const TYPE_META: Record<string, { label: string; color: string; emoji: string }> = {
  blog: { label: "Blog", color: "text-sky-400 border-sky-500/30 bg-sky-950/20", emoji: "📝" },
  news: { label: "News", color: "text-warm-yellow border-warm-yellow/30 bg-warm-yellow/5", emoji: "📰" },
  press: { label: "Press", color: "text-neon-red border-neon-red/30 bg-neon-red/5", emoji: "📢" },
  event: { label: "Event", color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/20", emoji: "🎤" },
  page: { label: "Stránka", color: "text-silver border-charcoal", emoji: "📄" },
};

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("sk-SK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function readingTime(text?: string | null): string {
  if (!text) return "1 min";
  const words = text.split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}

export function BlogSection() {
  const [items, setItems] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/blog?limit=6")
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => {
        setItems(d.items || []);
        setLoading(false);
      })
      .catch(() => {
        setItems([]);
        setLoading(false);
      });
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <section id="blog" className="relative scroll-mt-20 border-t border-charcoal bg-dark-gray py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            number="08"
            eyebrow="Blog & Novinky"
            title="Čo je nové u D.O.R.A."
            description="Najnovšie články, novinky, tlačové správy a recenzie koncertov."
          />
        </Reveal>

        {loading ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse border border-charcoal bg-ink/50" />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => {
              const meta = TYPE_META[item.type] || TYPE_META.page;
              const isExpanded = expanded === item.id;
              return (
                <Reveal key={item.id} delay={i * 80}>
                  <article
                    className={cn(
                      "group relative flex h-full flex-col overflow-hidden border border-charcoal bg-ink/50 transition-all hover:border-neon-red/30 clip-corner",
                      isExpanded && "lg:col-span-2"
                    )}
                  >
                    {/* Type badge */}
                    <div className="flex items-center justify-between p-4 pb-0">
                      <span
                        className={cn(
                          "flex items-center gap-1.5 border px-2 py-1 text-[10px] font-mono-brand uppercase tracking-wider",
                          meta.color
                        )}
                      >
                        <span>{meta.emoji}</span>
                        {meta.label}
                      </span>
                      {item.aiGenerated && (
                        <span className="flex items-center gap-1 text-[9px] text-violet-400/60">
                          <Sparkles className="h-2.5 w-2.5" />
                          AI asist.
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <h3 className="font-display text-lg font-bold leading-tight text-off-white transition-colors group-hover:text-neon-red">
                        {item.title}
                      </h3>

                      {item.excerpt && (
                        <p className="text-sm leading-relaxed text-silver/70 line-clamp-3">
                          {item.excerpt}
                        </p>
                      )}

                      {isExpanded && item.body && (
                        <div className="mt-2 text-sm leading-relaxed text-off-white/80">
                          {item.body}
                        </div>
                      )}

                      {/* Meta */}
                      <div className="mt-auto flex items-center gap-3 pt-3 border-t border-charcoal">
                        {item.publishedAt && (
                          <span className="flex items-center gap-1 text-[10px] text-silver/50">
                            <Calendar className="h-3 w-3" />
                            {fmtDate(item.publishedAt)}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] text-silver/50">
                          <Clock className="h-3 w-3" />
                          {readingTime(item.body)}
                        </span>
                        {item.author && (
                          <span className="text-[10px] text-silver/50">· {item.author}</span>
                        )}
                      </div>

                      {/* Expand/Collapse */}
                      <button
                        onClick={() => setExpanded(isExpanded ? null : item.id)}
                        className="mt-2 flex items-center gap-1 text-xs font-mono-brand uppercase tracking-wider text-neon-red/70 transition-colors hover:text-neon-red"
                      >
                        {isExpanded ? "Zavrieť" : "Čítať viac"}
                        <ChevronRight className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-90")} />
                      </button>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
