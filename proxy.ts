import { NextRequest, NextResponse } from "next/server";
import { PUBLIC_DASHBOARD_SLUGS } from "./app/insights/dashboards";

const COOKIE_NAME = "insights_auth";
const LOGIN_PATH = "/insights/login";
const PUBLIC_EXACT = new Set<string>(["/insights", LOGIN_PATH]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === LOGIN_PATH || pathname.startsWith("/api/insights/auth")) {
    return NextResponse.next();
  }

  if (PUBLIC_EXACT.has(pathname)) {
    return NextResponse.next();
  }

  const matchesPublicDashboard = PUBLIC_DASHBOARD_SLUGS.some(
    (slug) => pathname === `/insights/${slug}` || pathname.startsWith(`/insights/${slug}/`),
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
  matcher: ["/insights/:path*"],
};
