"use client";

// ============================================================
// Digital Garden 2.0 — Editor Font Size Control
// ============================================================
// 编辑器正文字号：小/中/大 预设 + 自定义滑块
// H1-H5 使用 em 单位，自动等比缩放
// ============================================================

import { useState, useEffect } from "react";

const PRESETS = [
  { label: "小", size: 12 },
  { label: "中", size: 14 },
  { label: "大", size: 18 },
] as const;

const MIN = 10;
const MAX = 28;

function getStored(): number {
  try {
    const v = Number(localStorage.getItem("garden-editor-font-size"));
    return v >= MIN && v <= MAX ? v : 14;
  } catch {
    return 14;
  }
}

function applyFontSize(size: number) {
  document.documentElement.style.setProperty("--editor-font-size", size + "px");
}

export function EditorFontSize() {
  const [size, setSize] = useState(14);
  const [showSlider, setShowSlider] = useState(false);

  useEffect(() => {
    const stored = getStored();
    setSize(stored);
    applyFontSize(stored);
  }, []);

  const set = (s: number) => {
    setSize(s);
    applyFontSize(s);
    try { localStorage.setItem("garden-editor-font-size", String(s)); } catch {}
  };

  const isPreset = PRESETS.some((p) => p.size === size);

  return (
    <div className="inline-flex items-center gap-1">
      <span className="text-[0.625rem] text-muted-foreground/50 mr-1">Aa</span>
      {PRESETS.map((p) => (
        <button
          key={p.size}
          onClick={() => { set(p.size); setShowSlider(false); }}
          className={`rounded-full px-2.5 py-0.5 text-[0.688rem] interactive ${
            size === p.size
              ? "bg-primary/15 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          {p.label}
        </button>
      ))}
      <button
        onClick={() => setShowSlider(!showSlider)}
        className={`rounded-full px-2.5 py-0.5 text-[0.688rem] interactive ${
          !isPreset
            ? "bg-primary/15 text-primary font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        自定义
      </button>
      {showSlider && (
        <div className="flex items-center gap-1.5 ml-1">
          <input
            type="range"
            min={MIN}
            max={MAX}
            value={size}
            onChange={(e) => set(Number(e.target.value))}
            className="w-20"
            style={{ accentColor: "var(--color-primary)" }}
          />
          <span className="text-[0.625rem] text-muted-foreground w-8 tabular-nums">
            {size}px
          </span>
        </div>
      )}
    </div>
  );
}
