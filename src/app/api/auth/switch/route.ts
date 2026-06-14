import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, SESSION_DURATION, UserInfo, getDefaultAvatar } from "@/lib/auth";

const RECENT_DAYS = 15;

export async function POST(request: Request) {
  let body: { userId?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "无效的请求" }, { status: 400 });
  }

  if (!body.userId) {
    return NextResponse.json({ error: "请指定用户" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: body.userId } });
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  // Check if user logged in within the last 15 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RECENT_DAYS);

  if (user.lastLoginAt && user.lastLoginAt > cutoff) {
    // Recent login → switch directly
    const userInfo: UserInfo = {
      id: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      avatar: user.avatar || getDefaultAvatar(user.username),
    };

    const response = NextResponse.json({ success: true, user: userInfo });
    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: SESSION_DURATION,
    };
    response.cookies.set(SESSION_COOKIE, user.id, cookieOpts);
    response.cookies.set("garden-user-id", user.id, { ...cookieOpts, httpOnly: false });

    return response;
  }

  // Not recent → ask for password
  return NextResponse.json({
    success: false,
    requireLogin: true,
    username: user.username,
  }, { status: 401 });
}
