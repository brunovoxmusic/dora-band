import { db } from "@/lib/db";
import type { ToolPermission } from "@/lib/ai/tools";

/**
 * B.4 — RBAC (Role-Based Access Control) pre AI agentov
 *
 * Každá role má pridelené permissions ktoré určujú:
 * - Ktoré tools môže agent volať (READ, WRITE, CREATE, DELETE, SEND)
 * - Ktoré akcie môže vykonávať (approve, reject, publish, send)
 *
 * Roles:
 * - admin: plný prístup (all permissions)
 * - editor: READ + WRITE + CREATE (môže editovať obsah, ale nemôže mazať/publikovať)
 * - viewer: READ only (iba prehliadanie)
 *
 * Použitie:
 *   const perms = await getUserPermissions(session.uid);
 *   if (!perms.includes("CREATE")) return 403;
 */

export type Role = "admin" | "editor" | "viewer";

const ROLE_PERMISSIONS: Record<Role, ToolPermission[]> = {
  admin: ["READ", "WRITE", "CREATE", "DELETE", "SEND"],
  editor: ["READ", "WRITE", "CREATE"],
  viewer: ["READ"],
};

/**
 * Vráti role pre admin usera podľa UID.
 * Ak user neexistuje, vráti "viewer" (najobmedzenejšia).
 */
export async function getUserRole(userId: string): Promise<Role> {
  try {
    const user = await db.adminUser.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) return "viewer";
    const role = user.role.toLowerCase() as Role;
    if (!["admin", "editor", "viewer"].includes(role)) return "viewer";
    return role;
  } catch {
    return "viewer";
  }
}

/**
 * Vráti permissions pre danú role.
 */
export function getRolePermissions(role: Role): ToolPermission[] {
  return ROLE_PERMISSIONS[role] || ["READ"];
}

/**
 * Vráti permissions pre usera (combine role + permissions).
 */
export async function getUserPermissions(userId: string): Promise<ToolPermission[]> {
  const role = await getUserRole(userId);
  return getRolePermissions(role);
}

/**
 * Skontroluje či user má konkrétnu permission.
 */
export async function hasPermission(
  userId: string,
  permission: ToolPermission
): Promise<boolean> {
  const perms = await getUserPermissions(userId);
  return perms.includes(permission);
}

/**
 * Vráti zoznam všetkých dostupných rolí (pre UI).
 */
export function listRoles(): { value: Role; label: string; permissions: ToolPermission[] }[] {
  return [
    { value: "admin", label: "Admin — plný prístup", permissions: ROLE_PERMISSIONS.admin },
    { value: "editor", label: "Editor — READ + WRITE + CREATE", permissions: ROLE_PERMISSIONS.editor },
    { value: "viewer", label: "Viewer — READ only", permissions: ROLE_PERMISSIONS.viewer },
  ];
}
