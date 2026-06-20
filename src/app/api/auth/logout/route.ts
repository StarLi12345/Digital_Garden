import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { deleteSession } from "@/lib/session";

export async function POST() {
  // Delete the current device session
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("garden-session-id")?.value;
    if (token) await deleteSession(token);
  } catch { /* ignore */ }

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
  response.cookies.set("garden-session-id", "", { ...cookieOpts, httpOnly: false });
  return response;
}
