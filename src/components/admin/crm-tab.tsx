"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Users, Plus, Trash2, Pencil, X, Loader2, Search, Mail, Phone, Building, MapPin, Star, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Contact = { id: string; type: string; name: string; email: string | null; phone: string | null; organization: string | null; website: string | null; city: string | null; country: string; aiScore: number; tags: string[]; status: string; _count?: { communications: number; bookings: number } };

const TYPES = [
  { value: "all", label: "Všetci" },
  { value: "fan", label: "Fanúšikovia" },
  { value: "promoter", label: "Promotéri" },
  { value: "venue", label: "Kluby" },
  { value: "festival", label: "Festivaly" },
  { value: "media", label: "Médiá" },
  { value: "sponsor", label: "Sponzori" },
];

export function CrmTab() {
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/contacts?type=${filter}`).then(r => r.json()).then(d => { setItems(d.items ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); /* eslint-disable-line react-hooks/set-state-in-effect */ }, [load]);

  const filtered = items.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.email || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-silver" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Hľadať..." className="w-40 border border-charcoal bg-dark-gray py-2 pl-8 pr-2 text-xs text-off-white outline-none focus:border-neon-red sm:w-56" />
          </div>
          <div className="flex flex-wrap gap-1">
            {TYPES.map(t => <button key={t.value} onClick={() => setFilter(t.value)} className={cn("border px-2.5 py-1.5 text-xs font-semibold", filter === t.value ? "border-neon-red bg-neon-red/10 text-neon-red" : "border-charcoal text-silver hover:text-off-white")}>{t.label}</button>)}
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 bg-neon-red px-4 py-2 text-sm font-bold uppercase text-white"><Plus className="h-4 w-4" /> Pridať</button>
      </div>

      {loading ? <div className="space-y-2">{Array.from({length: 4}).map((_, i) => <div key={i} className="h-16 animate-pulse bg-charcoal" />)}</div> : (
        <div className="max-h-[65vh] space-y-2 overflow-y-auto scroll-dora pr-1">
          {filtered.map(c => (
            <div key={c.id} className="flex items-center gap-3 border border-charcoal bg-dark-gray p-3 hover:border-off-white/20">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-neon-red/20 text-neon-red"><Users className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setSelected(c)}>
                <p className="truncate text-sm font-semibold text-off-white">{c.name}</p>
                <p className="truncate text-xs text-silver">{c.email || c.phone || c.organization || "—"}</p>
              </div>
              <span className="font-mono-brand text-[9px] uppercase text-warm-yellow">{c.type}</span>
              {c.aiScore > 0 && <span className="flex items-center gap-1 text-xs"><Star className="h-3 w-3 text-warm-yellow" />{c.aiScore}</span>}
              <span className="text-xs text-silver/50">{c._count?.communications || 0}💬</span>
            </div>
          ))}
          {filtered.length === 0 && <p className="py-8 text-center text-sm text-silver">Žiadne kontakty.</p>}
        </div>
      )}

      {showForm && <ContactForm onClose={() => { setShowForm(false); load(); }} />}
      {selected && <ContactDetail contact={selected} onClose={() => setSelected(null)} onUpdate={load} />}
    </div>
  );
}

function ContactForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ type: "fan", name: "", email: "", phone: "", organization: "", website: "", city: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Zlyhalo.");
      toast.success("Kontakt vytvorený."); onClose();
    } catch { toast.error("Chyba."); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto scroll-dora border border-charcoal bg-dark-gray p-6" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h3 className="font-display text-lg font-bold text-off-white">Nový kontakt</h3><button onClick={onClose}><X className="h-5 w-5 text-silver" /></button></div>
        <div className="space-y-3">
          <div><label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Typ</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white">{TYPES.filter(t => t.value !== "all").map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
          <div><label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Meno *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Email</label><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" /></div>
            <div><label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Telefón</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Organizácia</label><input value={form.organization} onChange={e => setForm({...form, organization: e.target.value})} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" /></div>
            <div><label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Web</label><input value={form.website} onChange={e => setForm({...form, website: e.target.value})} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" /></div>
          </div>
          <div><label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Mesto</label><input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" /></div>
          <div><label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Poznámky</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className="w-full resize-y border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" /></div>
          <button onClick={save} disabled={saving || !form.name} className="w-full bg-neon-red py-2.5 text-sm font-bold uppercase text-white disabled:opacity-50">{saving ? "Ukladám..." : "Uložiť"}</button>
        </div>
      </div>
    </div>
  );
}

function ContactDetail({ contact, onClose, onUpdate }: { contact: Contact; onClose: () => void; onUpdate: () => void }) {
  const [comms, setComms] = useState<Array<{ id: string; type: string; direction: string; subject: string | null; body: string; aiGenerated: boolean; createdAt: string }>>([]);
  const [showComm, setShowComm] = useState(false);
  const [commBody, setCommBody] = useState("");

  useEffect(() => { fetch(`/api/admin/communications?contactId=${contact.id}`).then(r => r.json()).then(d => setComms(d.items ?? [])); }, [contact.id]);

  const addComm = async () => {
    if (!commBody.trim()) return;
    try {
      await fetch("/api/admin/communications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactId: contact.id, type: "note", body: commBody }) });
      setCommBody(""); setShowComm(false);
      fetch(`/api/admin/communications?contactId=${contact.id}`).then(r => r.json()).then(d => setComms(d.items ?? []));
    } catch { toast.error("Chyba."); }
  };

  const del = async () => {
    if (!confirm("Zmazať kontakt?")) return;
    try { await fetch(`/api/admin/contacts/${contact.id}`, { method: "DELETE" }); toast.success("Zmazané."); onClose(); onUpdate(); }
    catch { toast.error("Chyba."); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto scroll-dora border border-charcoal bg-dark-gray p-6" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><div><h3 className="font-display text-lg font-bold text-off-white">{contact.name}</h3><p className="font-mono-brand text-[10px] uppercase text-warm-yellow">{contact.type} · {contact.status}</p></div><div className="flex gap-2"><button onClick={del} className="text-silver hover:text-neon-red"><Trash2 className="h-4 w-4" /></button><button onClick={onClose}><X className="h-5 w-5 text-silver" /></button></div></div>
        <div className="space-y-2 text-sm">
          {contact.email && <p className="flex items-center gap-2 text-off-white/80"><Mail className="h-3.5 w-3.5 text-warm-yellow" />{contact.email}</p>}
          {contact.phone && <p className="flex items-center gap-2 text-off-white/80"><Phone className="h-3.5 w-3.5 text-warm-yellow" />{contact.phone}</p>}
          {contact.organization && <p className="flex items-center gap-2 text-off-white/80"><Building className="h-3.5 w-3.5 text-warm-yellow" />{contact.organization}</p>}
          {contact.city && <p className="flex items-center gap-2 text-off-white/80"><MapPin className="h-3.5 w-3.5 text-warm-yellow" />{contact.city}, {contact.country}</p>}
          {contact.aiScore > 0 && <p className="flex items-center gap-2 text-warm-yellow"><Star className="h-3.5 w-3.5" />AI Score: {contact.aiScore}</p>}
        </div>
        <div className="mt-4 border-t border-charcoal pt-4">
          <div className="mb-2 flex items-center justify-between"><p className="font-mono-brand text-[11px] uppercase text-warm-yellow">{"// Komunikácia"}</p><button onClick={() => setShowComm(!showComm)} className="text-xs text-neon-red">+ Pridať</button></div>
          {showComm && <div className="mb-3"><textarea value={commBody} onChange={e => setCommBody(e.target.value)} rows={2} className="w-full resize-y border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" placeholder="Pridaj poznámku..." /><button onClick={addComm} className="mt-1 bg-neon-red px-3 py-1.5 text-xs font-bold uppercase text-white">Uložiť</button></div>}
          <div className="max-h-40 space-y-2 overflow-y-auto scroll-dora">
            {comms.map(c => <div key={c.id} className="border border-charcoal/50 bg-ink p-2"><p className="text-xs text-off-white/80">{c.body}</p><p className="mt-1 font-mono-brand text-[9px] text-silver">{c.type} · {new Date(c.createdAt).toLocaleDateString("sk-SK")}{c.aiGenerated && " · AI"}</p></div>)}
            {comms.length === 0 && <p className="text-xs text-silver/50">Žiadna komunikácia.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
