import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

import authConfig from "./auth.config";
import { db } from "./lib/db";
import { getUserById } from "./data/user";
import { UserRole } from "@prisma/client";

// extending the session type here
declare module "next-auth" {
  interface Session {
    user: {
      role: UserRole;
    } & DefaultSession["user"];
  }
}

export const { signIn, signOut, auth, handlers } = NextAuth({
  callbacks: {
    // these callbacks will run whenever the action happend like forexample signIn will run after when user signIn and execute the code inside it.
    // async signIn({ user }) {
    //   if (!user.id) {
    //     return false;
    //   }
    //   const existingUser = await getUserById(user.id);
    //
    //   if (!existingUser || !existingUser.emailVerified) {
    //     return false;
    //   }
    //
    //   return true;
    // },
    async session({ token, session }) {
      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }

      return session;
    },

    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);

      if (!existingUser) return token;
      token.role = existingUser.role;

      return token;
    },
  },
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  ...authConfig,
});
