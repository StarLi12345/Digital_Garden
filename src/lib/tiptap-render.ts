// ============================================================
// Digital Garden 3.0 — TipTap JSON → HTML 渲染器
// ============================================================
// · 代码块语言标签 · 内联高亮 · 标题锚点 · Mermaid · Math
//
// Mermaid & Math 处理策略：
//   1. 收集所有 mermaid/math 节点的代码文本
//   2. 正常调用 generateHTML（代码会以纯文本形式出现在 <p> 中）
//   3. 在输出 HTML 中直接搜索这些代码文本（已自动转义），
//      替换为 <div data-type="..."> 包裹的版本
// ============================================================

import { generateHTML } from "@tiptap/core";
import { extractHeadings } from "@/lib/link-parser";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import ImageExtension from "@tiptap/extension-image";
import { TextStyleKit as TextStyle } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import { Callout } from "@/components/editor/callout-extension";

const BASE_EXTENSIONS = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3, 4, 5] },
    link: { HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } },
  }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Highlight.configure({ multicolor: true }),
  ImageExtension.configure({ allowBase64: true }),
  TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right"] }),
  TextStyle,
  Callout,
];

// ── Helpers ──────────────────────────────────────────────

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractNodeText(node: any): string {
  if (!node) return "";
  if (node.type === "text") return node.text || "";
  if (Array.isArray(node.content)) {
    return node.content.map((c: any) => extractNodeText(c)).join("");
  }
  return "";
}

// ── Sanitize ─────────────────────────────────────────────

export function sanitizeNode(node: any): any {
  if (!node || typeof node !== "object") return node;
  if (Array.isArray(node)) {
    return node.map(sanitizeNode).filter((x: any) => typeof x === "object" && !!x);
  }
  const out: any = {};
  for (const k of Object.keys(node)) {
    if (k === "marks" && Array.isArray(node[k])) {
      out[k] = node[k].filter((m: any) => typeof m === "object" && !!m && !!m.type);
    } else if (k === "content" && Array.isArray(node[k])) {
      out[k] = node[k].map(sanitizeNode);
    } else {
      out[k] = node[k];
    }
  }
  return out;
}

// ── Collect special blocks from JSON tree ────────────────

interface SpecialBlock {
  tag: "mermaid" | "mathBlock";
  code: string;      // original code (un-escaped)
  escaped: string;   // HTML-escaped code (matches generateHTML output)
  html: string;      // replacement HTML
}

function collectBlocks(node: any): SpecialBlock[] {
  const blocks: SpecialBlock[] = [];
  function walk(n: any) {
    if (!n || typeof n !== "object") return;
    if (n.type === "mermaid" || n.type === "mathBlock") {
      const code = extractNodeText(n).trim();
      if (code) {
        const tag = n.type as "mermaid" | "mathBlock";
        const escaped = escapeHtml(code);
        blocks.push({
          tag,
          code,
          escaped,
          html: `<div data-type="${tag}">${escaped}</div>`,
        });
      }
    }
    if (Array.isArray(n.content)) n.content.forEach(walk);
  }
  walk(node);
  return blocks;
}

// ── Main renderer ────────────────────────────────────────

export function jsonToHtml(json: Record<string, unknown>): string {
  if (!json || !json.type) return "";

  try {
    const clean = sanitizeNode(json);

    // 1. Collect mermaid & math blocks
    const blocks = collectBlocks(clean);

    // 2. Generate HTML normally (mermaid/math text appears as plain text in <p> tags)
    const headings = extractHeadings(clean as unknown as import("@/lib/link-parser").TipTapNode);
    let html = generateHTML(clean, BASE_EXTENSIONS);

    // 3. Replace each block: find the escaped code text inside <p> tags and wrap it
    for (const block of blocks) {
      // Try exact match: <p>escaped_code</p>
      // (generateHTML wraps text nodes in <p> tags)
      const pattern = `<p>${escapeRegex(block.escaped)}</p>`;
      const regex = new RegExp(pattern, "g");
      if (regex.test(html)) {
        regex.lastIndex = 0; // reset after test
        html = html.replace(regex, block.html);
      } else {
        // Fallback: the code may have been split or modified — search for a substring
        // Take first 30 chars as a search needle
        const needle = escapeRegex(block.escaped.slice(0, Math.min(30, block.escaped.length)));
        const fallbackRegex = new RegExp(`<p>([^<]*${needle}[^<]*)</p>`, "gs");
        html = html.replace(fallbackRegex, (match) => {
          // Verify this match contains the full escaped code
          if (match.includes(block.escaped)) return block.html;
          // If not, try harder: check if the inner text matches
          const inner = match.slice(3, -4); // strip <p> and </p>
          if (inner.trim() === block.escaped.trim()) return block.html;
          return match;
        });
      }
    }

    // 4. Heading anchor IDs
    if (headings.length > 0) {
      let headingIdx = 0;
      html = html.replace(/<h([1-5])>/g, (match, level) => {
        const h = headings[headingIdx];
        headingIdx++;
        if (h) return `<h${level} id="${h.id}">`;
        return match;
      });
    }

    // 5. Code block wrappers
    html = html.replace(
      /<pre><code class="language-(\w+)">/g,
      (_, lang) =>
        `<div class="code-block-wrapper"><span class="code-lang-label">${lang}</span><pre><code class="language-${lang}">`
    );
    html = html.replace(/<pre><code>/g, '<div class="code-block-wrapper"><pre><code>');
    html = html.replace(/<\/code><\/pre>/g, (match, offset) => {
      const before = html.slice(0, offset);
      const openWrappers = (before.match(/<div class="code-block-wrapper">/g) || []).length;
      const closeWrappers = (before.match(/<\/div>/g) || []).length;
      if (openWrappers > closeWrappers) return "</code></pre></div>";
      return match;
    });

    return html;
  } catch {
    return "";
  }
}
