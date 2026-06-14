// ============================================================
// Quick addendum: add 10 more notes to reach 50 total
// ============================================================
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EXTRA_NOTES = [
  // More Emotions
  {
    title: "午后的倦意",
    type: "Emotion",
    tags: ["日常", "情绪"],
    createdAt: -2,
    content: JSON.stringify({ type: "doc", content: [
      { type: "paragraph", content: [{ type: "text", text: "下午三点，阳光从百叶窗的缝隙里漏进来，在桌面上画出一道道条纹。" }] },
      { type: "paragraph", content: [{ type: "text", text: "电脑屏幕上的代码变得模糊。打了个哈欠，去泡了今天的第二杯咖啡。" }] },
      { type: "paragraph", content: [{ type: "text", text: "有时候觉得，午后的倦意也是一种奢侈。说明至少这一刻，没有什么紧急的事在追着你。" }] },
    ]}),
    contentMd: "下午三点，阳光从百叶窗的缝隙里漏进来...",
    excerpt: "下午三点，阳光从百叶窗的缝隙里漏进来，在桌面上画出一道道条纹。午后的倦意也是一种奢侈。",
  },
  {
    title: "收到一封手写信",
    type: "Emotion",
    tags: ["情绪", "日常", "幸福"],
    createdAt: -7,
    content: JSON.stringify({ type: "doc", content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "在 2026 年收到手写信" }] },
      { type: "paragraph", content: [{ type: "text", text: "今天打开信箱，看到一封手写信。是大学室友寄来的。信封上的字迹还是那么丑。" }] },
      { type: "paragraph", content: [{ type: "text", text: "信不长，就一页纸。说了说他最近的工作、家庭、和刚出生的女儿。最后写道：" }] },
      { type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "老友，虽然很久不见，但你一直在我的生活里。有空来深圳，我请你喝酒。" }] }] },
      { type: "paragraph", content: [{ type: "text", text: "看完眼睛有点湿。在微信时代，一封手写信的重量是任何表情包都无法替代的。" }] },
    ]}),
    contentMd: "今天打开信箱，看到一封手写信...",
    excerpt: "今天打开信箱，看到一封手写信。是大学室友寄来的。在微信时代，一封手写信的重量是任何表情包都无法替代的。",
  },
  // More Dreams
  {
    title: "变成一棵树",
    type: "Dream",
    tags: ["梦境", "自然", "哲学"],
    createdAt: -19,
    content: JSON.stringify({ type: "doc", content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "一棵银杏树" }] },
      { type: "paragraph", content: [{ type: "text", text: "梦见自己变成了一棵银杏树。就站在大学图书馆前面的草坪上。" }] },
      { type: "paragraph", content: [{ type: "text", text: "春天发芽，夏天繁茂，秋天金黄，冬天光秃。一年又一年，看着学生们来来去去。" }] },
      { type: "paragraph", content: [{ type: "text", text: "有情侣在树下接吻，有毕业生在树下拍照，有失恋的人在树下哭。" }] },
      { type: "paragraph", content: [{ type: "text", text: "作为一棵树，不能说话，不能移动，但能看见一切。", marks: [{ type: "italic" }] }, { type: "text", text: " 醒来之后觉得，其实做一棵树也挺好的。" }] },
    ]}),
    contentMd: "梦见自己变成了一棵银杏树...",
    excerpt: "梦见自己变成了一棵银杏树。作为一棵树，不能说话，不能移动，但能看见一切。其实做一棵树也挺好的。",
  },
  {
    title: "平行世界的我",
    type: "Dream",
    tags: ["梦境", "思考", "哲学"],
    createdAt: -24,
    content: JSON.stringify({ type: "doc", content: [
      { type: "paragraph", content: [{ type: "text", text: "昨晚梦见遇到了平行世界里的自己。她过着完全不同的生活——住在成都，开了一家花店，养了两只猫。" }] },
      { type: "paragraph", content: [{ type: "text", text: "我们坐在她花店后面的小院子里喝茶。我问她：「你快乐吗？」" }] },
      { type: "paragraph", content: [{ type: "text", text: "她说：「", marks: [{ type: "bold" }] }, { type: "text", text: "快乐不是选择的结果，而是选择的方式。" }] },
      { type: "paragraph", content: [{ type: "text", text: "然后她递给我一盆多肉，说：「送给你。它不需要太多照顾，但会一直在那里。」" }] },
      { type: "paragraph", content: [{ type: "text", text: "醒了之后想了很久。也许每一个选择都通向一个平行世界，而我已经在自己最好的那个世界里了。", marks: [{ type: "italic" }] }] },
    ]}),
    contentMd: "昨晚梦见遇到了平行世界里的自己...",
    excerpt: "昨晚梦见遇到了平行世界里的自己。她过着完全不同的生活。也许每一个选择都通向一个平行世界。",
  },
  // More Stories
  {
    title: "楼下的桂花树",
    type: "Story",
    tags: ["故事", "自然", "日常"],
    createdAt: -85,
    content: JSON.stringify({ type: "doc", content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "每年十月的约定" }] },
      { type: "paragraph", content: [{ type: "text", text: "楼下有一棵桂花树。每年十月，它会在一夜之间开满花。那种香气浓得化不开，整个小区都闻得到。" }] },
      { type: "paragraph", content: [{ type: "text", text: "住在这里五年了。每年桂花开的时候，我都会在树下站一会儿。第一年是一个人，第三年是两个人，第五年又变成了一个人。" }] },
      { type: "paragraph", content: [{ type: "text", text: "桂花不在乎谁在树下。它只是每年按时开，按时落。", marks: [{ type: "italic" }] }] },
      { type: "horizontalRule" },
      { type: "paragraph", content: [{ type: "text", text: "上个月物业说要把树移走，因为挡了地下车库的入口。我去找了物业经理，磨了三天。最后树留下了。有些东西，值得为一棵树较真。" }] },
    ]}),
    contentMd: "楼下有一棵桂花树...",
    excerpt: "楼下有一棵桂花树。每年十月会在一夜之间开满花。桂花开的时候，我都会在树下站一会儿。有些东西，值得为一棵树较真。",
  },
  {
    title: "一个程序员转行当厨师",
    type: "Story",
    tags: ["故事", "科技", "美食"],
    createdAt: -52,
    content: JSON.stringify({ type: "doc", content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "从代码到厨房" }] },
      { type: "paragraph", content: [{ type: "text", text: "阿杰是我前同事。去年他辞掉了年薪 40 万的程序员工作，去学做菜。" }] },
      { type: "paragraph", content: [{ type: "text", text: "所有人都觉得他疯了。他爸妈气得两个月没跟他说话。" }] },
      { type: "paragraph", content: [{ type: "text", text: "前几天去他的私房菜馆吃饭。店面很小，只放得下三张桌子。他一个人在厨房忙，他女朋友在外面招呼客人。" }] },
      { type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "我问他还想不想写代码。他说：「", marks: [{ type: "bold" }] }, { type: "text", text: "写代码是做乘法，做菜是做加法。乘法做得久了，差点忘了加法是什么感觉。」" }] }] },
      { type: "paragraph", content: [{ type: "text", text: "我尝了他做的红烧肉。确实比代码好吃。" }] },
    ]}),
    contentMd: "阿杰是我前同事。去年他辞掉了年薪 40 万的程序员工作...",
    excerpt: "阿杰是我前同事。去年他辞掉了年薪 40 万的程序员工作去学做菜。他做的红烧肉确实比代码好吃。",
  },
  // More Learning
  {
    title: "Git 工作流最佳实践",
    type: "Learning",
    tags: ["学习", "科技", "工作"],
    createdAt: -16,
    content: JSON.stringify({ type: "doc", content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Conventional Commits" }] },
      { type: "paragraph", content: [{ type: "text", text: "规范的 Commit Message 格式：", marks: [{ type: "bold" }] }] },
      { type: "codeBlock", attrs: { language: "bash" }, content: [{ type: "text", text: "feat: 新功能\nfix: 修复 bug\ndocs: 文档更新\nstyle: 代码格式（不影响功能）\nrefactor: 重构\nperf: 性能优化\ntest: 测试相关\nchore: 构建/工具变更" }] },
      { type: "paragraph", content: [{ type: "text", text: "推荐的 Git 分支策略：" }] },
      { type: "orderedList", attrs: { start: 1 }, content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "main — 生产分支，永远可部署" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "develop — 开发分支" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "feature/xxx — 功能分支，从 develop 切出" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "hotfix/xxx — 紧急修复，从 main 切出" }] }] },
      ]},
      { type: "paragraph", content: [{ type: "text", text: "核心原则：", marks: [{ type: "bold" }] }, { type: "text", text: " 每个 commit 做且只做一件事。如果 commit message 里出现了「和」字，这个 commit 就应该拆开。" }] },
    ]}),
    contentMd: "Git 工作流最佳实践...",
    excerpt: "规范的 Commit Message 格式。核心原则：每个 commit 做且只做一件事。如果 commit message 里出现了「和」字，就应该拆开。",
  },
  {
    title: "如何读一本难懂的书",
    type: "Learning",
    tags: ["学习", "阅读", "思考"],
    createdAt: -11,
    content: JSON.stringify({ type: "doc", content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "三步阅读法" }] },
      { type: "paragraph", content: [{ type: "text", text: "最近在读《哥德尔、艾舍尔、巴赫》。这本书出了名的难，但我摸索出了一套方法：" }] },
      { type: "orderedList", attrs: { start: 1 }, content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "第一遍：快速通读。不理解的地方跳过，建立整体印象" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "第二遍：逐章细读。做笔记，画思维导图，试着向别人（或 AI）解释" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "第三遍：带着问题重读。只读那些和你的问题相关的章节" }] }] },
      ]},
      { type: "paragraph", content: [{ type: "text", text: "关键心态：", marks: [{ type: "bold" }] }, { type: "text", text: " 不和作者较劲。读不懂的时候不是证明你笨，而是说明你缺少某些前置知识。去补那些知识，而不是硬啃。" }] },
    ]}),
    contentMd: "如何读一本难懂的书...",
    excerpt: "最近在读《哥德尔、艾舍尔、巴赫》。读不懂的时候不是证明你笨，而是说明你缺少某些前置知识。去补那些知识，而不是硬啃。",
  },
  // More Thoughts
  {
    title: "数字极简主义实验",
    type: "Thought",
    tags: ["思考", "科技", "生活"],
    createdAt: -4,
    content: JSON.stringify({ type: "doc", content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "一周实验报告" }] },
      { type: "paragraph", content: [{ type: "text", text: "上周开始做了一个实验：把手机上所有社交 App 都删了，只保留了微信（也关掉了朋友圈）。" }] },
      { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "结果" }] },
      { type: "bulletList", content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "屏幕时间从每天 5.2 小时降到了 1.8 小时" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "读完了两本一直想看的书" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "睡眠质量明显改善（不再睡前刷手机）" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "有一点点 FOMO（害怕错过），但很快就消失了" }] }] },
      ]},
      { type: "paragraph", content: [{ type: "text", text: "结论：大多数「必须看」的资讯，其实不看也完全不影响生活。", marks: [{ type: "bold" }] }] },
      { type: "callout", content: [{ type: "paragraph", content: [{ type: "text", text: "推荐阅读：Cal Newport 的《Digital Minimalism》——这本书是这个实验的灵感来源。" }] }] },
    ]}),
    contentMd: "数字极简主义实验...",
    excerpt: "把手机上所有社交 App 都删了，只保留了微信。屏幕时间从每天 5.2 小时降到了 1.8 小时。大多数「必须看」的资讯其实不看也不影响生活。",
  },
  // More Memory
  {
    title: "毕业那天的夕阳",
    type: "Memory",
    tags: ["回忆", "成长", "大学"],
    createdAt: -178,
    content: JSON.stringify({ type: "doc", content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "2022年6月20日" }] },
      { type: "paragraph", content: [{ type: "text", text: "拍完毕业照，大家各自散了。我没有立刻走，一个人坐到操场的看台上。" }] },
      { type: "paragraph", content: [{ type: "text", text: "那天的夕阳特别好看。橙红色的光铺满了整个操场。有人在远处放风筝，有情侣在跑道边拥抱，有室友在疯狂自拍。" }] },
      { type: "paragraph", content: [{ type: "text", text: "我坐在那里想：这四年的每一个选择，把我带到了这个黄昏。虽然没有成为大一时候想成为的那个人，但好像变成了一个更真实的自己。" }] },
      { type: "paragraph", content: [{ type: "text", text: "后来太阳完全落下去了，操场上的人也越来越少。我站起来，拍了拍身上的灰，走了。没有回头。", marks: [{ type: "italic" }] }] },
    ]}),
    contentMd: "毕业那天的夕阳...",
    excerpt: "拍完毕业照，我一个人坐到操场的看台上。那天的夕阳特别好看。这四年的每一个选择，把我带到了这个黄昏。",
  },
];

async function main() {
  console.log("🌱 追加 10 条笔记...\n");

  // Get existing tags
  const tags = await prisma.tag.findMany();
  const tagMap = {};
  for (const t of tags) tagMap[t.name] = t;

  // Create any missing tags
  for (const note of EXTRA_NOTES) {
    for (const tn of note.tags) {
      if (!tagMap[tn]) {
        const slug = tn.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-一-鿿]/g, "") || `tag-${Date.now()}`;
        tagMap[tn] = await prisma.tag.create({ data: { name: tn, slug } });
      }
    }
  }
  console.log(`  标签已就绪`);

  for (let i = 0; i < EXTRA_NOTES.length; i++) {
    const note = EXTRA_NOTES[i];
    const daysBack = Math.abs(note.createdAt);
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    d.setHours(8 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 60), 0, 0);

    const slugDate = d.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).slice(2, 8);
    const slug = `${slugDate}-${random}`;

    const tagConnections = note.tags
      .filter((n) => tagMap[n])
      .map((name) => ({ tag: { connect: { id: tagMap[name].id } } }));

    await prisma.entry.create({
      data: {
        title: note.title,
        slug,
        type: note.type,
        content: note.content,
        contentMd: note.contentMd,
        excerpt: note.excerpt.slice(0, 200),
        createdAt: d,
        updatedAt: new Date(d.getTime() + Math.floor(Math.random() * 86400000 * 3)),
        tags: { create: tagConnections },
      },
    });

    const emoji = { Memory: "💭", Thought: "💡", Emotion: "💗", Dream: "🌙", Story: "📖", Learning: "📚" }[note.type];
    console.log(`  ${emoji} [${String(40 + i + 1).padStart(2)}] ${note.title}  ${d.toISOString().slice(0, 10)}`);
  }

  const total = await prisma.entry.count();
  console.log(`\n✨ 完成！现在共有 ${total} 条笔记。`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Failed:", e);
  prisma.$disconnect();
  process.exit(1);
});
