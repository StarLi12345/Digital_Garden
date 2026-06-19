"use client";

// ============================================================
// Digital Garden — SearchModal
// ============================================================
// Cmd+K / Ctrl+K 全局搜索弹窗。
// 200ms 防抖 · 键盘导航 · 入口搜索 · 结果直达
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { searchEntries } from "@/actions/entry-actions";
import { TYPE_LABELS } from "@/lib/constants";
import { fmtDate } from "@/lib/datetime";

interface SearchResult {
  slug: string;
  title: string;
  type: string;
  excerpt: string | null;
  createdAt: string;
  tags: { name: string }[];
}

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setHighlightIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open, onClose]);

  // Close on route change
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchEntries(query.trim());
        setResults(data as SearchResult[]);
      } catch { setResults([]); }
      setLoading(false);
      setHighlightIndex(-1);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const navigateTo = useCallback(
    (slug: string) => {
      onClose();
      router.push(`/entry/${slug}`);
    },
    [router, onClose],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && highlightIndex >= 0 && results[highlightIndex]) {
      e.preventDefault();
      navigateTo(results[highlightIndex].slug);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
        else { setQuery(""); setResults([]); }
        // Toggle handled by parent
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm">
      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg mx-4 rounded-xl border border-border bg-background shadow-2xl overflow-hidden"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <span className="text-lg shrink-0">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="搜索笔记标题或内容…"
            className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoComplete="off"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[0.625rem] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              搜索中…
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              没有找到匹配的笔记
            </div>
          )}
          {!loading && !query && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              输入关键词搜索笔记标题和正文
            </div>
          )}
          {results.map((entry, i) => (
            <button
              key={entry.slug}
              onClick={() => navigateTo(entry.slug)}
              onMouseEnter={() => setHighlightIndex(i)}
              className={`w-full text-left px-4 py-3 border-b border-border/50 last:border-0 transition-colors ${
                i === highlightIndex ? "bg-primary/5" : "hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-primary">
                  {TYPE_LABELS[entry.type as keyof typeof TYPE_LABELS] || entry.type}
                </span>
                <span className="text-sm font-medium text-foreground truncate">{entry.title}</span>
              </div>
              {entry.excerpt && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{entry.excerpt}</p>
              )}
              <div className="flex items-center gap-2 text-[0.625rem] text-muted-foreground/60">
                <span>{fmtDate(entry.createdAt)}</span>
                {entry.tags.map((t) => (
                  <span key={t.name}>#{t.name}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
