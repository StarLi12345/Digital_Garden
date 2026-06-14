"use client";

// ============================================================
// Digital Garden — TypeSelector
// ============================================================
// P1.3: 内容类型选择组件
//
// 职责：纯 UI + 键盘交互
// 数据源来自 src/lib/constants.ts → ENTRY_TYPES
// 不调用 Server Actions，不访问数据库
// ============================================================

import { type KeyboardEvent, useCallback } from "react";
import { ENTRY_TYPES, TYPE_LABELS } from "@/lib/constants";

// ── Props ─────────────────────────────────────────────

interface TypeSelectorProps {
  value: string;
  onChange: (type: string) => void;
}

// ── Component ─────────────────────────────────────────

export default function TypeSelector({ value, onChange }: TypeSelectorProps) {
  const currentIndex = (ENTRY_TYPES as readonly string[]).indexOf(value);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const delta = e.key === "ArrowLeft" ? -1 : 1;
        const nextIndex =
          (currentIndex + delta + ENTRY_TYPES.length) % ENTRY_TYPES.length;
        onChange((ENTRY_TYPES as readonly string[])[nextIndex]);
      }
    },
    [currentIndex, onChange],
  );

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">内容类型</p>
      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="内容类型"
        onKeyDown={handleKeyDown}
      >
        {ENTRY_TYPES.map((type) => {
          const isSelected = value === type;
          return (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onChange(type)}
              className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm interactive focus-ring
                ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-secondary hover:bg-muted"
                }`}
            >
              {TYPE_LABELS[type] || type}
            </button>
          );
        })}
      </div>
    </div>
  );
}
