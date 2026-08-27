import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { adminLoginSchema } from "@/lib/validations/auth";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  adapter: PrismaAdapter(prisma),
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

        const { email, password } = parsed.data;
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
  callbacks: {
    async signIn({ user, account, profile }) {
      // TEMP DEBUG — remove once the new-user redirect path is confirmed.
      console.log(
        "[onboarding-debug] signIn callback: provider=%s email=%s role=%s status=%s email_verified=%s",
        account?.provider,
        user.email,
        user.role,
        user.status,
        profile?.email_verified
      );

      if (account?.provider === "google" && !profile?.email_verified) {
        console.log("[onboarding-debug] signIn callback: rejected — unverified Google email");
        return false;
      }
      if (user.status === "SUSPENDED" || user.status === "REJECTED") {
        console.log("[onboarding-debug] signIn callback: rejected — suspended/rejected user status");
        return false;
      }
      if ((user.role === "ADMIN" || user.role === "SUPER_ADMIN") && user.status !== "APPROVED") {
        console.log("[onboarding-debug] signIn callback: rejected — admin/super-admin not approved");
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
