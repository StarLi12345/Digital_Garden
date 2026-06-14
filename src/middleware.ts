import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "garden-session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths (public assets, API meta, login page)
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/models") ||
    pathname.startsWith("/api/tts") ||
    pathname.startsWith("/api/ai-status") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/themes/") ||
    pathname.startsWith("/carousel/") ||
    pathname.startsWith("/music-player/") ||
    pathname.startsWith("/audio/") ||
    pathname.startsWith("/resources/")
  ) {
    return NextResponse.next();
  }

  // Check session: cookie must exist with a non-empty userId
  const session = request.cookies.get(SESSION_COOKIE);
  if (!session || !session.value) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
