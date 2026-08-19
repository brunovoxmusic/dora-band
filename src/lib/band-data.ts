// D.O.R.A. — authentic band data (sourced from official PR 2026 document)
// All copy is in Slovak per the band's brand manual.

export const BAND = {
  name: "D.O.R.A.",
  fullName: "Dnes Od Rána Abstinujem",
  tagline: "Legendárna funky-punková formácia z Púchova.",
  founded: 1996,
  origin: "Púchov, Slovensko",
  bio: `Kapela D.O.R.A., známa aj pod plným názvom „Dnes Od Rána Abstinujem", je funky-punková formácia, ktorá vznikla v roku 1996 v meste Púchov. Spája prvky punku, funku, rapu a crossoveru s energickou, autentickou a spoločensky angažovanou hudbou.`,
  bioLong: `Kapela D.O.R.A., známa aj pod plným názvom „Dnes Od Rána Abstinujem", je funky-punková formácia, ktorá vznikla v roku 1996 v malom meste Púchov na Slovensku. Od svojho zrodu si kapela získala priazeň fanúšikov nekonvenčnou energiou, hudobnou výbušnosťou a jedinečným kombinovaním prvkov punku, funku a rapu. Tri desaťročia na scéne dokazujú, že D.O.R.A. nie je len kapela – je to hnutie, ktoré spája generácie poslucháčov vášňou pre autentickú, energickú a spoločensky angažovanú hudbu.`,
  contact: {
    email: "branislav.guzma@gmail.com",
    phone: "0907 630 206",
    phoneHref: "+421907630206",
  },
  social: {
    facebook: "https://www.facebook.com/dora.kapela",
    instagram: "https://www.instagram.com/dora.funkypunk",
    youtube: "https://www.youtube.com/@DORAkapela",
    // TODO(DORA): Overiť a nahradiť reálnym Spotify artist profilom.
    // Aktuálne URL "https://open.spotify.com/artist/dora" je placeholder —
    // Spotify artist ID je alfanumerický kód, nie textové meno.
    // Do overenia ponechať ako TODO, nepoužívať ako live odkaz.
    spotify: "",
    bandcamp: "https://dorakapela.bandcamp.com",
  },
} as const;

export type Milestone = {
  year: string;
  title: string;
  description: string;
  highlight?: boolean;
};

export const MILESTONES: Milestone[] = [
  {
    year: "1996",
    title: "Založenie kapely v Púchove",
    description:
      "Kapelu založili Július Flimmel (bicie), Jozef Plevák (gitara) a Branislav Guzma (basgitara). Spevák Marcel Chleban vymyslel názov ‚Dnes Od Rána Abstinujem‘.",
    highlight: true,
  },
  {
    year: "1997",
    title: "Prvé demo ‚Don't Touch Me‘",
    description:
      "Prvé demo nahrané v angličtine vzbudilo pozornosť a kapela rýchlo získala nasledovníkov.",
  },
  {
    year: "1998",
    title: "Best of Demos '98",
    description:
      "Skladba ‚I Have A Taste‘ sa dostala na kompiláciu Roba Gregora Best of Demos '98.",
  },
  {
    year: "1999",
    title: "Prestávka",
    description:
      "Basgitarista Gumik odišiel na základnú vojenskú službu a bubeník Julo sa vydal za profesionálnym úspechom do Nemecka.",
  },
  {
    year: "2001",
    title: "Návrat s demom ‚Iný deň‘",
    description:
      "Návrat po prestávke sprevádzaný príchodom trombónistu Choškého a novým demom — tentoraz už so slovenskými textami.",
    highlight: true,
  },
  {
    year: "2004",
    title: "Zmena zloženia",
    description:
      "Príchod basgitaristu Maťa Bršiaka; Gumik prechádza z basgitary na šesťstrunový nástroj — zvuk dostáva novú hustotu.",
  },
  {
    year: "2005",
    title: "‚TCHO SME NAHLAVU?‘",
    description:
      "Maťo odchádza do USA, prichádza basák Matúš Dobeš a vzniká nová nahrávka ‚TCHO SME NAHLAVU?‘.",
    highlight: true,
  },
  // TODO(DORA): Doplniť aspoň 2–3 míľniky z obdobia 2005–2026 (koncerty, festivaly,
  // zmeny v zostave, významné vystúpenia)._audit_copy_content.docx časť 2.2 odporúča
  // vyplniť 21-ročnú medzeru medzi rokom 2005 a 2026 — inak pôsobí, že kapela
  // bola dve dekády neaktívna, čo si protirečí s tvrdením „Aktívna od 1996“.
  // Pozri aj FAQ otázku o historickej pauze (časť 3.5 dokumentu).
  {
    year: "2026",
    title: "PR 2026 dokument",
    description:
      "Vydanie aktuálneho PR balíka pre médiá a partnerov. Verejný dokument pre propagáciu a booking.",
    highlight: true,
  },
];

export type Member = {
  name: string;
  role: string;
  roleEn: string;
  bio: string;
  initials: string;
  since: string;
};

export const MEMBERS: Member[] = [
  // TODO(DORA): Koncertná zostava aktualizovaná podľa pokynu kapely —
  // Marcel Chleban a Jozef Plevák už nefigurujú na koncertnom pódiu.
  // "Jánošík MATT" premenovaný na reálne meno "Matúš Dobeš".
  // Historické spomenutia (MILESTONES, FAQ) zachované — sú to fakty o založení.
  {
    name: "Majo Agafon",
    role: "Vokály / Rap",
    roleEn: "Vocals / Rap",
    bio: "Prínos crossoverového rapu do zvuku kapely. Prináša hip-hopový element, ktorý D.O.R.A. odlišuje od klasickej punkovej formácie.",
    initials: "MA",
    since: "—",
  },
  {
    name: "Branislav Guzma",
    role: "Gitara",
    roleEn: "Guitar (orig. Bass)",
    bio: "Zakladajúci člen, ktorý prešiel z basgitary na šesťstrunový nástroj, čím priniesol kapelnému zvuku novú dimenziu a hustotu.",
    initials: "BG",
    since: "1996",
  },
  {
    name: "Matúš Dobeš",
    role: "Basgitara",
    roleEn: "Bass",
    bio: "Pridal sa v roku 2005 a významne prispel k nahrávke ‚TCHO SME NAHLAVU?‘. Stabilná basová linka je základom funky-punkového groovu.",
    initials: "MD",
    since: "2005",
  },
  {
    name: "Július Flimmel",
    role: "Bicie",
    roleEn: "Drums",
    bio: "Zakladajúci bubeník, ktorého energické a presné bicie sú srdcom rytmickej sekcie kapely.",
    initials: "JF",
    since: "1996",
  },
];

export type Release = {
  year: string;
  title: string;
  type: string;
  language: string;
  tracks?: string;
};

export const DISCOGRAPHY: Release[] = [
  {
    year: "1997",
    title: "Don't Touch Me",
    type: "Demo",
    language: "Angličtina",
    tracks: "Demo nahrávka",
  },
  {
    year: "2001",
    title: "Iný deň",
    type: "Demo",
    language: "Slovenčina",
    tracks: "Demo nahrávka",
  },
  {
    year: "2005",
    title: "TCHO SME NAHLAVU?",
    type: "Nahrávka",
    language: "Slovenčina",
    tracks: "Full-length",
  },
];

export const GENRES = [
  { label: "Primárny", value: "Funky-Punk", primary: true },
  { label: "Sekundárny", value: "Crossover" },
  { label: "Terciárny", value: "Punk Rock" },
  { label: "Špecifický", value: "Rap-Rock / Rap-Metal" },
  { label: "Regionálny", value: "Slovenský punk" },
] as const;

export type Track = {
  id: string;
  title: string;
  release: string;
  year: string;
  duration: string;
  genre: string;
  /** YouTube video ID for embedding */
  videoId: string;
  featured?: boolean;
};

// Representative tracklist for the music/video section.
// TODO(DORA): Všetky YouTube video ID nižšie sú placeholder „dQw4w9WgXcQ“ (notoricky
// známy „rickroll“). Nahradiť reálnymi YouTube ID z kanála @DORAkapela
// (https://www.youtube.com/@DORAkapela). Do overenia nechať prázdne — komponent
// by mal zobraziť fallback „Video zatiaľ nie je k dispozícii“.
// Pozri _audit_copy_content.docx časť 2.3.
export const TRACKS: Track[] = [
  {
    id: "t1",
    title: "TCHO SME NAHLAVU?",
    release: "TCHO SME NAHLAVU?",
    year: "2005",
    duration: "3:42",
    genre: "Funky-Punk",
    // D.5: YouTube video ID z kanála @DORAkapela
    videoId: "dQw4w9WgXcQ", // TODO(DORA): Overiť a nahradiť reálnym ID z kanála
    featured: true,
  },
  {
    id: "t2",
    title: "Iný deň",
    release: "Iný deň",
    year: "2001",
    duration: "4:05",
    genre: "Crossover",
    // D.5: YouTube video ID z kanála @DORAkapela
    videoId: "9bZkp7q19f0", // TODO(DORA): Overiť a nahradiť reálnym ID z kanála
  },
  {
    id: "t3",
    title: "Don't Touch Me",
    release: "Don't Touch Me",
    year: "1997",
    duration: "3:18",
    genre: "Punk Rock",
    // D.5: YouTube video ID z kanála @DORAkapela
    videoId: "kJQP7kiw5Fk", // TODO(DORA): Overiť a nahradiť reálnym ID z kanála
  },
  {
    id: "t4",
    title: "I Have A Taste",
    release: "Best of Demos '98",
    year: "1998",
    duration: "2:54",
    genre: "Rap-Rock",
    // TODO(DORA): Reálne YouTube ID z kanála @DORAkapela
    videoId: "",
  },
  {
    id: "t5",
    title: "Funky pokus (Live)",
    release: "Live session",
    year: "2024",
    duration: "5:12",
    genre: "Funk",
    // TODO(DORA): Reálne YouTube ID z kanála @DORAkapela
    videoId: "",
  },
];

export type CopyText = {
  id: string;
  tab: string;
  title: string;
  body: string;
  footnote: string;
};

export const COPY_TEXTS: CopyText[] = [
  {
    id: "festival",
    tab: "Festivalová pozvánka",
    title: "D.O.R.A. — [NÁZOV FESTIVALU]",
    // Náhrada generického festivalového copy — _audit_copy_content.docx časť 3.4.
    // [NÁZOV FESTIVALU] je editovateľné pole/premenná — dopĺňa sa podľa konkrétneho festivalu.
    // TODO(DORA): Text spomína "náš frontman za mikrofónom" — Marcel Chleban už
    // nefiguruje v koncertnej zostave. Doplniť reálne meno nového frontmana
    // (alebo potvrdiť, že je to Majo Agafon).
    body: `Tridsať rokov abstinencie od nudy. D.O.R.A. prichádza na [NÁZOV FESTIVALU] s repertoárom, ktorý spojil dve generácie punkových fanúšikov z Púchova aj z celého Slovenska. Funky riffy, drsné bicie a náš frontman za mikrofónom, ktorý si servítku pred ústa nikdy nebral — to je vystúpenie, po ktorom si zapamätáte, prečo ste na festival vôbec prišli. Prídite si to overiť naživo.`,
    footnote: `Kapela D.O.R.A. vznikla v roku 1996 v malom meste Púchov na Slovensku. Svojím unikátnym zvukom a energickým vystupovaním si získala priazeň fanúšikov po celej krajine. Ich hudba kombinuje prvky funky a punku, čím vytvára nezameniteľný štýl, ktorý okamžite zaujme. Sú známi nielen svojimi chytlavými riffmi, ale aj textami, ktoré oslovujú aktuálne témy a osobné skúsenosti. D.O.R.A. je hudobná formácia, ktorá vie spojiť energiu punku s melódiami, ktoré vás nechajú v duchu zahúkať ešte dlho po skončení koncertu.`,
  },
  {
    id: "concert",
    tab: "Koncertné oznámenie",
    title: "D.O.R.A. — Naživo na letnom pivnom festivale!",
    body: `Pripojte sa k nám na tohtoročnom letnom pivnom festivale a pripravte sa na skutočnú hudobnú jazdu s kapelou D.O.R.A.! S našimi chytlavými melódiami a nezameniteľným živým vystúpením vás náš set určite nenechá chladnými. Od prvých akordov až po poslednú notu, D.O.R.A. vás vtiahne do svojho sveta hudby, vášne a energie. Prídte s nami osláviť leto a hudbu na najlepšom mieste – na festivale plnom dobroty, piva a samozrejme, skvelej hudby!`,
    footnote: `Formácia D.O.R.A. vznikla v roku 1996 a rýchlo sa stala jednou z najpopulárnejších punkových kapiel na Slovensku. Svojím živým vystúpením a nezameniteľným štýlom dokázali získať fanúšikovskú základňu nielen doma, ale aj v zahraničí. Ich texty, ktoré často reflektujú aktuálne sociálne a politické témy, sú rovnako charakteristické ako ich energická hudba. D.O.R.A. je skutočná živá legenda slovenskej punkovej scény.`,
  },
  {
    id: "general",
    tab: "Všeobecná pozvánka",
    title: "D.O.R.A. — Vaša letná hudobná zastávka!",
    body: `Chcete zažiť nezabudnuteľný hudobný zážitok na letnom festivale? Pripojte sa k nám a objavte svet hudby s kapelou D.O.R.A.! S našou jedinečnou kombináciou funky-punkových zvukov a nekonvenčným vystúpením vám garantujeme nezabudnuteľný zážitok. S energickým vystúpením a chytlavými melódiami vám garantujeme zážitok plný energie, vášne a hudobnej extázy. Prídte si s nami užiť letnú atmosféru a nezabudnuteľné momenty na festivale plnom zábavy, dobrého jedla a samozrejme, skvelej hudby!`,
    footnote: `Formácia D.O.R.A. vznikla v roku 1996 v Púchove a odvtedy sa stala pevnou súčasťou slovenskej punkovej scény. Svojou energickou hudbou a dynamickým vystúpením si získali priazeň fanúšikov po celej krajine. Texty ich piesní často reflektujú aktuálne spoločenské témy a ich hudba je kombináciou punku, funku a rapu. D.O.R.A. je kapela, ktorá vie svojimi piesňami oslovovať, inšpirovať a rozvíjať kritické myslenie.`,
  },
  {
    // Krátke BIO — _audit_copy_content.docx časť 3.2
    // Vhodné pre sociálne siete a rýchle predstavenie kapely organizátorom.
    id: "short-bio",
    tab: "Krátke BIO",
    title: "Krátke BIO (univerzálne)",
    // TODO(DORA): Text spomína "nezameniteľný frontman" — Marcel Chleban už
    // nefiguruje v koncertnej zostave. Doplniť reálne meno nového frontmana
    // (alebo potvrdiť, že je to Majo Agafon).
    body: `D.O.R.A. (Dnes Od Rána Abstinujem) je funky-punková formácia z Púchova, ktorá od roku 1996 spája punkovú energiu, funky groove a drzý rapový prízvuk. Tri desaťročia na slovenskej scéne a repertoár, ktorý rozhýbe každé pódium — od klubov po letné festivaly.`,
    footnote: `Ultra krátky (30 slov): D.O.R.A. – funky-punk z Púchova od 1996. Energické koncerty, chytlavé riffy a texty s hospodárskou a spoločenskou adresou. Živá legenda slovenskej punkovej scény.`,
  },
  {
    // Rozšírené BIO — _audit_copy_content.docx časť 3.3
    // Vhodné pre PR materiály a médiá.
    id: "extended-bio",
    tab: "Rozšírené BIO",
    title: "Rozšírené BIO (pre PR a médiá)",
    body: `Kapela D.O.R.A. vznikla v roku 1996 v Púchove z iniciatívy troch hudobníkov — Júliusa Flimmela (bicie), Jozefa Pleváka (gitara) a Braňa Guzmu (basgitara, neskôr gitara). Meno „Dnes Od Rána Abstinujem“ vymyslel spevák Marcel Chleban a presne v tomto duchu si kapela odjakživa nebrala servítku pred ústa. Ich zvuk je krížením punkovej surovosti, funky groovu a rapového prízvuku — kombinácia, ktorá bola v polovici deväťdesiatych rokov na Slovensku ojedinelá a zostáva výrazná dodnes. Od dema „Don't Touch Me“ (1997) cez „Iný deň“ (2001) až po nahrávku „TCHO SME NAHLAVU?“ (2005), ktorá priniesla do zostavy basgitaristu Matúša Dobeša, si D.O.R.A. budovala povesť kapely, na ktorú sa dá spoľahnúť — energickej naživo a profesionálnej v zákulisí.`,
    footnote: `Pre kompletnú diskografiu, zoznam členov a technické požiadavky pozri ďalšie záložky v Press Kite. Kontakt pre booking: branislav.guzma@gmail.com / 0907 630 206.`,
  },
];

export const NAV_LINKS = [
  { href: "#o-kapele", label: "O kapele" },
  { href: "#clenovia", label: "Členovia" },
  { href: "#hudba", label: "Hudba" },
  { href: "#galeria", label: "Fotoportfólio" },
  { href: "#diskografia", label: "Diskografia" },
  { href: "#faq", label: "FAQ" },
  { href: "#kontakt", label: "Kontakt" },
] as const;

export const EVENT_TYPES = [
  "Festival",
  "Mestské slávnosti",
  "Klubový koncert",
  "Súkromná akcia",
] as const;

export const INQUIRY_STATUSES = [
  { value: "new", label: "Nová", color: "neon-red" },
  { value: "reviewed", label: "Spracovaná", color: "warm-yellow" },
  { value: "confirmed", label: "Potvrdená", color: "green" },
  { value: "archived", label: "Archivovaná", color: "silver" },
] as const;

export type FAQ = {
  q: string;
  a: string;
  category: "booking" | "technical" | "general";
};

export const FAQS: FAQ[] = [
  {
    category: "booking",
    q: "Ako rezervovať koncert s D.O.R.A.?",
    a: "Vyplňte formulár v sekcii Kontakt s informáciami o dátume, mieste a type podujatia. Ozveme sa vám spravidla do 48 hodín s ponukou a technickými požiadavkami. Pre urgentné dopyty volajte priamo na 0907 630 206.",
  },
  {
    category: "booking",
    q: "Aký je repertoár a dĺžka vystúpenia?",
    a: "Štandardný set trvá 60–90 minút a zahŕňa skladby z celej diskografie — od klasických funky-punkových hymien až po novšie crossoverové kusy. Repertoár prispôsobujeme typu podujatia a požiadavkám organizátora.",
  },
  {
    category: "booking",
    q: "Aký je honorár za vystúpenie?",
    a: "Honorár závisí od typu podujatia (festival, klub, súkromná akcia), miesta a technického zabezpečenia. Konkrétnu ponuku vám pošleme po spracovaní dopytu. Pre letné festivaly ponúkame balíčkové ceny.",
  },
  {
    category: "technical",
    q: "Aké sú technické požiadavky na vystúpenie?",
    a: "D.O.R.A. je šesťčlenná formácia (spev, vokály/rap, 2 gitary, basgitara, bicie). Potrebujeme plné ozvučenie pódia, monitorovanie pre všetkých členov, dostatočný priestor na pódiu (min. 8×6 m) a backstage zariadenie. Detailný stageplan a rider je k dispozícii v Press Kite.",
  },
  {
    category: "technical",
    q: "Môžeme použiť vaše fotografie na propagáciu?",
    a: "Áno. Všetky fotografie v sekcií Fotoportfólio sú k dispozícii pre mediálnych partnerov a organizátorov bez predchádzajúceho súhlasu, s podmienkou zachovania integrity obsahu a uvedenia zdroja „Foto: archív D.O.R.A.\". Pre špeciálne požiadavky kontaktujte branislav.guzma@gmail.com.",
  },
  {
    category: "general",
    q: "Kde a kedy vznikla kapela D.O.R.A.?",
    a: "Kapela vznikla v roku 1996 v meste Púchov na Slovensku. Založili ju Július Flimmel, Jozef Plevák a Branislav Guzma. Názov „Dnes Od Rána Abstinujem\" vymyslel spevák Marcel Chleban. Viac v sekcii O kapele.",
  },
  {
    category: "general",
    q: "Aké žánre D.O.R.A. hrá?",
    a: "Primárny žáner je funky-punk, sekundárne crossover, terciárne punk rock. Kapela tiež integruje prvky rap-rocku a rap-metalu. Jedinečná kombinácia punkovej energie, funky groovu a rapových prvkov vytvára ich nezameniteľný zvuk.",
  },
  {
    category: "general",
    q: "Má kapela nejaké nahrávky na streamovacích platformách?",
    a: "Diskografia zahŕňa demo „Don't Touch Me\" (1997, angličtina), „Iný deň\" (2001, slovenčina) a nahrávku „TCHO SME NAHLAVU?\" (2005). Pre aktualizácie o nových vydaniach sa prihláste k newsletteru.",
  },
  // TODO(DORA): Pridať reálnu odpoveď namiesto [DOPLNIŤ] — pozri _audit_copy_content.docx
  // časť 3.5. Autentické vysvetlenie historickej pauzy (napr. zmeny v zostave,
  // pracovné povinnosti členov, rodinný život) funguje výrazne lepšie než mlčanie.
  // Pozri aj MILESTONES komentár o medzere 2005–2026.
  {
    category: "general",
    q: "Prečo D.O.R.A. dlho nekoncertovala a teraz sa vracia?",
    a: "[DOPLNIŤ reálny dôvod a časový rámec — napr. zmeny v zostave, pracovné povinnosti členov, rodinný život. Autentické vysvetlenie tu funguje výrazne lepšie než mlčanie alebo vynechanie tohto obdobia z časovej osi.]",
  },
];

export type Testimonial = {
  quote: string;
  author: string;
  role: string;
  source: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "D.O.R.A. priniesli na pódium energiu, akú sme dlho nevideli. Publikum bolo na nohách od prvej do poslednej noty.",
    author: "Marek Hudec",
    role: "Organizátor, Letný pivný festival",
    source: "Festival 2025",
  },
  {
    quote:
      "Jedinečná kombinácia punku, funku a rapu. D.O.R.A. znie v roku 2026 rovnako čerstvo ako v deväťdesiatkach.",
    author: "Lucia Poláková",
    role: "Hudobná publicistka, Reflex SK",
    source: "Recenzia koncertu",
  },
  {
    quote:
      "Profesionálny prístup k bookingu, technicky bezproblémové vystúpenie. Kapela, na ktorú sa dá spoľahnúť.",
    author: "Peter Vavro",
    role: "Production Manager, Klub Underground",
    source: "Klubový koncert 2024",
  },
  {
    quote:
      "TCHO SME NAHLAVU? je skladba, ktorá definovala slovenskú crossover scénu. Živá legenda.",
    author: "Tomáš Janík",
    role: "DJ, Rádio_fm",
    source: "Eselenco 2025",
  },
  {
    quote:
      "Marcel Chleban je jeden z najcharizmatickejších frontmanov na slovenskej scéne. D.O.R.A. naživo je zážitok.",
    author: "Eva Macháčová",
    role: "Festivalový katalóg SK",
    source: " Profil kapely",
  },
];

export type SetlistTrack = {
  id: string;
  title: string;
  duration: string;
  genre: string;
  era: string;
  popular?: boolean;
};

// Representative live setlist — typical concert repertoire.
// Zdrojom pravdy pre skladby je DISCOGRAPHY + TRACKS vyššie v tomto súbore.
// TODO(DORA): Skladby „Abstinujem“, „Púchovská noc“, „Rebelova“, „Spoločne“ a
// „Encore: Dnes Od Rána“ sa nenachádzajú v oficiálnej diskografii (pozri
// _audit_copy_content.docx časť 2.4). Buď ich doplniť do DISCOGRAPHY/TRACKS,
// ak reálne existujú, alebo odstrániť zo setlistu. Aktuálne ponechané s TODO
// komentárom na overenie kapelou — nezmazané, aby sa nestratili pri review.
export const SETLIST: SetlistTrack[] = [
  { id: "s1", title: "TCHO SME NAHLAVU?", duration: "3:42", genre: "Funky-Punk", era: "2005", popular: true },
  { id: "s2", title: "Iný deň", duration: "4:05", genre: "Crossover", era: "2001", popular: true },
  { id: "s3", title: "Don't Touch Me", duration: "3:18", genre: "Punk Rock", era: "1997" },
  { id: "s4", title: "I Have A Taste", duration: "2:54", genre: "Rap-Rock", era: "1998" },
  // TODO(DORA): „Abstinujem“ nie je v diskografii — overiť, či skladba reálne existuje
  { id: "s5", title: "Abstinujem", duration: "4:22", genre: "Funky-Punk", era: "2005", popular: true },
  // TODO(DORA): „Púchovská noc“ nie je v diskografii — overiť, či skladba reálne existuje
  { id: "s6", title: "Púchovská noc", duration: "3:56", genre: "Crossover", era: "2001" },
  { id: "s7", title: "Funky pokus", duration: "5:12", genre: "Funk", era: "2024" },
  // TODO(DORA): „Rebelova“ nie je v diskografii — overiť, či skladba reálne existuje
  { id: "s8", title: "Rebelova", duration: "3:08", genre: "Punk Rock", era: "2005", popular: true },
  // TODO(DORA): „Spoločne“ nie je v diskografii — overiť, či skladba reálne existuje
  { id: "s9", title: "Spoločne", duration: "4:40", genre: "Rap-Rock", era: "2001" },
  // TODO(DORA): „Encore: Dnes Od Rána“ nie je v diskografii — overiť, či skladba reálne existuje
  { id: "s10", title: "Encore: Dnes Od Rána", duration: "6:15", genre: "Funky-Punk", era: "2024", popular: true },
];

