"use client";

import { useState, useMemo } from "react";
import { ChevronDown, HelpCircle, Tag } from "lucide-react";
import { FAQS } from "@/lib/band-data";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "all", label: "Všetko" },
  { value: "booking", label: "Booking" },
  { value: "technical", label: "Technika" },
  { value: "general", label: "Všeobecné" },
] as const;

const catColor: Record<string, string> = {
  booking: "text-neon-red border-neon-red/40",
  technical: "text-warm-yellow border-warm-yellow/40",
  general: "text-silver border-silver/40",
};

const catLabel: Record<string, string> = {
  booking: "Booking",
  technical: "Technika",
  general: "Všeobecné",
};

export function FaqSection() {
  const [active, setActive] = useState<string>("all");
  const [open, setOpen] = useState<number | null>(0);

  const filtered = useMemo(
    () => (active === "all" ? FAQS : FAQS.filter((f) => f.category === active)),
    [active]
  );

  return (
    <section
      id="faq"
      className="relative scroll-mt-20 border-t border-charcoal bg-dark-gray py-20 sm:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-40" />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            number="07"
            eyebrow="Časté otázky"
            title="FAQ pre organizátorov a fanúšikov"
            description="Odpovede na najčastejšie otázky o bookingu, technických požiadavkách a kapele. Nenašli ste odpoveď? Napíšte nám."
            align="center"
          />
        </Reveal>

        {/* Category filter */}
        <Reveal delay={100}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => {
                  setActive(c.value);
                  setOpen(null);
                }}
                className={cn(
                  "border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all",
                  active === c.value
                    ? "border-neon-red bg-neon-red text-white"
                    : "border-charcoal bg-ink text-silver hover:border-off-white/40 hover:text-off-white"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Accordion list */}
        <div className="mt-8 space-y-2">
          {filtered.map((faq, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={faq.q} delay={i * 60} direction="up">
                <div
                  className={cn(
                    "border bg-ink transition-colors",
                    isOpen ? "border-neon-red/50" : "border-charcoal hover:border-off-white/20"
                  )}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center gap-4 px-4 py-4 text-left sm:px-5"
                    aria-expanded={isOpen}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center border transition-colors",
                        isOpen
                          ? "border-neon-red bg-neon-red text-white"
                          : "border-charcoal text-silver"
                      )}
                    >
                      <HelpCircle className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 border px-1.5 py-0.5 font-mono-brand text-[9px] uppercase tracking-wider",
                            catColor[faq.category]
                          )}
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {catLabel[faq.category]}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "mt-1.5 font-display text-base font-bold transition-colors sm:text-lg",
                          isOpen ? "text-neon-red" : "text-off-white"
                        )}
                      >
                        {faq.q}
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-silver transition-transform duration-300",
                        isOpen && "rotate-180 text-neon-red"
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-all duration-300 ease-out",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="border-t border-charcoal px-4 py-4 pl-[4.5rem] text-sm leading-relaxed text-off-white/75 sm:px-5 sm:pl-[5.5rem]">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* CTA */}
        <Reveal delay={200}>
          <div className="mt-10 flex flex-col items-center gap-3 border border-dashed border-charcoal bg-ink/60 p-6 text-center">
            <p className="text-sm text-off-white/70">
              Nenašli ste odpoveď na vašu otázku?
            </p>
            <a
              href="#kontakt"
              className="inline-flex items-center gap-2 bg-neon-red px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white clip-corner glow-red-sm transition-all hover:bg-deep-red hover:glow-red"
            >
              Kontaktovať kapelu
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
