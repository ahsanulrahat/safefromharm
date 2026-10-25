import type { AdminRole } from "@prisma/client";

export const ADMIN_ROLES: AdminRole[] = [
  "SUPERADMIN",
  "CONTENT_MANAGER",
  "SAFEGUARDING_REVIEWER",
  "REPORTING_ADMIN",
];

export type AdminPermission =
  | "dashboard:read"
  | "participants:read"
  | "participants:details"
  | "participants:progress"
  | "participants:export"
  | "responses:read"
  | "certificates:read"
  | "certificates:write"
  | "content:read"
  | "content:write"
  | "registration:write"
  | "site_content:write"
  | "settings:read"
  | "settings:write"
  | "admins:read"
  | "admins:write"
  | "audit:read";

export const ADMIN_PERMISSION_MATRIX: Record<
  Exclude<AdminRole, "SAFEGUARDING" | "VIEWER">,
  readonly AdminPermission[]
> = {
  SUPERADMIN: [
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
  ],
  CONTENT_MANAGER: [
    "content:read",
    "content:write",
    "registration:write",
    "site_content:write",
  ],
  SAFEGUARDING_REVIEWER: [
    "dashboard:read",
    "participants:read",
    "participants:details",
    "participants:progress",
    "responses:read",
    "certificates:read",
  ],
  REPORTING_ADMIN: [
    "dashboard:read",
    "participants:export",
  ],
};

/** Map legacy database enum values to the closest least-privilege role. */
export function normalizeAdminRole(role: AdminRole): keyof typeof ADMIN_PERMISSION_MATRIX {
  if (role === "SAFEGUARDING") return "SAFEGUARDING_REVIEWER";
  if (role === "VIEWER") return "REPORTING_ADMIN";
  return role;
}

export function hasAdminPermission(
  role: AdminRole,
  permission: AdminPermission
): boolean {
  return ADMIN_PERMISSION_MATRIX[normalizeAdminRole(role)].includes(permission);
}

export type AdminSessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: AdminRole;
  sessionId: string;
  mustChangePassword: boolean;
};
