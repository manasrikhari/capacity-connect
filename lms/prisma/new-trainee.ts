/**
 * Create a brand-new account for testing onboarding.
 *
 * Why this exists: the only real account-creation path is Google OAuth via the
 * Prisma adapter, and the `events.createUser` hook that makes a new trainee
 * usable fires only there. With no Google credentials configured you cannot
 * reach that path through the UI, so this reproduces it faithfully — schema
 * defaults first, then the same hook logic — and adds a password so the account
 * can also sign in through the credentials form.
 *
 *   npm run db:new-trainee -- priya.test
 *   npm run db:new-trainee -- priya.test --raw     (skip the hook)
 *
 * `--raw` skips the hook, leaving the trainee PENDING as they used to be.
 *
 * Note it does NOT reproduce the old redirect loop on its own: that needed both
 * the PENDING default *and* `/blocked` being absent from the STUDENT branch of
 * proxy.ts. Whitelisting it there fixed the loop independently, so a PENDING
 * trainee now reaches /welcome and /blocked normally. `--raw` is for checking
 * how the app treats an unapproved account, not for demonstrating the bug.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
// Reuse the app's own client: it carries the pg driver adapter this schema needs.
import { prisma } from "../lib/prisma";

const PASSWORD = "1234";

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const raw = args.includes("--raw");
  const handle = (args.find((a) => !a.startsWith("--")) ?? "new.trainee").toLowerCase();
  const email = handle.includes("@") ? handle : `${handle}@imd.gov.in`;

  // Start from nothing, so the script is re-runnable and each test is clean.
  await prisma.user.deleteMany({ where: { email } });

  // 1. Exactly what the Prisma adapter creates on a first Google sign-in:
  //    schema defaults for role, status, plan and onboarded.
  const user = await prisma.user.create({
    data: {
      email,
      name: handle
        .split(/[.@]/)[0]
        .replace(/^\w/, (c) => c.toUpperCase()),
      password: await bcrypt.hash(PASSWORD, 10),
      emailVerified: new Date(),
    },
    select: { id: true, email: true, name: true, role: true, status: true, onboarded: true },
  });

  // 2. Then the `events.createUser` hook from lib/auth.ts.
  if (!raw && user.role === "STUDENT") {
    await prisma.user.update({ where: { id: user.id }, data: { status: "APPROVED" } });
  }

  const final = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { email: true, name: true, role: true, status: true, onboarded: true },
  });

  console.log("");
  console.log("  Created a brand-new account");
  console.log("  ─────────────────────────────────────────────");
  console.log(`  email      ${final.email}`);
  console.log(`  role       ${final.role}`);
  console.log(`  status     ${final.status}${raw ? "   <- --raw: hook skipped" : ""}`);
  console.log(`  onboarded  ${final.onboarded}`);
  console.log(`  profile    none`);
  console.log(`  enrolments none`);
  console.log("");
  console.log("  Sign in at http://localhost:3000");
  console.log(`    username  ${handle}`);
  console.log(`    password  ${PASSWORD}`);
  console.log("");
  if (raw) {
    console.log("  --raw leaves the account PENDING, as trainees used to be.");
    console.log("  It does not recreate the old redirect loop: the proxy.ts");
    console.log("  whitelist fixed that separately.");
    console.log("");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
