"use client";

// ============================================================
// Digital Garden — Theme Runtime Provider
// ============================================================
// 统一运行时：时间驱动 + 天气驱动 → CSS变量覆盖。
// 每 15 分钟自动重算。
// ============================================================

import { useEffect } from "react";
import { computeOverrides, applyOverrides } from "@/lib/theme-runtime";

export function ThemeRuntimeProvider() {
  useEffect(() => {
    const tick = () => {
      const ov = computeOverrides();
      applyOverrides(ov);
    };

    tick();
    const interval = setInterval(tick, 15 * 60 * 1000);
    window.addEventListener("storage", tick);
    return () => { clearInterval(interval); window.removeEventListener("storage", tick); };
  }, []);

  // Tint overlay div
  return <div className="runtime-tint" aria-hidden="true" />;
}
