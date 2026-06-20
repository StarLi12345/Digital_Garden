import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "garden-session";
const AUTH_COOKIE = "garden-auth";
const GUEST_USER_ID = "default-user"; // Star.Li — public display account

export function middleware(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE);
  const response = NextResponse.next();

  // No session → auto-login as Star.Li (guest mode)
  if (!session || !session.value) {
    const isSecure = request.url.startsWith("https://");
    response.cookies.set(SESSION_COOKIE, GUEST_USER_ID, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    response.cookies.set("garden-user-id", GUEST_USER_ID, {
      httpOnly: false,
      secure: isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    // Note: garden-auth cookie is NOT set — this marks it as guest
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
