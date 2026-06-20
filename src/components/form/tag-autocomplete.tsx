"use client";

// ============================================================
// Digital Garden — TagAutocomplete
// ============================================================
// 扩展 TagInput，添加已有标签的自动补全下拉。
// 支持键盘导航、自由输入新标签、复用标签 pill 样式。
// ============================================================

import { useState, useEffect, useCallback, useMemo, useRef, type KeyboardEvent, type ChangeEvent } from "react";
import { listAllTags } from "@/actions/entry-actions";

// ── Props (same as TagInput) ──────────────────────────

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

// ── Component ─────────────────────────────────────────

export default function TagAutocomplete({
  value,
  onChange,
  placeholder = "输入标签，回车添加",
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [allTags, setAllTags] = useState<{ name: string; count: number }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch all tags on mount
  useEffect(() => {
    listAllTags().then(setAllTags);
  }, []);

  // Filter suggestions based on input
  const suggestions = useMemo(() => {
    if (!input.trim()) return [];
    const q = input.trim().toLowerCase();
    return allTags
      .filter((t) => t.name.toLowerCase().includes(q) && !value.includes(t.name))
      .slice(0, 8);
  }, [input, allTags, value]);

  const addTag = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      if (value.includes(trimmed)) {
        setInput("");
        setShowDropdown(false);
        setHighlightIndex(-1);
        return;
      }
      onChange([...value, trimmed]);
      setInput("");
      setShowDropdown(false);
      setHighlightIndex(-1);
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
    if (showDropdown && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        return;
      }
      if (e.key === "Enter" && highlightIndex >= 0) {
        e.preventDefault();
        addTag(suggestions[highlightIndex].name);
        return;
      }
      if (e.key === "Escape") {
        setShowDropdown(false);
        setHighlightIndex(-1);
        return;
      }
    }
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
    setShowDropdown(true);
    setHighlightIndex(-1);
  };

  return (
    <div className="space-y-2 relative">
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
        ref={inputRef}
        type="text"
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (input.trim()) setShowDropdown(true); }}
        onBlur={() => setTimeout(() => { setShowDropdown(false); setHighlightIndex(-1); }, 150)}
        placeholder={value.length === 0 ? placeholder : "继续添加…"}
        className="w-full rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground interactive focus-ring"
        autoComplete="off"
      />

      {/* Autocomplete dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
          {suggestions.map((tag, i) => (
            <button
              key={tag.name}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addTag(tag.name); }}
              onMouseEnter={() => setHighlightIndex(i)}
              className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left interactive transition-colors ${
                i === highlightIndex
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted/50"
              }`}
            >
              <span>{tag.name}</span>
              <span className="text-[0.625rem] text-muted-foreground">{tag.count} 篇</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
