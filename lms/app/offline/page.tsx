import { CloudOff } from "lucide-react";
import type { Metadata } from "next";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: "Offline — Capacity Connect",
};

/** Shown by the service worker when a page is requested with no connection. */
export default function OfflinePage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 bg-page">
        <div className="mx-auto max-w-2xl px-4 py-16 md:px-6">
          <EmptyState
            icon={CloudOff}
            title="You're offline"
            description="This page isn't available without a connection. Pages you've already opened stay readable — reconnect to load anything new."
          />
        </div>
      </main>
    </>
  );
}
