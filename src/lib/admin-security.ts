import type { AdminRole } from "@prisma/client";

export function wouldRemoveLastActiveSuperadmin(input: {
  targetRole: AdminRole;
  targetActive: boolean;
  activeSuperadminCount: number;
  removePrivileges: boolean;
}) {
  return Boolean(
    input.targetRole === "SUPERADMIN" &&
      input.targetActive &&
      input.removePrivileges &&
      input.activeSuperadminCount <= 1
  );
}

export function isAdminSessionUsable(input: {
  accountActive: boolean;
  softDeleted: boolean;
  sessionFound: boolean;
  sessionRevoked: boolean;
  sessionExpired: boolean;
}) {
  return Boolean(
    input.accountActive &&
      !input.softDeleted &&
      input.sessionFound &&
      !input.sessionRevoked &&
      !input.sessionExpired
  );
}
