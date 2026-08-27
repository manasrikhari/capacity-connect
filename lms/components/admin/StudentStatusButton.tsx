"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { updateEnrollmentStatus } from "@/app/admin/students/actions";
import { Button, type ButtonProps } from "@/components/ui/Button";

export function StudentStatusButton({
  enrollmentId,
  status,
  variant,
  children,
}: {
  enrollmentId: string;
  status: "APPROVED" | "REJECTED";
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
          const result = await updateEnrollmentStatus({ enrollmentId, status });
          if (result?.error) {
            toast.error(result.error);
          } else {
            toast.success(status === "APPROVED" ? "Student approved" : "Student rejected");
          }
        });
      }}
    >
      {children}
    </Button>
  );
}
