import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

  // Entry counts by type
  const entries = await prisma.entry.findMany({ where: { userId }, select: { type: true, createdAt: true, updatedAt: true } });

  const totalEntries = entries.length;
  const typeCounts: Record<string, number> = {};
  for (const e of entries) {
    typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
  }

  // Tags
  const tagCount = await prisma.entryTag.count({
    where: { entry: { userId } },
  });

  // Days since registration
  const createdMs = user.createdAt.getTime();
  const daysSince = Math.floor((Date.now() - createdMs) / 86400000);

  // Last active (most recent entry update or login)
  const lastEntry = entries.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
  const lastActive = lastEntry?.updatedAt || user.lastLoginAt || user.createdAt;

  // Streak: longest consecutive days with entries
  let streak = 0;
  let maxStreak = 0;
  const dates = [...new Set(entries.map(e => e.createdAt.toISOString().slice(0, 10)))].sort();
  for (let i = 0; i < dates.length; i++) {
    if (i > 0) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff <= 1.5) streak++;
      else streak = 1;
    } else {
      streak = 1;
    }
    if (streak > maxStreak) maxStreak = streak;
  }

  // Total characters written
  const contentEntries = await prisma.entry.findMany({ where: { userId }, select: { contentMd: true } });
  const totalChars = contentEntries.reduce((sum, e) => sum + (e.contentMd?.length || 0), 0);

  // Type labels
  const TYPE_LABELS: Record<string, string> = {
    Memory: "回忆", Thought: "想法", Emotion: "情绪",
    Dream: "梦境", Story: "故事", Learning: "学习",
  };

  const typeBreakdown = Object.entries(typeCounts).map(([type, count]) => ({
    type,
    label: TYPE_LABELS[type] || type,
    count,
  })).sort((a, b) => b.count - a.count);

  return NextResponse.json({
    username: user.username,
    displayName: user.displayName || user.username,
    avatar: user.avatar,
    createdAt: user.createdAt,
    daysSinceRegistration: daysSince,
    lastActive,
    totalEntries,
    totalChars,
    tagCount,
    maxStreak,
    typeBreakdown,
    mostActiveType: typeBreakdown[0]?.label || "—",
  });
}
