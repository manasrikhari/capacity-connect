"use client";

import { Video } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { joinMeetingAction } from "@/app/actions/meeting";
import { cn } from "@/lib/utils";

export function JoinMeetingButton({
  meetingId,
  className,
  children,
}: {
  meetingId: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const result = await joinMeetingAction(meetingId);
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
      aria-label="Join current meeting"
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-emerald-200/50 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200/70 active:translate-y-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0",
        className
      )}
    >
      {children ?? (
        <>
          <Video className="size-4" />
          <span className="hidden sm:inline">Join Meeting</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
        </>
      )}
    </button>
  );
}
