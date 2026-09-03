"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyJoinCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex cursor-pointer items-center gap-1 rounded-[6px] p-0.5 text-ink-300 transition-colors hover:text-plum-700"
      aria-label="Copy join code"
    >
      {copied ? (
        <Check className="size-3.5 text-sage-600" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}
