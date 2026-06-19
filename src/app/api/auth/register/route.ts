import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, getDefaultAvatar } from "@/lib/auth";

// ── In-memory rate limiter ───────────────────────────────
const registerAttempts = new Map<string, number>(); // ip → timestamp
const RATE_WINDOW = 60_000;  // 1 minute
const MAX_PER_IP = 3;        // 3 registrations per minute (generous for humans, blocks scripts)

export async function POST(request: Request) {
  // Rate limit by IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "127.0.0.1";
  const now = Date.now();
  const lastAttempt = registerAttempts.get(ip);
  if (lastAttempt && now - lastAttempt < RATE_WINDOW / MAX_PER_IP) {
    return NextResponse.json({ error: "操作太频繁，请稍后再试" }, { status: 429 });
  }
  registerAttempts.set(ip, now);
  // Cleanup old entries every ~100 requests
  if (Math.random() < 0.01) {
    const cutoff = now - RATE_WINDOW;
    for (const [k, v] of registerAttempts) { if (v < cutoff) registerAttempts.delete(k); }
  }

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
