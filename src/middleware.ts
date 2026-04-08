import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

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
