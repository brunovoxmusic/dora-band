"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Download, Trash2, Mail, Loader2, Users, Search, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Subscriber = {
  id: string;
  email: string;
  active: boolean;
  source: string;
  createdAt: string;
};

export function SubscribersTab({ onChange }: { onChange: (n: number) => void }) {
  const [items, setItems] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/subscribers")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items ?? []);
        onChangeRef.current?.(d.items?.length ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (id: string, active: boolean) => {
    try {
      const res = await fetch(`/api/admin/subscribers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      if (!res.ok) throw new Error("Aktualizácia zlyhala.");
      setItems((arr) => arr.map((i) => (i.id === id ? { ...i, active: !active } : i)));
      toast.success(active ? "Odberateľ deaktivovaný." : "Odberateľ aktivovaný.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba.");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Naozaj zmazať tohto odberateľa?")) return;
    try {
      const res = await fetch(`/api/admin/subscribers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Zmazanie zlyhalo.");
      setItems((arr) => arr.filter((i) => i.id !== id));
      onChangeRef.current?.(items.length - 1);
      toast.success("Odberateľ zmazaný.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba.");
    }
  };

  const exportCsv = () => {
    const rows = [
      ["email", "active", "source", "createdAt"],
      ...items.map((i) => [i.email, String(i.active), i.source, new Date(i.createdAt).toISOString()]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dora-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exportovaných ${items.length} odberateľov.`);
  };

  const filtered = items.filter((i) => {
    if (filter === "active" && !i.active) return false;
    if (filter === "inactive" && i.active) return false;
    if (!search) return true;
    return i.email.toLowerCase().includes(search.toLowerCase());
  });

  const activeCount = items.filter((i) => i.active).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hľadať e-mail..."
              className="border border-charcoal bg-dark-gray py-2 pl-10 pr-3 text-sm text-off-white outline-none focus:border-neon-red w-48 sm:w-64"
            />
          </div>
          <div className="flex items-center gap-1">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  filter === f
                    ? "border-neon-red bg-neon-red/10 text-neon-red"
                    : "border-charcoal text-silver hover:text-off-white"
                )}
              >
                {f === "all" ? "Všetci" : f === "active" ? "Aktívni" : "Neaktívni"}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={exportCsv}
          disabled={items.length === 0}
          className="inline-flex items-center gap-2 border border-warm-yellow/40 bg-warm-yellow/10 px-4 py-2 text-sm font-bold uppercase tracking-wide text-warm-yellow transition-all hover:bg-warm-yellow hover:text-ink disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Summary bar */}
      <div className="mb-4 flex items-center gap-4 border border-charcoal bg-dark-gray px-4 py-3 text-xs">
        <span className="flex items-center gap-1.5 text-off-white/80">
          <Users className="h-4 w-4 text-neon-red" />
          Celkom: <span className="font-mono-brand font-bold text-off-white">{items.length}</span>
        </span>
        <span className="text-silver">·</span>
        <span className="text-off-white/80">
          Aktívni: <span className="font-mono-brand font-bold text-green-400">{activeCount}</span>
        </span>
        <span className="text-silver">·</span>
        <span className="text-off-white/80">
          Neaktívni: <span className="font-mono-brand font-bold text-silver">{items.length - activeCount}</span>
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse bg-charcoal" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-charcoal bg-dark-gray/50 py-16 text-center">
          <Mail className="h-10 w-10 text-silver/40" />
          <p className="mt-3 text-sm text-silver">Žiadni odberatelia noviniek.</p>
        </div>
      ) : (
        <div className="max-h-[60vh] space-y-2 overflow-y-auto scroll-dora pr-1">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 border border-charcoal bg-dark-gray p-3 transition-colors hover:border-off-white/20"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-charcoal bg-ink">
                <Mail className={cn("h-4 w-4", s.active ? "text-neon-red" : "text-silver/40")} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-off-white">{s.email}</p>
                <p className="font-mono-brand text-[10px] uppercase tracking-wider text-silver">
                  {new Date(s.createdAt).toLocaleDateString("sk-SK")} · {s.source}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 border px-2 py-0.5 font-mono-brand text-[9px] uppercase tracking-wider",
                  s.active
                    ? "border-green-500/40 bg-green-500/10 text-green-400"
                    : "border-silver/40 bg-silver/10 text-silver"
                )}
              >
                {s.active ? "Aktívny" : "Neaktívny"}
              </span>
              <button
                onClick={() => toggle(s.id, s.active)}
                className="inline-flex h-8 w-8 items-center justify-center border border-charcoal text-silver transition-colors hover:border-warm-yellow hover:text-warm-yellow"
                aria-label={s.active ? "Deaktivovať" : "Aktivovať"}
                title={s.active ? "Deaktivovať" : "Aktivovať"}
              >
                {s.active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => remove(s.id)}
                className="inline-flex h-8 w-8 items-center justify-center border border-charcoal text-silver transition-colors hover:border-neon-red hover:text-neon-red"
                aria-label="Zmazať"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
