import { describe, expect, it } from "vitest";
import {
  ADMIN_PERMISSION_MATRIX,
  hasAdminPermission,
  normalizeAdminRole,
  type AdminPermission,
} from "@/lib/roles";
import { isAdminSessionUsable, wouldRemoveLastActiveSuperadmin } from "@/lib/admin-security";
import type { AdminRole } from "@prisma/client";

const allPermissions: AdminPermission[] = [
  "dashboard:read",
  "participants:read",
  "participants:details",
  "participants:progress",
  "participants:export",
  "responses:read",
  "certificates:read",
  "certificates:write",
  "content:read",
  "content:write",
  "registration:write",
  "site_content:write",
  "settings:read",
  "settings:write",
  "admins:read",
  "admins:write",
  "audit:read",
];

describe("admin permission matrix", () => {
  const roles = Object.keys(ADMIN_PERMISSION_MATRIX) as Exclude<AdminRole, "SAFEGUARDING" | "VIEWER">[];

  it.each(roles.flatMap((role) => allPermissions.map((permission) => [role, permission] as const)))(
    "%s permission %s matches the documented matrix",
    (role, permission) => {
      expect(hasAdminPermission(role, permission)).toBe(
        ADMIN_PERMISSION_MATRIX[role].includes(permission)
      );
    }
  );

  it("maps legacy roles to least-privilege replacements", () => {
    expect(normalizeAdminRole("SAFEGUARDING")).toBe("SAFEGUARDING_REVIEWER");
    expect(normalizeAdminRole("VIEWER")).toBe("REPORTING_ADMIN");
    expect(hasAdminPermission("VIEWER", "responses:read")).toBe(false);
    expect(hasAdminPermission("SAFEGUARDING", "content:write")).toBe(false);
  });

  it("does not grant reporting export access to paragraph or participant details", () => {
    expect(hasAdminPermission("REPORTING_ADMIN", "participants:export")).toBe(true);
    expect(hasAdminPermission("REPORTING_ADMIN", "participants:details")).toBe(false);
    expect(hasAdminPermission("REPORTING_ADMIN", "responses:read")).toBe(false);
  });
});

describe("admin account safety guards", () => {
  it("prevents removing the last active superadmin and permits changes when another remains", () => {
    const base = { targetRole: "SUPERADMIN" as const, targetActive: true, removePrivileges: true };
    expect(wouldRemoveLastActiveSuperadmin({ ...base, activeSuperadminCount: 1 })).toBe(true);
    expect(wouldRemoveLastActiveSuperadmin({ ...base, activeSuperadminCount: 2 })).toBe(false);
    expect(wouldRemoveLastActiveSuperadmin({ ...base, targetActive: false, activeSuperadminCount: 1 })).toBe(false);
    expect(wouldRemoveLastActiveSuperadmin({ ...base, targetRole: "REPORTING_ADMIN", activeSuperadminCount: 1 })).toBe(false);
  });

  it("rejects missing, revoked, expired, disabled and deleted sessions", () => {
    const valid = { accountActive: true, softDeleted: false, sessionFound: true, sessionRevoked: false, sessionExpired: false };
    expect(isAdminSessionUsable(valid)).toBe(true);
    expect(isAdminSessionUsable({ ...valid, sessionFound: false })).toBe(false);
    expect(isAdminSessionUsable({ ...valid, sessionRevoked: true })).toBe(false);
    expect(isAdminSessionUsable({ ...valid, sessionExpired: true })).toBe(false);
    expect(isAdminSessionUsable({ ...valid, accountActive: false })).toBe(false);
    expect(isAdminSessionUsable({ ...valid, softDeleted: true })).toBe(false);
  });
});
