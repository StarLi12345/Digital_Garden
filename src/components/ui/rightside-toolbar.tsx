"use client";

// ============================================================
// Digital Garden 2.0 — Rightside Toolbar（借鉴 paimom.cn）
// ============================================================
// 固定在右侧的工具栏：回到顶部（含滚动百分比）、字号加减、
// 深色/浅色切换、简繁转换
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "./theme-provider";

export function RightsideToolbar() {
  const { theme, setTheme } = useTheme();
  const [scrollPercent, setScrollPercent] = useState(0);
  const [showGoUp, setShowGoUp] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const st = h.scrollTop || document.body.scrollTop;
      const sh = h.scrollHeight || document.body.scrollHeight;
      const ch = h.clientHeight;
      const pct = sh > ch ? Math.round((st / (sh - ch)) * 100) : 0;
      setScrollPercent(pct);
      setShowGoUp(st > 200);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = useCallback((pos: number) => {
    window.scrollTo({ top: pos, behavior: "smooth" });
  }, []);

  const changeFontSize = useCallback((delta: number) => {
    const html = document.documentElement;
    const current = parseFloat(getComputedStyle(html).fontSize);
    const next = Math.max(12, Math.min(24, Math.round(current + delta)));
    html.style.fontSize = next + "px";
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="fixed right-2 bottom-20 z-40 flex flex-col items-center gap-2 print:hidden">
      {/* Config buttons */}
      {configOpen && (
        <div className="flex flex-col items-center gap-2 animate-toast-in">
          <button
            onClick={() => changeFontSize(1)}
            title="放大字体"
            className="w-8 h-8 rounded-full bg-card/90 backdrop-blur border border-border shadow-sm flex items-center justify-center text-xs text-muted-foreground hover:text-foreground hover:bg-card interactive transition-all"
          >
            <span className="text-sm font-bold">+</span>
          </button>
          <button
            onClick={() => changeFontSize(-1)}
            title="缩小字体"
            className="w-8 h-8 rounded-full bg-card/90 backdrop-blur border border-border shadow-sm flex items-center justify-center text-xs text-muted-foreground hover:text-foreground hover:bg-card interactive transition-all"
          >
            <span className="text-sm font-bold">−</span>
          </button>
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "切换浅色模式" : "切换深色模式"}
            className="w-8 h-8 rounded-full bg-card/90 backdrop-blur border border-border shadow-sm flex items-center justify-center text-xs text-muted-foreground hover:text-foreground hover:bg-card interactive transition-all"
          >
            <span className="text-sm">{theme === "dark" ? "☀️" : "🌙"}</span>
          </button>
        </div>
      )}

      {/* Config toggle */}
      <button
        onClick={() => setConfigOpen(!configOpen)}
        title="设置"
        className={`w-8 h-8 rounded-full border shadow-sm flex items-center justify-center text-xs interactive transition-all ${
          configOpen
            ? "bg-primary/15 text-primary border-primary/30"
            : "bg-card/90 backdrop-blur border-border text-muted-foreground hover:text-foreground hover:bg-card"
        }`}
      >
        <span className={`text-sm ${configOpen ? "animate-spin" : ""}`}>⚙</span>
      </button>

      {/* Back to top with scroll % */}
      {showGoUp && (
        <button
          onClick={() => scrollTo(0)}
          title={`回到顶部 (${scrollPercent}%)`}
          className="w-8 h-8 rounded-full bg-card/90 backdrop-blur border border-border shadow-sm flex items-center justify-center text-xs text-muted-foreground hover:text-foreground hover:bg-card interactive transition-all relative group"
        >
          <span className="text-[0.625rem] font-medium tabular-nums absolute -top-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {scrollPercent}%
          </span>
          <span className="text-sm">↑</span>
        </button>
      )}
    </div>
  );
}
