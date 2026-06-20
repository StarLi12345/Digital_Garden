import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, SESSION_DURATION, UserInfo, getDefaultAvatar } from "@/lib/auth";

const PUBLIC_ACCOUNT_ID = "default-user";
const RECENT_DAYS = 30;

export async function POST(request: Request) {
  let body: { userId?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "无效的请求" }, { status: 400 });
  }

  if (!body.userId) {
    return NextResponse.json({ error: "请指定用户" }, { status: 400 });
  }

  // Allow switching to:
  // 1. The public display account (always)
  // 2. Any account that has logged in within RECENT_DAYS (device-local check)
  if (body.userId !== PUBLIC_ACCOUNT_ID) {
    // Check if the target user exists and has logged in recently
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
      select: { id: true, lastLoginAt: true },
    });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RECENT_DAYS);
    if (!user.lastLoginAt || user.lastLoginAt < cutoff) {
      return NextResponse.json({ error: "该账号需要重新登录", requireLogin: true, username: "" }, { status: 401 });
    }
  }

  const user = await prisma.user.findUnique({ where: { id: body.userId } });
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const userInfo: UserInfo = {
    id: user.id,
    username: user.username,
    displayName: user.displayName || user.username,
    avatar: user.avatar || getDefaultAvatar(user.username),
  };

  const response = NextResponse.json({ success: true, user: userInfo });
  const isSecure = request.url.startsWith("https://");
  const cookieOpts = {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION,
  };
  response.cookies.set(SESSION_COOKIE, user.id, cookieOpts);
  response.cookies.set("garden-user-id", user.id, { ...cookieOpts, httpOnly: false });

  // Set auth cookie for all accounts — even public ones need write access for their owner
  response.cookies.set("garden-auth", "verified", { ...cookieOpts, httpOnly: false });

  return response;
}
