// ============================================================
// Digital Garden — RSS 2.0 Feed
// ============================================================
// GET /api/feed — 返回最近 20 条公开笔记的 RSS XML。
// 可通过 RSS Reader 订阅花园更新。
// ============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const entries = await prisma.entry.findMany({
      where: {
        isPrivate: false,
        user: { visibility: "public" },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { tags: { include: { tag: true } } },
    });

    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://starli-digital-garden.cn";

    const items = entries
      .map((e) => {
        const excerpt = (e.excerpt || e.contentMd || "")
          .replace(/[#*`\[\]()>\\\-_~]/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 300);
        const pubDate = new Date(e.createdAt).toUTCString();
        const categories = e.tags
          .map((et) => `    <category>${escapeXml(et.tag.name)}</category>`)
          .join("\n");

        return `  <item>
    <title>${escapeXml(e.title)}</title>
    <link>${siteUrl}/entry/${e.slug}</link>
    <guid isPermaLink="true">${siteUrl}/entry/${e.slug}</guid>
    <description>${escapeXml(excerpt)}</description>
    <pubDate>${pubDate}</pubDate>
${categories}
  </item>`;
      })
      .join("\n");

    const now = new Date().toUTCString();
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Star's Digital Garden</title>
    <link>${siteUrl}</link>
    <description>一个属于自己的数字花园 — 记录回忆、想法、情绪、梦境、故事与学习</description>
    <language>zh-CN</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${siteUrl}/api/feed" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "s-maxage=3600, stale-while-revalidate",
      },
    });
  } catch (error) {
    console.error("RSS feed generation failed:", error);
    return new NextResponse("Feed unavailable", { status: 500 });
  }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
