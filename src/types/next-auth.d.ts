import type { AdminRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: AdminRole;
  }

  interface Session {
    user: {
      id: string;
      role: AdminRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    adminId?: string;
    role?: AdminRole;
  }
}
