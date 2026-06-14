// ============================================================
// Digital Garden 3.0 — TipTap JSON → HTML 渲染器 (Enhanced)
// ============================================================
// 在服务端将 TipTap JSON 转换为安全的 HTML。
// 新增：代码块语言标签、内联高亮、标题锚点ID
// ============================================================

import { generateHTML } from "@tiptap/core";
import { extractHeadings } from "@/lib/link-parser";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import ImageExtension from "@tiptap/extension-image";
import { TextStyleKit as TextStyle } from "@tiptap/extension-text-style";
import { Color as TipTapColor } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import { Callout } from "@/components/editor/callout-extension";

/**
 * Convert a TipTap JSON document to safe HTML for display.
 * Wraps code blocks in .code-block-wrapper for language labels.
 */
export function jsonToHtml(json: Record<string, unknown>): string {
  if (!json || !json.type) return "";

  try {
    // Extract headings for anchor ID generation
    const headings = extractHeadings(json as unknown as import("@/lib/link-parser").TipTapNode);

    let html = generateHTML(json, [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5] },
      }),
      LinkExtension.configure({
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Underline,
      Highlight.configure({ multicolor: true }),
      ImageExtension.configure({ allowBase64: true }),
      TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right"] }),
      TextStyle,
      TipTapColor,
      Callout,
    ]);

    // Post-process: inject heading IDs for anchor linking
    if (headings.length > 0) {
      let headingIdx = 0;
      html = html.replace(/<h([1-5])>/g, (match, level) => {
        const h = headings[headingIdx];
        headingIdx++;
        if (h) {
          return `<h${level} id="${h.id}">`;
        }
        return match;
      });
    }

    // Post-process: wrap <pre><code> in .code-block-wrapper with language label
    html = html.replace(
      /<pre><code class="language-(\w+)">/g,
      (_, lang) => {
        return `<div class="code-block-wrapper"><span class="code-lang-label">${lang}</span><pre><code class="language-${lang}">`;
      }
    );
    // Also handle <pre> without language
    html = html.replace(
      /<pre><code>/g,
      '<div class="code-block-wrapper"><pre><code>'
    );
    // Close the wrapper div after the closing pre tag (for code blocks)
    html = html.replace(
      /<\/code><\/pre>/g,
      (match, offset) => {
        // Only close wrapper if we're inside a .code-block-wrapper (not already closed)
        const before = html.slice(0, offset);
        const openWrappers = (before.match(/<div class="code-block-wrapper">/g) || []).length;
        const closeWrappers = (before.match(/<\/div>/g) || []).length;
        if (openWrappers > closeWrappers) {
          return "</code></pre></div>";
        }
        return match;
      }
    );

    return html;
  } catch {
    return "";
  }
}
