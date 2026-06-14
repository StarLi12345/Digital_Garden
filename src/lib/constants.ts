// ============================================================
// Digital Garden — 常量定义
// ============================================================

/** Entry 类型有效值 */
export const ENTRY_TYPES = [
  "Memory",
  "Thought",
  "Emotion",
  "Dream",
  "Story",
  "Learning",
] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];

/** Entry 类型中文标签（唯一来源，全项目引用此映射） */
export const TYPE_LABELS: Record<string, string> = {
  Memory: "回忆",
  Thought: "想法",
  Emotion: "情绪",
  Dream: "梦境",
  Story: "故事",
  Learning: "学习",
};

/** excerpt 最大长度（字符） */
export const EXCERPT_MAX_LENGTH = 200;

/** 列表默认每页条数 */
export const DEFAULT_PAGE_SIZE = 20;
