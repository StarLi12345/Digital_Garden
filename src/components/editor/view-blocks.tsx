"use client";

// ============================================================
// Digital Garden — View-Mode Block Renderers
// ============================================================
// Recursively renders a TipTap JSON document as React components.
// Each block type gets its own component with proper semantics.
// ============================================================

import { useMemo } from "react";
import { renderInline } from "./view-inline";
import { MermaidViewBlock } from "./view-mermaid";
import { MathViewBlock } from "./view-math";

// ── Types ────────────────────────────────────────────────

interface TipTapNode {
  type: string;
  content?: TipTapNode[];
  attrs?: Record<string, unknown>;
  text?: string;
}

// ── Extract heading info for TOC ─────────────────────────

export function extractHeadingInfo(node: TipTapNode): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  function walk(n: TipTapNode) {
    if (n.type === "heading") {
      const level = (n.attrs?.level as number) || 1;
      let text = "";
      if (n.content) {
        for (const child of n.content) {
          if (child.type === "text") text += child.text || "";
        }
      }
      const id = "h-" + slugify(text || `heading-${headings.length}`);
      headings.push({ id, text: text.slice(0, 80), level });
    }
    if (n.content) n.content.forEach(walk);
  }
  walk(node);
  return headings;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "section";
}

// ── Recursive block renderer ─────────────────────────────

export function DocRenderer({ node, headingIndex }: { node: TipTapNode; headingIndex: Map<string, number> }) {
  if (!node || !node.content) return null;
  const headings = useMemo(() => extractHeadingInfo(node), [node]);
  // Build index map: heading text → array index (for TOC scrolling)
  headings.forEach((h, i) => headingIndex.set(h.id, i));

  return <>{node.content.map((child, i) => renderBlock(child, i, headingIndex))}</>;
}

function renderBlock(node: TipTapNode, key: number, headingIndex: Map<string, number>): React.ReactNode {
  switch (node.type) {
    case "paragraph":
      return <p key={key} className="mb-[1em]">{renderInline(node.content)}</p>;

    case "heading": {
      const level = Math.min(5, Math.max(1, (node.attrs?.level as number) || 2));
      const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5";
      // Generate stable ID from text content
      let text = "";
      if (node.content) {
        for (const c of node.content) {
          if (c.type === "text") text += c.text || "";
        }
      }
      const id = "h-" + slugify(text || `heading-${headingIndex.size}`);
      headingIndex.set(id, headingIndex.size);
      const sizeClass = level === 1 ? "text-3xl" : level === 2 ? "text-2xl" : level === 3 ? "text-xl" : "text-lg";
      return (
        <Tag key={key} id={id} className={`${sizeClass} font-semibold text-foreground mt-6 mb-3 group relative`}>
          {renderInline(node.content)}
          <a href={`#${id}`} className="heading-anchor absolute -left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground text-sm no-underline">#</a>
        </Tag>
      );
    }

    case "blockquote":
      return (
        <blockquote key={key} className="border-l-[3px] border-primary bg-muted px-4 py-2 my-4 rounded-r-md text-muted-foreground">
          {node.content?.map((c, i) => renderBlock(c, i, headingIndex))}
        </blockquote>
      );

    case "codeBlock": {
      const lang = (node.attrs?.language as string) || "";
      const code = node.content
        ?.map((c) => (c.type === "text" ? c.text || "" : ""))
        .join("") || "";
      return (
        <div key={key} className="code-block-wrapper relative my-4">
          {lang && <span className="absolute top-0 right-0 px-2 py-0.5 text-[0.7em] text-muted-foreground bg-border rounded-bl-md font-mono">{lang}</span>}
          <pre className="rounded-lg p-4 overflow-x-auto font-mono text-[0.85em] leading-relaxed" style={{ background: "var(--color-code-bg)", border: "1px solid var(--color-border)" }}>
            <code className={lang ? `language-${lang}` : ""}>{code}</code>
          </pre>
        </div>
      );
    }

    case "bulletList":
      return (
        <ul key={key} className="list-disc pl-5 my-2 border-l-2 border-border">
          {node.content?.map((item, i) => renderListItem(item, i, "•", headingIndex))}
        </ul>
      );

    case "orderedList": {
      const start = (node.attrs?.start as number) || 1;
      return (
        <ol key={key} start={start} className="list-decimal pl-5 my-2 border-l-2 border-border">
          {node.content?.map((item, i) => renderListItem(item, i, `${start + i}.`, headingIndex))}
        </ol>
      );
    }

    case "taskList":
      return (
        <ul key={key} data-type="taskList" className="list-none pl-0 my-2">
          {node.content?.map((item, i) => renderBlock(item, i, headingIndex))}
        </ul>
      );

    case "taskItem": {
      const checked = node.attrs?.checked as boolean;
      return (
        <li key={key} data-type="taskItem" data-checked={String(!!checked)} className="flex items-start gap-2">
          <label className="shrink-0 mt-0.5">
            <input type="checkbox" checked={!!checked} readOnly className="accent-primary cursor-pointer" />
          </label>
          <div className={checked ? "line-through text-muted-foreground" : ""}>
            {node.content?.map((c, i) => {
              if (c.type === "paragraph") return renderInline(c.content);
              return renderBlock(c, i, headingIndex);
            })}
          </div>
        </li>
      );
    }

    case "listItem":
      return renderListItem(node, key, "•", headingIndex);

    case "horizontalRule":
      return <hr key={key} className="my-8 border-0 h-px bg-[var(--color-muted-foreground)] opacity-35" />;

    case "image": {
      const src = (node.attrs?.src as string) || "";
      const alt = (node.attrs?.alt as string) || "";
      return <img key={key} src={src} alt={alt} className="max-w-full rounded-lg my-3" />;
    }

    case "callout":
      return (
        <div key={key} data-type="callout" className="border-l-[3px] border-accent px-4 py-3 rounded-r-md my-4" style={{ background: "var(--color-callout-bg)" }}>
          {node.content?.map((c, i) => renderBlock(c, i, headingIndex))}
        </div>
      );

    case "mermaid":
      return <MermaidViewBlock key={key} node={node} />;

    case "mathBlock":
      return <MathViewBlock key={key} node={node} />;

    case "hardBreak":
      return <br key={key} />;

    default:
      // Unknown block — try rendering children
      if (node.content) {
        return <div key={key}>{node.content.map((c, i) => renderBlock(c, i, headingIndex))}</div>;
      }
      return null;
  }
}

function renderListItem(node: TipTapNode, key: number, marker: string, headingIndex: Map<string, number>): React.ReactNode {
  // Find the paragraph child (which contains the actual text)
  const paragraph = node.content?.find((c) => c.type === "paragraph");
  const subLists = node.content?.filter((c) => c.type !== "paragraph") || [];

  return (
    <li key={key} className="mb-1 pl-1">
      {paragraph ? renderInline(paragraph.content) : renderInline(node.content)}
      {subLists.length > 0 && (
        <div className="ml-2">
          {subLists.map((c, i) => renderBlock(c, i, headingIndex))}
        </div>
      )}
    </li>
  );
}
