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
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <ShieldX className="size-7" />
        </div>
        <h1 className="text-xl font-semibold text-slate-800">
          {isPending ? "Account pending approval" : "Account suspended"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {isPending
            ? "Your teacher account is awaiting approval from a platform administrator. You'll be able to sign in once approved."
            : "Your account has been suspended. Please contact a platform administrator."}
        </p>
        <div className="mt-6 flex justify-center">
          <SignOutButton />
        </div>
      </Card>
    </main>
  );
}
