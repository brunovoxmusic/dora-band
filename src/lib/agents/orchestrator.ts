import { generateText, streamText } from "ai";
import { getModel } from "@/lib/ai";
import { db } from "@/lib/db";

/**
 * AI Agent Framework for D.O.R.A. Band Management OS.
 * Multi-agent orchestration with trigger-based workflows.
 */

type Gig = { id: string; title: string; date: Date; venue: string; city: string };
type Inquiry = { id: string; organizer: string; email: string; phone: string; eventDate: string; eventLocation: string; eventType: string; message: string };

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

  const result = await generateText({ model: getModel("writing"), system: "Si copywriter pre slovenskú funky-punkovú kapelu D.O.R.A. z Púchova.", prompt });
  const sections = result.text.split("===SEKCIJA===");

  await db.automationLog.create({ data: { agentType: "content", trigger: "gig_created", input: JSON.stringify(gig), output: result.text, status: "success" } });

  return {
    article: sections[0]?.trim() || "",
    facebook: sections[1]?.trim() || "",
    instagram: sections[2]?.trim() || "",
    newsletter: sections[3]?.trim() || "",
    seoTitle: sections[4]?.trim() || "",
    seoDescription: sections[5]?.trim() || "",
    pressRelease: sections[6]?.trim() || "",
    raw: result.text,
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
Vráť IBA JSON.`;

  const result = await generateText({ model: getModel("analysis"), system: "Si projektový manažér pre hudobnú kapelu. Vráť iba platný JSON.", prompt });
  let tasks: Array<{ title: string; dueDate: string; priority: string }> = [];
  try { tasks = JSON.parse(result.text.replace(/```json\n?/g, "").replace(/\n?```/g, "")); } catch { /* fallback */ }

  const created = await Promise.all(tasks.map(t => db.task.create({ data: { title: t.title, dueDate: new Date(t.dueDate), priority: t.priority || "medium", status: "todo", gigId: gig.id, aiGenerated: true } })));

  await db.automationLog.create({ data: { agentType: "task", trigger: "gig_created", input: JSON.stringify(gig), output: JSON.stringify(tasks), status: "success" } });
  return created;
}

/** Email Agent — generates booking/reply emails */
export async function emailAgent(params: { tone: string; recipient: string; context: string; subject?: string }) {
  const prompt = `Príjemca: ${params.recipient}\nTón: ${params.tone}\nKontext: ${params.context}\n\nNapíš profesionálny email v slovenčine pre kapelu D.O.R.A.`;
  const result = await generateText({ model: getModel("writing"), system: `Si booking manažér slovenskej kapely D.O.R.A. Tón: ${params.tone}. Píš v slovenčine.`, prompt });

  await db.automationLog.create({ data: { agentType: "email", trigger: "manual", input: JSON.stringify(params), output: result.text, status: "success" } });
  return result.text;
}

/** Booking Agent — analyzes a venue/festival URL */
export async function bookingAgent(url: string) {
  const prompt = `Analyzuj túto webstránku eventu/festivalu: ${url}\nVráť JSON:\n{"name":"názov","genre":"žáner","audience":"cieľová skupina","capacity":"kapacita","contact":"kontakt","email":"email","matchScore":0-100,"recommendation":"KONTAKTOVAŤ|NÍZKY|NEVHODNÉ","reason":"dôvod","suggestedEmail":"predmet"}\nVráť IBA JSON.`;
  const result = await generateText({ model: getModel("analysis"), system: "Si AI analytik pre hudobný priemysel. Vráť iba JSON.", prompt });

  let analysis;
  try { analysis = JSON.parse(result.text.replace(/```json\n?/g, "").replace(/\n?```/g, "")); }
  catch { analysis = { raw: result.text }; }

  await db.automationLog.create({ data: { agentType: "booking", trigger: "manual", input: url, output: result.text, status: "success" } });
  return analysis;
}

/** Inquiry Agent — auto-analyzes incoming booking inquiry */
export async function inquiryAgent(inquiry: Inquiry) {
  // 1. Create CRM contact from inquiry
  const contact = await db.contact.create({
    data: {
      type: "promoter",
      name: inquiry.organizer,
      email: inquiry.email,
      phone: inquiry.phone,
      notes: `Auto-created from inquiry: ${inquiry.eventType} @ ${inquiry.eventLocation} on ${inquiry.eventDate}`,
      tags: JSON.stringify(["auto-from-inquiry", inquiry.eventType.toLowerCase()]),
    },
  }).catch(() => null); // might already exist

  // 2. AI analysis of the inquiry
  const prompt = `Analyzuj booking dopyt:\nOrganizátor: ${inquiry.organizer}\nEmail: ${inquiry.email}\nTyp: ${inquiry.eventType}\nDátum: ${inquiry.eventDate}\nMiesto: ${inquiry.eventLocation}\nSpráva: ${inquiry.message}\n\nVráť JSON:\n{"matchScore":0-100,"priority":"high|medium|low","suggestedReply":"navrhovaná odpoveď v slovenčine","analysis":"stručná analýza potenciálu"}\nVráť IBA JSON.`;
  const result = await generateText({ model: getModel("analysis"), system: "Si booking analytik pre kapelu D.O.R.A. Vráť iba JSON.", prompt });

  let analysis = { matchScore: 50, priority: "medium", suggestedReply: "", analysis: "" };
  try { analysis = JSON.parse(result.text.replace(/```json\n?/g, "").replace(/\n?```/g, "")); }
  catch { /* fallback */ }

  // 3. Create booking record
  if (contact) {
    await db.booking.create({
      data: {
        contactId: contact.id,
        status: "lead",
        aiMatchScore: analysis.matchScore,
        aiAnalysis: analysis.analysis,
      },
    });
  }

  // 4. Create follow-up task
  await db.task.create({
    data: {
      title: `Odpovedať na dopyt: ${inquiry.organizer}`,
      description: `Dopyt na ${inquiry.eventType} @ ${inquiry.eventLocation}. AI návrh odpovede: ${analysis.suggestedReply?.slice(0, 200)}`,
      priority: analysis.priority || "medium",
      status: "todo",
      aiGenerated: true,
    },
  });

  // 5. Log communication
  if (contact) {
    await db.communication.create({
      data: {
        contactId: contact.id,
        type: "email",
        direction: "inbound",
        subject: `Booking dopyt: ${inquiry.eventType}`,
        body: inquiry.message,
        aiGenerated: false,
      },
    });
  }

  await db.automationLog.create({ data: { agentType: "inquiry", trigger: "inquiry_received", input: JSON.stringify(inquiry), output: JSON.stringify(analysis), status: "success" } });
  return { contact, analysis };
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

  if (trigger === "inquiry_received") {
    const inquiry = data as Inquiry;
    const result = await inquiryAgent(inquiry).catch(e => ({ error: e.message }));
    const hasContact = result && "contact" in result && !!result.contact;
    await db.automationLog.create({ data: { agentType: "orchestrator", trigger, input: JSON.stringify(inquiry), output: JSON.stringify({ hasContact }), status: "success" } });
    return result;
  }
}
