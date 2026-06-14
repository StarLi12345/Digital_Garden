"use client";

// ============================================================
// Digital Garden — TagInput
// ============================================================
// P1.3: 标签输入组件
//
// 职责：纯 UI + 本地状态管理（数组 CRUD）
// 输入 → Enter 添加 | 点击 × 删除
// 行为：去重、trim、空输入忽略
// 不调用任何 API，不做智能推荐
// ============================================================

import { useState, useCallback, type KeyboardEvent, type ChangeEvent } from "react";

// ── Props ─────────────────────────────────────────────

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

// ── Component ─────────────────────────────────────────

export default function TagInput({
  value,
  onChange,
  placeholder = "输入标签，回车添加",
}: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      // Deduplicate
      if (value.includes(trimmed)) {
        setInput("");
        return;
      }
      onChange([...value, trimmed]);
      setInput("");
    },
    [value, onChange],
  );

  const removeTag = useCallback(
    (name: string) => {
      onChange(value.filter((t) => t !== name));
    },
    [value, onChange],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && input === "" && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">标签</p>

      {/* Tag pills */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-foreground"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-accent hover:bg-accent/10 interactive"
                aria-label={`删除标签 ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <input
        type="text"
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : "继续添加…"}
        className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground interactive focus-ring"
        autoComplete="off"
      />
    </div>
  );
}
