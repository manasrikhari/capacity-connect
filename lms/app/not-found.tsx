import { SearchX } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
          <SearchX className="size-7" />
        </div>
        <h1 className="text-xl font-semibold text-slate-800">Page not found</h1>
        <p className="mt-2 text-sm text-slate-500">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/" className={buttonClasses("primary", "md")}>
            Go home
          </Link>
        </div>
      </Card>
    </main>
  );
}
