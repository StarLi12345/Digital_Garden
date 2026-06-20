"use client";

// ============================================================
// Digital Garden — View-Mode Inline Text Renderer
// ============================================================
// Renders TipTap inline content (text + marks) as React elements.
// Supports: bold, italic, underline, strike, code, link, highlight, color.
// ============================================================

import type { ReactNode } from "react";

interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface TipTapInlineNode {
  type: string;
  text?: string;
  marks?: TipTapMark[];
  attrs?: Record<string, unknown>;
  content?: TipTapInlineNode[];
}

/** Apply a single mark to text content */
function applyMark(mark: TipTapMark, children: ReactNode): ReactNode {
  switch (mark.type) {
    case "bold":
      return <strong>{children}</strong>;
    case "italic":
      return <em>{children}</em>;
    case "underline":
      return <u>{children}</u>;
    case "strike":
      return <s>{children}</s>;
    case "code":
      return (
        <code className="bg-[var(--color-code-bg)] text-[var(--color-foreground)] px-1 py-0.5 rounded text-[0.88em] font-mono">
          {children}
        </code>
      );
    case "link": {
      const href = (mark.attrs?.href as string) || "#";
      return (
        <a href={href} rel="noopener noreferrer" target="_blank">
          {children}
        </a>
      );
    }
    case "highlight": {
      const color = (mark.attrs?.color as string) || "#fff176";
      return <mark style={{ backgroundColor: color }}>{children}</mark>;
    }
    case "textStyle": {
      const color = (mark.attrs?.color as string);
      if (color) return <span style={{ color }}>{children}</span>;
      return children;
    }
    default:
      return children;
  }
}

/** Apply all marks to text content (outermost to innermost) */
function applyMarks(marks: TipTapMark[] | undefined, text: string): ReactNode {
  let result: ReactNode = text;
  if (marks && marks.length > 0) {
    for (const mark of marks) {
      result = applyMark(mark, result);
    }
  }
  return result;
}

/** Render an inline node (text or hardBreak) */
export function renderInlineNode(node: TipTapInlineNode, key?: number | string): ReactNode {
  if (node.type === "text") {
    const text = node.text || "";
    return <span key={key}>{applyMarks(node.marks, text)}</span>;
  }
  if (node.type === "hardBreak") {
    return <br key={key} />;
  }
  if (node.type === "image") {
    const src = (node.attrs as any)?.src || "";
    const alt = (node.attrs as any)?.alt || "";
    return (
      <img key={key} src={src} alt={alt} className="max-w-full rounded-lg my-3 cursor-zoom-in" />
    );
  }
  // Unknown inline node — fallback to plain text
  if (node.content) {
    return <span key={key}>{node.content.map((c, i) => renderInlineNode(c, i))}</span>;
  }
  return null;
}

/** Render an array of inline nodes */
export function renderInline(nodes: TipTapInlineNode[] | undefined): ReactNode {
  if (!nodes || nodes.length === 0) return null;
  return nodes.map((node, i) => renderInlineNode(node, i));
}
