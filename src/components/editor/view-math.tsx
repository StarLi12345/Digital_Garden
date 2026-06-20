"use client";

// ============================================================
// Digital Garden — View-Mode Math/KaTeX Block
// ============================================================
// Renders a TipTap mathBlock node using KaTeX.
// ============================================================

import { useState, useEffect } from "react";

interface TipTapNode {
  type: string;
  content?: { type: string; text?: string }[];
}

// ── Singleton KaTeX import ──────────────────────────────
let katexPromise: Promise<typeof import("katex").default> | null = null;
function getKatex() {
  if (!katexPromise) {
    katexPromise = import("katex").then((k) => k.default);
  }
  return katexPromise;
}

export function MathViewBlock({ node }: { node: TipTapNode }) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const formula =
    node.content
      ?.map((c) => (c.type === "text" ? c.text || "" : ""))
      .join("")
      .trim() || "";

  useEffect(() => {
    if (!formula) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const katex = await getKatex();
        if (cancelled || !katex) return;
        const rendered = katex.renderToString(formula, {
          throwOnError: false,
          displayMode: true,
        });
        if (!cancelled) {
          setHtml(rendered);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "渲染失败");
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [formula]);

  if (!formula) return null;

  return (
    <div data-type="mathBlock" className="my-3 flex justify-center text-foreground text-lg">
      {loading && (
        <span className="text-xs text-muted-foreground">公式渲染中…</span>
      )}
      {error && (
        <div className="text-xs text-red-500 p-2 rounded border border-red-200 bg-red-50 dark:bg-red-950/20 w-full">
          <p className="font-medium mb-1">⚠ 公式语法错误</p>
          <pre className="font-mono text-[0.8em] whitespace-pre-wrap">{formula}</pre>
        </div>
      )}
      {html && (
        <span dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  );
}
