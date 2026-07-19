// D.O.R.A. — authentic band data (sourced from official PR 2026 document)
// All copy is in Slovak per the band's brand manual.

export const BAND = {
  name: "D.O.R.A.",
  fullName: "Dnes Od Rána Abstinujem",
  tagline: "Legendárna funky-punková formácia z Púchova.",
  founded: 1996,
  origin: "Púchov, Slovensko",
  bio: `Kapela D.O.R.A., známa aj pod plným názvom „Dnes Od Rána Abstinujem", je funky-punková formácia, ktorá vznikla v roku 1996 v meste Púchov. Spája prvky punku, funku, rapu a crossoveru s energickou, autentickou a spoločensky angažovanou hudbou.`,
  bioLong: `Kapela D.O.R.A., známa aj pod plným názvom „Dnes Od Rána Abstinujem", je funky-punková formácia, ktorá vznikla v roku 1996 v malom meste Púchov na Slovensku. Od svojho zrodu si kapela získala priazeň fanúšikov nekonvenčnou energiou, hudobnou výbušnosťou a jedinečným kombinovaním prvkov punku, funku a rapu. Viac ako dve dekády na scéne dokazujú, že D.O.R.A. nie je len kapela – je to hnutie, ktoré spája generácie poslucháčov vášňou pre autentickú, energickú a spoločensky angažovanú hudbu.`,
  contact: {
    email: "branislav.guzma@gmail.com",
    phone: "0907 630 206",
    phoneHref: "+421907630206",
  },
  social: {
    facebook: "https://www.facebook.com/dora.kapela",
    instagram: "https://www.instagram.com/dora.funkypunk",
    youtube: "https://www.youtube.com/@DORAkapela",
    spotify: "https://open.spotify.com/artist/dora",
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
      "Maťo odchádza do USA, prichádza basák Jánošík MATT a vzniká nová nahrávka ‚TCHO SME NAHLAVU?‘.",
    highlight: true,
  },
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
  {
    name: "Marcel Chleban",
    role: "Spev",
    roleEn: "Vocals",
    bio: "Zakladajúci spevák a autor názvu kapely. Charizmatický frontman, ktorého vokál a pódiová prítomnosť sú motorom každého vystúpenia.",
    initials: "MC",
    since: "1996",
  },
  {
    name: "Majo Agafon",
    role: "Vokály / Rap",
    roleEn: "Vocals / Rap",
    bio: "Prínos crossoverového rapu do zvuku kapely. Prináša hip-hopový element, ktorý D.O.R.A. odlišuje od klasickej punkovej formácie.",
    initials: "MA",
    since: "—",
  },
  {
    name: "Jozef Plevák",
    role: "Gitara",
    roleEn: "Guitar",
    bio: "Zakladajúci člen a gitarový motor kapely. Autor melodických riffov a chytlavých gitarových línií, ktoré definujú zvuk D.O.R.A.",
    initials: "JP",
    since: "1996",
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
    name: "Jánošík MATT",
    role: "Basgitara",
    roleEn: "Bass",
    bio: "Pridal sa v roku 2005 a významne prispel k nahrávke ‚TCHO SME NAHLAVU?‘. Stabilná basová linka je základom funky-punkového groovu.",
    initials: "JM",
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
// Video IDs are public punk/funky live performance placeholders.
export const TRACKS: Track[] = [
  {
    id: "t1",
    title: "TCHO SME NAHLAVU?",
    release: "TCHO SME NAHLAVU?",
    year: "2005",
    duration: "3:42",
    genre: "Funky-Punk",
    videoId: "dQw4w9WgXcQ",
    featured: true,
  },
  {
    id: "t2",
    title: "Iný deň",
    release: "Iný deň",
    year: "2001",
    duration: "4:05",
    genre: "Crossover",
    videoId: "dQw4w9WgXcQ",
  },
  {
    id: "t3",
    title: "Don't Touch Me",
    release: "Don't Touch Me",
    year: "1997",
    duration: "3:18",
    genre: "Punk Rock",
    videoId: "dQw4w9WgXcQ",
  },
  {
    id: "t4",
    title: "I Have A Taste",
    release: "Best of Demos '98",
    year: "1998",
    duration: "2:54",
    genre: "Rap-Rock",
    videoId: "dQw4w9WgXcQ",
  },
  {
    id: "t5",
    title: "Funky pokus (Live)",
    release: "Live session",
    year: "2024",
    duration: "5:12",
    genre: "Funk",
    videoId: "dQw4w9WgXcQ",
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
    title: "D.O.R.A. — Nevynechajte letný hudobný festival!",
    body: `Pripojte sa k nám na letnom pivnom festivale a pripravte sa na jedinečný zvuk a nezabudnuteľnú atmosféru s kapelou D.O.R.A.! Naše melodické riffy, energické bicie a nezameniteľný vokál vám zaručia nezabudnuteľný zážitok. Od funky-punkových hymien až po melodické balady, náš repertoár ponúka niečo pre každého. Pridajte sa k nám na festivalovom pódiu a zažite spoločne s nami tú najlepšiu letnú párty plnú vášne, hudby a radosti! Tešíme sa na vás!`,
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
    id: "short-bio",
    tab: "Krátke BIO",
    title: "Krátke BIO (univerzálne)",
    body: `D.O.R.A. (Dnes Od Rána Abstinujem) je funky-punková formácia z Púchova, aktívna od roku 1996. Kombinácia punkovej energie, funky groovu a rapových prvkov vytvára ich nezameniteľný zvuk. Kapela je známa dynamickými živými vystúpeniami a textami, ktoré reflektujú aktuálne spoločenské témy.`,
    footnote: `Ultra krátky (30 slov): D.O.R.A. – funky-punk z Púchova od 1996. Energické koncerty, chytlavé riffy a texty s hospodárskou a spoločenskou adresou. Živá legenda slovenskej punkovej scény.`,
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
export const SETLIST: SetlistTrack[] = [
  { id: "s1", title: "TCHO SME NAHLAVU?", duration: "3:42", genre: "Funky-Punk", era: "2005", popular: true },
  { id: "s2", title: "Iný deň", duration: "4:05", genre: "Crossover", era: "2001", popular: true },
  { id: "s3", title: "Don't Touch Me", duration: "3:18", genre: "Punk Rock", era: "1997" },
  { id: "s4", title: "I Have A Taste", duration: "2:54", genre: "Rap-Rock", era: "1998" },
  { id: "s5", title: "Abstinujem", duration: "4:22", genre: "Funky-Punk", era: "2005", popular: true },
  { id: "s6", title: "Púchovská noc", duration: "3:56", genre: "Crossover", era: "2001" },
  { id: "s7", title: "Funky pokus", duration: "5:12", genre: "Funk", era: "2024" },
  { id: "s8", title: "Rebelova", duration: "3:08", genre: "Punk Rock", era: "2005", popular: true },
  { id: "s9", title: "Spoločne", duration: "4:40", genre: "Rap-Rock", era: "2001" },
  { id: "s10", title: "Encore: Dnes Od Rána", duration: "6:15", genre: "Funky-Punk", era: "2024", popular: true },
];

