// ============================================================
// Digital Garden — Callout Extension（花园便签）
// ============================================================
// 自定义 TipTap Node：独立于 Blockquote 的内容块。
//
// 与 Blockquote 的区别：
//   Blockquote = "引用别人说的话"（斜体 · muted · border）
//   Callout    = "留给自己的便签"  （正体 · foreground · accent 边线 + 暖色背景）
//
// generateHTML 安全：
//   renderHTML() 输出 <div class="callout">，generateHTML 原样生成。
//   阅读态通过 .prose .callout CSS 渲染一致样式。
// ============================================================

import { Node, mergeAttributes } from "@tiptap/core";

export const Callout = Node.create({
  name: "callout",

  group: "block",

  content: "block+",

  defining: true,

  parseHTML() {
    return [{ tag: 'div[class~="callout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes({ class: "callout" }, HTMLAttributes),
      0,
    ];
  },
});
