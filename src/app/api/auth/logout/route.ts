import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const cookieOpts = {
    httpOnly: true,
    secure: false, // clearing cookie — works on any connection
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
  response.cookies.set(SESSION_COOKIE, "", cookieOpts);
  response.cookies.set("garden-user-id", "", { ...cookieOpts, httpOnly: false });
  response.cookies.set("garden-auth", "", { ...cookieOpts, httpOnly: false });
  return response;
}
