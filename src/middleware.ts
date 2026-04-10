import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const isSecureRequest = req.nextUrl.protocol === "https:" || forwardedProto === "https";
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  let token = await getToken({
    req,
    secret,
    secureCookie: isSecureRequest,
  });

  // Auth.js v5 cookie names (and legacy NextAuth names as fallback) can differ between environments.
  // Try known cookie/salt combinations before treating the user as anonymous.
  if (!token) {
    const cookieCandidates = [
      { cookieName: "__Secure-authjs.session-token", secureCookie: true },
      { cookieName: "authjs.session-token", secureCookie: false },
      { cookieName: "__Secure-next-auth.session-token", secureCookie: true },
      { cookieName: "next-auth.session-token", secureCookie: false },
    ] as const;

    for (const candidate of cookieCandidates) {
      token = await getToken({
        req,
        secret,
        secureCookie: candidate.secureCookie,
        cookieName: candidate.cookieName,
        salt: candidate.cookieName,
      });
      if (token) break;
    }
  }

  // Protected user routes
  const userRoutes = ["/alerts", "/notifications"];
  // Protected admin routes
  const adminRoutes = ["/admin"];

  const isUserRoute = userRoutes.some((r) => pathname.startsWith(r));
  const isAdminRoute = adminRoutes.some((r) => pathname.startsWith(r));

  if ((isUserRoute || isAdminRoute) && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = typeof token?.role === "string" ? token.role : undefined;
  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/alerts/:path*", "/notifications/:path*"],
};
