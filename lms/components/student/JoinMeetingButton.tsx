"use client";

import { Video } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { joinMeetingAction } from "@/app/actions/meeting";
import { buttonClasses } from "@/components/ui/Button";
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
        buttonClasses("primary", "md"),
        "cursor-pointer disabled:cursor-not-allowed disabled:opacity-70",
        className
      )}
    >
      {children ?? (
        <>
          <Video className="size-4" />
          <span>Join meeting</span>
        </>
      )}
    </button>
  );
}
