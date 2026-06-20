// ============================================================
// Digital Garden — Rich Test Data Seeder (50 notes)
// ============================================================
// 生成 50 条多样化笔记，覆盖所有类型和编辑器功能。
// 运行: node scripts/seed-rich-data.mjs
// ============================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TYPES = ["Memory", "Thought", "Emotion", "Dream", "Story", "Learning"];
const TYPE_LABELS = { Memory: "回忆", Thought: "想法", Emotion: "情绪", Dream: "梦境", Story: "故事", Learning: "学习" };

const TAG_POOL = [
  "旅行", "工作", "学习", "思考", "日常", "梦想", "情绪", "回忆",
  "东京", "北京", "咖啡", "雨天", "深夜", "音乐", "阅读", "写作",
  "成长", "孤独", "幸福", "焦虑", "希望", "未来", "过去",
  "科技", "摄影", "美食", "电影", "设计", "自然", "哲学", "生活",
];

// ── Helpers: TipTap JSON builders ──────────────────────

function t(text, marks) {
  const node = { type: "text", text };
  if (marks) {
    const m = [];
    if (marks.bold) m.push({ type: "bold" });
    if (marks.italic) m.push({ type: "italic" });
    if (marks.underline) m.push({ type: "underline" });
    if (marks.link) m.push({ type: "link", attrs: { href: marks.link, target: "_blank", rel: "noopener noreferrer" } });
    if (m.length) node.marks = m;
  }
  return node;
}

function p(...children) {
  return { type: "paragraph", content: children.length ? children : [{ type: "text", text: "" }] };
}

function h(level, text) {
  return { type: "heading", attrs: { level }, content: [{ type: "text", text }] };
}

function ul(...items) {
  return { type: "bulletList", content: items.map(item => ({
    type: "listItem", content: [p(t(item))]
  }))};
}

function ol(...items) {
  return { type: "orderedList", attrs: { start: 1 }, content: items.map(item => ({
    type: "listItem", content: [p(t(item))]
  }))};
}

function taskList(...items) {
  return { type: "taskList", content: items.map(({ text, checked }) => ({
    type: "taskItem", attrs: { checked: checked || false }, content: [p(t(text))]
  }))};
}

function bq(...children) {
  return { type: "blockquote", content: children.length ? children : [p(t(""))] };
}

function code(lang, text) {
  return { type: "codeBlock", attrs: { language: lang }, content: [{ type: "text", text }] };
}

function hr() {
  return { type: "horizontalRule" };
}

function callout(...children) {
  return { type: "callout", content: children };
}

function img(src, alt) {
  return { type: "paragraph", content: [{ type: "image", attrs: { src, alt: alt || "" } }] };
}

function doc(...content) {
  return JSON.stringify({ type: "doc", content });
}

// ── Content templates using TipTap JSON ────────────────

const NOTES = [
  // ===== 1-10: Memories (回忆) =====
  {
    title: "东京之旅：浅草寺的午后",
    type: "Memory",
    tags: ["东京", "旅行", "回忆"],
    createdAt: -150,
    content: doc(
      h(2, "浅草寺 — 雷门到本堂"),
      p(t("那天的阳光很好，穿过雷门的红色大灯笼，洒在石子路上。")),
      p(
        t("我们沿着"),
        t("仲见世通", { bold: true }),
        t("慢慢地走，两旁是各种小店铺。买了人形烧和抹茶冰淇淋。"),
      ),
      img("/backgrounds/garden-01.jpg", "浅草寺午后"),
      p(t("浅草寺的午后阳光", { italic: true })),
      h(3, "印象最深的事"),
      p(t("在正殿前抽了一支签，是大吉。签文说「"),
        t("云散月重明", { bold: true }),
        t("」。那时候觉得，这趟旅行真的来对了。")),
      bq(p(t("旅行不只是去看风景，更是去遇见另一个自己。")))),
    contentMd: "浅草寺的午后...",
    excerpt: "那天的阳光很好，穿过雷门的红色大灯笼，洒在石子路上。我们沿着仲见世通慢慢地走...",
  },
  {
    title: "外婆家的夏天",
    type: "Memory",
    tags: ["回忆", "日常", "过去"],
    createdAt: -142,
    content: doc(
      h(2, "蝉鸣和西瓜"),
      p(t("小时候每年暑假都在外婆家度过。院子里有一棵很大的香樟树，蝉鸣从早响到晚。")),
      p(t("外婆会把西瓜浸在井水里，午睡起来切开，凉丝丝的。那种甜，后来再也没有吃到过。")),
      hr(),
      p(t("今年回去，树还在，井已经封了。外婆也老了许多。"),
        t("有些东西只能留在记忆里。", { italic: true }))),
    contentMd: "小时候每年暑假都在外婆家度过...",
    excerpt: "小时候每年暑假都在外婆家度过。院子里有一棵很大的香樟树，蝉鸣从早响到晚。",
  },
  {
    title: "第一次看海",
    type: "Memory",
    tags: ["旅行", "回忆", "成长"],
    createdAt: -135,
    content: doc(
      h(2, "北戴河的清晨"),
      p(t("那是大三那年的五一。和三个室友坐了五个小时火车，到的时候已经是傍晚。")),
      p(t("第二天起了个大早去看日出。海风很冷，但天边的颜色一点点从深蓝变成橙红的时候，所有人都不说话了。")),
      bq(p(t("世界很大，我们很小。但这种渺小感并不让人沮丧，反而很自由。")))),
    contentMd: "那是大三那年的五一...",
    excerpt: "那是大三那年的五一。和三个室友坐了五个小时火车，到的时候已经是傍晚。",
  },
  {
    title: "高考前夜",
    type: "Memory",
    tags: ["回忆", "成长", "过去"],
    createdAt: -160,
    content: doc(
      h(2, "2019年6月6日"),
      p(t("那晚失眠了。翻来覆去到凌晨两点，最后干脆起来看了一遍错题本。")),
      p(t("妈妈敲门进来，什么也没说，放了一杯热牛奶就出去了。那杯牛奶的温度，到现在还记得。")),
      p(t("第二天考语文的时候，作文题目是「韧性」。我写了那棵长在老家石缝里的树。")),
    ),
    contentMd: "那晚失眠了...",
    excerpt: "那晚失眠了。翻来覆去到凌晨两点，最后干脆起来看了一遍错题本。",
  },
  {
    title: "大学图书馆的日落",
    type: "Memory",
    tags: ["回忆", "阅读", "日常"],
    createdAt: -130,
    content: doc(
      h(2, "四楼靠窗的位置"),
      p(t("大四那年每天都在图书馆四楼靠窗的位置。下午四五点的时候，阳光会从西边的窗户斜射进来，把整个自习室染成金色。")),
      p(t("旁边坐着一个总穿白衬衫的男生。我们从来没说过话，但每次他先走的时候，会轻轻把椅子推进去。")),
      p(t("毕业之后再也没有见过他，但那个习惯让我一直记得。有些人的存在本身就是一种温柔。", { italic: true })),
    ),
    contentMd: "大四那年每天都在图书馆四楼靠窗的位置...",
    excerpt: "大四那年每天都在图书馆四楼靠窗的位置。下午四五点的时候，阳光会从西边的窗户斜射进来。",
  },
  {
    title: "奶奶的红烧肉配方",
    type: "Memory",
    tags: ["回忆", "美食", "过去"],
    createdAt: -120,
    content: doc(
      h(2, "不是秘方的秘方"),
      p(t("奶奶的红烧肉是我吃过最好吃的。问了她很多次秘方，她总说没什么特别的。")),
      p(t("后来有一次专门看着她做，才发现她会在焯水之后加一小块冰糖慢慢炒，炒到琥珀色，再放肉。")),
      ul("五花肉 500g 切块", "焯水 5 分钟去血沫", "冰糖小火炒至琥珀色", "加姜片、八角、桂皮", "小火炖 1.5 小时"),
      p(t("她说：「"),
        t("做饭没有秘诀，就是用心。", { bold: true }),
        t("」")),
    ),
    contentMd: "奶奶的红烧肉是我吃过最好吃的...",
    excerpt: "奶奶的红烧肉是我吃过最好吃的。问了她很多次秘方，她总说没什么特别的。",
  },
  {
    title: "那个秋天的事",
    type: "Memory",
    tags: ["回忆", "秋天", "情绪"],
    createdAt: -145,
    content: doc(
      p(t("去年秋天的一个傍晚，我在公园里散步。银杏叶落了一地，金黄灿烂。")),
      p(t("有个小女孩在落叶堆里打滚，她的妈妈在旁边笑着拍照。那个画面让我想起了自己小时候。")),
      p(t("时间过得真快啊。", { italic: true })),
    ),
    contentMd: "去年秋天的一个傍晚...",
    excerpt: "去年秋天的一个傍晚，我在公园里散步。银杏叶落了一地，金黄灿烂。",
  },

  // ===== 11-20: Thoughts (想法) =====
  {
    title: "关于 AI 与创作的一些思考",
    type: "Thought",
    tags: ["思考", "科技", "写作"],
    createdAt: -50,
    content: doc(
      h(2, "AI 会让人类停止思考吗？"),
      p(t("最近读了 Paul Graham 的一篇文章，他说 AI 时代最稀缺的能力是「"),
        t("写作即思考", { bold: true }),
        t("」。")),
      p(t("很多人用 AI 来替代写作，但其实写作的过程本身就是思考的过程。如果你让 AI 替你想，你就放弃了思考的机会。")),
      hr(),
      h(3, "我的观点"),
      p(t("AI 应该是一个"),
        t("加速器", { bold: true }),
        t("而不是替代品。它可以帮你整理思路、提供灵感、检查逻辑漏洞，但不应该替代你动笔。")),
      p(t("附上 Paul Graham 的文章："),
        t("Writes and Write-Nots", { link: "https://paulgraham.com/writes.html" }),
        t("，值得一读。")),
    ),
    contentMd: "关于 AI 与创作...",
    excerpt: "最近读了 Paul Graham 的一篇文章，他说 AI 时代最稀缺的能力是「写作即思考」。",
  },
  {
    title: "为什么我们越来越孤独",
    type: "Thought",
    tags: ["思考", "孤独", "哲学", "生活"],
    createdAt: -45,
    content: doc(
      h(2, "连接的悖论"),
      p(t("我们现在有前所未有的连接工具——微信、微博、豆瓣、即刻——但年轻人却比以往任何时候都更孤独。")),
      p(t("我觉得原因有三：")),
      ol("社交媒体呈现的是「表演」而非「真实」", "即时回复造成了「秒回焦虑」", "线下见面的成本似乎在变高"),
      p(t("解决之道也许很简单："),
        t("把手机放下，出门见一个真正的朋友。", { bold: true }),
        t("不需要做什么特别的事，一起散散步就够了。")),
    ),
    contentMd: "我们现在有前所未有的连接工具...",
    excerpt: "我们现在有前所未有的连接工具——微信、微博、豆瓣、即刻——但年轻人却比以往任何时候都更孤独。",
  },
  {
    title: "学习的本质",
    type: "Thought",
    tags: ["学习", "思考", "成长"],
    createdAt: -55,
    content: doc(
      h(2, "费曼学习法的启示"),
      p(t("昨天在 YouTube 上看了费曼的访谈。他说："), t("「如果你不能简单地解释一个东西，说明你还没有真正理解它。」", { italic: true })),
      bq(
        p(t("The first principle is that you must not fool yourself — and you are the easiest person to fool.")),
        p(t("— Richard Feynman", { italic: true }))
      ),
      p(t("这让我反思自己的学习方式。很多时候我只是在"),
        t("假装学习", { bold: true }),
        t("——看视频、划重点、做笔记——但从来没有试图向别人解释过。")),
      p(t("从今天开始，每次学完一个概念，都试着写一段简短的解释。这就是我在这个花园里做的事。")),
    ),
    contentMd: "学习的本质...",
    excerpt: "昨天在 YouTube 上看了费曼的访谈。他说：「如果你不能简单地解释一个东西，说明你还没有真正理解它。",
  },
  {
    title: "城市与乡村的二重生活",
    type: "Thought",
    tags: ["思考", "生活", "设计"],
    createdAt: -48,
    content: doc(
      h(2, "两边都想要"),
      p(t("在城市待久了想念乡村的安静，在乡村待久了想念城市的便利。人真是矛盾的动物。")),
      p(t("最近在考虑一种「"),
        t("半城半乡", { bold: true }),
        t("」的生活模式：工作日住在城里，周末开车去郊区。不知道能不能实现。")),
      p(t("有没有一种可能，未来的城市设计本身就包含了足够的自然元素？像新加坡那样。")),
    ),
    contentMd: "在城市待久了想念乡村的安静...",
    excerpt: "在城市待久了想念乡村的安静，在乡村待久了想念城市的便利。人真是矛盾的动物。",
  },
  {
    title: "读书笔记：《局外人》",
    type: "Thought",
    tags: ["阅读", "思考", "哲学"],
    createdAt: -42,
    content: doc(
      h(2, "加缪的开篇"),
      p(t("「今天，妈妈死了。也许是昨天，我不知道。」")),
      p(t("这可能是文学史上最著名的开篇之一。它立刻建立了一个对所有社会规范都无动于衷的叙述者。")),
      p(t("默尔索的问题不在于他做了什么，而在于他"),
        t("拒绝表演", { bold: true }),
        t("。在法庭上，人们更在意他「没有在母亲的葬礼上哭泣」而不是他杀了人。这是对社会虚伪的锋利批判。")),
    ),
    contentMd: "读书笔记：《局外人》...",
    excerpt: "「今天，妈妈死了。也许是昨天，我不知道。」这可能是文学史上最著名的开篇之一。",
  },
  {
    title: "编程的艺术",
    type: "Thought",
    tags: ["思考", "科技", "学习"],
    createdAt: -60,
    content: doc(
      h(2, "代码是写给人看的"),
      p(t("Donald Knuth 说过："),
        t("「Programs are meant to be read by humans and only incidentally for computers to execute.」", { italic: true })),
      p(t("好的代码就像好的文章：清晰、简洁、有逻辑。变量命名和函数拆分，本质上和写文章的谋篇布局没有区别。")),
      code("javascript", "// 好的命名让代码自解释\nfunction calculateGardenStats(entries) {\n  const total = entries.length;\n  const byType = entries.reduce((acc, e) => {\n    acc[e.type] = (acc[e.type] || 0) + 1;\n    return acc;\n  }, {});\n  return { total, byType };\n}"),
    ),
    contentMd: "编程的艺术...",
    excerpt: "Donald Knuth 说过：Programs are meant to be read by humans and only incidentally for computers to execute.",
  },
  {
    title: "关于自由的碎片想法",
    type: "Thought",
    tags: ["思考", "成长", "孤独"],
    createdAt: -35,
    content: doc(
      p(t("最近在想，什么才是真正的自由。")),
      p(t("不是想做什么就做什么，而是"),
        t("不想做什么就可以不做什么", { bold: true }),
        t("。")),
      p(t("这种自由需要两个条件：经济独立和精神独立。我还在路上。")),
    ),
    contentMd: "最近在想，什么才是真正的自由...",
    excerpt: "最近在想，什么才是真正的自由。不是想做什么就做什么，而是不想做什么就可以不做什么。",
  },

  // ===== 21-30: Emotions (情绪) =====
  {
    title: "雨天的安宁",
    type: "Emotion",
    tags: ["雨天", "情绪", "日常"],
    createdAt: -5,
    content: doc(
      h(2, "喜欢下雨"),
      p(t("下雨天有一种奇怪的安宁感。窗外的世界变得模糊，房间里的灯光显得格外温暖。")),
      p(t("今天泡了一杯"),
        t("乌龙茶", { bold: true }),
        t("，坐在窗边听雨声。有一瞬间觉得，什么都不做也挺好的。")),
      p(t("也许这就是"),
        t("活在当下", { underline: true }),
        t("的感觉。")),
    ),
    contentMd: "下雨天有一种奇怪的安宁感...",
    excerpt: "下雨天有一种奇怪的安宁感。窗外的世界变得模糊，房间里的灯光显得格外温暖。",
  },
  {
    title: "深夜的焦虑",
    type: "Emotion",
    tags: ["深夜", "焦虑", "情绪"],
    createdAt: -12,
    content: doc(
      h(2, "凌晨两点的思绪"),
      p(t("又失眠了。脑海中反复回放今天开会时说的那句话，不知道是不是说错了。")),
      p(t("然后开始想更远的事：这个项目有前途吗？我是不是应该换个方向？三十岁之前能实现财务自由吗？")),
      p(t("其实知道这些焦虑大多是无用的，但深夜的时候大脑就是停不下来。")),
      hr(),
      p(t("写下来之后，好像好了一点。"),
        t("晚安。", { italic: true })),
    ),
    contentMd: "又失眠了...",
    excerpt: "又失眠了。脑海中反复回放今天开会时说的那句话，不知道是不是说错了。",
  },
  {
    title: "今天的快乐小事",
    type: "Emotion",
    tags: ["日常", "幸福", "情绪"],
    createdAt: -3,
    content: doc(
      h(2, "小确幸清单"),
      p(t("今天有几件开心的小事，记下来备忘：")),
      taskList(
        { text: "早上多睡了 15 分钟", checked: true },
        { text: "地铁上有座位", checked: true },
        { text: "午饭的拉面特别好吃", checked: true },
        { text: "收到一个意外的微信问候", checked: true },
        { text: "晚上看到很美的晚霞", checked: false },
      ),
      p(t("写完之后发现，快乐其实不需要什么大事件。"),
        t("一个个小确幸就够了。", { italic: true })),
    ),
    contentMd: "今天有几件开心的小事...",
    excerpt: "今天有几件开心的小事，记下来备忘。写完之后发现，快乐其实不需要什么大事件。",
  },
  {
    title: "一个平凡的星期一",
    type: "Emotion",
    tags: ["日常", "情绪", "工作"],
    createdAt: -8,
    content: doc(
      p(t("星期一总是最难熬的。")),
      p(t("不过今天下班的时候看到天边的晚霞特别美，粉紫色的一大片。站在公司门口看了五分钟。")),
      p(t("旁边有个保安大叔也在看，我们对视了一眼，都笑了。这种陌生人之间的小默契，让人觉得很温暖。")),
    ),
    contentMd: "星期一总是最难熬的...",
    excerpt: "星期一总是最难熬的。不过今天下班的时候看到天边的晚霞特别美，粉紫色的一大片。",
  },
  {
    title: "久违的平静",
    type: "Emotion",
    tags: ["情绪", "成长", "深夜"],
    createdAt: -18,
    content: doc(
      h(2, "暴风雨后的安静"),
      p(t("经历了两周的忙碌和混乱，今天终于把项目交付了。")),
      p(t("回到家，泡了一杯茶，打开音乐，什么都不想。这种感觉就像"),
        t("暴风雨过后的海面", { bold: true }),
        t("，虽然还有余波，但已经能看到阳光。")),
      p(t("平静不是没有风浪，而是风浪过后还能回归自己。", { italic: true })),
    ),
    contentMd: "经历了两周的忙碌和混乱...",
    excerpt: "经历了两周的忙碌和混乱，今天终于把项目交付了。回到家，泡了一杯茶，什么都不想。",
  },
  {
    title: "被一首歌击中",
    type: "Emotion",
    tags: ["音乐", "情绪", "深夜"],
    createdAt: -25,
    content: doc(
      h(2, "逃跑计划 — 一万次悲伤"),
      p(t("随机播放到这首歌的时候愣住了。上一次听还是在大学寝室，也是深夜，也是一个人。")),
      p(t("歌词里唱：「"),
        t("一万次悲伤，依然会有意义", { bold: true }),
        t("」。那时候觉得是矫情，现在觉得是真理。")),
      p(t("有些歌需要时间才能听懂。", { italic: true })),
    ),
    contentMd: "随机播放到这首歌的时候愣住了...",
    excerpt: "随机播放到这首歌的时候愣住了。上一次听还是在大学寝室，也是深夜，也是一个人。",
  },
  {
    title: "社交倦怠期",
    type: "Emotion",
    tags: ["孤独", "情绪", "思考"],
    createdAt: -30,
    content: doc(
      p(t("最近不太想回微信。不是不开心，就是觉得打字聊天很累。")),
      p(t("朋友约了好几次都没去。他们应该会觉得我变得冷淡了吧。")),
      p(t("其实不是。只是需要一段"),
        t("独处的时间", { underline: true }),
        t("来给精神充电。内向的人大概都有这种周期。")),
    ),
    contentMd: "最近不太想回微信...",
    excerpt: "最近不太想回微信。不是不开心，就是觉得打字聊天很累。朋友约了好几次都没去。",
  },
  {
    title: "春天的生命力",
    type: "Emotion",
    tags: ["自然", "情绪", "日常"],
    createdAt: -90,
    content: doc(
      p(t("下班看到路边的樱花开了。整条街都是粉白色的，风一吹花瓣就飘下来。")),
      p(t("春天有一种不讲道理的生命力。明明昨天还是光秃秃的树枝，今天就冒出了嫩芽。")),
      p(t("人也应该这样吧——"),
        t("在合适的时候，毫无保留地绽放。", { bold: true })),
    ),
    contentMd: "下班看到路边的樱花开了...",
    excerpt: "下班看到路边的樱花开了。整条街都是粉白色的，风一吹花瓣就飘下来。",
  },

  // ===== 31-38: Dreams (梦境) =====
  {
    title: "飞行梦",
    type: "Dream",
    tags: ["梦境", "梦想", "深夜"],
    createdAt: -10,
    content: doc(
      h(2, "昨晚梦见自己能飞了"),
      p(t("不是超人那种飞。是像游泳一样的飞——手臂划一下，身体就浮起来一点。")),
      p(t("我飞过了一座城市。下面的建筑像微缩模型，街道上的人像蚂蚁。风很冷，但心里很平静。")),
      p(t("飞到了小时候住的地方。想降落但怎么也降不下去，然后就醒了。")),
      p(t("据说飞行梦意味着"),
        t("对自由的渴望", { italic: true }),
        t("。也许吧。")),
    ),
    contentMd: "昨晚梦见自己能飞了...",
    excerpt: "不是超人那种飞。是像游泳一样的飞——手臂划一下，身体就浮起来一点。我飞过了一座城市。",
  },
  {
    title: "回到高中教室",
    type: "Dream",
    tags: ["梦境", "回忆", "成长"],
    createdAt: -22,
    content: doc(
      h(2, "很常见的梦"),
      p(t("又做那个梦了。回到高中教室，发现马上就要考试了，但我一整个学期都没来上课。")),
      p(t("梦里那种"),
        t("恐慌", { bold: true }),
        t("太真实了——翻着完全看不懂的课本，手心全是汗。")),
      p(t("醒来之后缓了好一会儿才意识到："),
        t("我已经毕业好几年了。", { italic: true })),
    ),
    contentMd: "又做那个梦了...",
    excerpt: "又做那个梦了。回到高中教室，发现马上就要考试了，但我一整个学期都没来上课。",
  },
  {
    title: "和猫对话",
    type: "Dream",
    tags: ["梦境", "日常", "深夜"],
    createdAt: -15,
    content: doc(
      h(2, "一只会说话的橘猫"),
      p(t("梦见一只橘猫坐在我的书桌上，用人类的语言和我聊天。")),
      p(t("它说它的名字叫「"),
        t("小橘", { bold: true }),
        t("」，已经在这个街区活了九年了。它告诉我哪家店的鱼最新鲜，哪个邻居最友善。")),
      p(t("我问它：「做猫开心吗？」它说：「"),
        t("你们人类就是想太多了。", { italic: true }),
        t("」然后跳下桌子走了。")),
      p(t("醒来想了很久这句话。")),
    ),
    contentMd: "梦见一只橘猫坐在我的书桌上...",
    excerpt: "梦见一只橘猫坐在我的书桌上，用人类的语言和我聊天。它说它的名字叫「小橘」。",
  },
  {
    title: "迷雾森林",
    type: "Dream",
    tags: ["梦境", "自然", "情绪"],
    createdAt: -28,
    content: doc(
      p(t("梦里走进了一片被浓雾笼罩的森林。树干上长满了青苔，脚下的路软软的像是踩在棉花上。")),
      p(t("走了很久很久，雾突然散了，眼前出现了一片湖。湖水是"),
        t("银色的", { bold: true }),
        t("，像融化了的月光。")),
      p(t("然后我就醒了。有时候觉得梦境比现实更美。")),
    ),
    contentMd: "梦里走进了一片被浓雾笼罩的森林...",
    excerpt: "梦里走进了一片被浓雾笼罩的森林。树干上长满了青苔，脚下的路软软的像是踩在棉花上。",
  },
  {
    title: "时间倒流",
    type: "Dream",
    tags: ["梦境", "思考", "哲学"],
    createdAt: -38,
    content: doc(
      h(2, "如果能回到过去"),
      p(t("梦里的设定是：时间可以倒流，但每次倒流都会失去一段记忆作为代价。")),
      p(t("我选择回到了大学时期。代价是忘记了毕业后认识的所有人。")),
      p(t("在梦里我觉得这是值得的。但醒来之后想到那些被遗忘的朋友，突然觉得很难过。")),
      p(t("也许"),
        t("向前看才是最好的选择", { bold: true }),
        t("。")),
    ),
    contentMd: "梦里的设定是：时间可以倒流...",
    excerpt: "梦里的设定是：时间可以倒流，但每次倒流都会失去一段记忆作为代价。我选择回到了大学时期。",
  },
  {
    title: "深海图书馆",
    type: "Dream",
    tags: ["梦境", "阅读", "自然"],
    createdAt: -32,
    content: doc(
      p(t("梦见了一座在水下的图书馆。所有的书都泡在水里但不会湿。")),
      p(t("可以在书架之间游泳。每抽出一本书，书里的故事就会以全息影像的方式在水里播放。")),
      p(t("我抽出了一本关于"),
        t("星空", { bold: true }),
        t("的书，整个图书馆就变成了银河。太美了。")),
    ),
    contentMd: "梦见了一座在水下的图书馆...",
    excerpt: "梦见了一座在水下的图书馆。所有的书都泡在水里但不会湿。每抽出一本书，书里的故事就会以全息影像的方式播放。",
  },

  // ===== 39-45: Stories (故事) =====
  {
    title: "便利店的夜班姑娘",
    type: "Story",
    tags: ["故事", "深夜", "日常"],
    createdAt: -40,
    content: doc(
      h(2, "凌晨三点的 7-11"),
      p(t("她叫小林，在 7-11 值夜班。每天晚上八点到早上六点。")),
      p(t("凌晨三点是最安静的时候。她会给货架补货，擦拭咖啡机，整理收银台。偶尔进来一个醉汉，或者一个失恋买冰淇淋的女生。")),
      p(t("小林在准备"),
        t("考研", { bold: true }),
        t("。收银台下藏着一本《政治经济学》。没有顾客的时候，她就拿出来看两页。")),
      bq(p(t("「我觉得夜晚是我的朋友。」她说。「它给了我足够的时间去追赶那个想要的生活。」"))),
    ),
    contentMd: "她叫小林，在 7-11 值夜班...",
    excerpt: "她叫小林，在 7-11 值夜班。每天晚上八点到早上六点。凌晨三点是最安静的时候。",
  },
  {
    title: "一个关于告别的小故事",
    type: "Story",
    tags: ["故事", "成长", "回忆"],
    createdAt: -70,
    content: doc(
      h(2, "站台上的五分钟"),
      p(t("火车还有五分钟开。")),
      p(t("他和父亲站在站台上，谁也没说话。父亲递过来一袋橘子——就像朱自清《背影》里写的。")),
      p(t("「到了打个电话。」父亲说。")),
      p(t("「嗯。」")),
      p(t("火车开动之后，他看见父亲还站在原处。那个身影越来越小，最后变成了一个黑点。")),
      p(t("他剥开一个橘子，很甜。然后"),
        t("眼泪就下来了。", { italic: true })),
    ),
    contentMd: "火车还有五分钟开...",
    excerpt: "火车还有五分钟开。他和父亲站在站台上，谁也没说话。父亲递过来一袋橘子——就像朱自清《背影》里写的。",
  },
  {
    title: "菜市场里的哲学家",
    type: "Story",
    tags: ["故事", "日常", "哲学"],
    createdAt: -65,
    content: doc(
      h(2, "卖豆腐的老周"),
      p(t("老周在菜市场卖了二十年豆腐。每天早上四点半起来磨豆子，六点出摊，中午收摊。")),
      p(t("有一次我问他：「老周，你觉得人生的意义是什么？」")),
      p(t("他一边切豆腐一边说：「"),
        t("把豆腐做好就行了。", { bold: true }),
        t("你问那么多干嘛？」")),
      p(t("我愣了一下，然后觉得这可能是最接近真理的回答。")),
    ),
    contentMd: "老周在菜市场卖了二十年豆腐...",
    excerpt: "老周在菜市场卖了二十年豆腐。他一边切豆腐一边说：「把豆腐做好就行了。你问那么多干嘛？」",
  },
  {
    title: "那年夏天的台风",
    type: "Story",
    tags: ["故事", "夏天", "回忆"],
    createdAt: -100,
    content: doc(
      p(t("2018 年夏天，台风过境。整个城市断电了整整三天。")),
      p(t("没有手机、没有空调、没有灯。晚上大家搬了椅子坐在小区楼下乘凉。有人弹吉他，有人讲鬼故事，小孩追着萤火虫跑。")),
      p(t("那三天是我记忆里"),
        t("最接近理想生活", { bold: true }),
        t("的时光。台风过后，所有人又回到了空调房里盯着屏幕，再也没在楼下见过彼此。")),
    ),
    contentMd: "2018 年夏天，台风过境...",
    excerpt: "2018 年夏天，台风过境。整个城市断电了整整三天。那三天是我记忆里最接近理想生活的时光。",
  },
  {
    title: "地铁上的陌生人",
    type: "Story",
    tags: ["故事", "日常", "思考"],
    createdAt: -58,
    content: doc(
      h(2, "每天遇见，从不说话"),
      p(t("每天早上八点十五分，同一节车厢，同一个位置。")),
      p(t("她总是在看 Kindle，他总是在听耳机。她穿灰色的大衣，他背黑色的双肩包。他们在同一站下车，走向不同的办公楼。")),
      p(t("这种状态持续了"),
        t("整整一年", { bold: true }),
        t("。他们从未说过话，但有一天她没有出现的时候，他觉得车厢空了很多。")),
      p(t("城市里的人际关系，有时候就是这样微妙。")),
    ),
    contentMd: "每天早上八点十五分，同一节车厢，同一个位置...",
    excerpt: "每天早上八点十五分，同一节车厢，同一个位置。她总是在看 Kindle，他总是在听耳机。",
  },
  {
    title: "爷爷的收音机",
    type: "Story",
    tags: ["故事", "回忆", "过去"],
    createdAt: -110,
    content: doc(
      h(2, "一台德生牌收音机"),
      p(t("爷爷有一台用了三十多年的德生牌收音机。外壳的漆磨掉了，天线也弯了，但收台还是很清楚。")),
      p(t("每天早上六点，他会准时打开收音机听新闻。那个声音——"),
        t("「中央人民广播电台」", { italic: true }),
        t("——伴随着我从童年到大学。")),
      p(t("爷爷走后，收音机放在书架上落了灰。前几天我买了电池装上，居然还能响。那一刻，仿佛爷爷还在客厅里。")),
    ),
    contentMd: "爷爷有一台用了三十多年的德生牌收音机...",
    excerpt: "爷爷有一台用了三十多年的德生牌收音机。外壳的漆磨掉了，天线也弯了，但收台还是很清楚。",
  },
  {
    title: "流浪猫的日常",
    type: "Story",
    tags: ["故事", "日常", "自然"],
    createdAt: -75,
    content: doc(
      p(t("小区里有三只流浪猫。一只橘的，一只黑白的，一只花斑的。")),
      p(t("每天早上出门的时候，橘猫会蹲在单元门口等我。不是等我——"),
        t("是等我带吃的", { italic: true }),
        t("。我已经连续喂了它一个月。")),
      p(t("黑白的很怕人，永远在远处观察。花斑的是个社交高手，谁都能摸。")),
      p(t("有时候觉得，人跟猫也挺像的。有怕生的，有自来熟的，有专门等一个人投喂的。")),
    ),
    contentMd: "小区里有三只流浪猫...",
    excerpt: "小区里有三只流浪猫。一只橘的，一只黑白的，一只花斑的。有时候觉得，人跟猫也挺像的。",
  },

  // ===== 46-50: Learning (学习) =====
  {
    title: "Rust 语言学习笔记",
    type: "Learning",
    tags: ["学习", "科技", "思考"],
    createdAt: -20,
    content: doc(
      h(2, "所有权（Ownership）系统"),
      p(t("Rust 最核心的概念是所有权。简单来说：")),
      ol(
        "每个值都有一个所有者（owner）",
        "同一时间只能有一个所有者",
        "当所有者离开作用域，值被自动释放"
      ),
      p(t("这个设计解决了 C/C++ 中两个最大的痛点："),
        t("内存泄漏和悬垂指针。", { bold: true })),
      code("rust", "fn main() {\n    let s1 = String::from(\"hello\");\n    let s2 = s1; // s1 的所有权移动到了 s2\n    // println!(\"{s1}\"); // 编译错误！s1 已经被 move\n    println!(\"{s2}\"); // OK\n}"),
      p(t("理解了所有权，就理解了 Rust 的一半。")),
    ),
    contentMd: "Rust 最核心的概念是所有权...",
    excerpt: "Rust 最核心的概念是所有权。简单来说：每个值都有一个所有者，同一时间只能有一个所有者...",
  },
  {
    title: "CSS Grid 布局备忘",
    type: "Learning",
    tags: ["学习", "设计", "科技"],
    createdAt: -14,
    content: doc(
      h(2, "Grid vs Flexbox"),
      p(t("简单区分：")),
      ul(
        "Flexbox：一维布局（要么横着排，要么竖着排）",
        "Grid：二维布局（同时控制行和列）"
      ),
      p(t("经典 Grid 写法：")),
      code("css", ".container {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 16px;\n}\n\n.item {\n  grid-column: span 2;\n}"),
      p(t("如果布局是"),
        t("卡片式、仪表盘、或者整体页面结构", { bold: true }),
        t("，优先用 Grid。如果是导航栏、列表项，用 Flexbox。")),
    ),
    contentMd: "CSS Grid 布局备忘...",
    excerpt: "简单区分：Flexbox 是一维布局（要么横着排，要么竖着排），Grid 是二维布局（同时控制行和列）。",
  },
  {
    title: "咖啡入门：从速溶到手冲",
    type: "Learning",
    tags: ["学习", "咖啡", "美食"],
    createdAt: -27,
    content: doc(
      h(2, "手冲咖啡的基本工具"),
      p(t("入门手冲咖啡不需要花很多钱。核心装备：")),
      taskList(
        { text: "V60 滤杯 + 滤纸（约 30 元）", checked: true },
        { text: "手冲壶（细嘴，约 80 元）", checked: true },
        { text: "磨豆机（手摇即可，约 150 元）", checked: true },
        { text: "厨房电子秤（必须有计时功能）", checked: false },
      ),
      h(3, "基本参数"),
      ul(
        "粉水比：1:15（15g 粉 → 225ml 水）",
        "水温：88-92°C（深烘低，浅烘高）",
        "研磨度：白砂糖粗细",
        "萃取时间：2-3 分钟"
      ),
      p(t("最重要的建议："),
        t("现磨现冲", { bold: true }),
        t("。豆子磨好后 15 分钟内用完，否则香气跑掉大半。")),
    ),
    contentMd: "咖啡入门：从速溶到手冲...",
    excerpt: "入门手冲咖啡不需要花很多钱。核心装备：V60 滤杯、手冲壶、磨豆机、厨房电子秤。",
  },
  {
    title: "摄影的曝光三角",
    type: "Learning",
    tags: ["学习", "摄影", "设计"],
    createdAt: -33,
    content: doc(
      h(2, "光圈 · 快门 · ISO"),
      p(t("曝光三角是摄影的基础。三者相互制衡：")),
      ul(
        "光圈（F 值）— 控制进光量和景深。F 越小，光圈越大，背景越虚化",
        "快门速度 — 控制曝光时间。越快越能凝固动作，越慢越容易模糊",
        "ISO — 传感器灵敏度。越高画质越噪"
      ),
      p(t("一句话口诀："),
        t("光圈控虚化，快门控运动，ISO 控噪点。", { bold: true })),
      p(t("建议练习方法：用手动模式拍同一个场景，每次只调整一个参数，观察画面的变化。")),
    ),
    contentMd: "摄影的曝光三角...",
    excerpt: "曝光三角是摄影的基础。三者相互制衡：光圈（F值）控制进光量和景深，快门速度控制曝光时间，ISO控制传感器灵敏度。",
  },
  {
    title: "时间管理的番茄工作法改造",
    type: "Learning",
    tags: ["学习", "工作", "思考"],
    createdAt: -9,
    content: doc(
      h(2, "为什么标准番茄钟不适合我"),
      p(t("传统的 25+5 番茄钟对我来说太碎片化了。25 分钟刚进入状态就被打断。")),
      p(t("我改进后的版本：")),
      ol(
        "90 分钟深度工作（关闭所有通知）",
        "20 分钟彻底休息（走动、喝水、看窗外）",
        "重复 3 轮后，休息 1 小时",
        "每天最多 3 个深度时段"
      ),
      bq(p(t("「效率不是做了多少事，而是做了多少重要的事。」"))),
      p(t("一周下来的效果：产出增加了约"),
        t("30%", { bold: true }),
        t("，而且没有那么疲惫。关键是 90 分钟的时间段让人可以真正沉浸。")),
    ),
    contentMd: "时间管理的番茄工作法改造...",
    excerpt: "传统的 25+5 番茄钟对我来说太碎片化了。我改进后的版本：90 分钟深度工作，20 分钟彻底休息。",
  },
];

// ── Helpers ──────────────────────────────────────────

const rand = (max) => Math.floor(Math.random() * max);
const pick = (arr) => arr[rand(arr.length)];

function randomDate(daysBackMin, daysBackMax) {
  const d = new Date();
  const days = daysBackMin + rand(daysBackMax - daysBackMin);
  d.setDate(d.getDate() - days);
  d.setHours(7 + rand(16), rand(60), rand(60), 0);
  return d;
}

function makeSlug(date) {
  const slugDate = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).slice(2, 8);
  return `${slugDate}-${random}`;
}

// ── Main ─────────────────────────────────────────────

async function main() {
  console.log("🌱 开始生成 50 条丰富测试笔记...\n");

  // Clean existing data
  await prisma.entryTag.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.tag.deleteMany();
  console.log("  ✓ 已清理旧数据");

  // Create tags
  const tagMap = {};
  for (const name of TAG_POOL) {
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-一-鿿]/g, "") || `tag-${Date.now()}`;
    const tag = await prisma.tag.create({ data: { name, slug } });
    tagMap[name] = tag;
  }
  console.log(`  ✓ 已创建 ${TAG_POOL.length} 个标签`);

  // Track stats
  const typeCounts = {};
  for (const t of TYPES) typeCounts[t] = 0;
  let minDate = new Date();
  let maxDate = new Date(0);

  for (let i = 0; i < NOTES.length; i++) {
    const note = NOTES[i];
    const type = note.type;
    typeCounts[type]++;

    const createdAt = note.createdAt
      ? randomDate(Math.abs(note.createdAt), Math.abs(note.createdAt) + 5)
      : randomDate(1, 180);
    const updatedAt = new Date(createdAt.getTime() + rand(86400000 * 5));

    if (createdAt < minDate) minDate = createdAt;
    if (createdAt > maxDate) maxDate = createdAt;

    const slug = makeSlug(createdAt);
    const tagNames = note.tags || [];
    const tagConnections = tagNames
      .filter((n) => tagMap[n])
      .map((name) => ({ tag: { connect: { id: tagMap[name].id } } }));

    await prisma.entry.create({
      data: {
        title: note.title,
        slug,
        type,
        content: note.content,
        contentMd: note.contentMd || note.excerpt || note.title,
        excerpt: (note.excerpt || note.title).slice(0, 200),
        createdAt,
        updatedAt,
        tags: { create: tagConnections },
      },
    });

    const typeLabel = TYPE_LABELS[type] || type;
    const emoji = { Memory: "💭", Thought: "💡", Emotion: "💗", Dream: "🌙", Story: "📖", Learning: "📚" }[type];
    process.stdout.write(`  ${emoji} [${String(i + 1).padStart(2)}] ${typeLabel.padEnd(3)} ${note.title.slice(0, 30)}${note.title.length > 30 ? "…" : ""}  ${createdAt.toISOString().slice(0, 10)}\n`);
  }

  // ── Summary ──────────────────────────────────────────

  console.log(`\n${"═".repeat(50)}`);
  console.log(`  总计:           ${NOTES.length} 条笔记`);
  console.log(`  标签数:         ${TAG_POOL.length} 个`);
  console.log(`  时间范围:       ${minDate.toISOString().slice(0, 10)} ~ ${maxDate.toISOString().slice(0, 10)}`);
  console.log(`\n  类型分布:`);
  for (const t of TYPES) {
    const bar = "█".repeat(typeCounts[t]);
    const label = TYPE_LABELS[t].padEnd(3);
    console.log(`    ${label} ${String(typeCounts[t]).padStart(2)}  ${bar}`);
  }
  console.log(`\n✨ 数据花园已就绪！`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Seed failed:", e);
  prisma.$disconnect();
  process.exit(1);
});
