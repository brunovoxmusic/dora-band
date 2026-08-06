import { streamText } from "ai";
import { getModel } from "@/lib/ai";
import { db } from "@/lib/db";

/**
 * AI Agent Framework for D.O.R.A. Band Management OS.
 * Each agent is a specialized AI function that performs a specific task.
 * The orchestrator chains agents into multi-step workflows.
 */

type Gig = { id: string; title: string; date: Date; venue: string; city: string };

/** Content Agent — generates content bundles for events */
export async function contentAgent(gig: Gig) {
  const prompt = `Nový koncert: ${gig.title}, dátum: ${new Date(gig.date).toLocaleDateString("sk-SK")}, miesto: ${gig.venue}, ${gig.city}.
Vygeneruj v slovenčine:
1. Krátky blog článok (100-150 slov)
2. Facebook príspevok (max 280 znakov + hashtagy)
3. Instagram caption (max 150 znakov)
4. Newsletter sekcia (50-80 slov)
5. SEO meta title (max 60 znakov)
6. SEO meta description (max 160 znakov)
7. Press release (100-200 slov)

Oddeľ každú sekciu s "===SEKCIJA==="`;

  const result = streamText({ model: getModel(), system: "Si copywriter pre slovenskú funky-punkovú kapelu D.O.R.A. z Púchova.", prompt });
  const text = await result.text;
  const sections = text.split("===SEKCIJA===");
  
  await db.automationLog.create({ data: { agentType: "content", trigger: "gig_created", input: JSON.stringify(gig), output: text, status: "success" } });
  
  return {
    article: sections[0]?.trim() || "",
    facebook: sections[1]?.trim() || "",
    instagram: sections[2]?.trim() || "",
    newsletter: sections[3]?.trim() || "",
    seoTitle: sections[4]?.trim() || "",
    seoDescription: sections[5]?.trim() || "",
    pressRelease: sections[6]?.trim() || "",
    raw: text,
  };
}

/** Task Agent — generates task checklist for a gig */
export async function taskAgent(gig: Gig) {
  const gigDate = new Date(gig.date);
  const prompt = `Nový koncert: ${gig.title}, dátum: ${gigDate.toLocaleDateString("sk-SK")}, miesto: ${gig.venue}, ${gig.city}.
Vytvor checklist v JSON formáte (pole objektov):
[{"title": "...", "dueDate": "YYYY-MM-DD", "priority": "high|medium|low"}]

Termíny:
- 14 dní pred: promo, plagát, médiá
- 7 dní pred: social push, newsletter
- 1 deň pred: technická kontrola, equipment
- Deň koncertu: soundcheck, setlist

Vráť IBA JSON, žiadny iný text.`;

  const result = streamText({ model: getModel(), system: "Si projektový manažér pre hudobnú kapelu. Vráť iba platný JSON.", prompt });
  const text = await result.text;
  
  let tasks: Array<{ title: string; dueDate: string; priority: string }> = [];
  try { tasks = JSON.parse(text.replace(/```json\n?/g, "").replace(/\n?```/g, "")); } catch { /* fallback */ }
  
  // Create tasks in DB
  const created = await Promise.all(tasks.map(t => db.task.create({ data: { title: t.title, dueDate: new Date(t.dueDate), priority: t.priority || "medium", status: "todo", gigId: gig.id, aiGenerated: true } })));
  
  await db.automationLog.create({ data: { agentType: "task", trigger: "gig_created", input: JSON.stringify(gig), output: JSON.stringify(tasks), status: "success" } });
  return created;
}

/** Email Agent — generates booking/reply emails */
export async function emailAgent(params: { tone: string; recipient: string; context: string; subject?: string }) {
  const prompt = `Príjemca: ${params.recipient}
Tón: ${params.tone}
Kontext: ${params.context}

Napíš profesionálny email v slovenčine pre kapelu D.O.R.A.`;

  const result = streamText({ model: getModel(), system: `Si booking manažér slovenskej kapely D.O.R.A. Tón komunikácie: ${params.tone}. Píš v slovenčine.`, prompt });
  const text = await result.text;
  
  await db.automationLog.create({ data: { agentType: "email", trigger: "manual", input: JSON.stringify(params), output: text, status: "success" } });
  return text;
}

/** Booking Agent — analyzes a venue/festival URL */
export async function bookingAgent(url: string) {
  const prompt = `Analyzuj túto webstránku eventu/festivalu: ${url}

Vráť JSON:
{
  "name": "názov eventu",
  "genre": "hudobný žáner",
  "audience": "cieľová skupina",
  "capacity": "odhadovaná kapacita",
  "contact": "kontaktné info",
  "email": "email ak nájdeš",
  "matchScore": 0-100,
  "recommendation": "KONTAKTOVAŤ | NÍZKY POTENCIÁL | NEVHODNÉ",
  "reason": "dôvod odporúčania",
  "suggestedEmail": "navrhovaný predmet emailu"
}

Vráť IBA JSON.`;

  const result = streamText({ model: getModel(), system: "Si AI analytik pre hudobný priemysel. Analyzuj vhodnosť eventu pre funky-punk kapelu. Vráť iba JSON.", prompt });
  const text = await result.text;
  
  let analysis;
  try { analysis = JSON.parse(text.replace(/```json\n?/g, "").replace(/\n?```/g, "")); }
  catch { analysis = { raw: text }; }
  
  await db.automationLog.create({ data: { agentType: "booking", trigger: "manual", input: url, output: text, status: "success" } });
  return analysis;
}

/** Orchestrator — chains agents for multi-step workflows */
export async function orchestrator(trigger: string, data: unknown) {
  await db.automationLog.create({ data: { agentType: "orchestrator", trigger, input: JSON.stringify(data), output: "started", status: "success" } });

  if (trigger === "gig_created") {
    const gig = data as Gig;
    const [content, tasks] = await Promise.all([
      contentAgent(gig).catch(e => ({ error: e.message })),
      taskAgent(gig).catch(e => ({ error: e.message })),
    ]);
    await db.automationLog.create({ data: { agentType: "orchestrator", trigger, input: JSON.stringify(gig), output: JSON.stringify({ content: !!content, tasks: Array.isArray(tasks) ? tasks.length : 0 }), status: "success" } });
    return { content, tasks };
  }
}
