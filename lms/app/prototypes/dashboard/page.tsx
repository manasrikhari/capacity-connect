"use client";

/* Design handoff surface — renders the approved student-dashboard design,
   LIFTED 2.0, on mock data. See designs/README.md for the integration notes.

   Dev-only: proxy.ts exempts /prototypes from auth outside production. Delete
   this route (and that exemption) once the design is integrated. */

import { useLayoutEffect, useState } from "react";
import { Lifted2, type Ground } from "./designs/Lifted2";
import "./shell.css";

/* Plum is the chosen ground. The other two walls stay switchable so the
   integrator can compare — the component itself defaults to sage, the page
   passes the decision. */
const GROUNDS: Array<{ key: Ground; label: string; swatch: string }> = [
  { key: "plum", label: "Plum paper (chosen)", swatch: "#F0EEF3" },
  { key: "porcelain", label: "Porcelain", swatch: "#F3F3F0" },
  { key: "sage", label: "Classroom sage", swatch: "#EEF0E8" },
];

export default function DashboardPrototype() {
  const [ground, setGround] = useState<Ground>("plum");

  useLayoutEffect(() => {
    const g = new URLSearchParams(window.location.search).get("g") as Ground | null;
    if (g && GROUNDS.some((x) => x.key === g)) setGround(g);
  }, []);

  const pickGround = (g: Ground) => {
    setGround(g);
    const url = new URL(window.location.href);
    url.searchParams.set("g", g);
    window.history.replaceState(null, "", url);
  };

  return (
    <div className="pt-wrap">
      <div className="pt-grounds">
        <span>Ground:</span>
        {GROUNDS.map((g) => (
          <button
            key={g.key}
            className="pt-g"
            aria-pressed={ground === g.key}
            onClick={() => pickGround(g.key)}
          >
            <i style={{ background: g.swatch }} />
            {g.label}
          </button>
        ))}
      </div>

      <Lifted2 ground={ground} />
    </div>
  );
}
