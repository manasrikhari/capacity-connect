"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: "0.75rem",
          background: "#ffffff",
          color: "#1e1b2e",
          border: "1px solid #ede9fe",
          boxShadow: "0 4px 16px rgba(124, 58, 237, 0.12)",
          fontSize: "0.875rem",
        },
        success: { iconTheme: { primary: "#7c3aed", secondary: "#ffffff" } },
        error: { iconTheme: { primary: "#dc2626", secondary: "#ffffff" } },
      }}
    />
  );
}
