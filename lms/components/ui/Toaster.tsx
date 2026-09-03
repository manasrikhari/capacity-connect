"use client";

import { Toaster as HotToaster } from "react-hot-toast";

/* Token values inlined because react-hot-toast wants literal styles:
   paper #F9F8FB, ink-900 #16140F, hair #DFDBE6, warm --shadow-md,
   sage-600 #587A4D, terracotta --status-unpaid #B6604E. */
export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: "10px",
          background: "#F9F8FB",
          color: "#16140F",
          border: "1px solid #DFDBE6",
          boxShadow: "0 8px 24px rgba(60, 52, 32, 0.08)",
          fontSize: "0.875rem",
        },
        success: { iconTheme: { primary: "#587A4D", secondary: "#F9F8FB" } },
        error: { iconTheme: { primary: "#B6604E", secondary: "#F9F8FB" } },
      }}
    />
  );
}
