"use client";

// ============================================================
// Digital Garden 3.0 — Link Suggestions Panel
// ============================================================
// Shows "unlinked mentions" — entry titles that appear in the
// current document text but aren't linked yet. Click to create
// a wiki link.
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { findUnlinkedMentions, type TipTapNode } from "@/lib/link-parser";
import { searchEntries } from "@/actions/entry-actions";

interface LinkSuggestionsProps {
  /** Current TipTap JSON content */
  content: TipTapNode | null;
  /** Callback when a suggestion is clicked: inserts a wiki link */
  onInsertLink: (slug: string, title: string) => void;
}

interface Suggestion {
  slug: string;
  title: string;
}

export function LinkSuggestions({ content, onInsertLink }: LinkSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!content) { setSuggestions([]); return; }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // Get all entry slugs/titles for comparison
        // Use a generous search to get recent entries
        const allEntries = await searchEntries("");
        if (cancelled) return;

        const unlinked = findUnlinkedMentions(content, allEntries);
        if (cancelled) return;

        setSuggestions(unlinked.slice(0, 5));
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [content]);

  if (!content || suggestions.length === 0) return null;

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground interactive"
      >
        <span className={`transition-transform ${expanded ? "rotate-90" : ""}`}>▸</span>
        💡 {suggestions.length} 个未链接提及
      </button>

      {expanded && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s.slug}
              onClick={() => onInsertLink(s.slug, s.title)}
              className="inline-flex items-center rounded-full border border-dashed border-primary/30 bg-primary/5 px-2.5 py-0.5 text-xs text-primary hover:bg-primary/10 interactive"
              title={`创建指向「${s.title}」的链接`}
            >
              + {s.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
