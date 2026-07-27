import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import { hashCode, MAX_ATTEMPTS } from "./otp";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  // Credentials provider requires JWT sessions — NextAuth doesn't support
  // database sessions for it, since there's no OAuth round-trip to persist.
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },

  // The frontend is a separate Vite app on another subdomain, so the
  // session cookie has to be readable across subdomains of the same
  // parent domain. Set AUTH_COOKIE_DOMAIN to e.g. ".yourdomain.com" in
  // production (leave unset for local dev on a single origin).
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        domain: process.env.AUTH_COOKIE_DOMAIN,
      },
    },
  },

  providers: [
    Credentials({
      name: "Email code",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const code = credentials?.code as string | undefined;
        if (!email || !code) return null;

        const record = await prisma.verificationCode.findFirst({
          where: { email, consumed: false, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        });
        if (!record || record.attempts >= MAX_ATTEMPTS) return null;
        
        const enteredHash = hashCode(code);

        console.log({
          email,
          code,
          foundRecord: !!record,
          storedHash: record?.codeHash,
          enteredHash,
        });

        if (record.codeHash !== hashCode(code)) {
          await prisma.verificationCode.update({
            where: { id: record.id },
            data: { attempts: { increment: 1 } },
          });
          return null;
        }

        await prisma.verificationCode.update({
          where: { id: record.id },
          data: { consumed: true },
        });

        const user = await prisma.user.upsert({
          where: { email },
          update: { emailVerified: new Date() },
          create: { email, emailVerified: new Date(), name: email.split("@")[0] },
        });

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
});
