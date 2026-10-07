import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";

const isDev = process.env.NODE_ENV !== "production";
const hasResend = Boolean(process.env.AUTH_RESEND_KEY);

export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

const providers: Provider[] = [
  // Email magic link. Without a Resend key in development, the link is printed to the server log.
  Resend({
    from: process.env.AUTH_EMAIL_FROM ?? "Shelfie <onboarding@resend.dev>",
    ...(!hasResend && isDev
      ? {
          apiKey: "dev",
          sendVerificationRequest: ({ identifier, url }) => {
            console.info(`\n[auth] Magic link for ${identifier}:\n${url}\n`);
          },
        }
      : {}),
  }),
];

if (googleEnabled) providers.push(Google);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers,
  session: { strategy: "database" },
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/check-email",
    error: "/signin",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
