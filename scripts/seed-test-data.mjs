// ============================================================
// Digital Garden — Test Data Seeder
// ============================================================
// 开发环境专用。生成 50 条 Entry，随机分布在过去 180 天。
//
// 运行: npm run seed:test
// 或:   node scripts/seed-test-data.mjs
// ============================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Data pools ─────────────────────────────────────────

const TYPES = ["Memory", "Thought", "Emotion", "Dream", "Story", "Learning"];

const TAG_POOL = [
  "旅行", "工作", "学习", "思考", "日常", "梦想", "情绪", "回忆",
  "东京", "北京", "咖啡", "雨天", "深夜", "音乐", "阅读", "写作",
  "成长", "孤独", "幸福", "焦虑", "希望", "未来", "过去",
];

const TITLE_PARTS_A = [
  "关于", "今天的", "昨晚的", "突然想到的", "一直想说的", "忘记记录的",
  "值得记住的", "那个", "第一次", "最后一次", "最难忘的", "普通的",
];

const TITLE_PARTS_B = [
  "东京旅行", "数字花园", "咖啡店", "雨天", "梦境", "想法", "情绪",
  "学习记录", "回忆", "对话", "散步", "阅读笔记", "深夜思考",
  "工作计划", "夏天", "秋天", "春天", "冬天", "音乐", "电影",
  "朋友", "家人", "自己", "未来", "过去",
];

const CONTENT_TEMPLATES = [
  "今天{verb}了{obj}，感觉{adj}。这是值得记录的一刻。",
  "突然想起{obj}的事情。那时候{adj}，现在想起来{adj2}。",
  "下午在{place}，{verb}的时候突然有了一个想法：{thought}。",
  "昨晚做了一个梦，梦见{obj}。醒来后{adj}了很久。",
  "关于{obj}，我最近有了新的理解。{thought}。",
  "今天的心情是{adj}的。可能是因为{obj}。",
  "读到一段话，让我想起{obj}。记录在这里，以后回来看看。",
  "{obj}给我留下了很深的印象。{thought}。",
  "整理了一下最近关于{obj}的想法。{thought}。",
  "不知道为什么，今天特别想写下来。{obj}。{thought}。",
];

const VERBS = ["看到", "想到", "经历", "完成", "开始", "结束"];
const OBJS = ["一片云", "一段音乐", "一个故事", "一件事", "那个瞬间", "那个画面", "那个声音", "那次对话"];
const ADJS = ["很好", "很平静", "有点复杂", "温暖", "安静", "充实", "疲惫", "开心", "微妙"];
const ADJS2 = ["觉得释然", "觉得很远", "觉得温暖", "觉得好笑", "觉得珍贵"];
const PLACES = ["咖啡馆", "公园", "家里", "地铁上", "图书馆", "海边"];
const THOUGHTS = [
  "也许这就是生活本来的样子。",
  "有时候最简单的答案就在眼前。",
  "时间会让一切变得清晰。",
  "记录下来，以后回头看会很有趣。",
  "这种感受可能不会再有了。",
];

// ── Random helpers ─────────────────────────────────────

const rand = (max) => Math.floor(Math.random() * max);
const pick = (arr) => arr[rand(arr.length)];
const pickN = (arr, n) => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

function randomDate(daysBack = 180) {
  const d = new Date();
  d.setDate(d.getDate() - rand(daysBack));
  d.setHours(rand(24), rand(60), rand(60), 0);
  return d;
}

function generateTitle() {
  const a = pick(TITLE_PARTS_A);
  const b = pick(TITLE_PARTS_B);
  return `${a}${b}`;
}

function generateContent() {
  const template = pick(CONTENT_TEMPLATES);
  return template
    .replace("{verb}", pick(VERBS))
    .replace("{obj}", pick(OBJS))
    .replace("{adj}", pick(ADJS))
    .replace("{adj2}", pick(ADJS2))
    .replace("{place}", pick(PLACES))
    .replace(/\{thought\}/g, pick(THOUGHTS));
}

// ── Main ───────────────────────────────────────────────

async function main() {
  console.log("🌱 开始生成测试数据...\n");

  // Clean existing entries
  await prisma.entryTag.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.tag.deleteMany();
  console.log("  已清理旧数据");

  // Create tags
  const tagMap = {};
  for (const name of TAG_POOL) {
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-一-鿿]/g, "");
    const tag = await prisma.tag.create({
      data: { name, slug: slug || `tag-${Date.now()}-${rand(1000)}` },
    });
    tagMap[name] = tag;
  }
  console.log(`  已创建 ${TAG_POOL.length} 个标签`);

  // Create entries
  const typeCounts = {};
  for (const t of TYPES) typeCounts[t] = 0;

  let minDate = new Date();
  let maxDate = new Date(0);

  for (let i = 0; i < 50; i++) {
    const type = pick(TYPES);
    typeCounts[type]++;

    const title = generateTitle();
    const contentMd = generateContent();
    const content = JSON.stringify({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: contentMd }] },
      ],
    });
    const excerpt = contentMd.slice(0, 150);
    const createdAt = randomDate(180);
    const updatedAt = new Date(createdAt.getTime() + rand(86400000));

    if (createdAt < minDate) minDate = createdAt;
    if (createdAt > maxDate) maxDate = createdAt;

    const slugDate = createdAt.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).slice(2, 8);
    const slug = `${slugDate}-${random}`;

    const tagNames = pickN(TAG_POOL, rand(4)); // 0-3 tags
    const tagConnections = tagNames.map((name) => ({
      tag: { connect: { id: tagMap[name].id } },
    }));

    await prisma.entry.create({
      data: {
        title,
        slug,
        type,
        content,
        contentMd,
        excerpt,
        createdAt,
        updatedAt,
        tags: { create: tagConnections },
      },
    });
  }

  // ── Statistics ────────────────────────────────────────

  console.log(`\n=== 生成完成 ===\n`);
  console.log(`Entries:      50`);
  console.log(`Tags:         ${TAG_POOL.length}`);
  console.log(
    `Date Range:   ${minDate.toISOString().slice(0, 10)} ~ ${maxDate.toISOString().slice(0, 10)}`,
  );
  console.log(`\nType Distribution:`);
  for (const t of TYPES) {
    const bar = "█".repeat(typeCounts[t]);
    console.log(`  ${t.padEnd(10)} ${String(typeCounts[t]).padStart(2)}  ${bar}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Seed failed:", e);
  prisma.$disconnect();
  process.exit(1);
});
