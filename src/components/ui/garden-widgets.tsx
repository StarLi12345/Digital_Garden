"use client";

// ============================================================
// Digital Garden — Widgets（仿 Element Plus）
// ============================================================
// Switch · Empty · Statistic · 彩色 Tag 等小组件
// ============================================================

import { useEffect, useState, useRef, type ReactNode } from "react";

// ── Switch（仿 el-switch）───────────────────────────

export function Switch({ checked, onChange, label, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean;
}) {
  return (
    <label className={`inline-flex items-center gap-2 ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          checked ? "bg-primary" : "bg-muted-foreground/25"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </label>
  );
}

// ── Empty（仿 el-empty）──────────────────────────────

export function Empty({ icon = "📭", title = "暂无数据", description, action }: {
  icon?: string; title?: string; description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4 opacity-40">{icon}</span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Statistic（仿 el-statistic）──────────────────────

export function Statistic({ value, label, prefix, suffix, animated }: {
  value: number; label: string; prefix?: string; suffix?: string; animated?: boolean;
}) {
  const [display, setDisplay] = useState(animated ? 0 : value);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!animated) { setDisplay(value); return; }
    let frame: number;
    const duration = 800;
    const start = performance.now();
    const from = 0;
    const to = value;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, animated]);

  return (
    <div className="garden-card px-5 py-3 text-center">
      <div className="text-2xl font-bold text-foreground tabular-nums">
        {prefix}{display}{suffix}
      </div>
      <div className="text-[0.688rem] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

// ── Tag（彩色标签）───────────────────────────────────

const TAG_COLORS: Record<string, string> = {
  Memory: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/50",
  Thought: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-700/50",
  Emotion: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/50 dark:text-pink-300 dark:border-pink-700/50",
  Dream: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-700/50",
  Story: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-700/50",
  Learning: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-700/50",
};

export function ColoredTag({ type, label }: { type: string; label?: string }) {
  const colorClass = TAG_COLORS[type] || "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.625rem] font-medium ${colorClass}`}>
      {label || type}
    </span>
  );
}

// ── Progress（仿 el-progress）────────────────────────

export function MiniProgress({ percent, color }: { percent: number; color?: string }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${Math.min(100, Math.max(0, percent))}%`,
          background: color || "var(--color-primary)",
        }}
      />
    </div>
  );
}
