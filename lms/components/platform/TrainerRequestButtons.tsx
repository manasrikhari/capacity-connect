"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { approveTrainerRequestAction, rejectTrainerRequestAction } from "@/app/platform/actions";
import { Button } from "@/components/ui/Button";

export function TrainerRequestButtons({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();

  function run(fn: (id: string) => Promise<{ error?: string }>, ok: string) {
    startTransition(async () => {
      const result = await fn(requestId);
      if (result?.error) toast.error(result.error);
      else toast.success(ok);
    });
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="primary"
        size="sm"
        loading={pending}
        onClick={() => run(approveTrainerRequestAction, "Trainer approved")}
      >
        Approve
      </Button>
      <Button
        type="button"
        variant="danger"
        size="sm"
        loading={pending}
        onClick={() => run(rejectTrainerRequestAction, "Request rejected")}
      >
        Reject
      </Button>
    </div>
  );
}
