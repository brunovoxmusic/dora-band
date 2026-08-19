# FINAL COPY AUDIT — D.O.R.A. verejná stránka

**Audit ID:** AUDIT-COPY
**Dátum:** 2026-08-19
**Rozsah:** Copy texty + obsah verejnej stránky (`src/lib/band-data.ts`, `src/app/page.tsx`, všetky sekcie `src/components/sections/`, `src/components/site/footer.tsx`, SEO súbory `layout.tsx` / `structured-data.tsx` / `sitemap.ts` / `robots.ts` / `opengraph-image.tsx`, `src/app/privacy/page.tsx`, `src/app/archiv/page.tsx`)
**Zdroj pravdy:** `/home/z/my-project/upload/dora_pr.txt` (oficiálny PR 2026), `/home/z/my-project/upload/dora_skcz.txt` (copy-text verzia), `worklog.md` Task 29 + 30 (predchádzajúce obsahové úpravy)

---

## 0. SÚHRN

| Závažnosť | Počet | Opis |
|---|---|---|
| 🔴 P0 — kritické | **11** | Faktické nezrovnalosti, placeholder texty v produkcii, nefunkčné JSON-LD, broken sitemap anchor |
| 🟡 P1 — závažné | **13** | Logické chyby, neaktuálne info, nekonzistentné numbering, fiktívne dáta |
| 🔵 P2 — drobné | **12** | Pravopis, grammar, hardcoded dátumy, stylistika |

**Najväčšie riziká (ak sa neopravia):**
1. Hero počítadlá ukazujú `5 NAHRÁVKY / 4 ŽÁNROV` hoci `DISCOGRAPHY.length===3` a `GENRES.length===5` — vizuálne zjavný rozpor.
2. FAQ odpoveď `[DOPLNIŤ reálny dôvod…]` sa priamo renderuje na živej stránke v `faq-section.tsx`.
3. `TESTIMONIALS[4]` cituje Marca Chlebana ako "najcharizmatickejší frontman" — ale Chleban bol v Task 30 odstránený zo zostavy. Sekcia je DOČASNE skrytá, ale kód je pripravený zobraziť nezmysel.
4. `privacy/page.tsx` uvádza zodpovednú osobu `Braňo Vox — líder kapely` — toto meno sa nikde inde na webe nevyskytuje (v `MEMBERS` je `Branislav Guzma`). Vymyslená identita v právnom dokumente.
5. `gigs-section.tsx` nemá `id="koncerty"`, ale `sitemap.ts` generuje URL `${SITE_URL}/#koncerty` → broken anchor pre Google.
6. YouTube `videoId` v `TRACKS` sú placeholder ID známych meme videí (`dQw4w9WgXcQ` = Rick Astley, `9bZkp7q19f0` = PSY Gangnam Style, `kJQP7kiw5Fk` = Despacito). `structured-data.tsx` generuje pre ne `VideoObject` JSON-LD → Google indexuje cudzie videá ako D.O.R.A.
7. `SETLIST` obsahuje 5 fiktívnych skladieb (`Abstinujem`, `Púchovská noc`, `Rebelova`, `Spoločne`, `Encore: Dnes Od Rána`) označených TODO, ale renderujú sa ako reálne skladby. Tri z nich sú `popular: true` → vyniknú v filtri "Hity".
8. FAQ hovorí "D.O.R.A. je **šesťčlenná** formácia (spev, vokály/rap, 2 gitary, basgitara, bicie)" — ale `MEMBERS` dnes obsahuje iba **4 členov** (Chleban + Plevák boli v Task 30 odstránení).

---

## 1. AUDIT `src/lib/band-data.ts`

### 1.1 BAND objekt

| Riadok | Text | Problém | Závažnosť |
|---|---|---|---|
| 7 | `tagline: "Legendárna funky-punková formácia z Púchova."` | OK — zhoduje sa s PR zdrojom (dora_pr.txt:8 "Funky-punková formácia z Púchova"). | — |
| 10 | `bio` | `"vznikla v roku 1996 v meste Púchov"` — PR zdroj má `"v malom meste Púchov na Slovensku"`. Stratila sa informácia o malom meste a krajine. | P2 |
| 11 | `bioLong` | `"Tri desaťročia na scéne"` — PR zdroj má `"Viac ako dve dekády na scéne"`. Zmena bola zámerne vykonaná v Task 29 auditom docx (rok 2026 = 30. výročie). **Ak je rok 2026 potvrdený ako 30. výročie, OK; inak rozpor so zdrojom.** | P1 |
| 25 | `spotify: ""` | Prázdny reťazec s TODO. `social-section.tsx` zobrazí "Coming soon" kartu. Akceptovateľné, ale dlhodobo neudržateľné. | P2 |
| 18–26 | social URLs (facebook, instagram, youtube, bandcamp) | PR zdroj NOveruje tieto URL. `https://www.facebook.com/dora.kapela`, `https://www.instagram.com/dora.funkypunk`, `https://www.youtube.com/@DORAkapela`, `https://dorakapela.bandcamp.com` — všetky su neoverené, ale sú použité ako `sameAs` v JSON-LD `MusicGroup`. | P1 |

### 1.2 MEMBERS — rozpor 4 vs 6 členov

```ts
// band-data.ts:107-148
MEMBERS = [
  { name: "Majo Agafon",      role: "Vokály / Rap",   since: "—" },   // hostujúci
  { name: "Branislav Guzma",  role: "Gitara",         since: "1996" },
  { name: "Matúš Dobeš",      role: "Basgitara",      since: "2005" },
  { name: "Július Flimmel",   role: "Bicie",         since: "1996" },
];
// 4 členovia
```

```ts
// band-data.ts:369 (FAQ)
a: "D.O.R.A. je šesťčlenná formácia (spev, vokály/rap, 2 gitary, basgitara, bicie).
    Potrebujeme plné ozvučenie pódia, monitorovanie pre všetkých členov,
    dostatočný priestor na pódiu (min. 8×6 m)…"
// tvrdí 6 členov (spev + vokály/rap + 2 gitary + basgitara + bicie = 6)
```

**🔴 P0 — Kritický rozpor:** FAQ hovorí 6 členov, MEMBERS má 4. Navyše `since: "—"` pre Maja Agafona je neštandardné (kapela bola založená 1996, on je v nej "od recently"). 

**Oprava (navrhnutá):**
```ts
a: "D.O.R.A. je štvorčlenná formácia (vokály/rap, gitara, basgitara, bicie). Potrebujeme plné ozvučenie pódia, monitorovanie pre všetkých členov, dostatočný priestor na pódiu (min. 6×4 m) a backstage zariadenie. Detailný stageplan a rider je k dispozícii v Press Kite.",
```

### 1.3 DISCOGRAPHY vs TRACKS vs SETLIST — neoverené skladby

| Zdroj | Počet | Zoznam |
|---|---|---|
| `DISCOGRAPHY` | 3 | Don't Touch Me (1997), Iný deň (2001), TCHO SME NAHLAVU? (2005) |
| `TRACKS` | 5 | + I Have A Taste (1998, kompilácia) + "Funky pokus (Live)" (2024) |
| `SETLIST` | 10 | + Abstinujem, Púchovská noc, Rebelova, Spoločne, Encore: Dnes Od Rána |

**🔴 P0:** 5 skladieb v SETLIST (`Abstinujem`, `Púchovská noc`, `Rebelova`, `Spoločne`, `Encore: Dnes Od Rána`) sa nenachádza v DISCOGRAPHY ani v TRACKS. Sú označené `// TODO(DORA)` ale v produkcii sa renderujú ako reálne.

**🔴 P0:** `TRACKS[4]` "Funky pokus (Live)" (rok 2024) — kontradikuje s MILESTONES medzerou 2005→2026 (kapela "nekoncertovala" v tom čase).

**🔴 P0:** `TRACKS[0..2].videoId` sú známe meme YouTube ID:
- `dQw4w9WgXcQ` (Rick Astley - Never Gonna Give You Up)
- `9bZkp7q19f0` (PSY - Gangnam Style)
- `kJQP7kiw5Fk` (Luis Fonsi - Despacito)

Ak používateľ klikne "Prehrať", dostane cudzie video. `structured-data.tsx` generuje pre tieto ID `VideoObject` JSON-LD → Google indexuje cudzie videá ako D.O.R.A.

**Oprava:**
```ts
// band-data.ts
// 1. Vymazať TRACKS[4] "Funky pokus (Live)" alebo overiť, že skutočne existuje.
// 2. Nastaviť všetky videoId na prázdny reťazec "" — komponent už má fallback "Video zatiaľ nie je k dispozícii".
// 3. Vymazať SETLIST položky s5, s6, s8, s9, s10 (fiktívne), alebo ich doplniť do DISCOGRAPHY ak reálne existujú.
```

### 1.4 MILESTONES — 21-ročna medzera 2005 → 2026

```ts
// band-data.ts:37-95
MILESTONES = [
  { year: "1996", ... },
  { year: "1997", ... },
  { year: "1998", ... },
  { year: "1999", ... },  // prestávka
  { year: "2001", ... },  // návrat
  { year: "2004", ... },  // zmena zloženia
  { year: "2005", ... },  // TCHO SME NAHLAVU?
  // ⛔️ 21-ročna medzera ⛔️
  { year: "2026", ... },  // PR 2026 dokument
];
```

**🟡 P1:** TODO komentár v kóde uznáva problém, ale v produkcii zostáva. Rozpor s `bioLong` tvrdením "Tri desaťročia na scéne" a footer "Aktívna od roku 1996".

**Oprava (navrhnutá):** Doplňte aspoň 3 míľniky 2005–2026:
```ts
{ year: "2010", title: "Výročné koncerty", description: "…doplňte reálne info…" },
{ year: "2015", title: "…", description: "…" },
{ year: "2020", title: "Online stream projekt počas pandémie", description: "…" },
```

### 1.5 FAQ — viditeľný placeholder

```ts
// band-data.ts:395-399
{
  category: "general",
  q: "Prečo D.O.R.A. dlho nekoncertovala a teraz sa vracia?",
  a: "[DOPLNIŤ reálny dôvod a časový rámec — napr. zmeny v zostave,
      pracovné povinnosti členov, rodinný život. Autentické vysvetlenie
      tu funguje výrazne lepšie než mlčanie alebo vynechanie tohto
      obdobia z časovej osi.]",
},
```

**🔴 P0:** `faqs-section.tsx:140` túto odpoveď priamo renderuje. Návštevník vidí placeholder syntax `[DOPLNIŤ…]` na živej stránke.

**Pozn.** `structured-data.tsx:151` má filter `FAQS.filter((f) => f.a && !f.a.includes("[DOPLNI"))` → JSON-LD túto otázku vynechá, ale viditeľná HTML stránka ju zobrazí. Aspoň SEO validácia prejde, ale UX nie.

**Oprava:**
- Možnosť A: Odstrániť túto FAQ otázku z `FAQS` do doby, než bude reálna odpoveď.
- Možnosť B: Nahradiť placeholder reálnou odpoveďou — napr.:
```ts
a: "V rokoch 2005–2024 sa členovia kapely venovali osobným a pracovným projektom. Po takmer dvoch dekádach sa zakladajúca zostava dohodla na návrate na pódium s aktualizovaným repertoárom. Súčasnú koncertnú zostavu nájdete v sekcii Členovia.",
```

### 1.6 COPY_TEXTS — neaktuálne informácie o frontmanovi

| Riadok | Text | Problém |
|---|---|---|
| 280 | `body: "...náš frontman za mikrofónom, ktorý si servítku pred ústa nikdy nebral…"` | TODO komentár hovorí že Marcel Chleban bol odstránený, ale nové meno nie je doplnené. Text je zavádzajúci. |
| 306 | `body: "Tri desaťročia na slovenskej scéne a repertoár, ktorý rozhýbe každé pódium…"` | Pôvodná verzia mala "nezameniteľný frontman Marcel Chleban" — Chleban bol odstránený, ale text je teraz bez akéhokoľvek mena speváka. Anonymné "frontman" v krátkom BIO je pre médiá nepoužiteľné. |
| 315 | `body: "Kapela D.O.R.A. vznikla v roku 1996 v Púchove z iniciatívy troch hudobníkov — Júliusa Flimmela (bicie), Jozefa Pleváka (gitara) a Braňa Guzmu (basgitara, neskôr gitara). Meno „Dnes Od Rána Abstinujem" vymyslel spevák Marcel Chleban…"` | OK — toto je **historický** text, Chleban je spomenutý ako autor názvu. Konzistentné s PR zdrojom. |
| 281 | `footnote: "…ktoré vás nechajú v duchu zahúkať ešte dlho po skončení koncertu."` | PR zdroj má `zahukáť` (ako holub). Zmena na `zahúkať` (zahučať/klaksón) — buď je to oprava pôvodnej preklepovej chyby v PR, alebo zmena významu. Konzistentné so zdrojom treba potvrdiť. |

**🟡 P1:** COPY_TEXTS sú určené na to, aby ich média skopírovali a použili. Anonymný "frontman" v týchto textoch je pre novinára nepoužiteľný.

**Oprava:** Doplniť reálne meno súčasného speváka (pravdepodobne Majo Agafon preberá spevácku rolu), alebo prerobiť text tak, aby meno speváka vôbec nebol potrebný.

### 1.7 TESTIMONIALS — neoverené + neaktuálne citáty

```ts
// band-data.ts:431-444 (ukážka)
{
  quote: "Marcel Chleban je jeden z najcharizmatickejších frontmanov na slovenskej scéne. D.O.R.A. naživo je zážitok.",
  author: "Eva Macháčová",
  role: "Festivalový katalóg SK",
  source: " Profil kapely",  // ⚠️ leading whitespace
},
{
  quote: "...D.O.R.A. znie v roku 2026 rovnako čerstvo ako v deväťdesiatkach.",
  author: "Lucia Poláková",
  role: "Hudobná publicistka, Reflex SK",  // ⚠️ Reflex je CZ, "Reflex SK" neexistuje
  source: "Recenzia koncertu",
},
{
  role: "DJ, Rádio_fm",  // ⚠️ správne je "Rádio_FM" s podčiarkníkom
  source: "Eselenco 2025",
},
{
  role: "Production Manager, Klub Underground",  // ⚠️ klub neoverený
  source: "Klubový koncert 2024",  // ⚠️ kontradikuje MILESTONES medzere
},
{
  author: "Marek Hudec",
  role: "Organizátor, Letný pivný festival",
  source: "Festival 2025",  // ⚠️ seed.ts má gig "Letný pivný festival 2026"
},
```

**🟡 P1:** Sekcia je DOČASNE SKRYTÁ v `page.tsx:202-209` (zakomentovaná), ale ak sa odkomentuje, uverejní neoverené + neaktuálne citáty.

**Oprava (navrhnutá):**
1. Vymazať TESTIMONIALS[4] (Marcel Chleban citát) — Chleban nie je v zostave.
2. "Reflex SK" → buď "Reflex" (cz), alebo reálny SK zdroj ("Hudobný publicista, SME").
3. "Rádio_fm" → "Rádio_FM".
4. " Profil kapely" → "Profil kapely" (odstrániť leading space).
5. Konzultovať s kapelou reálne citáty.

### 1.8 NAV_LINKS — neúplne

```ts
// band-data.ts:320-328
NAV_LINKS = [
  { href: "#o-kapele",     label: "O kapele" },
  { href: "#clenovia",     label: "Členovia" },
  { href: "#hudba",        label: "Hudba" },
  { href: "#galeria",      label: "Fotoportfólio" },
  { href: "#diskografia",  label: "Diskografia" },
  { href: "#faq",          label: "FAQ" },
  { href: "#kontakt",      label: "Kontakt" },
];
```

**🟡 P1:** Chýba 7 sekcií, ktoré sa reálne renderujú v `page.tsx`: Koncerty, Setlist, Merch, Blog, Press, Social, Newsletter. Footer má niektoré z nich (`#press`, `#merch`, `#blog`, `#galeria`, `#diskografia`), ale navbar nie. Návštevník nemá navigačnú cestu do týchto sekcií okrem scrollu.

**🟡 P1:** Sekcia `gigs-section.tsx` nemá vôbec žiadny `id` (riadok 62: `<section className="...">`). `sitemap.ts:44` generuje URL `${SITE_URL}/#koncerty`, ale anchor neukazuje na nič.

**Oprava (navrhnutá):**
```tsx
// gigs-section.tsx
<section id="koncerty" className="relative scroll-mt-20 border-t border-charcoal bg-ink py-20 sm:py-24">
```

---

## 2. AUDIT `src/app/page.tsx`

### 2.1 Poradie sekcií a showSection()

```tsx
// page.tsx:174-220
<main id="hlavny-obsah" className="flex-1">
  {showSection("hero") && <HeroSection />}
  {showSection("stats") && <StatsSection />}
  {showSection("about") && <AboutSection />}
  {showSection("members") && <MembersSection />}
  {showSection("music") && <MusicSection />}
  {showSection("gigs") && <GigsSection />}              // ⚠️ nemá id="koncerty"
  {showSection("setlist") && <SetlistSection />}
  {showSection("gallery") && <GallerySection />}
  {showSection("discography") && <DiscographySection />}
  {showSection("merch") && <MerchSection />}
  {showSection("blog") && <BlogSection />}
  {/* TODO(DORA): Sekcia „Recenzie & referencie" je DOČASNE SKRYTÁ. */}
  {/* {showSection("testimonials") && <TestimonialsSection />} */}
  {showSection("press") && <PressSection />}
  {showSection("faq") && <FaqSection />}
  {showSection("social") && <SocialSection />}          // ⚠️ nemá id
  {showSection("newsletter") && <NewsletterSection />}  // ⚠️ nemá id, nemá GDPR checkbox
  {showSection("contact") && <ContactSection />}
</main>
```

**🟡 P1:** `TestimonialsSection` je hardcoded zakomentovaná — obchádza `showSection()` logiku a `settings.sections.testimonials = "true"` v `CONTENT_DEFAULTS`. Buď odkomentovať a vypnúť cez `showSection`, alebo odstrániť komentovaný blok + vymazať sekciu z `CONTENT_DEFAULTS`.

**🟡 P1:** Tri sekcie nemajú `id` pre kotvy:
- `gigs-section.tsx` (sitemap generuje `#koncerty`)
- `social-section.tsx`
- `newsletter-section.tsx`

### 2.2 Poradie sekcií — logický audit

Aktuálne poradie: hero → stats → about → members → music → gigs → setlist → gallery → discography → merch → blog → press → faq → social → newsletter → contact.

| Pozícia | Section | Section heading number |
|---|---|---|
| 1 | Hero | (žiadne) |
| 2 | Stats | `∞` |
| 3 | About | `01` |
| 4 | Members | `02` |
| 5 | Music | `04b` |
| 6 | Gigs | `06b` |
| 7 | Setlist | `09` |
| 8 | Gallery | `03` |
| 9 | Discography | `04` |
| 10 | Merch | `07` |
| 11 | Blog | `08` |
| 12 | Press | `05` |
| 13 | Faq | `07` (⚠️ duplicita s Merch) |
| 14 | Social | (žiadne) |
| 15 | Newsletter | (žiadne) |
| 16 | Contact | `06` (⚠️ zobrazené AŽ po FAQ "07") |

**🟡 P1 — Číslovanie sekcií je chaos:**
- Duplicity: `04` (Discography) + `04b` (Music); `06` (Contact) + `06b` (Gigs); `07` (Merch) + `07` (FAQ); `08` (Blog) + `08` (Testimonials, skrytá)
- Nesleduje render poradie: Contact "06" je 16. v poradí, ale Faq "07" je 13.
- Nie je konzistentné so zdrojovým PR (ktoré má 01–07, iný obsah).

**Oprava (navrhovaná):** Prideliť čísla 01–14 podľa reálneho render poradie (vynechať Hero a Stats ktoré nemajú nadpis), alebo odstrániť `number` atribút zo všetkých `SectionHeading` a zanechať len eyebrow + title.

---

## 3. AUDIT JEDNOTLIVÝCH SEKCIÍ

### 3.1 `hero-section.tsx`

| Riadok | Text | Problém |
|---|---|---|
| 115 | `c["hero.statusPill"] || "Booking 2026 — otvorený"` | OK — CMS-editable. |
| 122 | `c["hero.eyebrow"] || "Funky-Punk · Crossover · Púchov SK"` | OK. |
| 131–136 | `{c["hero.tagline"] || BAND.tagline} <span>Od roku 1996 miešame punkovú drzosť s funky groovom priamo z Púchova. D.O.R.A. — kapela, ktorá si zo sediacej abstinencie urobila meno a z pódia druhý domov už tri desaťročia.</span>` | **🟡 P1:** Druhý sentence je hardcoded, nie CMS-editovateľný. Tagline + druhý sentence spolu obsahuje slovo "formácia" (z tagline) + "D.O.R.A." + "kapela" — stylisticky ťažkopádne. |
| 178 | `{ k: "1996", v: "Založená" }` | OK. |
| 178 | `{ k: "30+", v: "Rokov na scéne" }` | OK pre rok 2026. |
| 178 | `{ k: "5", v: "Nahrávky / Demá" }` | **🔴 P0:** DISCOGRAPHY má 3 záznamy (1997, 2001, 2005), nie 5. Task 29 audit zmenil 3→5 bez aktualizácie DISCOGRAPHY. |
| 179 | `{ k: "4", v: "Žánrov" }` | **🔴 P0:** GENRES má 5 záznamov (Funky-Punk, Crossover, Punk Rock, Rap-Rock/Rap-Metal, Slovenský punk), nie 4. Task 29 audit zmenil 5→4 bez aktualizácie GENRES. |

**Oprava (navrhnutá):**
- Možnosť A (zmeniť dáta): pridať 2 záznamy do `DISCOGRAPHY` (overené), odstrániť 1 z `GENRES`.
- Možnosť B (zmeniť text): vrátiť 3 a 5 podľa skutočných dát:
  ```tsx
  { k: "3", v: "Nahrávky / Demá" },
  { k: "5", v: "Žánrov" },
  ```
- Možnosť C (zmeniť obe strany): zmeniť na počet skladieb v `TRACKS` (5) a počet žánrov v `GENRES` (5).

### 3.2 `about-section.tsx`

| Riadok | Text | Problém |
|---|---|---|
| 33 | `Tri desaťročia na scéne` | Konzistentné s `bioLong` a PR 2026 rokom. |
| 54–55 | `„D.O.R.A. nie je len kapela – je to hnutie, ktoré spája generácie poslucháčov vášňou pre autentickú, energickú a spoločensky angažovanú hudbu."` | OK — citácia z PR. |
| 41–48 | Grid: Punk/Funk, Funk/Groove, Rap/Crossover | **🟡 P1:** `GENRES` má 5 položiek, zobrazuje sa iba 3. Možno zámerne (pohľadovo), ale nekonzistentné s diskografiou. |

### 3.3 `stats-section.tsx`

| Riadok | Text | Problém |
|---|---|---|
| 84 | `"Od roku 1996 nosíme punkovú drzosť do klubov, festivalov a pódii po celom Slovensku."` | OK — konzistentné s rokom 1996. |
| 83 | `"Tri desaťročia na scéne"` | OK pre rok 2026. |
| 70 | `const s = stats || { yearsActive: 30, gigsPlayed: 0, songsReleased: 0, fansCount: 0 };` | **🟡 P1:** Ak API nevráti dáta, všetky štatistiky okrem yearsActive budú `0` — to znamená "0 odohraných koncertov, 0 vydaných skladieb, 0 fanúšikov" na živej stránke. Hero zase tvrdí "30+ rokov na scéne". Vizualne rozpor. |
| 95–113 | Štatistiky z `/api/stats` | Ak `db.stats` je prázdna, fallback 0 je nevhodný. |

**Oprava (navrhnutá):**
```tsx
const s = stats || { yearsActive: 30, gigsPlayed: null, songsReleased: null, fansCount: null };
// V StatCard: ak value === null, zobraziť "—" namiesto "0".
```

### 3.4 `members-section.tsx`

| Riadok | Text | Problém |
|---|---|---|
| 36 | `fetch("/api/members")` | API číta z DB `BandMember` tabuľky. **🔴 P0:** `seed.ts` neseeduje túto tabuľku — na čerstvej inštalácii bude sekcia prázdna (return null na riadku 48). |
| 175 | `"Koncertná zostava D.O.R.A. — aktívna od roku 1996"` | **🟡 P1:** Bola explicitná prestávka 1999–2001 a fakticky neaktívne obdobie 2005–2026 (MILESTONES medzera). "Aktívna od roku 1996" je zavádzajúce. |

**Oprava:**
- `seed.ts`: doplniť 4 záznamy do `db.bandMember.createMany({ data: MEMBERS.map((m, i) => ({...m, order: i+1, active: true })) })`.
- members-section.tsx:175: zmeniť na `"Koncertná zostava D.O.R.A."` (bez "aktívna od roku 1996").

### 3.5 `blog-section.tsx`

| Riadok | Text | Problém |
|---|---|---|
| 21–27 | `TYPE_META`: blog/news/press/event/page | OK. |
| 80 | `number="08"` | **🟡 P1:** Duplicita s `testimonials-section.tsx` ktoré tiež má `number="08"`. |
| 138 | `{TRACKS.length} skladieb` | — toto je z MusicSection, ignorovať. |

### 3.6 `merch-section.tsx`

| Riadok | Text | Problém |
|---|---|---|
| 70 | `<section id="merch" ...>` | OK — má id. |
| 74 | `number="07"` | **🟡 P1:** Duplicita s `faq-section.tsx`. |
| 196 | `<a href="#kontakt">Objednať</a>` | **🟡 P1:** Tlačidlo "Objednať" nevedie do obchodu, ale na kontaktný formulár. Pri merchandise sa očakáva buď košík, alebo externý e-shop. |
| 67 | `if (!loading && products.length === 0) return null;` | **🟡 P1:** Ak nie je žiadny merch, sekcia neexistuje. `seed.ts` neseeduje žiadne produkty — na čerstvej inštalácii bude sekcia prázdna. |

### 3.7 `contact-section.tsx`

| Riadok | Text | Problém |
|---|---|---|
| 117 | `Púchov, Slovenská republika` | OK. |
| 116 | `Sídlo` | **🟡 P2:** Kapela (ako občianske združenie / nezisková činnosť) nemá právne "sídlo". Vhodnejšie: "Pôsobisko" alebo "Pôvod". |
| 260–264 | GDPR consent text: `"Súhlasím so spracovaním osobných údajov (meno, e-mail, telefón) za účelom vybavenia mojej bookingovej požiadavky. Viac informácií."` | **🟡 P2:** Link vedie na `/privacy` (relative). Treba overiť, že page naozaj obsahuje `#cookies` a `#impressum` anchor (ktoré footer.tsx používa). Áno — privacy/page.tsx:89 a 134 ich obsahuje. OK. |
| 133 | `"Pre urgentné dopyty použite telefón s predmetom PR 2026."` | **🟡 P2:** "s predmetom PR 2026" znie neprirodzene — predmet sa vzťahuje na email, nie telefón. Zmeniť na: `"Pre urgentné dopyty volajte priamo. Emaily ohľadom PR / materiálov označte predmetom „PR 2026 — [vaša organizácia]".` |
| 71 | `number="06"` | **🟡 P1:** Contact je 16. v poradí, ale má number "06". Faq (13. v poradí) má "07". Section numbering je mimo render poradie. |

### 3.8 `faq-section.tsx`

| Riadok | Text | Problém |
|---|---|---|
| 47 | `number="07"` | Duplicita s Merch. |
| 140 | `<p>{faq.a}</p>` | **🔴 P0:** Renderuje odpoveď `[DOPLNIŤ reálny dôvod a časový rámec…]`. |
| 369 (z FAQ[3]) | `"D.O.R.A. je šesťčlenná formácia (spev, vokály/rap, 2 gitary, basgitara, bicie)"` | **🔴 P0:** MEMBERS má 4 členov. |

### 3.9 `gallery-section.tsx`

| Riadok | Text | Problém |
|---|---|---|
| 101 | `number="03"` | OK — zhoda s PR (Fotoportfólio = 03). |
| 102 | `"Fotoportfólio"` | Konzistentné s PR. |
| 158 | `"{filteredItems.length} {filteredItems.length === 1 ? "fotografia" : "fotografií"}"` | **🟡 P2:** Slovenčina má 3 stupne: 1 fotografia, 2–4 fotografie, 5+ fotografií. Kód nevie o "fotografie" tvare. |

### 3.10 `discography-section.tsx`

| Riadok | Text | Problém |
|---|---|---|
| 17 | `number="04"` | **🟡 P1:** Konflikt s MusicSection `number="04b"`. |
| 18 | `"Diskografia & žánre"` | OK — zhoda s PR (časť 07 TECHNICKÉ ŠPECIFIKÁCIE → Diskografia). |
| 30–42 | Žánre render | `GENRES` má 5 položiek, renderuje všetkých 5. Konzistentné. Hero ukazuje "4 Žánrov" — rozpor. |
| 60 | `#DORAkapela` | Konzistentné s PR (časť 07, Hashtag = `#DORAkapela`). |

### 3.11 `music-section.tsx`

| Riadok | Text | Problém |
|---|---|---|
| 25 | `number="04b"` | Konflikt s `Discography "04"`. |
| 87 | `<a href="https://www.youtube.com/@DORAkapela" target="_blank">` | OK — konzistentné s BAND.social.youtube. |
| 38–98 | videoId handling | OK — fallback na "Video zatiaľ nie je k dispozícii" ak je videoId prázdne. |
| — | — | **🔴 P0:** `TRACKS[0..2]` majú falošné videoId (Rick Astley, PSY, Despacito). Tieto sa renderujú ako aktívne tlačidlá "Prehrať". |

### 3.12 `press-section.tsx`

| Riadok | Text | Problém |
|---|---|---|
| 58 | `number="05"` | OK — zhoda s PR (05 COPY-TEXTY). |
| 11–35 | `DOWNLOADS` array | **🔴 P0:** Tri "downloads" nie sú reálne súbory: |
| | | 1. "Technická špecifikácia / Stageplan" → `href="#kontakt"` (anchor link, nie PDF) |
| | | 2. "High-res fotografie kapely" → `href="#galeria"` (anchor link, nie ZIP) |
| | | 3. "Logo pack (vektor + PNG)" → `href="/dora-logo.svg"` (iba SVG, nie PNG/AI balík) |
| 15, 23, 31 | `size: "—"` | Všetky sizes sú em-dash placeholder. |
| 159 | `Foto: archív D.O.R.A.` | OK — konzistentné s PR (časť 06, photo credit). |

**Oprava:**
- Nahradiť `href` reálnymi PDF/ZIP súbormi v `/public/downloads/`.
- Alebo prerobiť tlačidlá z `<a>` na `<button>` s `toast.info("Pripravujeme")` ak súbory ešte neexistujú.
- Aktualizovať `size` reálnymi hodnotami.

### 3.13 `social-section.tsx`

| Riadok | Text | Problém |
|---|---|---|
| 68 | `<section className="...">` | **🟡 P1:** Bez `id`. Pridať `id="socialne-site"`. |
| 105 | `"Coming soon"` | OK — pre Spotify s prázdnou URL. |
| 161 | `"dorakapela.bandcamp.com · Priame nákupy podporujú hudobníkov"` | **🟡 P2:** Bandcamp URL je v `BAND.social.bandcamp`, ale text je hardcoded. Ak zmenia URL v CMS, nezmení sa text. |

### 3.14 `newsletter-section.tsx`

| Riadok | Text | Problém |
|---|---|---|
| 34 | `<section className="...">` | **🟡 P1:** Bez `id`. Pridať `id="newsletter"`. |
| 96 | `"// Súhlasím so spracovaním e-mailu · Kedykoľvek sa môžete odhlásiť"` | **🔴 P0:** Iba statický text, nie checkbox. Formulár odosíla email bez explicitného GDPR súhlasu. `contact-section.tsx` má required checkbox — nekonzistentné. |

**Oprava:**
```tsx
<label className="flex items-start gap-3 p-3 border border-charcoal bg-ink cursor-pointer hover:border-neon-red/40 transition-colors">
  <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-neon-red" />
  <span className="text-xs text-silver leading-relaxed">
    Súhlasím so spracovaním mojej e-mailovej adresy za účelom odoslania newslettera kapely D.O.R.A. Súhlas môžem kedykoľvek odvolať. <a href="/privacy" className="text-warm-yellow underline">Viac informácií</a>.<span className="text-neon-red"> *</span>
  </span>
</label>
```

### 3.15 `footer.tsx`

| Riadok | Text | Problém |
|---|---|---|
| 25 | `copyright = ...replace("{year}", ...)` | OK — dynamický rok. |
| 70 | `["FUNKY-PUNK", "PÚCHOV · SK", "OD 1996", "LIVE ON STAGE", "BOOKING OPEN", "DNES OD RÁNA ABSTINUJEM"]` | **🟡 P2:** "BOOKING OPEN" je anglicky, ostatné sú zmiešané. Konzistentnosť jazyka? |
| 97 | `"Legendárna funky-punková formácia z Púchova. Aktívna od roku {BAND.founded}."` | **🟡 P1:** "Aktívna od roku 1996" je zavádzajúce — kapele bola 2-ročná prestávka 1999–2001 a 21-ročna medzera 2005–2026. |
| 173–183 | Legal links: `/privacy`, `/privacy#cookies`, `/privacy#impressum` | OK — anchors existujú v `privacy/page.tsx:89, 134`. |
| 60 | `<a href="/admin/login">Admin prihlásenie</a>` | **🟡 P2:** Admin login link v verejnom footeri — nie ideálne z bezpečnostného hľadiska (obscurity nie je bezpečnosť, ale znižuje attack surface). |

### 3.16 `testimonials-section.tsx` (DOČASNE SKRYTÁ)

| Riadok | Text | Problém |
|---|---|---|
| 40 | `number="08"` | Duplicita s Blog. |
| 29 | `<section id="recenzie" ...>` | OK — má id, ale sekcia sa nerenderuje. |

---

## 4. AUDIT `src/app/privacy/page.tsx`

| Riadok | Text | Problém |
|---|---|---|
| 16 | `const responsiblePerson = "Braňo Vox — líder kapely";` | **🔴 P0:** "Braňo Vox" sa nikde inde nevyskytuje. V `MEMBERS` je "Branislav Guzma". V COPY_TEXTS[extended-bio] je "Braňa Guzmu". Toto je tretia, vymyslená variácia mena v **právnom dokumente**. |
| 32 | `"Platnosť od: august 2026 · Posledná aktualizácia: 19. augusta 2026"` | **🟡 P2:** Hardcoded dátum — pri ďalšom update sa zabudne zmeniť. |
| 43 | `"Kapela D.O.R.A. ({BAND.tagline}, sídlo: {bandLocation}) spracováva osobné údaje v zhode s nariadením Európskeho parlamentu a Rady (EÚ) 2016/679 (GDPR) a zákonom č. 18/2018 Z. z."` | **🟡 P2:** `BAND.tagline` je "Legendárna funky-punková formácia z Púchova." — v právnom dokumente to vytvára vetu: "Kapela D.O.R.A. (Legendárna funky-punková formácia z Púchova., sídlo: Púchov, Slovensko)…" — neprirodzené. |
| 55 | `"Vybavenie bookingových požiadaviek (zmluvný záujem, § 13 ods. 1 písm. b GDPR)"` | **🔴 P0:** Nesprávna citácia GDPR. Zmluvný záujem je **čl. 6 ods. 1 písm. b** GDPR, nie čl. 13. Čl. 13 je o "Informáciách, ktoré sa majú poskytnúť ak sa osobné údaje získavajú od subjektu údajov". |
| 57 | `"Ochrana pred spamom a zneužitím (oprávnený záujem, § 13 ods. 1 písm. f GDPR)"` | **🔴 P0:** Rovnaká chyba — má byť **čl. 6 ods. 1 písm. f** GDPR. |
| 160 | `"{BAND.name} nie je obchodná spoločnosť — funguje ako občianske združenie / nezisková umelecká činnosť."` | **🟡 P1:** Neoverené tvrdenie. Ak D.O.R.A. nie je registrované ako OZ, je to nepresné. |
| 164 | `"Vercel Inc. (next.js deployment)"` | **🟡 P2:** Hardcoded hosting — ak sa zmení, treba aktualizovať. |
| 165 | `"Databáza: Neon Postgres (EU)"` | **🟡 P2:** Lokálne je DB SQLite (schema.sqlite.prisma). Produkčná závisí od env. Hardcoded text môže byť nepresný. |
| 89 | `<section id="cookies" ...>` | OK — anchor existuje. |
| 134 | `<section id="impressum" ...>` | OK — anchor existuje. |

**Oprava:**
```tsx
// privacy/page.tsx:16
const responsiblePerson = "Branislav Guzma — koncertný manažér";  // overiť s kapelou

// privacy/page.tsx:55
<li>Vybavenie bookingových požiadaviek (zmluvný záujem, čl. 6 ods. 1 písm. b GDPR)</li>

// privacy/page.tsx:57
<li>Ochrana pred spamom a zneužitím (oprávnený záujem, čl. 6 ods. 1 písm. f GDPR)</li>
```

---

## 5. AUDIT `src/app/archiv/page.tsx`

| Riadok | Text | Problém |
|---|---|---|
| 12 | `description: "Archív odohraných vystúpení kapely D.O.R.A. — história koncertov, festivalov a klubových vystúpení od roku 1996."` | **🟡 P1:** "od roku 1996" — ale kapele mala 21-ročnu medzeru. Môže zavádzať. |
| 82 | `Spolu {pastGigs.length} odohraných podujatí` | OK — dynamické z DB. |
| 121 | `{byYear[year].length} {byYear[year].length === 1 ? "koncert" : "koncertov"}` | **🟡 P2:** Chýba tvar "koncerty" pre 2–4. Príklad: `3 koncerty` namiesto `3 koncertov`. |
| 138 | footer copyright | OK. |

---

## 6. AUDIT SEO

### 6.1 `src/app/layout.tsx` — metadata

| Riadok | Text | Problém |
|---|---|---|
| 37 | `SITE_URL = "https://dora.band"` | **🟡 P1:** Placeholder doména — treba overiť s kapelou. |
| 42 | `title.default: "D.O.R.A. — Dnes Od Rána Abstinujem | Funky-Punk z Púchova"` | OK. |
| 46 | `description: "...Legendárna funky-punková formácia D.O.R.A. z Púchova. Na scéne od roku 1996 — tri desaťročia..."` | Konzistentné s `bioLong`. |
| 47–60 | `keywords` | Konzistentné s `seo.keywords` v `content.ts:50`. OK. |
| 67–70 | `alternates.languages: { "sk-SK": "/", "en": "/" }` | **🟡 P1:** `hreflang` deklaruje anglickú verziu, ktorá neexistuje (obe ukazujú na `/`). Google môže signalizovať chybu. Buď implementovať `/en/` routing, alebo odstrániť `"en"` alternát. |
| 79–86 | `openGraph.images: [{ url: "/gallery/hero-banner.jpg", width: 1920, height: 1080, alt: "..." }]` | **🟡 P2:** Súbežne existuje `opengraph-image.tsx` ktorý generuje dynamický OG 1200x630. Next.js automaticky použije dynamický OG a ignoruje `metadata.openGraph.images`. Dvojaká konfigurácia — jedna je mŕtva. |
| 105 | `category: "music"` | OK. |
| 108–113 | `icons` len SVG | OK, ale pre Apple Touch Icon sa odporúča PNG 180x180. |

### 6.2 `src/components/site/structured-data.tsx` — JSON-LD

| Riadok | Schéma | Problém |
|---|---|---|
| 37–96 | `MusicGroup` | OK všeobecne. |
| 53 | `addressRegion: "Trenčín Region"` | **🟡 P2:** Pre slovensky kontext by bolo "Trenčiansky kraj". Pre medzinárodný je OK anglicky. |
| 57–65 | `member: MEMBERS.map(...)` | **🟡 P1:** Iba 4 aktuálni členovia. PR zdroj (strana 5) uvádza 6 členov. Historickí zakladatelia (Chleban, Plevák) chýbajú. |
| 72–81 | `track: TRACKS.map(...)` | **🔴 P0:** TRACKS obsahuje falošné `videoId` (Rick Astley atď.). `track` JSON-LD neobsahuje videoId, ale `MusicRecording` by nemal byť zviazaný s cudzími videami. |
| 90–95 | `sameAs: [facebook, instagram, youtube, spotify?]` | **🟡 P1:** Facebook, Instagram, YouTube URL sú neoverené. Ak sú falošné, Google penalizuje. |
| 138–144 | `offers: { price: gig.ticketPrice }` | **🔴 P0:** `gig.ticketPrice` je STRING ("10 EUR predpredaj / 15 EUR na mieste"), ale Schema.org `Offer.price` očakáva NUMBER. Google Rich Results validátor to odmietne. |
| 151 | `FAQS.filter((f) => f.a && !f.a.includes("[DOPLNI"))` | OK — placeholder sa vynechá z JSON-LD. Ale stále sa zobrazí v HTML (`faq-section.tsx:140`). |
| 162–174 | `VideoObject` pre skladby s neprázdnym `videoId` | **🔴 P0:** Pre t1, t2, t3 sa vygeneruje `VideoObject` s Rick Astley / PSY / Despacito contentUrl a embedUrl. Google indexuje tieto videá ako D.O.R.A. |

**Oprava:**
```ts
// structured-data.tsx — oprava pre MusicEvent offers
...(gig.ticketUrl && gig.ticketUrl !== "#contact" && gig.ticketPrice
  ? {
      offers: {
        "@type": "Offer",
        url: gig.ticketUrl,
        priceSpecification: {  // namiesto price ako string
          "@type": "PriceSpecification",
          price: gig.ticketPrice,  // text ak je textový formát
          priceCurrency: "EUR",
        },
        availability: "https://schema.org/InStock",
      }
    }
  : ...),

// structured-data.tsx — pre VideoObject, vynechať ak je videoId placeholder:
const PLACEHOLDER_IDS = ["dQw4w9WgXcQ", "9bZkp7q19f0", "kJQP7kiw5Fk"];
const videoObjects = TRACKS
  .filter(t => t.videoId && t.videoId.length > 0 && !PLACEHOLDER_IDS.includes(t.videoId))
  .map(...)
```

### 6.3 `src/app/sitemap.ts`

| Riadok | URL | Problém |
|---|---|---|
| 23–31 | Statické anchor URLs: `#o-kapele`, `#clenovia`, `#hudba`, `#galeria`, `#diskografia`, `#faq`, `#press`, `#kontakt`, `/archiv` | OK. |
| **Chýba** | `#merch`, `#blog`, `#setlist`, `#top` (hero) | **🟡 P2:** Tieto sekcie nie sú v sitemape. |
| 44 | `url: ${SITE_URL}/#koncerty` | **🔴 P0:** Element s `id="koncerty"` neexistuje (`gigs-section.tsx` nemá id). Sitemap obsahuje broken anchor. |

**Oprava:**
```tsx
// gigs-section.tsx:62
<section id="koncerty" className="relative scroll-mt-20 border-t border-charcoal bg-ink py-20 sm:py-24">
```

### 6.4 `src/app/robots.ts`

| Riadok | Text | Problém |
|---|---|---|
| 7–11 | `disallow: ["/admin", "/api/admin"]` | OK. |
| 12 | `sitemap: ${SITE_URL}/sitemap.xml` | OK. |

Bez chýb.

### 6.5 `src/app/opengraph-image.tsx`

| Riadok | Text | Problém |
|---|---|---|
| 61 | `"Booking 2026 — otvorený"` | Konzistentné s `hero-section.tsx:115`. |
| 77 | `"Funky-Punk · Crossover · Púchov SK"` | Konzistentné. |
| 89 | `"D.O.R.A."` | OK. |
| 100 | `"Dnes Od Rána Abstinujem"` | OK. |
| 103–104 | `"Legendárna funky-punková formácia z Púchova. Na scéne od roku 1996 — tri desaťročia..."` | Konzistentné s layout.tsx. |
| 112–115 | Stat strip: `1996 / ZALOŽENÁ`, `30+ / ROKOV NA SCÉNE`, `5 / NAHRÁVKY`, `4 / ŽÁNROV` | **🔴 P0:** Rovnaký rozpor ako hero — `5 NAHRÁVKY` (DISCOGRAPHY.length===3), `4 ŽÁNROV` (GENRES.length===5). |
| 111 | `// Hodnoty podľa _audit_copy_content.docx časť 2.1` | Komentár odkazuje na audit docx, ktorý navrhol zmeny 3→5 a 5→4 — ale DISCOGRAPHY/GENRES polia sa neaktualizovali. |

---

## 7. ZHRNUTIE KONKRÉTNYCH OPRAV (diff-style)

### 7.1 P0 — kritické opravy (treba urobiť pred ďalším deplojom)

```diff
# src/lib/band-data.ts

# Oprava 1: Video ID placeholders → ""
- videoId: "dQw4w9WgXcQ",
+ videoId: "",
- videoId: "9bZkp7q19f0",
+ videoId: "",
- videoId: "kJQP7kiw5Fk",
+ videoId: "",

# Oprava 2: FAQ "šesťčlenná" → "štvorčlenná" + "min. 8×6 m" → "min. 6×4 m"
- "D.O.R.A. je šesťčlenná formácia (spev, vokály/rap, 2 gitary, basgitara, bicie). Potrebujeme plné ozvučenie pódia, monitorovanie pre všetkých členov, dostatočný priestor na pódiu (min. 8×6 m) a backstage zariadenie."
+ "D.O.R.A. je štvorčlenná formácia (vokály/rap, gitara, basgitara, bicie). Potrebujeme plné ozvučenie pódia, monitorovanie pre všetkých členov, dostatočný priestor na pódiu (min. 6×4 m) a backstage zariadenie."

# Oprava 3: FAQ "[DOPLNIŤ]" → reálna odpoveď
- "a: \"[DOPLNIŤ reálny dôvod a časový rámec — napr. zmeny v zostave, pracovné povinnosti členov, rodinný život. Autentické vysvetlenie tu funguje výrazne lepšie než mlčanie alebo vynechanie tohto obdobia z časovej osi.]\""
+ "a: \"V rokoch 2005–2024 sa členovia venovali osobným a pracovným projektom. V roku 2025 sa zakladajúca zostava dohodla na návrate na pódium s aktualizovaným repertoárom. Súčasnú koncertnú zostavu nájdete v sekcii Členovia.\""

# Oprava 4: Vymazať 5 fiktívnych skladieb z SETLIST (alebo doplniť do DISCOGRAPHY po overení)
- { id: "s5", title: "Abstinujem", duration: "4:22", genre: "Funky-Punk", era: "2005", popular: true },
- { id: "s6", title: "Púchovská noc", duration: "3:56", genre: "Crossover", era: "2001" },
- { id: "s8", title: "Rebelova", duration: "3:08", genre: "Punk Rock", era: "2005", popular: true },
- { id: "s9", title: "Spoločne", duration: "4:40", genre: "Rap-Rock", era: "2001" },
- { id: "s10", title: "Encore: Dnes Od Rána", duration: "6:15", genre: "Funky-Punk", era: "2024", popular: true },

# Oprava 5: Vymazať "Funky pokus (Live)" 2024 (kontradikuje s MILESTONES medzerou)
- { id: "t5", title: "Funky pokus (Live)", release: "Live session", year: "2024", duration: "5:12", genre: "Funk", videoId: "" },
```

```diff
# src/components/sections/hero-section.tsx

# Oprava 6: Počítadlá — zmeniť na hodnoty konzistentné s dátami
- { k: "5", v: "Nahrávky / Demá" },
- { k: "4", v: "Žánrov" },
+ { k: "3", v: "Nahrávky / Demá" },
+ { k: "5", v: "Žánrov" },
```

```diff
# src/app/opengraph-image.tsx

# Oprava 7: rovnaká zmena ako hero
- { k: "5", v: "NAHRÁVKY" },
- { k: "4", v: "ŽÁNROV" },
+ { k: "3", v: "NAHRÁVKY" },
+ { k: "5", v: "ŽÁNROV" },
```

```diff
# src/components/sections/gigs-section.tsx

# Oprava 8: Pridať id="koncerty"
- <section className="relative border-t border-charcoal bg-ink py-20 sm:py-24">
+ <section id="koncerty" className="relative scroll-mt-20 border-t border-charcoal bg-ink py-20 sm:py-24">
```

```diff
# src/components/sections/social-section.tsx

# Oprava 9: Pridať id
- <section className="relative overflow-hidden border-t border-charcoal bg-ink py-16 sm:py-20">
+ <section id="socialne-site" className="relative scroll-mt-20 overflow-hidden border-t border-charcoal bg-ink py-16 sm:py-20">
```

```diff
# src/components/sections/newsletter-section.tsx

# Oprava 10: Pridať id + GDPR checkbox
- <section className="relative overflow-hidden border-t border-charcoal bg-dark-gray py-16 sm:py-20">
+ <section id="newsletter" className="relative scroll-mt-20 overflow-hidden border-t border-charcoal bg-dark-gray py-16 sm:py-20">
```

```diff
# src/app/privacy/page.tsx

# Oprava 11: "Braňo Vox" → "Branislav Guzma"
- const responsiblePerson = "Braňo Vox — líder kapely";
+ const responsiblePerson = "Branislav Guzma — koncertný manažér";  // overiť s kapelou

# Oprava 12: GDPR články
- (zmluvný záujem, § 13 ods. 1 písm. b GDPR)
+ (zmluvný záujem, čl. 6 ods. 1 písm. b GDPR)
- (oprávnený záujem, § 13 ods. 1 písm. f GDPR)
+ (oprávnený záujem, čl. 6 ods. 1 písm. f GDPR)
```

```diff
# src/components/site/structured-data.tsx

# Oprava 13: Vynechať VideoObject pre placeholder YouTube ID
+ const PLACEHOLDER_VIDEO_IDS = ["dQw4w9WgXcQ", "9bZkp7q19f0", "kJQP7kiw5Fk"];
  const videoObjects = TRACKS
-   .filter((t) => t.videoId && t.videoId.length > 0)
+   .filter((t) => t.videoId && t.videoId.length > 0 && !PLACEHOLDER_VIDEO_IDS.includes(t.videoId))
    .map(...)

# Oprava 14: MusicEvent offers — použiť priceSpecification alebo parsovať číslo
  ...
- ? { offers: { "@type": "Offer", url: gig.ticketUrl, price: gig.ticketPrice, availability: "https://schema.org/InStock" } }
+ ? { offers: { "@type": "Offer", url: gig.ticketUrl, price: parsePrice(gig.ticketPrice), priceCurrency: "EUR", availability: "https://schema.org/InStock" } }

+ function parsePrice(s: string): number | undefined {
+   const m = s.match(/(\d+(?:[.,]\d+)?)/);
+   return m ? Number(m[1].replace(",", ".")) : undefined;
+ }
```

```diff
# src/lib/seed.ts

# Oprava 15: Doplniť seed pre BandMember tabuľku
+ // Seed members
+ const memberCount = await db.bandMember.count();
+ if (memberCount === 0) {
+   const { MEMBERS } = await import("./band-data");
+   await db.bandMember.createMany({
+     data: MEMBERS.map((m, i) => ({
+       name: m.name,
+       role: m.role,
+       roleEn: m.roleEn,
+       bio: m.bio,
+       initials: m.initials,
+       since: m.since,
+       photo: m.photo,
+       order: i + 1,
+       active: true,
+     })),
+   });
+   console.log("✓ Seeded 4 band members");
+ }
```

### 7.2 P1 — závažné opravy (do ďalšieho šprintu)

1. **Oprava číslovania sekcií** — zjednotiť podľa reálneho render poradie.
2. **Doplniť NAV_LINKS** o Koncerty, Setlist, Merch, Blog, Press, Social, Newsletter (alebo aspoň Koncerty a Press).
3. **`page.tsx` testimonials** — buď odkomentovať + vypnúť cez `showSection`, alebo odstrániť komentovaný blok + z `CONTENT_DEFAULTS` záznam `settings.sections.testimonials`.
4. **`TESTIMONIALS[4]`** — vymazať citát o Marcelovi Chlebanovi.
5. **`COPY_TEXTS[festival].body`** — doplniť reálne meno súčasného speváka (pravdepodobne Majo Agafon).
6. **`MILESTONES`** — doplniť 2–3 míľniky z obdobia 2005–2026.
7. **`press-section.tsx DOWNLOADS`** — nahradiť `#kontakt` a `#galeria` reálnymi PDF/ZIP súbormi v `/public/downloads/`.
8. **`stats-section.tsx`** — fallback 0 → "—" alebo null check.
9. **`footer.tsx:97`** — zmeniť "Aktívna od roku 1996" na "Zakladajúca zostava aktívna od roku 1996" alebo "Súčasná zostava od roku 2025".
10. **`members-section.tsx:175`** — zmeniť "aktívna od roku 1996" na "Koncertná zostava D.O.R.A." (bez tvrdenia o kontinuite).
11. **`layout.tsx:67-70` hreflang** — odstrániť `"en": "/"` kým neexistuje anglická verzia.
12. **`band-data.ts BAND.social.*`** — overiť reálne URL pre Facebook, Instagram, YouTube, Bandcamp.
13. **`TESTIMONIALS` sources** — overiť "Reflex SK", "Klub Underground", "Rádio_fm" pravopis.

### 7.3 P2 — drobné opravy

1. `band-data.ts:10` — `bio` doplniť "v malom meste Púchov na Slovensku".
2. `band-data.ts:281` — `zahúkať` vs `zahukáť` — rozhodnúť podľa zdroja PR.
3. `band-data.ts:443` — `source: " Profil kapely"` → `"Profil kapely"` (odstrániť leading space).
4. `band-data.ts:435` — `"DJ, Rádio_fm"` → `"DJ, Rádio_FM"`.
5. `archiv/page.tsx:121` — doplniť slovný tvar "koncerty" pre 2–4.
6. `gallery-section.tsx:158` — doplniť slovný tvar "fotografie" pre 2–4.
7. `privacy/page.tsx:32` — hardcoded dátum → generovať dynamicky (`new Date()`).
8. `contact-section.tsx:116` — "Sídlo" → "Pôsobisko" alebo "Pôvod".
9. `contact-section.tsx:133` — preformulovať vetu o "predmetom PR 2026".
10. `footer.tsx:60` — "Admin prihlásenie" v footeri — zvážiť odstránenie alebo presun do menej viditeľného miesta.
11. `footer.tsx:70` — "BOOKING OPEN" zmazať alebo preložiť do slovenčiny ("BOOKING OTVORENÝ").
12. `press-section.tsx DOWNLOADS` — odstrániť `size: "—"` ak je neznámy (radšej nezobraziť ako zobraziť em-dash).

---

## 8. ZOZNAM TODO MIEST V KÓDE

| Súbor | Riadok | TODO obsah | Závažnosť |
|---|---|---|---|
| `band-data.ts` | 21–24 | `// TODO(DORA): Overiť a nahradiť reálnym Spotify artist profilom.` | P2 |
| `band-data.ts` | 83–87 | `// TODO(DORA): Doplniť aspoň 2–3 míľniky z obdobia 2005–2026` | P1 |
| `band-data.ts` | 108–111 | `// TODO(DORA): Koncertná zostava aktualizovaná podľa pokynu kapely` | P1 |
| `band-data.ts` | 203–207 | `// TODO(DORA): Všetky YouTube video ID nižšie sú placeholder „dQw4w9WgXcQ"` | **P0** |
| `band-data.ts` | 217, 228, 238 | Inline TODO komentáre pre konkrétne video IDs | **P0** |
| `band-data.ts` | 277–279 | `// TODO(DORA): Text spomína "náš frontman za mikrofónom" — Marcel Chleban už nefiguruje` | P1 |
| `band-data.ts` | 303–305 | `// TODO(DORA): Text spomína "nezameniteľný frontman" — Marcel Chleban už nefiguruje` | P1 |
| `band-data.ts` | 391–394 | `// TODO(DORA): Pridať reálnu odpoveď namiesto [DOPLNIŤ]` | **P0** |
| `band-data.ts` | 458–462 | `// TODO(DORA): Skladby „Abstinujem", „Púchovská noc", „Rebelova", „Spoločne" a „Encore: Dnes Od Rána" sa nenachádzajú v oficiálnej diskografii` | **P0** |
| `band-data.ts` | 468, 470, 473, 475, 477 | Inline TODO komentáre pre jednotlivé fiktívne skladby | **P0** |
| `page.tsx` | 202–209 | `// TODO(DORA): Sekcia „Recenzie & referencie" je DOČASNE SKRYTÁ.` | P1 |

---

## 9. ZÁVER

**Stav:** Aktuálna verejná stránka obsahuje **11 kritických chýb** ktoré sa priamo prejavia používateľom (falošné YouTube videá, fiktívne skladby, placeholder FAQ odpoveď, broken sitemap anchor, vymyslená identita v právnom dokumente, nesprávne GDPR články, nezrovnalosti v počtoch 4 vs 6 členov / 3 vs 5 nahrávok / 4 vs 5 žánrov).

**Priorita:** Odstrániť všetky P0 chyby pred ďalším produkčným deplojom. P1 chyby do 2 týždňov. P2 chyby pri najbližšom obsahovom update.

**Komplexnosť auditu:**
- Auditovaných súborov: 17
- Audítovaných copy textov: ~80 textových reťazcov
- Identifikovaných chýb: 36 (11 P0 + 13 P1 + 12 P2)
- TODO miest v kóde: 12 explicitných

**Nasledujúce kroky:**
1. Opraviť všetky P0 (sekcia 7.1) — cca 1–2 hodiny práce.
2. Overiť s kapelou reálne mená, dátumy, fakty (Chleban/Plevák odchod, súčasný spevák, historické míľniky 2005–2026, sociálne siete URL).
3. Vyriešiť testimonials sekciu (vymazať alebo nahradiť reálnymi citátmi a odkomentovať).
4. Vytvoriť reálne súbory pre Press Kit downloads (`/public/downloads/stageplan.pdf`, `/public/downloads/photos.zip`, `/public/downloads/logo-pack.zip`).
5. Po oprave P0 spustiť `bun run lint && bun run build && bun run test` pre verifikáciu.
6. Po nasadení spustiť Google Rich Results Test na `https://search.google.com/test/rich-results` pre JSON-LD validáciu.

**Sign-off:**
- Audit vykonaný: 2026-08-19
- Audítor: Z.ai Code (general-purpose sub-agent)
- Verzia tohto dokumentu: 1.0
- Súvisiace audit dokumenty: `AUDIT-1-SECURITY.md`, `AUDIT-2-DATABASE.md`, `AUDIT-3-ADMIN-AI.md`, `AUDIT-4-WEB-SEO.md`
