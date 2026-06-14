"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { pageVariants } from "@/lib/animations";

/**
 * PageTransition — 路由切换动画包装器
 *
 * 包裹 Layout 的 children，在路由切换时提供淡入淡出动画。
 * 使用 pathname 作为 AnimatePresence 的 key，确保路由变化时触发动画。
 *
 * mode="wait"：等待当前页面退出动画完成后，再播放新页面进入动画。
 *             总耗时 ≈ exit(150ms) + initial→animate(250ms) = ~400ms。
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
