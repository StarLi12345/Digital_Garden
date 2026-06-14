import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionUserId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  // Accept optional target userId in body; default to session user
  let targetUserId = sessionUserId;
  try {
    const body = await req.json().catch(() => ({}));
    if (body.userId) targetUserId = body.userId;
  } catch {}

  // Delete the user — cascades to entries, entry tags; assets are preserved (SetNull)
  await prisma.user.delete({ where: { id: targetUserId } });

  const response = NextResponse.json({ success: true });

  // Only clear session if the deleted user is the currently logged-in user
  if (targetUserId === sessionUserId) {
    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 0,
    };
    response.cookies.set(SESSION_COOKIE, "", cookieOpts);
    response.cookies.set("garden-user-id", "", { ...cookieOpts, httpOnly: false });
  }

  return response;
}
