import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth";

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  let body: { avatar?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "无效的请求" }, { status: 400 });
  }

  if (!body.avatar) {
    return NextResponse.json({ error: "请提供头像数据" }, { status: 400 });
  }

  // Basic validation: must be a data URL or http URL, cap at ~500KB
  const avatar = body.avatar.trim();
  if (!avatar.startsWith("data:image/") && !avatar.startsWith("http")) {
    return NextResponse.json({ error: "无效的头像格式" }, { status: 400 });
  }
  if (avatar.length > 600_000) {
    return NextResponse.json({ error: "头像文件过大（不超过500KB）" }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { avatar },
    });
    return NextResponse.json({ success: true, avatar });
  } catch {
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
