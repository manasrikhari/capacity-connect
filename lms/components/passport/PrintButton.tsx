"use client";

import { Printer } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";

/** Print the passport via the browser's print dialog (a "Save as PDF" path too). */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClasses("secondary", "sm")}>
      <Printer className="size-4" />
      Print / save PDF
    </button>
  );
}
