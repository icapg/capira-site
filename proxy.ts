import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "insights_auth";
const LOGIN_PATH = "/insights/login";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dejar pasar el login y el API de auth sin verificar
  if (pathname === LOGIN_PATH || pathname.startsWith("/api/insights/auth")) {
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
