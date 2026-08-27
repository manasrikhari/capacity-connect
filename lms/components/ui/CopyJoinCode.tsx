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
      className="inline-flex cursor-pointer items-center gap-1 rounded-md p-0.5 text-slate-400 transition-colors hover:text-violet-600"
      aria-label="Copy join code"
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-500" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}
