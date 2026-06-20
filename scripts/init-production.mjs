// ============================================================
// Digital Garden — Production Database Initializer
// ============================================================
// Creates default user + 52 entries with full TipTap content.
// Safe to run multiple times (idempotent).
//
// Run: node scripts/init-production.mjs
// ============================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { E, SLUG, extractMarkdown } from "./seed-3.0-content.mjs";

const prisma = new PrismaClient();

// ── Default User Config ───────────────────────────────
const DEFAULT_USER = {
  id: "default-user",       // Must match GUEST_USER_ID in middleware.ts
  username: "Star.Li",
  password: "123456",       // bcrypt hashed below
  displayName: "Star",
  visibility: "public",
};

// ── Entry stubs (title → type mapping for all 52 entries) ──
const ENTRY_TYPES = {
  "毕业那天的夕阳": "Memory",
  "高考前夜": "Memory",
  "外婆家的夏天": "Memory",
  "奶奶的红烧肉配方": "Memory",
  "爷爷的收音机": "Memory",
  "第一次看海": "Memory",
  "大学图书馆的日落": "Memory",
  "那个秋天的事": "Memory",
  "低俗": "Thought",
  "Star  万物起源": "Thought",
  "东京之旅：浅草寺的午后": "Memory",
  "楼下的桂花树": "Story",
  "流浪猫的日常": "Story",
  "地铁上的陌生人": "Story",
  "菜市场里的哲学家": "Story",
  "便利店的夜班姑娘": "Story",
  "那年夏天的台风": "Memory",
  "一个关于告别的小故事": "Story",
  "一个程序员转行当厨师": "Story",
  "编程的艺术": "Thought",
  "学习的本质": "Learning",
  "关于 AI 与创作的一些思考": "Thought",
  "为什么我们越来越孤独": "Thought",
  "读书笔记：《局外人》": "Learning",
  "关于自由的碎片想法": "Thought",
  "数字极简主义实验": "Thought",
  "城市与乡村的二重生活": "Thought",
  "摄影的曝光三角": "Learning",
  "Rust 语言学习笔记": "Learning",
  "Git 工作流最佳实践": "Learning",
  "CSS Grid 布局备忘": "Learning",
  "咖啡入门：从速溶到手冲": "Learning",
  "如何读一本难懂的书": "Learning",
  "时间管理的番茄工作法改造": "Learning",
  "时间倒流": "Dream",
  "深海图书馆": "Dream",
  "迷雾森林": "Dream",
  "回到高中教室": "Dream",
  "平行世界的我": "Dream",
  "变成一棵树": "Dream",
  "和猫对话": "Dream",
  "飞行梦": "Dream",
  "春天的生命力": "Emotion",
  "社交倦怠期": "Emotion",
  "被一首歌击中": "Emotion",
  "久违的平静": "Emotion",
  "深夜的焦虑": "Emotion",
  "一个平凡的星期一": "Emotion",
  "雨天的安宁": "Emotion",
  "收到一封手写信": "Emotion",
  "今天的快乐小事": "Emotion",
  "午后的倦意": "Emotion",
};

// ── Date offsets (days before today) for realistic timestamps ──
const DATE_OFFSETS = {
  "毕业那天的夕阳": 560,
  "高考前夜": 540,
  "外婆家的夏天": 500,
  "奶奶的红烧肉配方": 480,
  "爷爷的收音机": 450,
  "第一次看海": 420,
  "大学图书馆的日落": 400,
  "那个秋天的事": 380,
  "低俗": 20,
  "Star  万物起源": 10,
  "东京之旅：浅草寺的午后": 350,
  "楼下的桂花树": 300,
  "流浪猫的日常": 280,
  "地铁上的陌生人": 260,
  "菜市场里的哲学家": 250,
  "便利店的夜班姑娘": 240,
  "那年夏天的台风": 230,
  "一个关于告别的小故事": 220,
  "一个程序员转行当厨师": 210,
  "编程的艺术": 200,
  "学习的本质": 190,
  "关于 AI 与创作的一些思考": 185,
  "为什么我们越来越孤独": 180,
  "读书笔记：《局外人》": 170,
  "关于自由的碎片想法": 160,
  "数字极简主义实验": 155,
  "城市与乡村的二重生活": 150,
  "摄影的曝光三角": 140,
  "Rust 语言学习笔记": 135,
  "Git 工作流最佳实践": 130,
  "CSS Grid 布局备忘": 125,
  "咖啡入门：从速溶到手冲": 120,
  "如何读一本难懂的书": 115,
  "时间管理的番茄工作法改造": 110,
  "时间倒流": 100,
  "深海图书馆": 95,
  "迷雾森林": 90,
  "回到高中教室": 85,
  "平行世界的我": 80,
  "变成一棵树": 75,
  "和猫对话": 70,
  "飞行梦": 65,
  "春天的生命力": 60,
  "社交倦怠期": 55,
  "被一首歌击中": 50,
  "久违的平静": 45,
  "深夜的焦虑": 40,
  "一个平凡的星期一": 35,
  "雨天的安宁": 30,
  "收到一封手写信": 25,
  "今天的快乐小事": 15,
  "午后的倦意": 5,
};

// ── Main ───────────────────────────────────────────────

async function main() {
  console.log("🌱 Digital Garden — Production DB Initializer\n");

  // ── Step 1: Create default user ──────────────────────
  console.log("👤 [1/3] Creating default user...");
  const existingUser = await prisma.user.findUnique({ where: { id: DEFAULT_USER.id } });
  if (existingUser) {
    console.log(`   User "${DEFAULT_USER.username}" already exists — skipping`);
  } else {
    const passwordHash = await bcrypt.hash(DEFAULT_USER.password, 12);
    await prisma.user.create({
      data: {
        id: DEFAULT_USER.id,
        username: DEFAULT_USER.username,
        passwordHash,
        displayName: DEFAULT_USER.displayName,
        visibility: DEFAULT_USER.visibility,
      },
    });
    console.log(`   ✅ Created user: ${DEFAULT_USER.username} (id: ${DEFAULT_USER.id})`);
  }

  // ── Step 2: Create stub entries ──────────────────────
  console.log("\n📝 [2/3] Creating entry stubs...");
  let createdCount = 0;
  let skipCount = 0;

  const titles = Object.keys(ENTRY_TYPES);
  for (const title of titles) {
    const slug = SLUG[title];
    if (!slug) {
      console.log(`   ⚠️  No slug defined for: "${title}" — skipping`);
      skipCount++;
      continue;
    }

    // Check if entry already exists
    const existing = await prisma.entry.findUnique({ where: { slug } });
    if (existing) {
      skipCount++;
      continue;
    }

    const type = ENTRY_TYPES[title];
    const daysAgo = DATE_OFFSETS[title] || 100;
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    const updatedAt = new Date(createdAt.getTime() + Math.floor(Math.random() * 86400000 * 3));

    // Create stub entry (content will be updated in step 3)
    await prisma.entry.create({
      data: {
        title,
        slug,
        type,
        content: JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: title }] }] }),
        contentMd: title,
        excerpt: title,
        userId: DEFAULT_USER.id,
        createdAt,
        updatedAt,
      },
    });
    createdCount++;
  }
  console.log(`   ✅ Created ${createdCount} entries, ${skipCount} already existed`);

  // ── Step 3: Update entries with rich TipTap content ──
  console.log("\n✨ [3/3] Populating rich TipTap content...");
  const allEntries = await prisma.entry.findMany({
    where: { userId: DEFAULT_USER.id },
    select: { id: true, title: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  let updated = 0;
  let skipped = 0;

  for (const entry of allEntries) {
    const builder = E[entry.title];
    if (!builder) {
      console.log(`   ⚠️  No content builder for: "${entry.title}" — skipping`);
      skipped++;
      continue;
    }

    const content = builder();
    const contentMd = extractMarkdown(content);
    const excerpt = contentMd.slice(0, 200).replace(/[#*`\[\]()>\\\-_~]/g, "").trim();

    await prisma.entry.update({
      where: { id: entry.id },
      data: { content, contentMd, excerpt },
    });

    updated++;
    if (updated % 10 === 0) console.log(`   [${updated}/${allEntries.length}] entries updated...`);
  }

  console.log(`\n🎉 Done! ${updated} entries populated, ${skipped} skipped.`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error("Init failed:", e); process.exit(1); });
