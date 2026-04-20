import { NextRequest, NextResponse } from "next/server";
import { PUBLIC_DASHBOARD_SLUGS } from "./app/info/dashboards";

const COOKIE_NAME = "info_auth";
const LOGIN_PATH = "/info/login";
const PUBLIC_EXACT = new Set<string>(["/info", LOGIN_PATH]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === LOGIN_PATH || pathname.startsWith("/api/info/auth")) {
    return NextResponse.next();
  }

  if (PUBLIC_EXACT.has(pathname)) {
    return NextResponse.next();
  }

  const matchesPublicDashboard = PUBLIC_DASHBOARD_SLUGS.some(
    (slug) => pathname === `/info/${slug}` || pathname.startsWith(`/info/${slug}/`),
  );
  if (matchesPublicDashboard) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const validToken = process.env.ADMIN_TOKEN;

  if (!validToken || token !== validToken) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/info/:path*"],
};
