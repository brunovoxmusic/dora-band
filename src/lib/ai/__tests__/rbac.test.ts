import { describe, it, expect } from "vitest";
import { getRolePermissions, listRoles, type Role } from "@/lib/ai/rbac";

describe("RBAC", () => {
  describe("getRolePermissions", () => {
    it("admin má všetky permissions", () => {
      const perms = getRolePermissions("admin");
      expect(perms).toContain("READ");
      expect(perms).toContain("WRITE");
      expect(perms).toContain("CREATE");
      expect(perms).toContain("DELETE");
      expect(perms).toContain("SEND");
    });

    it("editor má READ, WRITE, CREATE ale nie DELETE/SEND", () => {
      const perms = getRolePermissions("editor");
      expect(perms).toContain("READ");
      expect(perms).toContain("WRITE");
      expect(perms).toContain("CREATE");
      expect(perms).not.toContain("DELETE");
      expect(perms).not.toContain("SEND");
    });

    it("viewer má iba READ", () => {
      const perms = getRolePermissions("viewer");
      expect(perms).toEqual(["READ"]);
    });

    it("neznáma role vráti READ only (fallback)", () => {
      const perms = getRolePermissions("unknown" as Role);
      expect(perms).toEqual(["READ"]);
    });
  });

  describe("listRoles", () => {
    it("vráti 3 role", () => {
      const roles = listRoles();
      expect(roles).toHaveLength(3);
    });

    it("obsahuje admin, editor, viewer", () => {
      const roles = listRoles();
      const values = roles.map((r) => r.value);
      expect(values).toContain("admin");
      expect(values).toContain("editor");
      expect(values).toContain("viewer");
    });

    it("každá role má value, label, permissions", () => {
      for (const role of listRoles()) {
        expect(role.value).toBeTruthy();
        expect(role.label).toBeTruthy();
        expect(Array.isArray(role.permissions)).toBe(true);
        expect(role.permissions.length).toBeGreaterThan(0);
      }
    });

    it("admin má najviac permissions", () => {
      const roles = listRoles();
      const admin = roles.find((r) => r.value === "admin");
      const viewer = roles.find((r) => r.value === "viewer");
      expect(admin!.permissions.length).toBeGreaterThan(viewer!.permissions.length);
    });
  });
});
