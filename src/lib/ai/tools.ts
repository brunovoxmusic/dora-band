/**
 * M4.2 — AI Tool System
 *
 * Definuje nástroje, ktoré AI agenti môžu volať.
 * Každý tool má:
 * - name: unikátny identifikátor
 * - description: čo robí
 * - permissions: READ | WRITE | CREATE | DELETE | SEND
 * - execute: funkcia, ktorá ho vykoná
 *
 * Toto je základ pre tool-calling v AI agentoch.
 */

export type ToolPermission = "READ" | "WRITE" | "CREATE" | "DELETE" | "SEND";

export type ToolResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

export type Tool = {
  name: string;
  description: string;
  permissions: ToolPermission[];
  /** Category for UI grouping */
  category: "crm" | "booking" | "content" | "task" | "analytics" | "search";
  /** Execute the tool with given parameters */
  execute: (params: Record<string, unknown>) => Promise<ToolResult>;
};

/**
 * Zoznam všetkých dostupných nástrojov.
 * Agenti môžu volať iba nástroje, na ktoré majú oprávnenie.
 */
export const TOOLS: Tool[] = [
  {
    name: "search_crm",
    description: "Vyhľadá kontakty v CRM podľa mena, emailu, organizácie alebo mesta",
    permissions: ["READ"],
    category: "crm",
    execute: async (params) => {
      try {
        const { db } = await import("@/lib/db");
        const query = String(params.query || "");
        if (!query) return { success: false, error: "query parameter is required" };
        const contacts = await db.contact.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { email: { contains: query, mode: "insensitive" as const } },
              { organization: { contains: query, mode: "insensitive" as const } },
              { city: { contains: query, mode: "insensitive" as const } },
            ],
          },
          take: 10,
          select: { id: true, name: true, email: true, type: true, organization: true, city: true, status: true, aiScore: true },
        });
        return { success: true, data: contacts };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    },
  },
  {
    name: "get_upcoming_gigs",
    description: "Vráti zoznam nadchádzajúcich koncertov",
    permissions: ["READ"],
    category: "booking",
    execute: async () => {
      try {
        const { db } = await import("@/lib/db");
        const gigs = await db.gig.findMany({
          where: { status: "upcoming", date: { gte: new Date() } },
          orderBy: { date: "asc" },
          take: 10,
          select: { id: true, title: true, date: true, venue: true, city: true, ticketPrice: true },
        });
        return { success: true, data: gigs };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    },
  },
  {
    name: "get_urgent_tasks",
    description: "Vráti zoznam urgentných nedokončených úloh",
    permissions: ["READ"],
    category: "task",
    execute: async () => {
      try {
        const { db } = await import("@/lib/db");
        const tasks = await db.task.findMany({
          where: { status: { not: "done" }, priority: { in: ["urgent", "high"] } },
          orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
          take: 10,
          select: { id: true, title: true, priority: true, dueDate: true, gigId: true },
        });
        return { success: true, data: tasks };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    },
  },
  {
    name: "get_new_inquiries",
    description: "Vráti nespracované booking dopyty",
    permissions: ["READ"],
    category: "booking",
    execute: async () => {
      try {
        const { db } = await import("@/lib/db");
        const inquiries = await db.bookingInquiry.findMany({
          where: { status: "new" },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, organizer: true, email: true, eventType: true, eventDate: true, eventLocation: true, message: true },
        });
        return { success: true, data: inquiries };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    },
  },
  {
    name: "get_knowledge",
    description: "Vyhľadá overené fakty v Knowledge Base",
    permissions: ["READ"],
    category: "search",
    execute: async (params) => {
      try {
        const { db } = await import("@/lib/db");
        const query = String(params.query || "");
        const where = query
          ? { OR: [{ key: { contains: query, mode: "insensitive" as const } }, { value: { contains: query, mode: "insensitive" as const } }], verified: true }
          : { verified: true };
        const facts = await db.knowledgeItem.findMany({
          where,
          take: 10,
          select: { category: true, key: true, value: true, source: true },
        });
        return { success: true, data: facts };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    },
  },
  {
    name: "get_analytics_summary",
    description: "Vráti súhrn kľúčových metrík (bookings, gigs, subscribers, tasks)",
    permissions: ["READ"],
    category: "analytics",
    execute: async () => {
      try {
        const { db } = await import("@/lib/db");
        const [gigs, upcomingGigs, inquiries, newInquiries, contacts, tasks, activeTasks, subscribers, songs, bookings] = await Promise.all([
          db.gig.count(),
          db.gig.count({ where: { status: "upcoming", date: { gte: new Date() } } }),
          db.bookingInquiry.count(),
          db.bookingInquiry.count({ where: { status: "new" } }),
          db.contact.count(),
          db.task.count(),
          db.task.count({ where: { status: { not: "done" } } }),
          db.subscriber.count({ where: { active: true } }),
          db.song.count(),
          db.booking.count({ where: { status: { notIn: ["cancelled", "confirmed"] } } }),
        ]);
        return { success: true, data: { gigs, upcomingGigs, inquiries, newInquiries, contacts, tasks, activeTasks, subscribers, songs, activeBookings: bookings } };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    },
  },
  {
    name: "create_task",
    description: "Vytvorí novú úlohu (M4.4: vyžaduje WRITE permission)",
    permissions: ["CREATE"],
    category: "task",
    execute: async (params) => {
      try {
        const { db } = await import("@/lib/db");
        if (!params.title) return { success: false, error: "title is required" };
        const task = await db.task.create({
          data: {
            title: String(params.title),
            description: params.description ? String(params.description) : null,
            priority: String(params.priority || "medium"),
            status: "todo",
            dueDate: params.dueDate ? new Date(String(params.dueDate)) : null,
            gigId: params.gigId ? String(params.gigId) : null,
            aiGenerated: true,
          },
        });
        return { success: true, data: task };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    },
  },
];

/**
 * Vráti tool podľa mena.
 */
export function getTool(name: string): Tool | undefined {
  return TOOLS.find(t => t.name === name);
}

/**
 * Vráti zoznam tool názvov pre dané permissions.
 */
export function getToolsForPermissions(permissions: ToolPermission[]): string[] {
  return TOOLS
    .filter(t => t.permissions.some(p => permissions.includes(p)))
    .map(t => t.name);
}

/**
 * Zoznam všetkých tool názvov (pre zobrazenie v UI).
 */
export const TOOL_NAMES = TOOLS.map(t => ({
  name: t.name,
  description: t.description,
  permissions: t.permissions,
  category: t.category,
}));
