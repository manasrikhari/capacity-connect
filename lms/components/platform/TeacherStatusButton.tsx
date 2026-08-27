"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import type { ApprovalStatus } from "@/app/generated/prisma/enums";
import { updateTeacherStatus } from "@/app/platform/actions";
import { Button, type ButtonProps } from "@/components/ui/Button";

const TOAST_LABELS: Record<string, string> = {
  APPROVED: "Teacher approved",
  REJECTED: "Teacher rejected",
  SUSPENDED: "Teacher suspended",
};

export function TeacherStatusButton({
  teacherId,
  status,
  variant,
  children,
}: {
  teacherId: string;
  status: Extract<ApprovalStatus, "APPROVED" | "REJECTED" | "SUSPENDED">;
  variant?: ButtonProps["variant"];
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      loading={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await updateTeacherStatus({ teacherId, status });
          if (result?.error) {
            toast.error(result.error);
          } else {
            toast.success(TOAST_LABELS[status] ?? "Status updated");
          }
        });
      }}
    >
      {children}
    </Button>
  );
}
