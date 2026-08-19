"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Save, Loader2, RotateCcw, Settings as SettingsIcon, Power, Megaphone, Eye,
  EyeOff, AlertTriangle, CheckCircle2, Info, XCircle, Sparkles, ExternalLink,
  Clock, ShieldCheck, Globe, Zap, ZapOff, RefreshCw, Send, Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

type ContentEntry = {
  key: string;
  value: string;
  category: string;
  label: string;
  type: "text" | "textarea";
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseBool(v: string | undefined, fallback = false): boolean {
  if (v == null) return fallback;
  const x = v.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(x)) return true;
  if (["false", "0", "no", "off", ""].includes(x)) return false;
  return fallback;
}

const BANNER_TYPES: { value: "info" | "warning" | "success" | "error" | "promo"; label: string; color: string }[] = [
  { value: "info", label: "Info", color: "bg-sky-500/15 text-sky-300 border-sky-500/40" },
  { value: "warning", label: "Varovanie", color: "bg-warm-yellow/15 text-warm-yellow border-warm-yellow/40" },
  { value: "success", label: "Úspech", color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
  { value: "error", label: "Chyba", color: "bg-neon-red/15 text-neon-red border-neon-red/40" },
  { value: "promo", label: "Promo", color: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40" },
];

const SECTIONS_ORDER: { id: string; label: string; desc: string }[] = [
  { id: "hero", label: "Hero (úvod)", desc: "Hlavná úvodná sekcia s pozadím a CTA" },
  { id: "stats", label: "Štatistiky", desc: "Čísla kapely — roky, koncerty, skladby, fanúšikovia" },
  { id: "about", label: "O kapele", desc: "Biografia + časová os" },
  { id: "members", label: "Členovia kapely", desc: "Profily členov s fotkami" },
  { id: "music", label: "Hudba & Videá", desc: "Videá a hudobné ukážky" },
  { id: "gigs", label: "Koncerty", desc: "Nadchádzajúce a odohrané koncerty" },
  { id: "setlist", label: "Setlist", desc: "Typický setlist" },
  { id: "gallery", label: "Galéria", desc: "Fotogaléria s vyhľadávaním" },
  { id: "discography", label: "Diskografia", desc: "Albumy a tracklisty" },
  { id: "merch", label: "Merch & Obchod", desc: "Produkty na predaj s fotkami a cenami" },
  { id: "blog", label: "Blog & Novinky", desc: "Publikované články, news a press releases" },
  { id: "testimonials", label: "Recenzie", desc: "Ohlasy fanúšikov a promotérov" },
  { id: "press", label: "PR / Press Kit", desc: "Materiály pre médiá" },
  { id: "faq", label: "FAQ", desc: "Často kladené otázky" },
  { id: "social", label: "Sociálne siete", desc: "Odkazy na sociálne siete" },
  { id: "newsletter", label: "Newsletter", desc: "Prihlásenie na odber" },
  { id: "contact", label: "Kontakt", desc: "Booking formulár a kontakt" },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SettingsTab() {
  const [items, setItems] = useState<ContentEntry[]>([]);
  const [original, setOriginal] = useState<ContentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSubtab, setActiveSubtab] = useState<"maintenance" | "banner" | "sections" | "site">("maintenance");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => { setItems(d.items ?? []); setOriginal(d.items ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Build a lookup map for quick access
  const map = useMemo(() => {
    const m: Record<string, string> = {};
    for (const it of items) m[it.key] = it.value;
    return m;
  }, [items]);

  const update = (key: string, value: string) => {
    setItems((arr) => arr.map((i) => (i.key === key ? { ...i, value } : i)));
  };

  const reset = (key: string) => {
    const orig = original.find((o) => o.key === key);
    if (orig) update(key, orig.value);
  };

  const dirtyCount = items.filter(
    (i) => i.value !== original.find((o) => o.key === i.key)?.value
  ).length;
  const dirty = dirtyCount > 0;

  const save = async () => {
    const changed = items
      .filter((i) => i.value !== original.find((o) => o.key === i.key)?.value)
      .map((i) => ({ key: i.key, value: i.value }));
    if (changed.length === 0) { toast.info("Žiadne zmeny."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: changed }),
      });
      if (!res.ok) throw new Error("Uloženie zlyhalo.");
      const data = await res.json();
      toast.success(`Uložených ${data.updated} nastavení.`);
      load();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Chyba."); }
    finally { setSaving(false); }
  };

  // Maintenance-related values
  const maintEnabled = parseBool(map["settings.maintenance.enabled"]);
  const maintAllowBypass = parseBool(map["settings.maintenance.allowAdminBypass"], true);

  // Banner-related values
  const bannerEnabled = parseBool(map["settings.banner.enabled"]);
  const bannerDismissible = parseBool(map["settings.banner.dismissible"], true);
  const bannerType = (map["settings.banner.type"] || "info") as "info" | "warning" | "success" | "error" | "promo";

  // Sections
  const sectionStates = SECTIONS_ORDER.map((s) => ({
    ...s,
    visible: parseBool(map[`settings.sections.${s.id}`], true),
    dirty: map[`settings.sections.${s.id}`] !== original.find((o) => o.key === `settings.sections.${s.id}`)?.value,
  }));
  const hiddenCount = sectionStates.filter((s) => !s.visible).length;
  const visibleCount = sectionStates.length - hiddenCount;

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse bg-charcoal" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header + actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-4 w-4 text-neon-red" />
          <h2 className="font-display text-lg font-extrabold text-off-white">Všeobecné nastavenia webu</h2>
          {maintEnabled && (
            <span className="inline-flex items-center gap-1 border border-neon-red bg-neon-red/10 px-2 py-1 font-mono-brand text-[10px] uppercase tracking-wider text-neon-red">
              <Power className="h-3 w-3" /> Údržba aktívna
            </span>
          )}
          {bannerEnabled && (
            <span className="inline-flex items-center gap-1 border border-warm-yellow bg-warm-yellow/10 px-2 py-1 font-mono-brand text-[10px] uppercase tracking-wider text-warm-yellow">
              <Megaphone className="h-3 w-3" /> Banner aktívny
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {dirtyCount > 0 && (
            <span className="font-mono-brand text-[10px] uppercase tracking-wider text-warm-yellow">
              {dirtyCount} neuložených
            </span>
          )}
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-2 bg-neon-red px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-deep-red disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Uložiť nastavenia
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="mb-6 flex flex-wrap gap-1 border-b border-charcoal">
        {([
          { id: "maintenance", label: "Režim údržby", icon: Power, color: maintEnabled ? "text-neon-red" : "" },
          { id: "banner", label: "Oznamovací banner", icon: Megaphone, color: bannerEnabled ? "text-warm-yellow" : "" },
          { id: "sections", label: "Viditeľnosť sekcií", icon: Eye, color: "" },
          { id: "site", label: "Web & meta", icon: Globe, color: "" },
        ] as const).map((t) => {
          const Icon = t.icon;
          const active = activeSubtab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSubtab(t.id)}
              className={cn(
                "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "border-neon-red text-neon-red"
                  : "border-transparent text-off-white/60 hover:text-off-white"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-neon-red" : t.color)} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ---- MAINTENANCE ---- */}
      {activeSubtab === "maintenance" && (
        <div className="space-y-5">
          {/* Status hero */}
          <div className={cn(
            "relative overflow-hidden border bg-dark-gray p-5",
            maintEnabled ? "border-neon-red/60" : "border-charcoal"
          )}>
            <div className={cn(
              "pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl",
              maintEnabled ? "bg-neon-red/30" : "bg-charcoal/40"
            )} />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center border",
                  maintEnabled ? "border-neon-red bg-neon-red/15 text-neon-red" : "border-charcoal text-silver"
                )}>
                  <Power className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-display text-base font-extrabold text-off-white">
                    {maintEnabled ? "Režim údržby je ZAPNUTÝ" : "Režim údržby je VYPNUTÝ"}
                  </p>
                  <p className="mt-0.5 max-w-xl text-xs text-silver">
                    {maintEnabled
                      ? "Verejný web je skrytý za údržbovou obrazovkou. Administrácia ostáva prístupná prihlásenému adminovi."
                      : "Prepne verejný web do režimu údržby. Návštevníci uvidia iba údržbovú obrazovku."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "font-mono-brand text-[10px] uppercase tracking-wider",
                  maintEnabled ? "text-neon-red" : "text-silver"
                )}>
                  {maintEnabled ? "ZAPNUTÝ" : "VYPNUTÝ"}
                </span>
                <Switch
                  checked={maintEnabled}
                  onCheckedChange={(v) => update("settings.maintenance.enabled", String(v))}
                  className={cn(
                    "h-6 w-11 data-[state=checked]:bg-neon-red data-[state=unchecked]:bg-charcoal",
                  )}
                />
              </div>
            </div>
          </div>

          {/* Maintenance message + schedule */}
          <div className="grid gap-4 lg:grid-cols-2">
            <SettingCard
              icon={<Megaphone className="h-4 w-4" />}
              title="Oznámenie pre návštevníkov"
              subtitle="Správa zobrazená na údržbovej obrazovke"
            >
              <SettingField
                entry={items.find((i) => i.key === "settings.maintenance.title")!}
                onChange={(v) => update("settings.maintenance.title", v)}
                onReset={() => reset("settings.maintenance.title")}
              />
              <SettingField
                entry={items.find((i) => i.key === "settings.maintenance.message")!}
                onChange={(v) => update("settings.maintenance.message", v)}
                onReset={() => reset("settings.maintenance.message")}
              />
              <SettingField
                entry={items.find((i) => i.key === "settings.maintenance.estimatedReturn")!}
                onChange={(v) => update("settings.maintenance.estimatedReturn", v)}
                onReset={() => reset("settings.maintenance.estimatedReturn")}
                placeholder="napr. 'o 2 hodiny', 'do večera'"
              />
            </SettingCard>

            <SettingCard
              icon={<Calendar className="h-4 w-4" />}
              title="Naplánované okno údržby"
              subtitle="Ak je nastavené, údržba sa aktivuje len v tomto intervale"
            >
              <SettingField
                entry={items.find((i) => i.key === "settings.maintenance.startTime")!}
                onChange={(v) => update("settings.maintenance.startTime", v)}
                onReset={() => reset("settings.maintenance.startTime")}
                placeholder="2026-04-15T02:00:00"
              />
              <SettingField
                entry={items.find((i) => i.key === "settings.maintenance.endTime")!}
                onChange={(v) => update("settings.maintenance.endTime", v)}
                onReset={() => reset("settings.maintenance.endTime")}
                placeholder="2026-04-15T04:00:00"
              />
              <div className="rounded border border-charcoal bg-ink/50 p-3">
                <p className="mb-1 font-mono-brand text-[10px] uppercase tracking-wider text-warm-yellow">
                  Tip
                </p>
                <p className="text-xs text-silver/80">
                  Ak sú polia prázdne, údržba sa aktivuje ihneď po zapnutí prepínača vyššie.
                  Čas je v UTC (pridajte <code className="text-neon-red">Z</code> na konci ISO).
                </p>
              </div>
            </SettingCard>

            <SettingCard
              icon={<ShieldCheck className="h-4 w-4" />}
              title="Prístup počas údržby"
              subtitle="Kto môže vidieť web aj počas údržby"
            >
              <div className="flex items-center justify-between border border-charcoal bg-ink/50 p-3">
                <div>
                  <p className="text-sm font-semibold text-off-white">Povoliť obídenie pre admina</p>
                  <p className="text-xs text-silver">
                    Prihlásený admin uvidí normálny web + badge "ÚDRŽBA"
                  </p>
                </div>
                <Switch
                  checked={maintAllowBypass}
                  onCheckedChange={(v) => update("settings.maintenance.allowAdminBypass", String(v))}
                  className="h-6 w-11 data-[state=checked]:bg-neon-red data-[state=unchecked]:bg-charcoal"
                />
              </div>
              <SettingField
                entry={items.find((i) => i.key === "settings.maintenance.contactEmail")!}
                onChange={(v) => update("settings.maintenance.contactEmail", v)}
                onReset={() => reset("settings.maintenance.contactEmail")}
                placeholder="nudzovy@kontakt.sk"
              />
            </SettingCard>

            {/* Live preview */}
            <SettingCard
              icon={<Eye className="h-4 w-4" />}
              title="Náhľad údržbovej obrazovky"
              subtitle="Takto sa zobrazí návštevníkom"
            >
              <MaintenancePreview
                title={map["settings.maintenance.title"] || "Web sa pripravuje"}
                message={map["settings.maintenance.message"] || ""}
                estimatedReturn={map["settings.maintenance.estimatedReturn"] || ""}
                contactEmail={map["settings.maintenance.contactEmail"] || ""}
                enabled={maintEnabled}
              />
              <a
                href={`/?preview=1${maintEnabled ? "&maint=1" : ""}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 border border-charcoal px-3 py-2 text-xs font-semibold text-off-white/80 transition-colors hover:border-neon-red hover:text-neon-red"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Otvoriť náhľad webu
              </a>
            </SettingCard>
          </div>
        </div>
      )}

      {/* ---- BANNER ---- */}
      {activeSubtab === "banner" && (
        <div className="space-y-5">
          {/* Status hero */}
          <div className={cn(
            "relative overflow-hidden border bg-dark-gray p-5",
            bannerEnabled ? "border-warm-yellow/60" : "border-charcoal"
          )}>
            <div className={cn(
              "pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl",
              bannerEnabled ? "bg-warm-yellow/25" : "bg-charcoal/40"
            )} />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center border",
                  bannerEnabled ? "border-warm-yellow bg-warm-yellow/15 text-warm-yellow" : "border-charcoal text-silver"
                )}>
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-display text-base font-extrabold text-off-white">
                    {bannerEnabled ? "Banner je ZAPNUTÝ" : "Banner je VYPNUTÝ"}
                  </p>
                  <p className="mt-0.5 max-w-xl text-xs text-silver">
                    Živé oznamovacie bannerové hlásenie zobrazené navrchu verejného webu.
                    Ideálne pre oznámenia koncertov, noviniek alebo výstrah.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "font-mono-brand text-[10px] uppercase tracking-wider",
                  bannerEnabled ? "text-warm-yellow" : "text-silver"
                )}>
                  {bannerEnabled ? "ZAPNUTÝ" : "VYPNUTÝ"}
                </span>
                <Switch
                  checked={bannerEnabled}
                  onCheckedChange={(v) => update("settings.banner.enabled", String(v))}
                  className="h-6 w-11 data-[state=checked]:bg-warm-yellow data-[state=unchecked]:bg-charcoal"
                />
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div>
            <p className="mb-2 font-mono-brand text-[10px] uppercase tracking-wider text-silver">
              Živý náhľad banneru
            </p>
            <BannerPreview
              message={map["settings.banner.message"] || ""}
              type={bannerType}
              dismissible={bannerDismissible}
              link={map["settings.banner.link"] || ""}
              linkLabel={map["settings.banner.linkLabel"] || ""}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SettingCard
              icon={<Megaphone className="h-4 w-4" />}
              title="Obsah banneru"
              subtitle="Text správy a voliteľné CTA tlačidlo"
            >
              <SettingField
                entry={items.find((i) => i.key === "settings.banner.message")!}
                onChange={(v) => update("settings.banner.message", v)}
                onReset={() => reset("settings.banner.message")}
              />
              <SettingField
                entry={items.find((i) => i.key === "settings.banner.linkLabel")!}
                onChange={(v) => update("settings.banner.linkLabel", v)}
                onReset={() => reset("settings.banner.linkLabel")}
                placeholder="napr. 'Rezervovať lístky'"
              />
              <SettingField
                entry={items.find((i) => i.key === "settings.banner.link")!}
                onChange={(v) => update("settings.banner.link", v)}
                onReset={() => reset("settings.banner.link")}
                placeholder="https://..."
              />
            </SettingCard>

            <SettingCard
              icon={<Sparkles className="h-4 w-4" />}
              title="Vzhľad a správanie"
              subtitle="Typ, dismiss a plánovanie"
            >
              <div className="mb-3">
                <p className="mb-2 font-mono-brand text-[10px] uppercase tracking-wider text-silver">
                  Typ banneru
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {BANNER_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => update("settings.banner.type", t.value)}
                      className={cn(
                        "border px-2 py-2 text-[10px] font-bold uppercase tracking-wide transition-all",
                        bannerType === t.value
                          ? t.color
                          : "border-charcoal text-silver hover:text-off-white"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-3 flex items-center justify-between border border-charcoal bg-ink/50 p-3">
                <div>
                  <p className="text-sm font-semibold text-off-white">Možnosť zavrieť (dismiss)</p>
                  <p className="text-xs text-silver">Návštevník môže banner skryť (pamätá sa v localStorage)</p>
                </div>
                <Switch
                  checked={bannerDismissible}
                  onCheckedChange={(v) => update("settings.banner.dismissible", String(v))}
                  className="h-6 w-11 data-[state=checked]:bg-warm-yellow data-[state=unchecked]:bg-charcoal"
                />
              </div>
              <SettingField
                entry={items.find((i) => i.key === "settings.banner.startAt")!}
                onChange={(v) => update("settings.banner.startAt", v)}
                onReset={() => reset("settings.banner.startAt")}
                placeholder="Začiatok (ISO, voliteľné)"
              />
              <SettingField
                entry={items.find((i) => i.key === "settings.banner.endAt")!}
                onChange={(v) => update("settings.banner.endAt", v)}
                onReset={() => reset("settings.banner.endAt")}
                placeholder="Koniec (ISO, voliteľné)"
              />
            </SettingCard>
          </div>
        </div>
      )}

      {/* ---- SECTIONS ---- */}
      {activeSubtab === "sections" && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat icon={<Eye className="h-4 w-4" />} label="Viditeľné" value={visibleCount} color="text-emerald-300" border="border-emerald-500/40" bg="bg-emerald-500/10" />
            <SummaryStat icon={<EyeOff className="h-4 w-4" />} label="Skryté" value={hiddenCount} color="text-neon-red" border="border-neon-red/40" bg="bg-neon-red/10" />
            <SummaryStat icon={<SettingsIcon className="h-4 w-4" />} label="Spolu sekcií" value={sectionStates.length} color="text-off-white" border="border-charcoal" bg="bg-dark-gray" />
            <SummaryStat icon={<AlertTriangle className="h-4 w-4" />} label="Hero je skrytý?" value={sectionStates.find((s) => s.id === "hero")?.visible === false ? "ÁNO" : "NIE"} color={sectionStates.find((s) => s.id === "hero")?.visible === false ? "text-neon-red" : "text-emerald-300"} border={sectionStates.find((s) => s.id === "hero")?.visible === false ? "border-neon-red/40" : "border-emerald-500/40"} bg={sectionStates.find((s) => s.id === "hero")?.visible === false ? "bg-neon-red/10" : "bg-emerald-500/10"} />
          </div>

          {/* Bulk actions */}
          <div className="flex flex-wrap items-center gap-2 border border-charcoal bg-dark-gray p-3">
            <span className="font-mono-brand text-[10px] uppercase tracking-wider text-silver">Hromadné akcie:</span>
            <button
              onClick={() => SECTIONS_ORDER.forEach((s) => update(`settings.sections.${s.id}`, "true"))}
              className="inline-flex items-center gap-1.5 border border-charcoal px-2.5 py-1.5 text-xs font-semibold text-off-white/80 transition-colors hover:border-emerald-500 hover:text-emerald-300"
            >
              <Eye className="h-3 w-3" /> Zobraziť všetky
            </button>
            <button
              onClick={() => SECTIONS_ORDER.forEach((s) => update(`settings.sections.${s.id}`, "false"))}
              className="inline-flex items-center gap-1.5 border border-charcoal px-2.5 py-1.5 text-xs font-semibold text-off-white/80 transition-colors hover:border-neon-red hover:text-neon-red"
            >
              <EyeOff className="h-3 w-3" /> Skryť všetky
            </button>
            <button
              onClick={() => SECTIONS_ORDER.forEach((s) => {
                // Invert each
                const cur = parseBool(map[`settings.sections.${s.id}`], true);
                update(`settings.sections.${s.id}`, String(!cur));
              })}
              className="inline-flex items-center gap-1.5 border border-charcoal px-2.5 py-1.5 text-xs font-semibold text-off-white/80 transition-colors hover:border-warm-yellow hover:text-warm-yellow"
            >
              <RefreshCw className="h-3 w-3" /> Invertovať
            </button>
            <span className="ml-auto font-mono-brand text-[10px] text-silver/60">
              Zmeny sa prejavia po uložení
            </span>
          </div>

          {/* Section grid */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sectionStates.map((s) => {
              const Icon = s.visible ? Eye : EyeOff;
              return (
                <button
                  key={s.id}
                  onClick={() => update(`settings.sections.${s.id}`, String(!s.visible))}
                  className={cn(
                    "group relative flex items-start gap-3 border p-3 text-left transition-all",
                    s.visible
                      ? "border-charcoal bg-dark-gray hover:border-off-white/40"
                      : "border-neon-red/40 bg-neon-red/5 hover:border-neon-red",
                    s.dirty && "ring-1 ring-warm-yellow/40"
                  )}
                >
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center border",
                    s.visible ? "border-charcoal text-silver" : "border-neon-red/50 text-neon-red"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "truncate text-sm font-bold",
                        s.visible ? "text-off-white" : "text-off-white/60"
                      )}>
                        {s.label}
                      </p>
                      {s.dirty && (
                        <span className="border border-warm-yellow/40 px-1 font-mono-brand text-[8px] uppercase text-warm-yellow">
                          zmena
                        </span>
                      )}
                    </div>
                    <p className={cn(
                      "mt-0.5 line-clamp-2 text-[11px] leading-tight",
                      s.visible ? "text-silver/70" : "text-silver/40"
                    )}>
                      {s.desc}
                    </p>
                    <p className="mt-1 font-mono-brand text-[9px] uppercase tracking-wider text-silver/40">
                      {s.visible ? "VIDITEĽNÁ" : "SKRYTÁ"}
                    </p>
                  </div>
                  <Switch
                    checked={s.visible}
                    onCheckedChange={(v) => update(`settings.sections.${s.id}`, String(v))}
                    onClick={(e) => e.stopPropagation()}
                    className="h-5 w-9 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-charcoal"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ---- SITE META ---- */}
      {activeSubtab === "site" && (
        <div className="space-y-5">
          <SettingCard
            icon={<Globe className="h-4 w-4" />}
            title="Jazyk a časová zóna webu"
            subtitle="Používa sa pre meta tagy a structured data"
          >
            <SettingField
              entry={items.find((i) => i.key === "settings.site.language")!}
              onChange={(v) => update("settings.site.language", v)}
              onReset={() => reset("settings.site.language")}
              placeholder="sk, cs, en, de..."
            />
            <SettingField
              entry={items.find((i) => i.key === "settings.site.timezone")!}
              onChange={(v) => update("settings.site.timezone", v)}
              onReset={() => reset("settings.site.timezone")}
              placeholder="Europe/Bratislava"
            />
          </SettingCard>

          <SettingCard
            icon={<Zap className="h-4 w-4" />}
            title="Stav cache"
            subtitle="Nastavenia sa cachujú 30s v pamäti servera"
          >
            <div className="flex items-center justify-between border border-charcoal bg-ink/50 p-3">
              <div>
                <p className="text-sm font-semibold text-off-white">In-memory cache</p>
                <p className="text-xs text-silver">Po uložení zmien sa cache automaticky invaliduje</p>
              </div>
              <button
                onClick={() => {
                  fetch("/api/admin/settings").then(() => {
                    toast.success("Cache obnovená.");
                    load();
                  });
                }}
                className="inline-flex items-center gap-1.5 border border-charcoal px-3 py-2 text-xs font-semibold text-off-white/80 transition-colors hover:border-neon-red hover:text-neon-red"
              >
                <RefreshCw className="h-3 w-3" /> Obnoviť
              </button>
            </div>
          </SettingCard>

          <SettingCard
            icon={<Send className="h-4 w-4" />}
            title="Test doručenia nastavení"
            subtitle="Overenie, že verejný endpoint /api/settings vracia správne dáta"
          >
            <button
              onClick={async () => {
                try {
                  const r = await fetch("/api/settings");
                  const d = await r.json();
                  toast.success(`Banner aktívny: ${d.banner?.isActive ? "áno" : "nie"} · Sekcie: ${Object.keys(d.sections || {}).length}`);
                } catch {
                  toast.error("Nepodarilo sa získať nastavenia.");
                }
              }}
              className="inline-flex items-center gap-1.5 border border-charcoal px-3 py-2 text-xs font-semibold text-off-white/80 transition-colors hover:border-neon-red hover:text-neon-red"
            >
              <Send className="h-3 w-3" /> Overiť verejný endpoint
            </button>
          </SettingCard>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SettingCard({
  icon, title, subtitle, children,
}: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="border border-charcoal bg-dark-gray p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-charcoal bg-ink/50 text-neon-red">
          {icon}
        </div>
        <div>
          <p className="text-sm font-bold text-off-white">{title}</p>
          {subtitle && <p className="text-xs text-silver">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SettingField({
  entry, onChange, onReset, placeholder,
}: {
  entry: ContentEntry;
  onChange: (v: string) => void;
  onReset: () => void;
  placeholder?: string;
}) {
  const isDirty = entry.value !== entry.value; // placeholder — actual dirty state checked at parent
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-semibold text-off-white/80">{entry.label}</label>
        <span className="font-mono-brand text-[9px] text-silver/40">{entry.key}</span>
      </div>
      <div className="relative">
        {entry.type === "textarea" ? (
          <textarea
            value={entry.value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full resize-y border border-charcoal bg-ink px-3 py-2 text-sm text-off-white outline-none focus:border-neon-red scroll-dora"
          />
        ) : (
          <input
            value={entry.value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full border border-charcoal bg-ink px-3 py-2 text-sm text-off-white outline-none focus:border-neon-red"
          />
        )}
        {isDirty && (
          <button
            onClick={onReset}
            className="absolute right-2 top-2 text-silver hover:text-neon-red"
            title="Vrátiť"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {entry.type === "textarea" && (
        <span className="mt-1 inline-block font-mono-brand text-[9px] text-silver/40">
          {entry.value.length} znakov
        </span>
      )}
    </div>
  );
}

function SummaryStat({
  icon, label, value, color, border, bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  border: string;
  bg: string;
}) {
  return (
    <div className={cn("border p-3", border, bg)}>
      <div className="flex items-center gap-2">
        <span className={color}>{icon}</span>
        <span className="font-mono-brand text-[9px] uppercase tracking-wider text-silver">{label}</span>
      </div>
      <p className={cn("mt-1 font-display text-xl font-extrabold", color)}>{value}</p>
    </div>
  );
}

function BannerPreview({
  message, type, dismissible, link, linkLabel,
}: {
  message: string;
  type: "info" | "warning" | "success" | "error" | "promo";
  dismissible: boolean;
  link: string;
  linkLabel: string;
}) {
  const styles: Record<typeof type, { bg: string; border: string; icon: React.ReactNode; text: string }> = {
    info: { bg: "bg-sky-500/10", border: "border-sky-500/40", icon: <Info className="h-4 w-4 text-sky-300" />, text: "text-sky-100" },
    warning: { bg: "bg-warm-yellow/10", border: "border-warm-yellow/40", icon: <AlertTriangle className="h-4 w-4 text-warm-yellow" />, text: "text-warm-yellow" },
    success: { bg: "bg-emerald-500/10", border: "border-emerald-500/40", icon: <CheckCircle2 className="h-4 w-4 text-emerald-300" />, text: "text-emerald-100" },
    error: { bg: "bg-neon-red/10", border: "border-neon-red/40", icon: <XCircle className="h-4 w-4 text-neon-red" />, text: "text-neon-red" },
    promo: { bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/40", icon: <Sparkles className="h-4 w-4 text-fuchsia-300" />, text: "text-fuchsia-100" },
  };
  const s = styles[type];
  return (
    <div className={cn("flex items-center gap-3 border px-4 py-3", s.bg, s.border)}>
      {s.icon}
      <p className={cn("flex-1 text-sm font-semibold", s.text)}>
        {message || <span className="text-silver/60 italic">(prázdna správa)</span>}
      </p>
      {link && linkLabel && (
        <a
          href={link || "#"}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.preventDefault()}
          className="border border-current px-3 py-1 text-xs font-bold uppercase tracking-wide"
        >
          {linkLabel}
        </a>
      )}
      {dismissible && (
        <button className="text-current opacity-60 hover:opacity-100" title="Dismissible">
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function MaintenancePreview({
  title, message, estimatedReturn, contactEmail, enabled,
}: {
  title: string;
  message: string;
  estimatedReturn: string;
  contactEmail: string;
  enabled: boolean;
}) {
  return (
    <div className={cn(
      "relative overflow-hidden border bg-ink p-5",
      enabled ? "border-neon-red/40" : "border-charcoal"
    )}>
      {/* Strobe background hint */}
      <div className={cn(
        "pointer-events-none absolute inset-0 opacity-20",
        enabled && "bg-gradient-to-br from-neon-red/30 via-transparent to-warm-yellow/20"
      )} />
      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <Power className={cn("h-5 w-5", enabled ? "text-neon-red" : "text-silver")} />
          <span className="font-mono-brand text-[10px] uppercase tracking-[0.2em] text-silver">
            {enabled ? "MAINTENANCE MODE" : "PREVIEW"}
          </span>
        </div>
        <p className="font-display text-xl font-extrabold text-off-white">
          {title || "Web sa pripravuje"}
        </p>
        <p className="mt-2 text-sm text-silver">
          {message || <span className="italic text-silver/50">(správa sa zobrazí tu)</span>}
        </p>
        {estimatedReturn && (
          <p className="mt-3 inline-flex items-center gap-1.5 border border-charcoal px-2 py-1 font-mono-brand text-[10px] uppercase tracking-wider text-warm-yellow">
            <Clock className="h-3 w-3" /> Predpokladaný návrat: {estimatedReturn}
          </p>
        )}
        {contactEmail && (
          <p className="mt-3 text-xs text-silver/60">
            Kontakt: <a href={`mailto:${contactEmail}`} className="text-neon-red hover:underline">{contactEmail}</a>
          </p>
        )}
      </div>
    </div>
  );
}
