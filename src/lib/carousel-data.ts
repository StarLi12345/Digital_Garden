// ============================================================
// Digital Garden — Carousel Slide Pool（轮播图池）
// ============================================================
// 20 张图片，每次随机抽取展示。
// 云端部署时大图片走 CDN（Phase 2）。
// 标题与描述贴合「数字花园」主题。
// ============================================================

import { resolveAssetUrl } from "./cdn";

export interface CarouselSlide {
  image?: string;
  title: string;
  description: string;
  tag: string;
}

/** Resolve carousel image URLs through CDN at module init time */
function cdn(path: string): string {
  return resolveAssetUrl(path);
}

const SLIDE_POOL: CarouselSlide[] = [
  { title: "数字花园", description: "每一行代码都是一粒种子，在这个数字花园中悄然生长、开花、结果", tag: "🌱 序章" },
  { title: "灵感之森", description: "穿过林间小径，在斑驳光影中寻找那些被遗忘的思绪与灵感", tag: "🌲 探索", image: cdn("/carousel/p01.webp") },
  { title: "星河书卷", description: "翻开夜的扉页，群星如文字洒满苍穹，等待被阅读与铭记", tag: "📖 记录", image: cdn("/carousel/p16.webp") },
  { title: "静谧时光", description: "时间在这一刻慢下来，让思绪沉淀，让心灵在宁静中自由呼吸", tag: "🍃 沉淀", image: cdn("/carousel/p06.webp") },
  { title: "远方来信", description: "来自世界另一端的问候，每一封信都是一段未曾讲述的故事", tag: "✉ 连接", image: cdn("/carousel/p05.webp") },
  { title: "晨光序曲", description: "第一缕光刺破夜幕，万物苏醒，新的篇章在微风中缓缓展开", tag: "🌅 新生", image: cdn("/carousel/p02.webp") },
  { title: "夜色漫游", description: "在星光的指引下漫步，黑夜不是终点，而是另一种开始", tag: "🌙 漫游", image: cdn("/carousel/p20.webp") },
  { title: "记忆温室", description: "珍贵的记忆如花朵般在此珍藏，每一次回望都是一次温暖的相遇", tag: "🏡 归处", image: cdn("/carousel/p04.webp") },
  { title: "云端之上", description: "穿越云层，在更高处俯瞰生活的全貌，一切喧嚣都变得渺小", tag: "☁️ 远眺", image: cdn("/carousel/p10.webp") },
  { title: "春日来信", description: "春天寄来一封绿色的信，写满了关于希望和重生的诗篇", tag: "💌 春信", image: cdn("/carousel/p11.webp") },
  { title: "星海拾贝", description: "在浩瀚的信息海洋中，拾取那些闪亮的知识碎片，串成属于自己的项链", tag: "🐚 拾取", image: cdn("/carousel/p18.webp") },
  { title: "黄昏小径", description: "夕阳拉长了影子，回家的路上总有一些温柔值得被记录", tag: "🌇 归途", image: cdn("/carousel/p19.webp") },
  { title: "雨后初晴", description: "雨停了，阳光穿透云层，空气中弥漫着泥土和青草的清香", tag: "🌈 放晴", image: cdn("/carousel/p17.webp") },
  { title: "夜读时光", description: "一盏灯、一本书、一杯茶，夜晚是属于思考者的花园", tag: "🕯 夜读", image: cdn("/carousel/p15.webp") },
  { title: "林间晨曦", description: "穿过树梢的第一道光，为整片森林镀上金色的希望", tag: "🌄 晨曦", image: cdn("/carousel/p09.webp") },
  { title: "纸上花园", description: "笔尖勾勒出的世界同样绚烂，想象力是最好的园丁", tag: "✍️ 创作", image: cdn("/carousel/p13.webp") },
  { title: "窗边小景", description: "窗外的世界每天都在变化，用心观察，平凡处也有风景", tag: "🪟 观望", image: cdn("/carousel/p12.webp") },
  { title: "月下独白", description: "夜深了，对着月亮说说那些白天来不及整理的思绪", tag: "🌛 独白", image: cdn("/carousel/p07.webp") },
  { title: "花间一瞬", description: "最美的时刻总是稍纵即逝，所以才更值得被铭刻", tag: "📸 定格", image: cdn("/carousel/p14.webp") },
  { title: "远山呼唤", description: "山的那边是什么？好奇心永远是探索者最好的指南针", tag: "⛰ 远方", image: cdn("/carousel/p08.webp") },
  { title: "微光角落", description: "即使是最不起眼的角落，也有属于自己的光", tag: "🕯 微光", image: cdn("/carousel/p03.webp") },
];

/** Fisher-Yates shuffle, returns a new array */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick N random slides from the pool (no duplicates) */
export function pickRandomSlides(count: number): CarouselSlide[] {
  // Always include "数字花园" as first slide
  const intro = SLIDE_POOL[0];
  const rest = SLIDE_POOL.slice(1);
  const shuffled = shuffle(rest);
  // Take count-1 from shuffled, then shuffle position of intro into the mix
  const picked = [intro, ...shuffled.slice(0, count - 1)];
  // Move intro to a random position (but never last)
  const introIdx = Math.floor(Math.random() * (count - 1));
  const result = picked.filter((_, i) => i !== 0); // remove intro from front
  result.splice(introIdx, 0, intro);
  return result;
}
