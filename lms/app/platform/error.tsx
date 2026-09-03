"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function PlatformError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <h2 className="font-display text-xl text-ink-900">Something tore the page</h2>
        <p className="mt-2 text-sm text-ink-500">
          The page hit an error it couldn&rsquo;t recover from. Nothing was lost.
        </p>
        <Button className="mt-5" onClick={reset}>
          Try again
        </Button>
      </Card>
    </div>
  );
}
