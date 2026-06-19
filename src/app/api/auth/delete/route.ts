import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth";

/** Delete the currently logged-in user's own account. No one else. */
export async function POST() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get(SESSION_COOKIE)?.value;
  const isVerified = cookieStore.get("garden-auth")?.value === "verified";

  if (!sessionUserId || !isVerified) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  // Only allow deleting your own account — never anyone else's
  await prisma.user.delete({ where: { id: sessionUserId } });

  const response = NextResponse.json({ success: true });
  const cookieOpts = {
    httpOnly: true,
    secure: false,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
  response.cookies.set(SESSION_COOKIE, "", cookieOpts);
  response.cookies.set("garden-user-id", "", { ...cookieOpts, httpOnly: false });
  response.cookies.set("garden-auth", "", { ...cookieOpts, httpOnly: false });

  return response;
}
