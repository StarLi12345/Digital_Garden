import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, getDefaultAvatar } from "@/lib/auth";

export async function POST(request: Request) {
  let body: { username?: string; password?: string; displayName?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "无效的请求" }, { status: 400 });
  }

  const { username, password, displayName } = body;

  if (!username || !username.trim()) {
    return NextResponse.json({ error: "请输入账号" }, { status: 400 });
  }
  if (!password || password.length < 2) {
    return NextResponse.json({ error: "密码至少需要2个字符" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { username: username.trim() },
  });
  if (existing) {
    return NextResponse.json({ error: "该账号已存在" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      username: username.trim(),
      passwordHash,
      displayName: displayName?.trim() || username.trim(),
    },
  });

  // 注册成功后不自动登录——让用户手动登录
  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      avatar: user.avatar || getDefaultAvatar(user.username),
    },
  });
}
