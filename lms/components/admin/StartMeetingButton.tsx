"use client";

import { Video } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { startClassAction } from "@/app/actions/meeting";

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
      className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 ${
        optimisticIsLive
          ? "bg-emerald-600 shadow-emerald-250/50 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200/70"
          : "bg-violet-600 shadow-violet-200/50 hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-200/70"
      }`}
    >
      <Video className="size-4" />
      <span className="hidden sm:inline">
        {optimisticIsLive ? "Rejoin meeting" : "Start meeting"}
      </span>
      {optimisticIsLive && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
      )}
    </button>
  );
}
