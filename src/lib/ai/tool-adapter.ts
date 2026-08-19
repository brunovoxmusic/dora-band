import { z } from "zod";
import { TOOLS, type ToolPermission } from "@/lib/ai/tools";

/**
 * B.1 — AI Tool System Adapter
 *
 * Transformuje interné TOOLS (z tools.ts) do Vercel AI SDK tool formátu.
 * Používa `any` pre toolset kvôli AI SDK v7 komplexným generickým typom.
 *
 * Adapter pridáva:
 *   - Zod parameters (voľné — akceptuje akýkoľvek objekt)
 *   - Logging (volanie toolu sa zaznamená)
 *   - Error handling
 */

/**
 * Vráti AI SDK toolset z našich TOOLS, filtrovaný podľa permissions.
 *
 * @param allowedPermissions - ktoré permissions má volajúci agent (READ, WRITE, ...)
 * @returns Record<toolName, AiTool> (casted to any pre AI SDK kompatibilitu)
 */
export function getAiSdkTools(allowedPermissions: ToolPermission[] = ["READ"]): Record<string, unknown> {
  const toolset: Record<string, unknown> = {};

  for (const t of TOOLS) {
    // B.4 RBAC: len tools, na ktoré má agent permission
    const hasPermission = t.permissions.some((p) => allowedPermissions.includes(p));
    if (!hasPermission) continue;

    toolset[t.name] = {
      description: t.description,
      parameters: z.object({}).passthrough(),
      execute: async (params: Record<string, unknown>) => {
        const start = Date.now();
        try {
          console.log(`[ai-tool] ${t.name} called with:`, JSON.stringify(params).slice(0, 200));
          const result = await t.execute(params);
          const latency = Date.now() - start;
          console.log(`[ai-tool] ${t.name} completed in ${latency}ms, success: ${result.success}`);
          if (!result.success) {
            return { error: result.error || "Tool execution failed", success: false };
          }
          return result.data;
        } catch (err) {
          const latency = Date.now() - start;
          console.error(`[ai-tool] ${t.name} error after ${latency}ms:`, err);
          return { error: err instanceof Error ? err.message : String(err), success: false };
        }
      },
    };
  }

  return toolset;
}

/**
 * Vráti zoznam všetkých dostupných tool názvov (pre debugging / UI).
 */
export function listAvailableTools(permissions: ToolPermission[] = ["READ"]): string[] {
  return TOOLS
    .filter((t) => t.permissions.some((p) => permissions.includes(p)))
    .map((t) => t.name);
}
