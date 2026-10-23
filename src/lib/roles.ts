import type { AdminRole } from "@prisma/client";

export const ADMIN_ROLES: AdminRole[] = ["SUPERADMIN", "SAFEGUARDING", "VIEWER"];
export const SAFEGUARDING_ROLES: AdminRole[] = ["SUPERADMIN", "SAFEGUARDING"];

export type AdminSessionUser = {
  id: string;
  email: string;
  name?: string | null;
  role: AdminRole;
};
