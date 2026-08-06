"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckSquare, Square, Trash2, Plus, Loader2, X, Calendar, Flag, Bot } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Task = { id: string; title: string; description: string | null; dueDate: string | null; priority: string; status: string; gigId: string | null; aiGenerated: boolean; createdAt: string };

const COLUMNS = [
  { id: "todo", label: "Todo", color: "border-silver/40" },
  { id: "in-progress", label: "Prebieha", color: "border-warm-yellow/40" },
  { id: "done", label: "Hotovo", color: "border-green-500/40" },
];

const PRIORITIES: Record<string, string> = { urgent: "text-neon-red", high: "text-warm-yellow", medium: "text-silver", low: "text-silver/50" };

export function TasksTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/tasks").then(r => r.json()).then(d => { setTasks(d.items ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); /* eslint-disable-line react-hooks/set-state-in-effect */ }, [load]);

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    try {
      await fetch(`/api/admin/tasks/${task.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
      setTasks(arr => arr.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch { toast.error("Chyba."); }
  };

  const remove = async (id: string) => {
    try { await fetch(`/api/admin/tasks/${id}`, { method: "DELETE" }); setTasks(arr => arr.filter(t => t.id !== id)); toast.success("Zmazané."); }
    catch { toast.error("Chyba."); }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-off-white/80">{tasks.filter(t => t.status !== "done").length} aktívnych úloh</p>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 bg-neon-red px-4 py-2 text-sm font-bold uppercase text-white"><Plus className="h-4 w-4" /> Pridať</button>
      </div>

      {loading ? <div className="space-y-2">{Array.from({length: 4}).map((_, i) => <div key={i} className="h-16 animate-pulse bg-charcoal" />)}</div> : (
        <div className="grid gap-4 sm:grid-cols-3">
          {COLUMNS.map(col => (
            <div key={col.id} className={cn("border-t-2 bg-dark-gray/50 p-3", col.color)}>
              <p className="mb-3 font-mono-brand text-[10px] uppercase tracking-wider text-silver">{col.label} ({tasks.filter(t => t.status === col.id).length})</p>
              <div className="space-y-2">
                {tasks.filter(t => t.status === col.id).map(t => (
                  <div key={t.id} className="border border-charcoal bg-dark-gray p-3">
                    <div className="flex items-start gap-2">
                      <button onClick={() => toggleStatus(t)} className="mt-0.5 shrink-0">{t.status === "done" ? <CheckSquare className="h-4 w-4 text-green-400" /> : <Square className="h-4 w-4 text-silver" />}</button>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm font-semibold", t.status === "done" ? "text-silver line-through" : "text-off-white")}>{t.title}</p>
                        {t.description && <p className="mt-0.5 text-xs text-off-white/60">{t.description}</p>}
                        <div className="mt-1.5 flex items-center gap-2">
                          {t.dueDate && <span className="flex items-center gap-1 font-mono-brand text-[9px] text-silver"><Calendar className="h-2.5 w-2.5" />{new Date(t.dueDate).toLocaleDateString("sk-SK")}</span>}
                          <span className={cn("flex items-center gap-1 font-mono-brand text-[9px]", PRIORITIES[t.priority] || PRIORITIES.medium)}><Flag className="h-2.5 w-2.5" />{t.priority}</span>
                          {t.aiGenerated && <span className="flex items-center gap-0.5 font-mono-brand text-[9px] text-neon-red"><Bot className="h-2.5 w-2.5" />AI</span>}
                        </div>
                      </div>
                      <button onClick={() => remove(t.id)} className="shrink-0 text-silver hover:text-neon-red"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.status === col.id).length === 0 && <p className="py-4 text-center text-xs text-silver/40">Prázdne</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <TaskForm onClose={() => { setShowForm(false); load(); }} />}
    </div>
  );
}

function TaskForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", priority: "medium" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.title) return;
    setSaving(true);
    try {
      await fetch("/api/admin/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      toast.success("Úloha vytvorená."); onClose();
    } catch { toast.error("Chyba."); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur" onClick={onClose}>
      <div className="w-full max-w-md border border-charcoal bg-dark-gray p-6" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h3 className="font-display text-lg font-bold text-off-white">Nová úloha</h3><button onClick={onClose}><X className="h-5 w-5 text-silver" /></button></div>
        <div className="space-y-3">
          <div><label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Názov *</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" /></div>
          <div><label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Popis</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full resize-y border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Termín</label><input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" /></div>
            <div><label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Priorita</label><select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white"><option value="low">Nízka</option><option value="medium">Stredná</option><option value="high">Vysoká</option><option value="urgent">Urgentná</option></select></div>
          </div>
          <button onClick={save} disabled={saving || !form.title} className="w-full bg-neon-red py-2.5 text-sm font-bold uppercase text-white disabled:opacity-50">{saving ? "Ukladám..." : "Uložiť"}</button>
        </div>
      </div>
    </div>
  );
}
