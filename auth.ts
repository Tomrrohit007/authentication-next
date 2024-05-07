import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

import authConfig from "./auth.config";
import { db } from "./lib/db";
import { getUserById } from "./data/user";
import { UserRole } from "@prisma/client";
import { getTwoFactorConfirmationByUserId } from "./data/two-factor-confirmation";
import { getAccountByUserId } from "./data/account";

export type ExtendedUser = {
  role: UserRole;
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
} & DefaultSession["user"];

// extending the session type here
declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}

export const { signIn, signOut, auth, handlers } = NextAuth({
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  callbacks: {
    // these callbacks will run whenever the action happend like forexample signIn will run after when user signIn and execute the code inside it.

    async signIn({ user, account }) {
      if (account?.provider !== "credentials") return true;

      if (!user || !user?.id) return false;

      const existingUser = await getUserById(user.id);

      if (!existingUser?.emailVerified) return false;

      if (existingUser.isTwoFactorEnabled) {
        const confirmation = await getTwoFactorConfirmationByUserId(
          existingUser.id,
        );
        if (!confirmation) return false;

        await db.twoFactorConfirmation.delete({
          where: { id: confirmation.id },
        });
      }

      return true;
    },
    async session({ token, session }) {
      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }
      if (session.user) {
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
      }
      if (session.user) {
        session.user.name = token.name;
        session.user.isOAuth = token.isOAuth as boolean;
        if (token.email) session.user.email = token.email;
      }

      return session;
    },

    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);

      if (!existingUser) return token;
      const existingAccount = await getAccountByUserId(existingUser.id);

      token.name = existingUser.name;
      token.isOAuth = !!existingAccount;
      token.email = existingUser.email;
      token.role = existingUser.role;
      token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;

      return token;
    },
  },
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  ...authConfig,
});
