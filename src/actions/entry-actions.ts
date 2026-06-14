"use server";

// ============================================================
// Digital Garden — Entry Server Actions
// ============================================================
// P1.1 最小可用数据层
//
// 实现：
//   createEntry      — 创建 Entry + Tags + EntryTag
//   getEntryBySlug   — 按 slug 查询完整 Entry
//   updateEntry      — 更新 Entry + Tags
//   listEntries      — 最近 Entry 列表
//
// Slug 方案：YYYYMMDD-xxxxxx（日期 + 随机 6 位 hex）
// 校验策略：应用层 TypeScript 校验，不引入第三方库
// ============================================================

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ENTRY_TYPES, EXCERPT_MAX_LENGTH, DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { SESSION_COOKIE } from "@/lib/auth";

async function getUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

// ── Types ─────────────────────────────────────────────

export interface CreateEntryInput {
  title: string;
  type: string;
  content: string; // TipTap JSON
  contentMd: string; // Markdown
  tags?: string[]; // tag names, e.g. ["旅行", "2024"]
}

export interface UpdateEntryInput {
  title?: string;
  type?: string;
  content?: string;
  contentMd?: string;
  tags?: string[];
}

export interface EntryResult {
  success: true;
  data: {
    id: string;
    title: string;
    slug: string;
    type: string;
    content: string;
    contentMd: string;
    excerpt: string | null;
    isPrivate: boolean;
    createdAt: Date;
    updatedAt: Date;
    tags: { id: string; name: string; slug: string }[];
  };
}

export interface EntryError {
  success: false;
  error: string;
}

export type EntryActionResult = EntryResult | EntryError;

// ── Helpers ───────────────────────────────────────────

/** Generate a unique, human-readable slug without external dependencies */
function generateSlug(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Buffer.from(
    crypto.getRandomValues(new Uint8Array(3)),
  ).toString("hex");
  return `${date}-${random}`;
}

/** Generate a URL-safe slug from a tag name */
function tagSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-一-鿿]/g, "")
    || `tag-${Date.now()}`;
}

/** Find existing tag or create a new one — returns the tag ID */
async function resolveTag(name: string): Promise<string> {
  const trimmed = name.trim();
  const existing = await prisma.tag.findUnique({ where: { name: trimmed } });
  if (existing) return existing.id;
  const created = await prisma.tag.create({
    data: { name: trimmed, slug: tagSlug(trimmed) },
  });
  return created.id;
}

/** Extract a plain-text excerpt from Markdown content */
function generateExcerpt(md: string): string {
  return md
    .replace(/[#*`\[\]()>\\\-_~]/g, "") // strip markdown syntax chars
    .replace(/\s+/g, " ") // collapse whitespace
    .trim()
    .slice(0, EXCERPT_MAX_LENGTH);
}

/** Validate that type is one of the allowed values */
function isValidType(type: string): boolean {
  return (ENTRY_TYPES as readonly string[]).includes(type);
}

// ── Actions ───────────────────────────────────────────

/**
 * Create a new Entry with optional tags.
 *
 * Tags are matched by name: existing tags are reused, new tags are created.
 * Slug is auto-generated in YYYYMMDD-xxxxxx format.
 * Excerpt is auto-generated from contentMd.
 */
export async function createEntry(
  input: CreateEntryInput,
): Promise<EntryActionResult> {
  // ── Validation ────────────────────────────────────
  if (!input.title || input.title.trim().length === 0) {
    return { success: false, error: "标题不能为空" };
  }
  if (!input.content || input.content.trim().length === 0) {
    return { success: false, error: "内容不能为空" };
  }
  if (!input.type || !isValidType(input.type)) {
    return {
      success: false,
      error: `无效的类型: ${input.type}。允许: ${ENTRY_TYPES.join(", ")}`,
    };
  }

  // ── Slug ──────────────────────────────────────────
  const slug = generateSlug();

  // ── Excerpt ────────────────────────────────────────
  const excerpt = generateExcerpt(input.contentMd || input.content);

  // ── Tags ──────────────────────────────────────────
  const tagNames = (input.tags ?? []).filter(t => t.trim());

  try {
    const userId = await getUserId();
    if (!userId) {
      return { success: false, error: "请先登录" };
    }

    const entry = await prisma.entry.create({
      data: {
        title: input.title.trim(),
        slug,
        type: input.type,
        content: input.content,
        contentMd: input.contentMd || input.content,
        excerpt,
        userId,
        tags: {
          create: await Promise.all(
            tagNames.map(async (name) => ({
              tag: { connect: { id: await resolveTag(name) } },
            })),
          ),
        },
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    revalidatePath("/");
    revalidatePath("/garden");

    return {
      success: true,
      data: {
        id: entry.id,
        title: entry.title,
        slug: entry.slug,
        type: entry.type,
        content: entry.content,
        contentMd: entry.contentMd,
        excerpt: entry.excerpt,
        isPrivate: entry.isPrivate,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        tags: entry.tags.map((et) => ({
          id: et.tag.id,
          name: et.tag.name,
          slug: et.tag.slug,
        })),
      },
    };
  } catch (error) {
    console.error("createEntry failed:", error);
    return { success: false, error: "保存失败，请稍后重试" };
  }
}

/**
 * Get a single Entry by its slug, including tags.
 * Returns null if not found.
 */
export async function getEntryBySlug(
  slug: string,
): Promise<EntryResult["data"] | null> {
  try {
    const entry = await prisma.entry.findUnique({
      where: { slug },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!entry) return null;

    return {
      id: entry.id,
      title: entry.title,
      slug: entry.slug,
      type: entry.type,
      content: entry.content,
      contentMd: entry.contentMd,
      excerpt: entry.excerpt,
      isPrivate: entry.isPrivate,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      tags: entry.tags.map((et) => ({
        id: et.tag.id,
        name: et.tag.name,
        slug: et.tag.slug,
      })),
    };
  } catch (error) {
    console.error("getEntryBySlug failed:", error);
    return null;
  }
}

/**
 * Update an existing Entry by slug.
 *
 * Only provided fields are updated.
 * Tags (if provided): old associations are deleted, new ones created.
 * Slug is regenerated only if title changed.
 * Excerpt is regenerated only if contentMd changed.
 */
export async function updateEntry(
  slug: string,
  input: UpdateEntryInput,
): Promise<EntryActionResult> {
  // ── Validation ────────────────────────────────────
  if (input.type && !isValidType(input.type)) {
    return {
      success: false,
      error: `无效的类型: ${input.type}。允许: ${ENTRY_TYPES.join(", ")}`,
    };
  }

  try {
    // ── Find existing ────────────────────────────────
    const existing = await prisma.entry.findUnique({ where: { slug } });
    if (!existing) {
      return { success: false, error: "条目不存在" };
    }

    // ── Build update data ────────────────────────────
    const data: Record<string, unknown> = {};

    if (input.title !== undefined) {
      const newTitle = input.title.trim();
      if (!newTitle) {
        return { success: false, error: "标题不能为空" };
      }
      data.title = newTitle;
      // Only regenerate slug if the title actually changed
      if (newTitle !== existing.title) {
        data.slug = generateSlug();
      }
    }
    if (input.type !== undefined) {
      data.type = input.type;
    }
    if (input.content !== undefined) {
      data.content = input.content;
    }
    if (input.contentMd !== undefined) {
      data.contentMd = input.contentMd;
      data.excerpt = generateExcerpt(input.contentMd);
    }

    // ── Execute update ───────────────────────────────
    const entry = await prisma.entry.update({
      where: { slug: existing.slug },
      data,
      include: {
        tags: { include: { tag: true } },
      },
    });

    // ── Handle tags ──────────────────────────────────
    if (input.tags !== undefined) {
      // Delete old associations
      await prisma.entryTag.deleteMany({
        where: { entryId: entry.id },
      });

      // Create new associations via shared helper
      const tagNames = input.tags.filter((t) => t.trim().length > 0);
      for (const name of tagNames) {
        const tagId = await resolveTag(name);
        await prisma.entryTag.create({
          data: { entryId: entry.id, tagId },
        });
      }
    }

    // ── Re-fetch with updated tags ───────────────────
    const updated = await prisma.entry.findUnique({
      where: { id: entry.id },
      include: { tags: { include: { tag: true } } },
    });

    if (!updated) {
      return { success: false, error: "更新后查询失败" };
    }

    revalidatePath("/");
    revalidatePath("/garden");
    revalidatePath(`/entry/${updated.slug}`);
    revalidatePath(`/entry/${updated.slug}/edit`);

    return {
      success: true,
      data: {
        id: updated.id,
        title: updated.title,
        slug: updated.slug,
        type: updated.type,
        content: updated.content,
        contentMd: updated.contentMd,
        excerpt: updated.excerpt,
        isPrivate: updated.isPrivate,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        tags: updated.tags.map((et) => ({
          id: et.tag.id,
          name: et.tag.name,
          slug: et.tag.slug,
        })),
      },
    };
  } catch (error) {
    console.error("updateEntry failed:", error);
    return { success: false, error: "更新失败，请稍后重试" };
  }
}

/**
 * List recent entries, ordered by updatedAt descending.
 *
 * No pagination in this minimal version — returns the most recent 20.
 * Pagination can be added in Phase 2 when there are enough entries.
 */
export async function listEntries(limit = DEFAULT_PAGE_SIZE) {
  try {
    const userId = await getUserId();
    const entries = await prisma.entry.findMany({
      where: userId ? { userId } : {},
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: {
        id: true, title: true, slug: true, type: true,
        excerpt: true, isPrivate: true, content: true,
        createdAt: true, updatedAt: true,
        tags: { include: { tag: true } },
      },
    });

    return entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      slug: entry.slug,
      type: entry.type,
      excerpt: entry.excerpt,
      content: entry.content,
      isPrivate: entry.isPrivate,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      tags: entry.tags.map((et) => ({
        id: et.tag.id,
        name: et.tag.name,
        slug: et.tag.slug,
      })),
    }));
  } catch (error) {
    console.error("listEntries failed:", error);
    return [];
  }
}

// ───────────────────────────────────────────
// Search — for internal wiki linking [[
// ───────────────────────────────────────────

/**
 * Search entries by title for internal wiki linking.
 * Returns minimal data (slug, title) for autocomplete.
 */
export async function searchEntries(query: string) {
  try {
    const userId = await getUserId();
    const entries = await prisma.entry.findMany({
      where: {
        ...(userId ? { userId } : {}),
        OR: [
          { title: { contains: query } },
          { excerpt: { contains: query } },
        ],
      },
      select: { slug: true, title: true },
      take: 10,
      orderBy: { updatedAt: "desc" },
    });
    return entries;
  } catch (error) {
    console.error("searchEntries failed:", error);
    return [];
  }
}

// ───────────────────────────────────────────
// Related Entries — 笔记关联 / 反向链接
// ───────────────────────────────────────────

import { parseOutlinks, getLinkedSlugs, type LinkInfo } from "@/lib/link-parser";

/** Find entries that link TO the given slug (反向链接) */
export async function getBacklinks(slug: string) {
  try {
    const userId = await getUserId();
    const entries = await prisma.entry.findMany({
      where: {
        ...(userId ? { userId } : {}),
        content: { contains: `/entry/${slug}` },
      },
      select: { id: true, title: true, slug: true, type: true, excerpt: true, content: true, createdAt: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
    // Post-filter using structural parsing for accuracy
    return entries
      .filter(e => {
        try {
          const json = JSON.parse(e.content);
          const slugs = getLinkedSlugs(json);
          return slugs.has(slug);
        } catch { return true; } // Fall back to Prisma contains match
      })
      .map(e => ({
        id: e.id, title: e.title, slug: e.slug, type: e.type,
        excerpt: e.excerpt, createdAt: e.createdAt.toISOString(),
      }));
  } catch { return []; }
}

/** Find entries linked FROM this entry (正向引用) */
export async function getOutlinks(content: string) {
  try {
    // Primary: parse TipTap JSON structurally
    const json = JSON.parse(content);
    const links = parseOutlinks(json);
    const slugs = [...new Set(links.map(l => l.slug))];
    if (slugs.length === 0) return [];
    const entries = await prisma.entry.findMany({
      where: { slug: { in: slugs } },
      select: { id: true, title: true, slug: true, type: true, excerpt: true, createdAt: true },
      take: 20,
    });
    return entries.map(e => ({
      ...e, createdAt: e.createdAt.toISOString(),
    }));
  } catch {
    // Fallback: regex on raw content string
    const matches = content.match(/\/entry\/([a-zA-Z0-9-]+)/g);
    if (!matches) return [];
    const slugs = [...new Set(matches.map(m => m.replace("/entry/", "")))];
    try {
      const entries = await prisma.entry.findMany({
        where: { slug: { in: slugs } },
        select: { id: true, title: true, slug: true, type: true, excerpt: true, createdAt: true },
        take: 20,
      });
      return entries.map(e => ({
        ...e, createdAt: e.createdAt.toISOString(),
      }));
    } catch { return []; }
  }
}

/** Get graph data: all entries + their internal links */
export async function getGraphData() {
  try {
    const userId = await getUserId();
    const entries = await prisma.entry.findMany({
      where: userId ? { userId } : {},
      select: { id: true, title: true, slug: true, type: true, content: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
    const nodes = entries.map(e => ({
      id: e.slug,
      title: e.title,
      type: e.type,
      createdAt: e.createdAt.toISOString(),
    }));
    const validSlugs = new Set(nodes.map(n => n.id));
    const links: { source: string; target: string }[] = [];

    for (const e of entries) {
      try {
        const json = JSON.parse(e.content);
        const slugs = getLinkedSlugs(json);
        for (const target of slugs) {
          if (validSlugs.has(target)) {
            links.push({ source: e.slug, target });
          }
        }
      } catch {
        // Fallback: regex on raw content string
        const matches = e.content.match(/\/entry\/([a-zA-Z0-9-]+)/g);
        if (matches) {
          for (const m of matches) {
            const target = m.replace("/entry/", "");
            if (validSlugs.has(target)) {
              links.push({ source: e.slug, target });
            }
          }
        }
      }
    }
    return { nodes, links };
  } catch { return { nodes: [], links: [] }; }
}

/** Get link statistics for a given entry (for badge display) */
export async function getLinkStats(slug: string): Promise<{ backlinks: number; outlinks: number }> {
  try {
    const userId = await getUserId();
    const entry = await prisma.entry.findUnique({
      where: { slug },
      select: { content: true },
    });
    const outlinks = entry?.content
      ? (() => { try { return getLinkedSlugs(JSON.parse(entry.content)).size; } catch { return 0; } })()
      : 0;

    const backlinks = await prisma.entry.count({
      where: {
        ...(userId ? { userId } : {}),
        content: { contains: `/entry/${slug}` },
      },
    });

    return { backlinks, outlinks };
  } catch { return { backlinks: 0, outlinks: 0 }; }
}

/**
 * Delete an entry by slug.
 * Cascade deletes: EntryTag associations are deleted automatically.
 */
export async function deleteEntry(slug: string): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await prisma.entry.findUnique({ where: { slug } });
    if (!existing) {
      return { success: false, error: "条目不存在" };
    }

    await prisma.entry.delete({ where: { slug } });

    revalidatePath("/");
    revalidatePath("/garden");

    return { success: true };
  } catch (error) {
    console.error("deleteEntry failed:", error);
    return { success: false, error: "删除失败，请稍后重试" };
  }
}

// ───────────────────────────────────────────
// Garden Memory — Digital Garden 核心体验
// ───────────────────────────────────────────

/**
 * Return a random past Entry for the "来自花园" memory card.
 *
 * Strategy:
 *   1. Prefer entries older than 30 days (true "re-discovery")
 *   2. Fall back to any entry if no old ones exist
 *   3. Return null if garden is empty
 *
 * Uses COUNT + random offset → findFirst(skip). Portable across SQLite ↔ PostgreSQL.
 *
 * Named with product semantics (getGardenMemory) to allow future expansion:
 *   getGardenMemory("on-this-day")  → 去年今日
 *   getGardenMemory("related", id)  → 关联回忆
 */
export async function getGardenMemory(): Promise<EntryResult["data"] | null> {
  try {
    const userId = await getUserId();
    const baseWhere = userId ? { userId } : {};

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // ── Prefer entries older than 30 days ──────────────
    let total = await prisma.entry.count({
      where: { ...baseWhere, createdAt: { lt: thirtyDaysAgo } },
    });

    let where: Record<string, unknown> | undefined;
    if (total > 0) {
      where = { ...baseWhere, createdAt: { lt: thirtyDaysAgo } };
    } else {
      // ── Fallback: any entry ──────────────────────────
      total = await prisma.entry.count({ where: baseWhere });
      if (total === 0) return null;
      where = { ...baseWhere };
    }

    const offset = Math.floor(Math.random() * total);
    const entry = await prisma.entry.findFirst({
      where,
      skip: offset,
      take: 1,
      orderBy: { createdAt: "desc" },
      include: { tags: { include: { tag: true } } },
    });

    if (!entry) return null;

    return {
      id: entry.id,
      title: entry.title,
      slug: entry.slug,
      type: entry.type,
      content: entry.content,
      contentMd: entry.contentMd,
      excerpt: entry.excerpt,
      isPrivate: entry.isPrivate,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      tags: entry.tags.map((et) => ({
        id: et.tag.id,
        name: et.tag.name,
        slug: et.tag.slug,
      })),
    };
  } catch (error) {
    console.error("getGardenMemory failed:", error);
    return null;
  }
}
