"use client";

import { Video } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { startClassAction } from "@/app/actions/meeting";
import { buttonClasses } from "@/components/ui/Button";

export function StartMeetingButton({
  batchId,
  isLive,
}: {
  batchId: string;
  isLive: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [optimisticIsLive, setOptimisticIsLive] = useOptimistic(isLive);
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      setOptimisticIsLive(true);
      const result = await startClassAction(batchId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={optimisticIsLive ? "Rejoin class session" : "Start instant class session"}
      className={buttonClasses(
        "primary",
        "md",
        "shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
      )}
    >
      <Video className="size-4" />
      <span className="hidden sm:inline">
        {optimisticIsLive ? "Rejoin meeting" : "Start meeting"}
      </span>
      {optimisticIsLive && (
        <span
          className="inline-block size-2 rounded-full bg-status-live"
          style={{ animation: "live-pulse 1.8s var(--ease-out) infinite" }}
        />
      )}
    </button>
  );
}
