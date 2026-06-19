import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth";

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  const auth = cookieStore.get("garden-auth")?.value;
  if (!userId || auth !== "verified") {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  let body: { username?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "无效的请求" }, { status: 400 });
  }

  const username = body.username?.trim();
  if (!username) {
    return NextResponse.json({ error: "请输入新用户名" }, { status: 400 });
  }
  if (username.length < 2 || username.length > 20) {
    return NextResponse.json({ error: "用户名需要 2-20 个字符" }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_一-鿿.]+$/.test(username)) {
    return NextResponse.json({ error: "用户名只能包含字母、数字、下划线、中文和点号" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing && existing.id !== userId) {
    return NextResponse.json({ error: "该用户名已被占用" }, { status: 409 });
  }

  await prisma.user.update({ where: { id: userId }, data: { username } });
  return NextResponse.json({ success: true, username });
}
