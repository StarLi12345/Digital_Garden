// ============================================================
// Digital Garden — Animation Variants
// ============================================================
// 集中管理所有 Framer Motion 动画配置。
// 禁止在页面组件中散落动画参数。
//
// 原则：
//   温柔 · 不打扰 · 轻量
//   如果用户注意到动画本身，说明动画已经过度了。
// ============================================================

import type { Variants, Transition } from "framer-motion";

// ── Shared timing presets ────────────────────────────

/** 快速反馈：150ms — 按钮 Hover、图标切换 */
export const FAST: Transition = { duration: 0.15, ease: "easeOut" };

/** 标准过渡：200ms — 卡片 Hover、输入框 Focus */
export const NORMAL: Transition = { duration: 0.2, ease: "easeOut" };

/** 页面切换：250ms — 路由切换淡入 */
export const PAGE: Transition = { duration: 0.25, ease: "easeOut" };

// ── Page ──────────────────────────────────────────────

/** 页面路由切换动画 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 4,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: PAGE,
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

// ── Card ──────────────────────────────────────────────

/** 卡片 Hover 动画 */
export const cardVariants: Variants = {
  rest: {
    y: 0,
    boxShadow: "var(--shadow-card)",
    transition: NORMAL,
  },
  hover: {
    y: -2,
    boxShadow: "var(--shadow-card-hover)",
    transition: FAST,
  },
};

// ── Modal (reserved for future use) ─────────────────────

/** Modal 弹出动画 — Phase 3+ 使用 */
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

/** Modal 背板动画 */
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: NORMAL },
  exit: { opacity: 0, transition: FAST },
};

// ── Toast (reserved for future use) ─────────────────────

/** Toast 通知动画 — Phase 1+ 使用（保存成功/失败提示） */
export const toastVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.97,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

// ── Accordion (reserved for future use) ────────────────

/** 折叠面板动画 — Phase 3+ 使用（设置页、标签管理） */
export const accordionVariants: Variants = {
  hidden: {
    height: 0,
    opacity: 0,
  },
  visible: {
    height: "auto",
    opacity: 1,
    transition: { height: { duration: 0.25, ease: "easeOut" }, opacity: { duration: 0.2 } },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { height: { duration: 0.2, ease: "easeIn" }, opacity: { duration: 0.1 } },
  },
};

// ── List Item (reserved for future use) ──────────────

/** 列表项交错入场 — Phase 1+ 使用（Entry 列表加载） */
export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.04,
      duration: 0.2,
      ease: "easeOut",
    },
  }),
};
