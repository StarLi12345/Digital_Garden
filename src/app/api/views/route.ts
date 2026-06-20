// ============================================================
// Digital Garden — Page View API
// ============================================================
// POST /api/views  — record a page view (debounced per IP+path)
// GET  /api/views  — fetch stats: total views, popular entries
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── Bot patterns to skip ─────────────────────────────────
const BOT_PATTERNS = [
  "bot", "crawler", "spider", "scraper", "curl", "wget",
  "python-requests", "go-http-client", "java", "axios", "node-fetch",
  "urllib", "aiohttp", "httpclient", "puppeteer", "playwright",
  "googlebot", "bingbot", "slurp", "duckduckbot", "baiduspider",
  "yandex", "facebookexternalhit", "twitterbot", "discordbot",
  "telegrambot", "whatsapp", "semrush", "ahrefsbot", "mj12bot",
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some((p) => ua.includes(p));
}

function anonymizeIP(ip: string): string {
  // Zero last octet for IPv4, or last hextet for IPv6
  const parts = ip.split(".");
  if (parts.length === 4) {
    parts[3] = "0";
    return parts.join(".");
  }
  const v6 = ip.split(":");
  if (v6.length >= 3) {
    v6[v6.length - 1] = "0";
    return v6.join(":");
  }
  return ip;
}

// ── POST: record a view ─────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { path, entrySlug } = body as { path?: string; entrySlug?: string | null };

    if (!path) {
      return NextResponse.json({ error: "path is required" }, { status: 400 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const userAgent = req.headers.get("user-agent") || "";

    // Skip bots
    if (isBot(userAgent)) {
      return NextResponse.json({ skipped: "bot" });
    }

    const anonIP = anonymizeIP(ip);

    // Debounce: skip if same IP+path recorded within 30 minutes
    const recent = await prisma.pageView.findFirst({
      where: {
        path,
        ip: anonIP,
        createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recent) {
      return NextResponse.json({ skipped: "debounced" });
    }

    await prisma.pageView.create({
      data: { path, entrySlug: entrySlug || null, ip: anonIP, userAgent },
    });

    return NextResponse.json({ recorded: true });
  } catch (e: any) {
    console.error("[views] POST error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

// ── GET: fetch stats ────────────────────────────────────
// ?userId=<id> → per-user stats (own entries' views)
// no query      → global stats (all page views)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Build the slug filter for per-user queries
    let slugFilter: string[] | undefined;
    if (userId) {
      const userEntries = await prisma.entry.findMany({
        where: { userId },
        select: { slug: true },
      });
      slugFilter = userEntries.map(e => e.slug);
    }

    const viewWhere = {
      ...(slugFilter ? { entrySlug: { in: slugFilter } } : {}),
    };

    const timeWhere = (gte: Date) => ({
      ...viewWhere,
      createdAt: { gte },
    });

    const [totalViews, todayViews, weekViews] = await Promise.all([
      prisma.pageView.count({ where: viewWhere }),
      prisma.pageView.count({ where: timeWhere(today) }),
      prisma.pageView.count({ where: timeWhere(weekAgo) }),
    ]);

    // Popular entries (top 10 by views)
    const popularEntries = await prisma.pageView.groupBy({
      by: ["entrySlug"],
      where: { entrySlug: { not: null }, ...(slugFilter ? { entrySlug: { in: slugFilter } } : {}) },
      _count: { entrySlug: true },
      orderBy: { _count: { entrySlug: "desc" } },
      take: 10,
    });

    // Fetch titles for popular entries
    const slugs = popularEntries.map((e) => e.entrySlug!).filter(Boolean);
    const entries = slugs.length > 0
      ? await prisma.entry.findMany({
          where: { slug: { in: slugs } },
          select: { slug: true, title: true },
        })
      : [];

    const entryMap = new Map(entries.map((e) => [e.slug, e.title]));
    const popular = popularEntries.map((e) => ({
      slug: e.entrySlug,
      title: entryMap.get(e.entrySlug!) || e.entrySlug!,
      views: e._count.entrySlug,
    }));

    // Popular pages — only for global stats
    const popularPages = userId ? [] : await prisma.pageView.groupBy({
      by: ["path"],
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 5,
    });

    return NextResponse.json({
      totalViews,
      todayViews,
      weekViews,
      popularEntries: popular,
      popularPages: popularPages.map((p) => ({
        path: p.path,
        views: p._count.path,
      })),
    });
  } catch (e: any) {
    console.error("[views] GET error:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
