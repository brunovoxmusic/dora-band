"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Images, Star, Upload, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type MediaItem = {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string | null;
  category: string;
  caption: string | null;
  credits: string;
  featured: boolean;
  order: number;
};

const CATEGORIES = [
  { value: "concert", label: "Koncert" },
  { value: "portrait", label: "Portrét" },
  { value: "backstage", label: "Zákulisie" },
  { value: "promo", label: "Promo" },
];

const emptyForm = {
  title: "",
  url: "",
  thumbnailUrl: "",
  category: "concert",
  caption: "",
  credits: "Foto: archív D.O.R.A.",
  featured: false,
};

export function MediaTab({ onChange }: { onChange: (n: number) => void }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/media")
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

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", file.name.replace(/\.[^.]+$/, ""));
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Nahrávanie zlyhalo.");
      toast.success("Obrázok nahratý a pridaný do galérie.");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba pri nahrávaní.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openEdit = (m: MediaItem) => {
    setEditing(m);
    setForm({
      title: m.title,
      url: m.url,
      thumbnailUrl: m.thumbnailUrl || "",
      category: m.category,
      caption: m.caption || "",
      credits: m.credits,
      featured: m.featured,
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/admin/media/${editing.id}` : "/api/admin/media";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Uloženie zlyhalo.");
      }
      toast.success(editing ? "Médium upravené." : "Médium pridané.");
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Naozaj zmazať toto médium?")) return;
    try {
      const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Zmazanie zlyhalo.");
      toast.success("Médium zmazané.");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chyba.");
    }
  };

  const filtered = filter === "all" ? items : items.filter((i) => i.category === filter);
  const catLabel = (c: string) => CATEGORIES.find((x) => x.value === c)?.label || c;

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = filtered.findIndex((i) => i.id === active.id);
    const newIndex = filtered.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(filtered, oldIndex, newIndex);
    // Optimistic local update
    setItems((prev) => {
      const map = new Map(prev.map((i) => [i.id, i]));
      const result: MediaItem[] = [];
      const seen = new Set<string>();
      reordered.forEach((m, idx) => {
        if (map.has(m.id)) {
          result.push({ ...map.get(m.id)!, order: idx + 1 });
          seen.add(m.id);
        }
      });
      prev.forEach((m) => {
        if (!seen.has(m.id)) result.push(m);
      });
      return result;
    });

    // Persist new order
    try {
      const payload = reordered.map((m, idx) => ({ id: m.id, order: idx + 1 }));
      await fetch("/api/admin/media/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      toast.success("Poradie médií aktualizované.");
    } catch {
      toast.error("Nepodarilo sa uložiť poradie.");
      load();
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "border px-2.5 py-1.5 text-xs font-semibold transition-colors",
              filter === "all" ? "border-neon-red bg-neon-red/10 text-neon-red" : "border-charcoal text-silver hover:text-off-white"
            )}
          >
            Všetko
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilter(c.value)}
              className={cn(
                "border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                filter === c.value ? "border-neon-red bg-neon-red/10 text-neon-red" : "border-charcoal text-silver hover:text-off-white"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleUpload}
            className="hidden"
            aria-label="Nahrať obrázok"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 border border-warm-yellow/40 bg-warm-yellow/10 px-4 py-2 text-sm font-bold uppercase tracking-wide text-warm-yellow transition-all hover:bg-warm-yellow hover:text-ink disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Nahrávam..." : "Nahrať obrázok"}
          </button>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 bg-neon-red px-4 py-2 text-sm font-bold uppercase tracking-wide text-white clip-corner glow-red-sm transition-all hover:bg-deep-red hover:glow-red"
          >
            <Plus className="h-4 w-4" />
            Pridať médium
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse bg-charcoal" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-charcoal bg-dark-gray/50 py-16 text-center">
          <Images className="h-10 w-10 text-silver/40" />
          <p className="mt-3 text-sm text-silver">Žiadne médiá.</p>
        </div>
      ) : (
        <div className="max-h-[70vh] overflow-y-auto scroll-dora pr-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={filtered.map((m) => m.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {filtered.map((m) => (
                  <SortableMediaCard
                    key={m.id}
                    item={m}
                    catLabel={catLabel}
                    onEdit={() => openEdit(m)}
                    onDelete={() => remove(m.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur"
          onClick={() => setShowForm(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto scroll-dora border border-charcoal bg-dark-gray p-6 clip-corner-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-off-white">
                {editing ? "Upraviť médium" : "Pridať médium"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-silver hover:text-neon-red" aria-label="Zavrieť">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={save} className="space-y-3">
              <FormField label="Názov *">
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="media-input"
                  placeholder="napr. Koncertný záchyt 1"
                />
              </FormField>
              <FormField label="URL obrázku *">
                <input
                  required
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="media-input"
                  placeholder="/gallery/concert/concert-01.jpg"
                />
              </FormField>
              <FormField label="URL náhľadu (thumbnail)">
                <input
                  value={form.thumbnailUrl}
                  onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                  className="media-input"
                  placeholder="/gallery/concert/concert-01-thumb.jpg"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Kategória">
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="media-input"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Credits">
                  <input
                    value={form.credits}
                    onChange={(e) => setForm({ ...form, credits: e.target.value })}
                    className="media-input"
                  />
                </FormField>
              </div>
              <FormField label="Popisok (caption)">
                <input
                  value={form.caption}
                  onChange={(e) => setForm({ ...form, caption: e.target.value })}
                  className="media-input"
                />
              </FormField>
              <label className="flex items-center gap-2 border border-charcoal bg-ink p-3">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="h-4 w-4 accent-[#E63946]"
                />
                <span className="flex items-center gap-1.5 text-sm text-off-white">
                  <Star className="h-3.5 w-3.5 text-warm-yellow" />
                  Hlavné / featured médium
                </span>
              </label>

              {form.url && (
                <div className="border border-charcoal bg-ink p-3">
                  <p className="mb-2 font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">
                    Náhľad
                  </p>
                  <img
                    src={form.thumbnailUrl || form.url}
                    alt="preview"
                    className="max-h-40 w-auto border border-charcoal object-contain"
                    onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.3")}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="border border-charcoal px-4 py-2.5 text-sm font-semibold text-off-white/80 hover:text-off-white"
                >
                  Zrušiť
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-neon-red px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white clip-corner glow-red-sm hover:bg-deep-red disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {saving ? "Ukladám..." : "Uložiť"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        :global(.media-input) {
          width: 100%;
          border: 1px solid #2d2d2d;
          background-color: #0a0a0a;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: #e8e8e8;
          outline: none;
          transition: border-color 0.2s;
        }
        :global(.media-input:focus) {
          border-color: #e63946;
        }
      `}</style>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">{label}</span>
      {children}
    </label>
  );
}

function SortableMediaCard({
  item,
  catLabel,
  onEdit,
  onDelete,
}: {
  item: MediaItem;
  catLabel: (c: string) => string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative border bg-dark-gray",
        isDragging ? "border-neon-red glow-red-sm" : "border-charcoal"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1 z-10 inline-flex h-6 w-6 cursor-grab items-center justify-center bg-ink/80 text-silver opacity-0 transition-opacity hover:text-neon-red group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Presunúť"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <div className="relative aspect-square overflow-hidden bg-ink">
        <img
          src={item.thumbnailUrl || item.url}
          alt={item.title}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/dora-mark.svg";
          }}
        />
        {item.featured && (
          <span className="absolute right-1 top-1 inline-flex items-center gap-1 bg-warm-yellow px-1.5 py-0.5 font-mono-brand text-[8px] uppercase text-ink">
            <Star className="h-2.5 w-2.5" />
            Top
          </span>
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-1 bg-ink/70 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="inline-flex h-8 w-8 items-center justify-center border border-charcoal bg-dark-gray text-off-white hover:border-neon-red hover:text-neon-red"
            aria-label="Upraviť"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="inline-flex h-8 w-8 items-center justify-center border border-charcoal bg-dark-gray text-off-white hover:border-neon-red hover:text-neon-red"
            aria-label="Zmazať"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="p-2">
        <p className="truncate text-xs font-semibold text-off-white">{item.title}</p>
        <p className="font-mono-brand text-[9px] uppercase tracking-wider text-warm-yellow">
          {catLabel(item.category)}
        </p>
      </div>
    </div>
  );
}
