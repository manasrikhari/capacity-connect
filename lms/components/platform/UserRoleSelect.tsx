"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import type { Role } from "@/app/generated/prisma/enums";
import { updateUserRoleAction } from "@/app/platform/actions";
import { Select } from "@/components/ui/Field";
import { ROLE_LABEL } from "@/lib/roles";

const ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "STUDENT"];

/** Inline role changer used in the /platform tables. Guards live server-side. */
export function UserRoleSelect({ userId, role }: { userId: string; role: Role }) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      aria-label="Change role"
      defaultValue={role}
      disabled={pending}
      className="min-w-[8rem] text-xs"
      onChange={(e) => {
        const next = e.target.value as Role;
        const el = e.target;
        if (next === role) return;
        startTransition(async () => {
          const result = await updateUserRoleAction(userId, next);
          if (result?.error) {
            toast.error(result.error);
            el.value = role; // revert on refusal
          } else {
            toast.success(`Role changed to ${ROLE_LABEL[next]}`);
          }
        });
      }}
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABEL[r]}
        </option>
      ))}
    </Select>
  );
}
