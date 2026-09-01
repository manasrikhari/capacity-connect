import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { StaffLoginForm } from "./StaffLoginForm";

/* Email + password entry. Primary for teachers/owners; also works for students
   who have a password set. Google sign-in stays the main student path (/). */
export default async function StaffLoginPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 size-11 rounded-full"
            style={{
              background: "radial-gradient(circle at 35% 30%, var(--plum-300), var(--plum-700))",
            }}
            aria-hidden="true"
          />
          <h1 className="text-2xl text-ink-900">Sign in</h1>
          <p className="mt-1.5 text-sm text-ink-500">
            Teachers and owners sign in with email and password.
          </p>
        </div>

        <div className="rounded-2xl border border-hair bg-paper p-6">
          <StaffLoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-ink-500">
          A student?{" "}
          <Link href="/" className="text-plum-700 underline underline-offset-2">
            Continue with Google
          </Link>
        </p>
      </div>
    </main>
  );
}
