import type { ApprovalStatus, Role } from "@/app/generated/prisma/enums";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      status: ApprovalStatus;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    status: ApprovalStatus;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    status: ApprovalStatus;
    lastSync?: number;
  }
}
