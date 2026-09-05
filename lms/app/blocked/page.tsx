import { ShieldX } from "lucide-react";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Card } from "@/components/ui/Card";
import { auth } from "@/lib/auth";

export default async function BlockedPage() {
  const session = await auth();
  if (!session) redirect("/");

  const isPending = session.user.status === "PENDING";

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <div
          className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-full ${
            isPending
              ? "bg-status-partial/15 text-status-partial"
              : "bg-status-unpaid/12 text-status-unpaid"
          }`}
        >
          <ShieldX className="size-7" />
        </div>
        <h1 className="text-xl font-medium text-ink-900">
          {isPending ? "Account pending approval" : "Account suspended"}
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          {isPending
            ? "Your trainer account is awaiting approval from a Ministry of Earth Sciences administrator. You'll be able to sign in once approved."
            : "Your account has been suspended. Please contact a platform administrator."}
        </p>
        <div className="mt-6 flex justify-center">
          <SignOutButton />
        </div>
      </Card>
    </main>
  );
}
