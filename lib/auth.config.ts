import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config — no DB imports here.
// Used by proxy to check sessions without hitting the database.
export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [], // providers added in lib/auth.ts (Node.js only)
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPath = nextUrl.pathname.startsWith("/auth");
      if (isAuthPath) return true;
      if (isLoggedIn) return true;
      return false; // redirect to sign-in
    },
  },
};
