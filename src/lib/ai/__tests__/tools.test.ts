import { describe, it, expect } from "vitest";
import { TOOLS, getTool, getToolsForPermissions, TOOL_NAMES } from "@/lib/ai/tools";

describe("AI Tools", () => {
  describe("TOOLS", () => {
    it("obsahuje 7 definovaných tools", () => {
      expect(TOOLS).toHaveLength(7);
    });

    it("každý tool má name, description, permissions, category, execute", () => {
      for (const tool of TOOLS) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(Array.isArray(tool.permissions)).toBe(true);
        expect(tool.permissions.length).toBeGreaterThan(0);
        expect(["crm", "booking", "content", "task", "analytics", "search"]).toContain(tool.category);
        expect(typeof tool.execute).toBe("function");
      }
    });

    it("obsahuje search_crm tool", () => {
      expect(TOOLS.find((t) => t.name === "search_crm")).toBeTruthy();
    });

    it("obsahuje get_upcoming_gigs tool", () => {
      expect(TOOLS.find((t) => t.name === "get_upcoming_gigs")).toBeTruthy();
    });

    it("obsahuje create_task tool", () => {
      expect(TOOLS.find((t) => t.name === "create_task")).toBeTruthy();
    });
  });

  describe("getTool", () => {
    it("nájde tool podľa mena", () => {
      const tool = getTool("search_crm");
      expect(tool).toBeTruthy();
      expect(tool?.name).toBe("search_crm");
    });

    it("vráti undefined pre neznámy tool", () => {
      expect(getTool("nonexistent")).toBeUndefined();
    });
  });

  describe("getToolsForPermissions", () => {
    it("vráti READ tools pre READ permission", () => {
      const tools = getToolsForPermissions(["READ"]);
      expect(tools).toContain("search_crm");
      expect(tools).toContain("get_upcoming_gigs");
      expect(tools).toContain("get_knowledge");
    });

    it("vráti CREATE tools pre CREATE permission", () => {
      const tools = getToolsForPermissions(["CREATE"]);
      expect(tools).toContain("create_task");
    });

    it("nevráti CREATE tools pre READ only permission", () => {
      const tools = getToolsForPermissions(["READ"]);
      expect(tools).not.toContain("create_task");
    });

    it("vráti všetky tools pre READ + CREATE", () => {
      const tools = getToolsForPermissions(["READ", "CREATE"]);
      // 6 READ tools + 1 CREATE tool = 7
      expect(tools.length).toBe(7);
    });

    it("vráti prázdne pole pre žiadnu permission", () => {
      const tools = getToolsForPermissions([]);
      expect(tools).toHaveLength(0);
    });
  });

  describe("TOOL_NAMES", () => {
    it("má rovnaký počet ako TOOLS", () => {
      expect(TOOL_NAMES).toHaveLength(7);
    });

    it("každá položka má name, description, permissions, category", () => {
      for (const t of TOOL_NAMES) {
        expect(t.name).toBeTruthy();
        expect(t.description).toBeTruthy();
        expect(Array.isArray(t.permissions)).toBe(true);
        expect(t.category).toBeTruthy();
      }
    });
  });
});
