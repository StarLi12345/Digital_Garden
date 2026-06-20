"use client";

// ============================================================
// Digital Garden — TitleInput (Notion-style)
// ============================================================
// 两种模式：
//   variant="notion"  — 无边框大字，用于 /plant 编辑器
//   variant="default" — 带边框，用于设置等表单场景
// ============================================================

import { type ChangeEvent } from "react";

interface TitleInputProps {
  value: string;
  onChange: (title: string) => void;
  maxLength?: number;
  placeholder?: string;
  variant?: "default" | "notion";
}

export default function TitleInput({
  value,
  onChange,
  maxLength = 100,
  placeholder = "无标题",
  variant = "default",
}: TitleInputProps) {
  const currentLength = value.length;
  const isOverLimit = currentLength > maxLength;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  if (variant === "notion") {
    return (
      <div className="space-y-1">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          maxLength={maxLength + 10}
          placeholder={placeholder}
          className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none py-2"
          autoComplete="off"
        />
        <div className="flex items-center justify-end">
          <span className={`text-xs ${isOverLimit ? "text-accent font-medium" : "text-muted-foreground/40"}`}>
            {currentLength}/{maxLength}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        maxLength={maxLength + 10}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground interactive focus-ring"
        autoComplete="off"
      />
      <div className="flex items-center justify-end">
        <span className={`text-xs ${isOverLimit ? "text-accent font-medium" : "text-muted-foreground"}`}>
          {currentLength}/{maxLength}
        </span>
      </div>
    </div>
  );
}
