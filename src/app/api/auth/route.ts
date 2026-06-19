import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, SESSION_COOKIE, SESSION_DURATION, UserInfo, getDefaultAvatar } from "@/lib/auth";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "无效的请求" }, { status: 400 });
  }

  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json({ error: "请输入账号和密码" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username: username.trim() } });
  if (!user) {
    return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
  }

  const userInfo: UserInfo = {
    id: user.id,
    username: user.username,
    displayName: user.displayName || user.username,
    avatar: user.avatar || getDefaultAvatar(user.username),
  };

  // Update lastLoginAt
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});

  const response = NextResponse.json({ success: true, user: userInfo });
  const cookieOpts = {
    httpOnly: true,
    secure: request.url.startsWith("https://"),
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION,
  };
  response.cookies.set(SESSION_COOKIE, user.id, cookieOpts);
  // Client-readable cookie for localStorage namespacing
  response.cookies.set("garden-user-id", user.id, { ...cookieOpts, httpOnly: false });
  // Auth marker: real login, not guest mode
  response.cookies.set("garden-auth", "verified", { ...cookieOpts, httpOnly: false });

  return response;
}
