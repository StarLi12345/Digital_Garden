"use client";

// ============================================================
// Digital Garden — Footer Random Quote (Hitokoto + 本地库)
// ============================================================
// 每次刷新随机获取，覆盖动画/文学/诗词/电影/哲学/网络等领域
// 优先联网获取 Hitokoto API，失败回退本地 50+ 条精选名言
// ============================================================

import { useState, useEffect } from "react";

interface Quote {
  text: string;
  author: string;
  source: string;
}

const FALLBACK_QUOTES: Quote[] = [
  // ── 花园 / 自然 ──────────────────────────
  { text: "草木有本心，何求美人折。", author: "张九龄", source: "《感遇十二首》" },
  { text: "一花一世界，一叶一菩提。", author: "佛经", source: "《华严经》" },
  { text: "心中若有桃花源，何处不是水云间。", author: "佚名", source: "禅语" },
  { text: "种一棵树最好的时间是十年前，其次是现在。", author: "非洲谚语", source: "谚语" },
  { text: "花园里没有杂草，只有尚未被发现用处的植物。", author: "爱默生", source: "西方哲理" },

  // ── 二次元 / 番剧 ──────────────────────
  { text: "什么都无法舍弃的人，什么都无法改变。", author: "阿尔敏", source: "《进击的巨人》" },
  { text: "正因为我们看不见，所以才需要去相信。", author: "冈部伦太郎", source: "《命运石之门》" },
  { text: "人的梦想是永远不会结束的！", author: "马歇尔·D·蒂奇", source: "《海贼王》" },
  { text: "我们所度过的每个平凡的日常，也许就是连续发生的奇迹。", author: "相生祐子", source: "《日常》" },
  { text: "与其想着怎样华丽地死去，不如想想怎样华丽地活下去。", author: "坂田银时", source: "《银魂》" },
  { text: "错的不是我，是这个世界。", author: "金木研", source: "《东京喰种》" },
  { text: "我从来都没有想过放弃，因为一旦放弃了，就什么都没有了。", author: "漩涡鸣人", source: "《火影忍者》" },

  // ── 中国古今 ────────────────────────────
  { text: "人生如逆旅，我亦是行人。", author: "苏轼", source: "《临江仙》" },
  { text: "长风破浪会有时，直挂云帆济沧海。", author: "李白", source: "《行路难》" },
  { text: "会当凌绝顶，一览众山小。", author: "杜甫", source: "《望岳》" },
  { text: "山重水复疑无路，柳暗花明又一村。", author: "陆游", source: "《游山西村》" },
  { text: "不畏浮云遮望眼，自缘身在最高层。", author: "王安石", source: "《登飞来峰》" },
  { text: "此心安处是吾乡。", author: "苏轼", source: "《定风波》" },
  { text: "满目山河空念远，落花风雨更伤春。", author: "晏殊", source: "《浣溪沙》" },
  { text: "天行健，君子以自强不息。", author: "周文王", source: "《周易》" },
  { text: "路漫漫其修远兮，吾将上下而求索。", author: "屈原", source: "《离骚》" },
  { text: "纸上得来终觉浅，绝知此事要躬行。", author: "陆游", source: "《冬夜读书示子聿》" },

  // ── 外国名著 ────────────────────────────
  { text: "世界上只有一种真正的英雄主义，那就是在认清生活的真相后依然热爱生活。", author: "罗曼·罗兰", source: "《米开朗基罗传》" },
  { text: "凡是过往，皆为序章。", author: "莎士比亚", source: "《暴风雨》" },
  { text: "一个人可以被毁灭，但不能被打败。", author: "海明威", source: "《老人与海》" },
  { text: "幸福的家庭都是相似的，不幸的家庭各有各的不幸。", author: "列夫·托尔斯泰", source: "《安娜·卡列尼娜》" },
  { text: "生命中真正重要的不是你遭遇了什么，而是你记住了什么。", author: "马尔克斯", source: "《百年孤独》" },
  { text: "满地都是六便士，他却抬头看见了月亮。", author: "毛姆", source: "《月亮与六便士》" },

  // ── 电影 / 电视 ────────────────────────
  { text: "人生就像一盒巧克力，你永远不知道下一颗是什么味道。", author: "阿甘", source: "《阿甘正传》" },
  { text: "希望是美好的，也许是世间最美好的东西，而美好的事物永不消逝。", author: "安迪", source: "《肖申克的救赎》" },
  { text: "决定我们成为什么样的人的，不是我们的能力，而是我们的选择。", author: "邓布利多", source: "《哈利·波特》" },
  { text: "恐惧是思想的杀手。", author: "保罗", source: "《沙丘》" },
  { text: "愿你被很多人爱，如果没有，愿你在寂寞中学会宽容。", author: "刘瑜", source: "《愿你慢慢长大》" },

  // ── 古圣哲理 ──────────────────────────
  { text: "上善若水，水善利万物而不争。", author: "老子", source: "《道德经》" },
  { text: "知人者智，自知者明。", author: "老子", source: "《道德经》" },
  { text: "己所不欲，勿施于人。", author: "孔子", source: "《论语》" },
  { text: "博学之，审问之，慎思之，明辨之，笃行之。", author: "子思", source: "《中庸》" },
  { text: "吾生也有涯，而知也无涯。", author: "庄子", source: "《庄子·养生主》" },
  { text: "非淡泊无以明志，非宁静无以致远。", author: "诸葛亮", source: "《诫子书》" },
  { text: "海纳百川，有容乃大。", author: "林则徐", source: "对联" },

  // ── 网络 / 现代 ────────────────────────
  { text: "愿你出走半生，归来仍是少年。", author: "佚名", source: "网络" },
  { text: "世上只有一种稳赚不赔的投资，那就是学习。", author: "佚名", source: "网络" },
  { text: "所谓门槛，能力够了就是门，能力不够就是槛。", author: "佚名", source: "网络" },
  { text: "你的问题在于书读得太少，而想得太多。", author: "杨绛", source: "语录" },
  { text: "生活不止眼前的苟且，还有诗和远方的田野。", author: "高晓松", source: "歌词" },
];

function getRandomQuote(): Quote {
  const idx = Math.floor(Math.random() * FALLBACK_QUOTES.length);
  return FALLBACK_QUOTES[idx];
}

async function fetchHitokoto(): Promise<Quote> {
  const categories = ["a", "b", "d", "e", "f", "g", "h", "i", "k"];
  const c = categories[Math.floor(Math.random() * categories.length)];
  const res = await fetch(`https://v1.hitokoto.cn/?c=${c}&encode=json`);
  if (!res.ok) throw new Error("API failed");
  const data = await res.json();
  return {
    text: data.hitokoto || "",
    author: data.from_who || data.creator || "佚名",
    source: data.from || "一言",
  };
}

export function FooterQuote() {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHitokoto()
      .then((q) => { if (!cancelled) setQuote(q); })
      .catch(() => { if (!cancelled) setQuote(getRandomQuote()); });
    return () => { cancelled = true; };
  }, []);

  if (!quote) {
    return <div className="text-center h-10" />;
  }

  return (
    <div className="text-center">
      <p className="footer-quote italic">「{quote.text}」</p>
      <p className="text-[0.625rem] text-muted-foreground/50 mt-1">
        —— {quote.author}{quote.source ? ` · ${quote.source}` : ""}
      </p>
    </div>
  );
}
