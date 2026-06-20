// ============================================================
// Digital Garden — TipTap JSON → Markdown 转换器
// ============================================================
// 递归遍历 TipTap JSON 树，生成 Markdown 字符串。
//
// 支持节点：doc, paragraph, heading(h2/h3), bulletList,
//           orderedList, listItem, blockquote, codeBlock,
//           horizontalRule, text, hardBreak
// 支持标记：bold, italic, strike
// 未知节点：降级为纯文本提取
//
// 零外部依赖。仅使用 TypeScript 原生能力。
// ============================================================

import type { TipTapNode, TipTapMark } from "@/lib/link-parser";

// ── Public API ────────────────────────────────────────

/**
 * Convert a TipTap JSON document to a Markdown string.
 *
 * @param json - TipTap JSON object (editor.getJSON() output)
 * @returns Markdown string
 */
export function jsonToMarkdown(json: TipTapNode): string {
  if (!json || typeof json !== "object") return "";
  return renderNode(json).trim();
}

// ── Internal renderers ────────────────────────────────

function renderNode(node: TipTapNode): string {
  switch (node.type) {
    case "doc":
      return renderChildren(node);

    case "paragraph":
      return renderInline(node) + "\n\n";

    case "heading":
      return renderHeading(node);

    case "bulletList":
      return renderList(node, "-");

    case "orderedList":
      return renderOrderedList(node);

    case "taskList":
      return renderTaskList(node);

    case "taskItem":
      return renderTaskItem(node);

    case "listItem":
      return renderListItem(node);

    case "blockquote":
      return renderBlockquote(node);

    case "codeBlock":
      return renderCodeBlock(node);

    case "horizontalRule":
      return "---\n\n";

    case "hardBreak":
      return "\n";

    case "image": {
      const src = (node.attrs?.src as string) || "";
      const alt = (node.attrs?.alt as string) || "";
      return `![${alt}](${src})\n\n`;
    }

    case "text":
      return renderText(node);

    case "mermaid": {
      const code = node.content
        ?.map((c) => (c.type === "text" ? c.text || "" : ""))
        .join("") || "";
      return "```mermaid\n" + code + "\n```\n\n";
    }

    case "mathBlock": {
      const formula = node.content
        ?.map((c) => (c.type === "text" ? c.text || "" : ""))
        .join("") || "";
      return "$$\n" + formula + "\n$$\n\n";
    }

    default:
      // Unknown node → degrade: extract plain text from children
      return node.content ? renderChildren(node) : "";
  }
}

// ── Block-level renderers ─────────────────────────────

function renderChildren(node: TipTapNode): string {
  if (!node.content) return "";
  return node.content.map((child) => renderNode(child)).join("");
}

function renderHeading(node: TipTapNode): string {
  const level = node.attrs?.level as number;
  const prefix = "#".repeat(level);
  const text = renderInline(node);
  return `${prefix} ${text}\n\n`;
}

function renderList(node: TipTapNode, marker: string): string {
  if (!node.content) return "";
  return node.content
    .map((item) => {
      const text = renderInline(item);
      // listItem's first child is the paragraph/list content
      const inner = item.content
        ? item.content.map((c) => renderListItemContent(c, marker)).join("")
        : `${marker} ${text}`;
      return inner;
    })
    .join("") + "\n";
}

function renderTaskList(node: TipTapNode): string {
  if (!node.content) return "";
  return node.content.map((item) => {
    const checked = item.attrs?.checked ? "x" : " ";
    const text = renderInline(item);
    return `- [${checked}] ${text}`;
  }).join("\n") + "\n\n";
}

function renderTaskItem(node: TipTapNode): string {
  const checked = node.attrs?.checked ? "x" : " ";
  const text = renderInline(node);
  return `- [${checked}] ${text}`;
}

function renderOrderedList(node: TipTapNode): string {
  if (!node.content) return "";
  return node.content
    .map((item, i) => {
      const text = renderInline(item);
      const inner = item.content
        ? item.content.map((c) => renderListItemContent(c, `${i + 1}.`)).join("")
        : `${i + 1}. ${text}`;
      return inner;
    })
    .join("") + "\n";
}

function renderListItemContent(node: TipTapNode, prefix: string): string {
  switch (node.type) {
    case "paragraph":
      return `${prefix} ${renderInline(node)}\n`;
    case "bulletList":
      return renderList(node, "  -");
    case "orderedList":
      return renderOrderedListNested(node);
    default:
      return `${prefix} ${renderInline(node)}\n`;
  }
}

function renderOrderedListNested(node: TipTapNode): string {
  if (!node.content) return "";
  return node.content
    .map((item, i) => `${i + 1}. ${renderInline(item)}\n`)
    .join("");
}

function renderListItem(node: TipTapNode): string {
  // listItem is handled by its parent (bulletList / orderedList)
  return renderInline(node);
}

function renderBlockquote(node: TipTapNode): string {
  const text = renderInline(node);
  return text
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => `> ${line}`)
    .join("\n") + "\n\n";
}

function renderCodeBlock(node: TipTapNode): string {
  const text = node.content
    ? node.content.map((c) => (c.type === "text" ? c.text || "" : "")).join("")
    : "";
  const lang = (node.attrs?.language as string) || "";
  return "```" + lang + "\n" + text + "\n```\n\n";
}

// ── Inline renderers ──────────────────────────────────

function renderInline(node: TipTapNode): string {
  if (!node.content) return "";
  return node.content.map((child) => renderInlineNode(child)).join("");
}

function renderInlineNode(node: TipTapNode): string {
  if (node.type === "text") {
    return renderText(node);
  }
  if (node.type === "hardBreak") {
    return "\n";
  }
  if (node.type === "image") {
    const src = (node.attrs?.src as string) || "";
    const alt = (node.attrs?.alt as string) || "";
    return `![${alt}](${src})`;
  }
  // Nested block in inline context → degrade
  return node.content ? renderChildren(node) : "";
}

function renderText(node: TipTapNode): string {
  let text = node.text || "";
  if (!node.marks || node.marks.length === 0) return text;

  // Apply marks from outer to inner
  for (const mark of node.marks) {
    switch (mark.type) {
      case "bold":
        text = `**${text}**`;
        break;
      case "italic":
        text = `*${text}*`;
        break;
      case "underline":
        text = `<u>${text}</u>`;
        break;
      case "strike":
        text = `~~${text}~~`;
        break;
      case "code":
        text = `\`${text}\``;
        break;
      case "highlight": {
        const color = (mark.attrs?.color as string) || "";
        text = color ? `<mark style="background-color:${color}">${text}</mark>` : `<mark>${text}</mark>`;
        break;
      }
      case "textStyle": {
        if (mark.attrs?.color) {
          text = `<span style="color:${mark.attrs.color}">${text}</span>`;
        }
        break;
      }
      case "link": {
        const href = (mark.attrs?.href as string) || "";
        text = `[${text}](${href})`;
        break;
      }
      default:
        // Unknown mark → pass through
        break;
    }
  }
  return text;
}
