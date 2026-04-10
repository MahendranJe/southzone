import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

// Minimal edge-compatible auth config for JWT verification only (no DB calls).
// Must share the same secret as the main auth config so JWTs can be verified.
const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const { pathname } = nextUrl;
      const isLoggedIn = !!auth?.user;

      const isUserRoute = ["/alerts", "/notifications"].some((r) =>
        pathname.startsWith(r)
      );
      const isAdminRoute = pathname.startsWith("/admin");

      if ((isUserRoute || isAdminRoute) && !isLoggedIn) {
        // Redirect unauthenticated users to login
        return false;
      }

      if (isAdminRoute && auth?.user?.role !== "ADMIN") {
        // Logged-in non-admins go back to home
        return NextResponse.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/admin/:path*", "/alerts/:path*", "/notifications/:path*"],
};
