import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { adminLoginSchema } from "@/lib/validations/auth";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  // Prisma 7's custom-output `prisma-client` generator produces a PrismaClient
  // whose structural type @auth/prisma-adapter's signature doesn't accept,
  // although it is a functioning PrismaClient at runtime. Cast to exactly the
  // type the adapter expects at this one boundary.
  adapter: PrismaAdapter(prisma as unknown as Parameters<typeof PrismaAdapter>[0]),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = adminLoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email: identifier, password } = parsed.data;
        /* Bare usernames are a development convenience: "teacher" and
           "student" map to the seeded demo pair (same batch), anything else
           tries <name>@test.com. Production requires a full email. */
        let email = identifier.toLowerCase();
        if (!email.includes("@")) {
          if (process.env.NODE_ENV === "production") return null;
          // Capacity Connect demo aliases → seeded MoES/IMD accounts.
          const aliases: Record<string, string> = {
            admin: "admin@moes.gov.in",
            teacher: "trainer.radar@imd.gov.in",
            trainer: "trainer.radar@imd.gov.in",
            student: "trainee.sat@imd.gov.in",
            trainee: "trainee.sat@imd.gov.in",
          };
          email = aliases[email] ?? `${email}@imd.gov.in`;
        }
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
  events: {
    // The only account-creation path (OAuth first sign-in via PrismaAdapter).
    // A STUDENT never needs account-level approval — approval lives on the
    // enrolment — so a brand-new trainee is APPROVED at creation. Without this
    // they default to PENDING and hit an infinite /student → /blocked loop.
    async createUser({ user }) {
      if (user.id && user.role === "STUDENT") {
        await prisma.user.update({
          where: { id: user.id },
          data: { status: "APPROVED" },
        });
      }
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && !profile?.email_verified) {
        return false;
      }
      // SUSPENDED/REJECTED are hard denials. PENDING staff are deliberately
      // let *in* so they can reach /blocked and read why — the proxy and the
      // /admin guard confine them there. Refusing outright (as before) bricked
      // a trainer awaiting approval with a bare AccessDenied and no explanation.
      if (user.status === "SUSPENDED" || user.status === "REJECTED") {
        return false;
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
      }

      const needsSync =
        trigger === "update" ||
        token.role === undefined ||
        !token.lastSync ||
        Date.now() - token.lastSync > 60_000;

      if (token.id && needsSync) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true, status: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.lastSync = Date.now();
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.status = token.status;
      return session;
    },
  },
});
