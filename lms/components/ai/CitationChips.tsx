"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import type { Citation } from "@/lib/graphrag";

/**
 * Render the knowledge-graph nodes that grounded a MeghDoot answer as chips,
 * grouped by category. Each chip carries its source as a tooltip. A tiny mono
 * caption reports the graph node count. Renders nothing when there are no
 * citations.
 */
export function CitationChips({ citations }: { citations: Citation[] }) {
  if (!citations || citations.length === 0) return null;

  // Group by category (fall back to a neutral bucket for uncategorised nodes).
  const groups = new Map<string, Citation[]>();
  for (const c of citations) {
    const key = c.category || "Other";
    const list = groups.get(key);
    if (list) list.push(c);
    else groups.set(key, [c]);
  }

  return (
    <div className="mt-3 space-y-2 border-t border-hair pt-2.5">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
        graph · {citations.length} node{citations.length === 1 ? "" : "s"}
      </div>
      <div className="space-y-1.5">
        {Array.from(groups.entries()).map(([category, items]) => (
          <div key={category} className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-300">
              {category}
            </span>
            {items.map((c) => (
              <Badge
                key={c.nodeId}
                color="violet"
                title={c.source || c.nodeName}
              >
                {c.nodeName}
              </Badge>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
