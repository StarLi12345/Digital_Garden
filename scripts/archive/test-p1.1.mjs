// P1.1 Verification Script
// Tests: createEntry → getEntryBySlug → listEntries → updateEntry
// Run: node scripts/test-p1.1.mjs

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ENTRY_TYPES = [
  "Memory", "Thought", "Emotion", "Dream", "Story", "Learning",
];

function generateSlug() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Buffer.from(
    crypto.getRandomValues(new Uint8Array(3)),
  ).toString("hex");
  return `${date}-${random}`;
}

function generateExcerpt(md) {
  return md
    .replace(/[#*`\[\]()>\\\-_~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

async function test() {
  console.log("=== P1.1 CRUD Verification ===\n");

  // ── 1. CREATE ──────────────────────────────────────
  console.log("1. createEntry ...");
  const slug = generateSlug();
  const entry = await prisma.entry.create({
    data: {
      title: "我的第一条记录",
      slug,
      type: "Memory",
      content: JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "这是测试内容" }] }] }),
      contentMd: "这是测试内容",
      excerpt: generateExcerpt("这是测试内容"),
      tags: {
        create: [
          {
            tag: {
              connectOrCreate: {
                where: { name: "测试" },
                create: { name: "测试", slug: "test" },
              },
            },
          },
        ],
      },
    },
    include: { tags: { include: { tag: true } } },
  });
  console.log(`   ✅ created: slug=${entry.slug}, title="${entry.title}", tags=${entry.tags.length}\n`);

  // ── 2. READ ────────────────────────────────────────
  console.log("2. getEntryBySlug ...");
  const found = await prisma.entry.findUnique({
    where: { slug: entry.slug },
    include: { tags: { include: { tag: true } } },
  });
  if (found && found.title === "我的第一条记录") {
    console.log(`   ✅ found: "${found.title}" (${found.type})\n`);
  } else {
    console.log("   ❌ not found\n");
    process.exit(1);
  }

  // ── 3. LIST ────────────────────────────────────────
  console.log("3. listEntries ...");
  const list = await prisma.entry.findMany({
    orderBy: { updatedAt: "desc" },
    take: 10,
    include: { tags: { include: { tag: true } } },
  });
  console.log(`   ✅ returned ${list.length} entries\n`);

  // ── 4. UPDATE ──────────────────────────────────────
  console.log("4. updateEntry ...");
  const updated = await prisma.entry.update({
    where: { slug: entry.slug },
    data: {
      title: "我的第一条记录（已修改）",
      contentMd: "这是修改后的内容",
      excerpt: generateExcerpt("这是修改后的内容"),
    },
    include: { tags: { include: { tag: true } } },
  });
  if (updated.title === "我的第一条记录（已修改）") {
    console.log(`   ✅ updated: "${updated.title}"\n`);
  } else {
    console.log("   ❌ update failed\n");
    process.exit(1);
  }

  // ── 5. CLEANUP ─────────────────────────────────────
  console.log("5. Cleanup ...");
  await prisma.entryTag.deleteMany({ where: { entryId: entry.id } });
  await prisma.entry.delete({ where: { id: entry.id } });
  console.log("   ✅ test entry deleted\n");

  console.log("=== All tests passed ✅ ===");
}

test()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
