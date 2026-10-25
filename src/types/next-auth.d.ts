import type { AdminRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: AdminRole;
    adminSessionId?: string;
    mustChangePassword?: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: AdminRole;
      adminSessionId: string;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    adminId?: string;
    role?: AdminRole;
    adminSessionId?: string;
    mustChangePassword?: boolean;
  }
}
