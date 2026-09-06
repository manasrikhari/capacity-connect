import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card } from "@/components/ui/Card";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create an account — Capacity Connect",
  description:
    "Register for MoES capacity-building courses in weather and climate services.",
};

export default async function RegisterPage() {
  // Somebody already signed in has no business here.
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <>
      <PublicHeader
        right={
          <Link href="/courses" className="text-sm text-plum-700 hover:underline">
            Browse courses
          </Link>
        }
      />

      <main className="flex-1 bg-page">
        <div className="mx-auto max-w-md px-4 py-14 md:px-6">
          <div className="mb-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-300">
              Ministry of Earth Sciences
            </p>
            <h1 className="mt-2 font-display text-3xl font-normal text-ink-900">
              Create an account
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              For trainees joining a capacity-building course. If your office nominated you, use the
              invitation link they sent instead — it fills in your details for you.
            </p>
          </div>

          <Card>
            <RegisterForm />
          </Card>

          <p className="mt-4 text-center text-sm text-ink-500">
            Already registered?{" "}
            <Link href="/#signin" className="text-plum-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
