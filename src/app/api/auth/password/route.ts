import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword, SESSION_COOKIE } from "@/lib/auth";

export async function PUT(request: Request) {
  // Real auth required (not guest mode)
  const cookieStore = await cookies();
  const auth = cookieStore.get("garden-auth")?.value;
  if (!auth || auth !== "verified") {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  let body: { oldPassword?: string; newPassword?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "无效的请求" }, { status: 400 });
  }

  const { oldPassword, newPassword } = body;
  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: "请填写旧密码和新密码" }, { status: 400 });
  }
  if (newPassword.length < 2) {
    return NextResponse.json({ error: "新密码至少需要2个字符" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const valid = await verifyPassword(oldPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "旧密码错误" }, { status: 400 });
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

  return NextResponse.json({ success: true });
}
