"use client";

import { useState } from "react";
import { Sparkles, Loader2, Bot, Zap, AlertCircle, Copy, Check, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TONES = [
  { value: "professional", label: "Profesionálny" },
  { value: "friendly", label: "Priateľský" },
  { value: "rock", label: "Rock energický" },
  { value: "festival-pitch", label: "Festival pitch" },
  { value: "sponsor", label: "Sponzorský návrh" },
  { value: "follow-up", label: "Follow-up" },
  { value: "thank-you", label: "Poďakovanie" },
];

const AGENTS = [
  { id: "url", label: "URL Analyzer", desc: "Analyzuj webstránku eventu/festivalu", icon: Bot },
  { id: "email", label: "Email Assistant", desc: "Vygeneruj email s tónom", icon: Send },
  { id: "content", label: "Content Bundle", desc: "Blog + sociálne + newsletter pre koncert", icon: Sparkles },
  { id: "tasks", label: "Task Generator", desc: "Vytvor checklist pre koncert", icon: Zap },
];

export function AutomationsTab() {
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  // URL Analyzer state
  const [url, setUrl] = useState("");

  // Email state
  const [emailTone, setEmailTone] = useState("professional");
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailContext, setEmailContext] = useState("");

  // Content bundle state
  const [gigTitle, setGigTitle] = useState("");
  const [gigDate, setGigDate] = useState("");
  const [gigVenue, setGigVenue] = useState("");

  const runAgent = async () => {
    setLoading(true); setResult(""); setActiveAgent("running");
    try {
      let body;
      if (url) { body = { type: "custom", instruction: `Analyzuj túto webstránku eventu/festivalu: ${url}. Vráť v slovenčine: názov, žáner, cieľovú skupinu, kapacitu, kontakty, match skóre (0-100), odporúčanie (KONTAKTOVAŤ/NÍZKY/NEVHODNÉ) a dôvod. Navrhni predmet booking emailu.` }; }
      else if (emailRecipient) { body = { type: "custom", instruction: `Napíš email v slovenčine pre: ${emailRecipient}. Tón: ${emailTone}. Kontext: ${emailContext || "Prvý kontakt o vystúpení kapely D.O.R.A."}` }; }
      else if (gigTitle) { body = { type: "custom", instruction: `Nový koncert: ${gigTitle}, ${gigDate}, ${gigVenue}. Vygeneruj v slovenčine: 1) blog článok (100 slov), 2) Facebook príspevok, 3) Instagram caption, 4) newsletter sekcia, 5) SEO title, 6) SEO description. Oddeľ sekcie "===SEKCIJA===".` }; }
      else { body = { type: "custom", instruction: "Vytvor checklist pre koncert kapely D.O.R.A.: 14 dní pred (promo, plagát), 7 dní (social, newsletter), 1 deň (technická kontrola), deň koncertu (soundcheck)." }; }

      const res = await fetch("/api/admin/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Agent zlyhal.");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Stream nedostupný.");
      const decoder = new TextDecoder(); let text = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; text += decoder.decode(value, { stream: true }); setResult(text); }
      toast.success("Agent dokončil úlohu.");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Chyba."); }
    finally { setLoading(false); }
  };

  const copy = async () => { await navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success("Skopírované."); };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <p className="mb-3 font-mono-brand text-[11px] uppercase tracking-[0.2em] text-warm-yellow">{"// AI Agenti"}</p>
        <div className="space-y-2">
          {AGENTS.map(a => {
            const Icon = a.icon;
            const isActive = activeAgent === a.id;
            return <button key={a.id} onClick={() => { setActiveAgent(a.id); setResult(""); }} className={cn("flex w-full items-center gap-3 border p-3 text-left", isActive ? "border-neon-red bg-neon-red/5" : "border-charcoal bg-dark-gray hover:border-off-white/20")}>
              <div className={cn("flex h-9 w-9 items-center justify-center", isActive ? "bg-neon-red text-white" : "bg-ink text-silver")}><Icon className="h-4 w-4" /></div>
              <div><p className={cn("text-sm font-bold", isActive ? "text-neon-red" : "text-off-white")}>{a.label}</p><p className="text-xs text-silver">{a.desc}</p></div>
            </button>;
          })}
        </div>

        {activeAgent === "url" && (
          <div className="mt-4 space-y-3 border border-charcoal bg-dark-gray p-4">
            <label className="block font-mono-brand text-[10px] uppercase text-silver">URL eventu/festivalu</label>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://festival.sk" className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" />
          </div>
        )}
        {activeAgent === "email" && (
          <div className="mt-4 space-y-3 border border-charcoal bg-dark-gray p-4">
            <div><label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Príjemca</label><input value={emailRecipient} onChange={e => setEmailRecipient(e.target.value)} placeholder="festival@email.sk" className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" /></div>
            <div><label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Tón</label><select value={emailTone} onChange={e => setEmailTone(e.target.value)} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white">{TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div><label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Kontext</label><textarea value={emailContext} onChange={e => setEmailContext(e.target.value)} rows={2} className="w-full resize-y border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" placeholder="Prvý kontakt o vystúpení..." /></div>
          </div>
        )}
        {activeAgent === "content" && (
          <div className="mt-4 space-y-3 border border-charcoal bg-dark-gray p-4">
            <div><label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Názov koncertu</label><input value={gigTitle} onChange={e => setGigTitle(e.target.value)} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Dátum</label><input type="date" value={gigDate} onChange={e => setGigDate(e.target.value)} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" /></div>
              <div><label className="mb-1 block font-mono-brand text-[10px] uppercase text-silver">Miesto</label><input value={gigVenue} onChange={e => setGigVenue(e.target.value)} className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white" /></div>
            </div>
          </div>
        )}

        {activeAgent && activeAgent !== "running" && (
          <button onClick={runAgent} disabled={loading} className="mt-4 inline-flex items-center gap-2 bg-neon-red px-6 py-2.5 text-sm font-bold uppercase text-white disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Spracúvam..." : "Spustiť agenta"}
          </button>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="font-mono-brand text-[11px] uppercase tracking-[0.2em] text-warm-yellow">{"// Výstup"}</p>
          {result && <button onClick={copy} className="flex items-center gap-1 text-xs text-neon-red">{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{copied ? "Skopírované" : "Kopírovať"}</button>}
        </div>
        <div className="min-h-[20rem] border border-charcoal bg-dark-gray p-4">
          {loading && !result ? <div className="flex h-32 items-center justify-center gap-2 text-silver"><Loader2 className="h-5 w-5 animate-spin text-neon-red" /><span className="text-xs">AI agent pracuje...</span></div> :
           result ? <pre className="max-h-[50vh] overflow-auto scroll-dora whitespace-pre-wrap text-sm text-off-white">{result}</pre> :
           <div className="flex h-32 items-center justify-center text-silver/40"><AlertCircle className="h-6 w-6" /></div>}
        </div>
      </div>
    </div>
  );
}
