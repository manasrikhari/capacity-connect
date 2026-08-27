"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { deleteStudent } from "@/app/admin/students/actions";
import { Button } from "@/components/ui/Button";

export function StudentDeleteButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      loading={pending}
      onClick={() => {
        if (!confirm(`Remove ${studentName} from this batch? This cannot be undone.`)) return;
        startTransition(async () => {
          const result = await deleteStudent(studentId);
          if (result?.error) {
            toast.error(result.error);
          } else {
            toast.success("Student removed from batch");
          }
        });
      }}
    >
      Remove
    </Button>
  );
}
