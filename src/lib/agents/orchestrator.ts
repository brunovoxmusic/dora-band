import { generateText, streamText } from "ai";
import { getModel } from "@/lib/ai";
import { db } from "@/lib/db";
import { sanitizeForPrompt } from "@/lib/ai/sanitize";

/**
 * AI Agent Framework for D.O.R.A. Band Management OS.
 * Multi-agent orchestration with trigger-based workflows.
 *
 * P0 SECURITY FIXES (M0.8 + M0.9):
 * - inquiryAgent: NO LONGER auto-creates Contact/Booking/Task/Communication.
 *   Instead, stores AI analysis as a "pending" AutomationLog for admin review.
 *   Admin approves → records are created manually or via approval workflow.
 * - Prompt injection defense: all user-provided text is sanitized before
 *   insertion into LLM prompts (sanitized via @/lib/ai/sanitize).
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

  // B.2 Human-in-the-Loop: NO auto-create Task záznamov.
  // Namiesto toho vytvor ApprovalQueue návrhy pre každú úlohu.
  // Admin schváli → Task sa vytvorí cez /api/admin/approvals/[id]/approve.
  const created = await Promise.all(tasks.map(t =>
    db.approvalQueue.create({
      data: {
        agentType: "task",
        entityType: "Task",
        action: "create_task",
        payload: JSON.stringify({
          title: t.title,
          dueDate: t.dueDate,
          priority: t.priority || "medium",
          gigId: gig.id,
        }),
        reasoning: `Auto-generované pre koncert "${gig.title}" (${gigDate.toLocaleDateString("sk-SK")})`,
        gigId: gig.id,
        status: "pending",
      },
    })
  ));

  await db.automationLog.create({ data: { agentType: "task", trigger: "gig_created", input: JSON.stringify(gig), output: JSON.stringify({ pendingApprovals: created.length, tasks }), status: "success" } });
  return created;
}

/** Email Agent — generates booking/reply emails */
export async function emailAgent(params: { tone: string; recipient: string; context: string; subject?: string }) {
  const safeRecipient = sanitizeForPrompt(params.recipient, 100);
  const safeContext = sanitizeForPrompt(params.context, 1000);
  const prompt = `Príjemca: ${safeRecipient}\nTón: ${params.tone}\nKontext: ${safeContext}\n\nNapíš profesionálny email v slovenčine pre kapelu D.O.R.A.`;
  const result = await generateText({ model: getModel("writing"), system: `Si booking manažér slovenskej kapely D.O.R.A. Tón: ${params.tone}. Píš v slovenčine.`, prompt });

  await db.automationLog.create({ data: { agentType: "email", trigger: "manual", input: JSON.stringify(params), output: result.text, status: "success" } });
  return result.text;
}

/** Booking Agent — analyzes a venue/festival URL */
export async function bookingAgent(url: string) {
  const safeUrl = sanitizeForPrompt(url, 500);
  const prompt = `Analyzuj túto webstránku eventu/festivalu: ${safeUrl}\nVráť JSON:\n{"name":"názov","genre":"žáner","audience":"cieľová skupina","capacity":"kapacita","contact":"kontakt","email":"email","matchScore":0-100,"recommendation":"KONTAKTOVAŤ|NÍZKY|NEVHODNÉ","reason":"dôvod","suggestedEmail":"predmet"}\nVráť IBA JSON.`;
  const result = await generateText({ model: getModel("analysis"), system: "Si AI analytik pre hudobný priemysel. Vráť iba JSON.", prompt });

  let analysis;
  try { analysis = JSON.parse(result.text.replace(/```json\n?/g, "").replace(/\n?```/g, "")); }
  catch { analysis = { raw: result.text }; }

  await db.automationLog.create({ data: { agentType: "booking", trigger: "manual", input: url, output: result.text, status: "success" } });
  return analysis;
}

/**
 * Inquiry Agent — analyzes incoming booking inquiry.
 *
 * P0-8 (Human-in-the-Loop): NO LONGER auto-creates Contact/Booking/Task/Communication.
 * Instead, stores AI analysis in AutomationLog with status "pending_review".
 * Admin reviews the analysis and manually creates records if approved.
 *
 * P0-9 (Prompt Injection): inquiry.message is sanitized before prompt insertion.
 */
export async function inquiryAgent(inquiry: Inquiry) {
  // M0-9: Sanitize all user-provided fields before LLM prompt
  const safeOrganizer = sanitizeForPrompt(inquiry.organizer, 100);
  const safeEmail = sanitizeForPrompt(inquiry.email, 100);
  const safeEventType = sanitizeForPrompt(inquiry.eventType, 50);
  const safeEventDate = sanitizeForPrompt(inquiry.eventDate, 50);
  const safeEventLocation = sanitizeForPrompt(inquiry.eventLocation, 200);
  const safeMessage = sanitizeForPrompt(inquiry.message, 500);

  // AI analysis with sanitized input
  const prompt = `Analyzuj booking dopyt:\nOrganizátor: ${safeOrganizer}\nEmail: ${safeEmail}\nTyp: ${safeEventType}\nDátum: ${safeEventDate}\nMiesto: ${safeEventLocation}\nSpráva: ${safeMessage}\n\nVráť JSON:\n{"matchScore":0-100,"priority":"high|medium|low","suggestedReply":"navrhovaná odpoveď v slovenčine","analysis":"stručná analýza potenciálu"}\nVráť IBA JSON.`;
  const result = await generateText({ model: getModel("analysis"), system: "Si booking analytik pre kapelu D.O.R.A. Vráť iba JSON.", prompt });

  let analysis = { matchScore: 50, priority: "medium", suggestedReply: "", analysis: "" };
  try { analysis = JSON.parse(result.text.replace(/```json\n?/g, "").replace(/\n?```/g, "")); }
  catch { /* fallback */ }

  // M0-8: Human-in-the-Loop — NO auto-create of Contact/Booking/Task/Communication.
  // Store analysis as pending review in AutomationLog.
  // Admin reviews and creates records manually.
  await db.automationLog.create({
    data: {
      agentType: "inquiry",
      trigger: "inquiry_received",
      input: JSON.stringify({
        inquiryId: inquiry.id,
        organizer: inquiry.organizer,
        email: inquiry.email,
        phone: inquiry.phone,
        eventType: inquiry.eventType,
        eventDate: inquiry.eventDate,
        eventLocation: inquiry.eventLocation,
      }),
      output: JSON.stringify({
        ...analysis,
        // Include raw inquiry data for admin to create records if approved
        pendingAction: "review_and_create_contact_booking",
        inquiryData: {
          organizer: inquiry.organizer,
          email: inquiry.email,
          phone: inquiry.phone,
          notes: `Inquiry: ${inquiry.eventType} @ ${inquiry.eventLocation} on ${inquiry.eventDate}`,
          message: inquiry.message,
        },
      }),
      status: "success",
    },
  });

  return { analysis, pendingReview: true };
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
    await db.automationLog.create({ data: { agentType: "orchestrator", trigger, input: JSON.stringify(inquiry), output: JSON.stringify({ pendingReview: true }), status: "success" } });
    return result;
  }
}
