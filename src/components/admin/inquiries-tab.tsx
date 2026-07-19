"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Mail,
  Phone,
  Calendar,
  MapPin,
  Trash2,
  Loader2,
  Inbox,
  Search,
  Filter,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { INQUIRY_STATUSES } from "@/lib/band-data";

type Inquiry = {
  id: string;
  organizer: string;
  email: string;
  phone: string;
  eventDate: string;
  eventLocation: string;
  eventType: string;
  message: string;
  status: string;
  createdAt: string;
};

const statusStyle: Record<string, string> = {
  new: "border-neon-red bg-neon-red/10 text-neon-red",
  reviewed: "border-warm-yellow bg-warm-yellow/10 text-warm-yellow",
  confirmed: "border-green-500 bg-green-500/10 text-green-400",
  archived: "border-silver bg-silver/10 text-silver",
};

const statusLabel: Record<string, string> = {
  new: "Nová",
  reviewed: "Spracovaná",
  confirmed: "Potvrdená",
  archived: "Archivovaná",
};

export function InquiriesTab({ onChange }: { onChange: (n: number) => void }) {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Inquiry | null>(null);

  // Keep onChange in a ref so it doesn't trigger re-fetches when parent re-renders.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/inquiries?status=${filter}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? []);
        // Only update the parent total-count badge when viewing all inquiries,
        // so the badge always reflects the true total (not a filtered subset).
        if (filter === "all") {
          onChangeRef.current?.(d.items?.length ?? 0);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Aktualizácia zlyhala.");
      setItems((arr) => arr.map((i) => (i.id === id ? { ...i, status } : i)));
      setSelected((s) => (s && s.id === id ? { ...s, status } : s));
      toast.success(`Status zmenený na: ${statusLabel[status]}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba.");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Naozaj zmazať tento dopyt?")) return;
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Zmazanie zlyhalo.");
      setItems((arr) => arr.filter((i) => i.id !== id));
      setSelected(null);
      onChangeRef.current?.(items.length - 1);
      toast.success("Dopyt zmazaný.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba.");
    }
  };

  const filtered = items.filter((i) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      i.organizer.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q) ||
      i.eventLocation.toLowerCase().includes(q) ||
      i.eventType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* List */}
      <div className="lg:col-span-3">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hľadať dopyt..."
              className="w-full border border-charcoal bg-dark-gray py-2 pl-10 pr-3 text-sm text-off-white outline-none focus:border-neon-red"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-silver" />
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                filter === "all" ? "border-neon-red bg-neon-red/10 text-neon-red" : "border-charcoal text-silver hover:text-off-white"
              )}
            >
              Všetko
            </button>
            {INQUIRY_STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => setFilter(s.value)}
                className={cn(
                  "border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  filter === s.value ? "border-neon-red bg-neon-red/10 text-neon-red" : "border-charcoal text-silver hover:text-off-white"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse bg-charcoal" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-charcoal bg-dark-gray/50 py-16 text-center">
            <Inbox className="h-10 w-10 text-silver/40" />
            <p className="mt-3 text-sm text-silver">Žiadne dopyty v tejto kategórii.</p>
          </div>
        ) : (
          <div className="max-h-[70vh] space-y-2 overflow-y-auto scroll-dora pr-1">
            {filtered.map((i) => {
              const isActive = selected?.id === i.id;
              return (
                <button
                  key={i.id}
                  onClick={() => setSelected(i)}
                  className={cn(
                    "block w-full border bg-dark-gray p-4 text-left transition-all",
                    isActive ? "border-neon-red bg-charcoal/40" : "border-charcoal hover:border-off-white/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "border px-1.5 py-0.5 font-mono-brand text-[9px] uppercase tracking-wider",
                            statusStyle[i.status]
                          )}
                        >
                          {statusLabel[i.status]}
                        </span>
                        <span className="font-mono-brand text-[9px] uppercase tracking-wider text-silver">
                          {i.eventType}
                        </span>
                      </div>
                      <p className="mt-1.5 truncate font-semibold text-off-white">{i.organizer}</p>
                      <p className="mt-0.5 truncate text-xs text-off-white/60">{i.eventDate} · {i.eventLocation}</p>
                    </div>
                    <span className="shrink-0 font-mono-brand text-[9px] text-silver">
                      {new Date(i.createdAt).toLocaleDateString("sk-SK")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail */}
      <div className="lg:col-span-2">
        {selected ? (
          <div className="sticky top-24 border border-charcoal bg-dark-gray p-5 clip-corner">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-lg font-bold text-off-white">{selected.organizer}</h3>
              <button
                onClick={() => remove(selected.id)}
                className="inline-flex h-8 w-8 items-center justify-center border border-charcoal text-silver transition-colors hover:border-neon-red hover:text-neon-red"
                aria-label="Zmazať"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <DetailRow icon={Mail} label="E-mail" value={selected.email} href={`mailto:${selected.email}`} />
              <DetailRow icon={Phone} label="Telefón" value={selected.phone} href={`tel:${selected.phone}`} />
              <DetailRow icon={Calendar} label="Dátum" value={selected.eventDate} />
              <DetailRow icon={MapPin} label="Miesto" value={selected.eventLocation} />
              <DetailRow icon={Tag} label="Typ podujatia" value={selected.eventType} />
            </div>

            {selected.message && (
              <div className="mt-4 border-t border-charcoal pt-4">
                <p className="font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">Správa</p>
                <p className="mt-2 max-h-40 overflow-y-auto scroll-dora text-sm text-off-white/80">
                  {selected.message}
                </p>
              </div>
            )}

            <div className="mt-5 border-t border-charcoal pt-4">
              <p className="mb-2 font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">
                Zmeniť status
              </p>
              <div className="flex flex-wrap gap-1.5">
                {INQUIRY_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => updateStatus(selected.id, s.value)}
                    className={cn(
                      "border px-2.5 py-1.5 text-xs font-semibold transition-all",
                      selected.status === s.value
                        ? statusStyle[s.value]
                        : "border-charcoal text-silver hover:text-off-white"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-4 font-mono-brand text-[9px] uppercase tracking-wider text-silver/60">
              Prijaté: {new Date(selected.createdAt).toLocaleString("sk-SK")}
            </p>
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center border border-dashed border-charcoal bg-dark-gray/50 text-center">
            <Mail className="h-8 w-8 text-silver/40" />
            <p className="mt-3 text-sm text-silver">Vyberte dopyt pre detail.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <Icon className="h-3.5 w-3.5 text-warm-yellow" />
      <span className="font-mono-brand text-[10px] uppercase tracking-wider text-silver">{label}</span>
      <span className="ml-auto text-right text-off-white/90">{value}</span>
    </>
  );
  if (href) {
    return (
      <a href={href} className="flex items-center gap-2 hover:text-neon-red">
        {content}
      </a>
    );
  }
  return <div className="flex items-center gap-2">{content}</div>;
}
