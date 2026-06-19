import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth";

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const auth = cookieStore.get("garden-auth")?.value;
  if (!auth || auth !== "verified") {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  let body: { visibility?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "无效的请求" }, { status: 400 });
  }

  const { visibility } = body;
  if (!visibility || !["public", "private"].includes(visibility)) {
    return NextResponse.json({ error: "无效的可见性值" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: userId }, data: { visibility } });
  return NextResponse.json({ success: true, visibility });
}

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) return NextResponse.json({ visibility: "public" });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { visibility: true } });
  return NextResponse.json({ visibility: user?.visibility || "public" });
}
