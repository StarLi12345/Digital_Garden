import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, SESSION_DURATION, UserInfo, getDefaultAvatar } from "@/lib/auth";
import { createSession, sessionCookieOpts } from "@/lib/session";

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

  // Create device session (kicks out old session on same device)
  const sessionToken = await createSession(user.id, request).catch(() => null);

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

  // 公共账号不给 garden-auth，访客切换后仍是访客（只读+无草稿同步）
  const cookieStore = await cookies();
  const hasExistingAuth = cookieStore.get("garden-auth")?.value === "verified";
  if (body.userId !== PUBLIC_ACCOUNT_ID || hasExistingAuth) {
    response.cookies.set("garden-auth", "verified", { ...cookieOpts, httpOnly: false });
  }
  // Session token for device-based write validation
  if (sessionToken) {
    response.cookies.set("garden-session-id", sessionToken, sessionCookieOpts(request));
  }

  return response;
}
