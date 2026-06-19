"use client";

// ============================================================
// Digital Garden — View-Mode Mermaid Block
// ============================================================
// Renders a TipTap mermaid node as an SVG diagram.
// Uses dynamic import, double-render guard, and theme reactivity.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/components/ui/theme-provider";

interface TipTapNode {
  type: string;
  content?: { type: string; text?: string }[];
}

// ── Singleton mermaid import ────────────────────────────
let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;
let mermaidInit = false;
function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => m.default);
  }
  return mermaidPromise;
}

export function MermaidViewBlock({ node }: { node: TipTapNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgHtml, setSvgHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { resolved } = useTheme();
  const renderedRef = useRef(false);

  const code =
    node.content
      ?.map((c) => (c.type === "text" ? c.text || "" : ""))
      .join("")
      .trim() || "";

  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const mermaid = await getMermaid();
        if (cancelled || !mermaid) return;
        if (!mermaidInit) {
          mermaid.initialize({ startOnLoad: false });
          mermaidInit = true;
        }
        mermaid.initialize({ startOnLoad: false, theme: resolved === "dark" ? "dark" : "default" });
        const id = "rmv-" + Math.random().toString(36).slice(2, 10);
        const { svg } = await mermaid.render(id, code);
        if (!cancelled) {
          setSvgHtml(svg);
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
  }, [code, resolved]);

  if (!code) return null;

  return (
    <div ref={containerRef} data-type="mermaid" className="my-3 flex justify-center overflow-x-auto">
      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          图表渲染中…
        </div>
      )}
      {error && (
        <div className="text-xs text-red-500 p-2 rounded border border-red-200 bg-red-50 dark:bg-red-950/20 overflow-x-auto w-full">
          <p className="font-medium mb-1">⚠ 图表语法错误</p>
          <pre className="font-mono text-[0.8em] whitespace-pre-wrap">{code}</pre>
        </div>
      )}
      {svgHtml && (
        <div dangerouslySetInnerHTML={{ __html: svgHtml }} className="flex justify-center" />
      )}
    </div>
  );
}
