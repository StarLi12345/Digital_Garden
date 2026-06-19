// ============================================================
// Digital Garden — Export Utilities
// ============================================================
// MD  → 下载 .md 文件（图片路径绝对化）
// Word → 下载 .doc 文件（Markdown→HTML，自包含）
// PDF  → jsPDF 直接下载，不弹打印框
// ============================================================

import { marked } from "marked";

// ── Singleton dynamic imports (loaded on demand for export rendering) ──
let _mermaid: typeof import("mermaid").default | null = null;
async function getMermaid() {
  if (!_mermaid) { const m = await import("mermaid"); _mermaid = m.default; }
  return _mermaid;
}
let _katex: typeof import("katex").default | null = null;
async function getKatex() {
  if (!_katex) { const k = await import("katex"); _katex = k.default; }
  return _katex;
}

/** Escape HTML entities */
function escapeHtml(s: string) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

/** Get origin for resolving relative paths */
function getOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

/** Trigger a file download in the browser */
function downloadBlob(content: string | Blob, filename: string, mime: string) {
  const blob = typeof content === "string" ? new Blob([content], { type: mime }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function safeName(title: string): string {
  return (title || "未命名").replace(/[\\/:*?"<>|]/g, "_");
}

/** Convert relative image paths to absolute URLs */
function absolutizeImgPaths(html: string): string {
  const origin = getOrigin();
  if (!origin) return html;
  // <img src="/path"> → <img src="https://host/path">
  return html.replace(
    /(<img[^>]+src=")(\/[^"]+)("[^>]*>)/gi,
    (_, prefix, path, suffix) => `${prefix}${origin}${path}${suffix}`
  );
}

/** Convert relative image refs in markdown to absolute URLs */
function absolutizeMdPaths(md: string): string {
  const origin = getOrigin();
  if (!origin) return md;
  // ![alt](/path) → ![alt](https://host/path)
  return md.replace(
    /(!\[[^\]]*\])\((\/[^)]+)\)/g,
    (_, imgTag, path) => `${imgTag}(${origin}${path})`
  );
}

/** Generate export-ready HTML — renders mermaid/LaTeX as SVG inline */
export async function generateExportHtml(title: string, contentMd: string): Promise<string> {
  let bodyHtml = marked.parse(contentMd, { async: false }) as string;

  try {
    // ── Render mermaid code blocks as SVG ──
    const mermaidRegex = /<code class="language-mermaid">([\s\S]*?)<\/code>/g;
    const mermaidMatches: { original: string; code: string }[] = [];
    let m;
    while ((m = mermaidRegex.exec(bodyHtml)) !== null) {
      mermaidMatches.push({ original: m[0], code: m[1] });
    }
    if (mermaidMatches.length > 0) {
      const mermaid = await getMermaid();
      if (mermaid) {
        mermaid.initialize({ startOnLoad: false, theme: "default" });
        for (const match of mermaidMatches) {
          try {
            const id = "exp-" + Math.random().toString(36).slice(2, 8);
            const { svg } = await mermaid.render(id, match.code);
            bodyHtml = bodyHtml.replace(match.original, `<div style="text-align:center;margin:1em 0">${svg}</div>`);
          } catch { /* keep original code */ }
        }
      }
    }

    // ── Render LaTeX formulas as inline SVG ──
    // Block-level: $$...$$
    const latexBlockRegex = /\$\$([\s\S]*?)\$\$/g;
    const katex = await getKatex();
    if (katex) {
      bodyHtml = bodyHtml.replace(latexBlockRegex, (_, formula) => {
        try {
          const svg = katex.renderToString(formula.trim(), { throwOnError: false, displayMode: true, output: "html" });
          return `<div style="text-align:center;margin:1em 0;font-size:1.1em">${svg}</div>`;
        } catch { return _; }
      });
      // Inline: $...$
      bodyHtml = bodyHtml.replace(/\$([^$\n]+?)\$/g, (_, formula) => {
        try {
          return katex.renderToString(formula.trim(), { throwOnError: false, displayMode: false, output: "html" });
        } catch { return _; }
      });
    }

    // ── Also handle raw <pre><code> that marked might produce ──
    // (marked may or may not wrap mermaid in language-mermaid class)
    const extraMermaidRegex = /<pre><code>((?:graph |sequenceDiagram|gantt|stateDiagram|pie|mindmap)[\s\S]*?)<\/code><\/pre>/g;
    if (mermaidMatches.length > 0) {
      // Already handled if marked detected the language
    }
  } catch { /* keep original content on error */ }

  return buildHtmlDoc(title, bodyHtml);
}

/** Build a complete HTML document for rich export */
function buildHtmlDoc(title: string, htmlBody: string, extraStyle = ""): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${safeName(title)}</title>
<style>
  body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; font-size: 15px; line-height: 1.85; color: #222; max-width: 720px; margin: 2em auto; padding: 0 1.5em; }
  h1 { font-size: 1.8em; margin: 1.2em 0 0.5em; }
  h2 { font-size: 1.4em; margin: 1em 0 0.4em; }
  h3 { font-size: 1.15em; margin: 0.8em 0 0.3em; }
  p { margin: 0.5em 0; }
  img { max-width: 100%; border-radius: 6px; margin: 0.5em 0; }
  blockquote { border-left: 3px solid #6b8c5c; padding: 0.5em 1em; margin: 1em 0; background: #f5f2ed; color: #555; }
  pre { background: #f5f2ed; padding: 1em; border-radius: 6px; overflow-x: auto; font-size: 0.9em; }
  code { background: #f5f2ed; padding: 0.15em 0.35em; border-radius: 3px; font-size: 0.9em; }
  ul, ol { padding-left: 1.5em; margin: 0.5em 0; }
  li { margin-bottom: 0.25em; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  td, th { border: 1px solid #ddd; padding: 0.5em; }
  mark { padding: 0.05em 0.15em; border-radius: 2px; }
  ${extraStyle}
</style>
</head>
<body>
<h1>${title}</h1>
${htmlBody}
</body>
</html>`;
}

// ── Export: Markdown ────────────────────────────────────

export async function exportMD(title: string, contentMd: string) {
  let md = absolutizeMdPaths(contentMd);

  try {
    // ── Render mermaid blocks as embedded SVG images ──
    const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
    const mermaidMatches: { original: string; code: string }[] = [];
    let m;
    while ((m = mermaidRegex.exec(md)) !== null) {
      mermaidMatches.push({ original: m[0], code: m[1] });
    }
    if (mermaidMatches.length > 0) {
      const mermaid = await getMermaid();
      if (mermaid) {
        mermaid.initialize({ startOnLoad: false, theme: "default" });
        for (const match of mermaidMatches) {
          try {
            const id = "md-" + Math.random().toString(36).slice(2, 8);
            const { svg } = await mermaid.render(id, match.code);
            const b64 = btoa(unescape(encodeURIComponent(svg)));
            const imgMarkdown = `![图表](data:image/svg+xml;base64,${b64})`;
            md = md.replace(match.original, imgMarkdown);
          } catch { /* keep original code */ }
        }
      }
    }

    // LaTeX formulas are kept as-is ($...$ / $$...$$) in markdown.
    // Most markdown viewers (Typora, VS Code + extensions) render them natively.
  } catch { /* keep original on error */ }

  downloadBlob(md, `${safeName(title)}.md`, "text/markdown;charset=utf-8");
}

// ── Export: Word (.doc) ─────────────────────────────────

export function exportWord(title: string, htmlBody: string) {
  // Convert relative image paths to absolute URLs
  const withAbsoluteImgs = absolutizeImgPaths(htmlBody);

  const wordMeta = `
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40"`;
  const doc = buildHtmlDoc(title, withAbsoluteImgs)
    .replace("<html>", `<html ${wordMeta}>`)
    .replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta http-equiv="Content-Type" content="text/html; charset=utf-8">');
  downloadBlob(doc, `${safeName(title)}.doc`, "application/msword;charset=utf-8");
}

// ── Export: PDF (via browser print → Save as PDF) ─────

export function exportPDF(title: string, htmlBody: string) {
  const withAbsoluteImgs = absolutizeImgPaths(htmlBody);

  const doc = buildHtmlDoc(title, withAbsoluteImgs, `
    @media print {
      body { margin: 0; padding: 1.5em; }
      @page { margin: 1.5cm; size: A4; }
    }
  `);

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("请允许弹出窗口以导出 PDF");
    return;
  }
  printWindow.document.write(doc);
  printWindow.document.close();

  printWindow.onload = () => {
    const imgs = printWindow.document.querySelectorAll("img");
    let loaded = 0;
    const total = imgs.length;

    const tryPrint = () => {
      const hint = printWindow.document.createElement("div");
      hint.style.cssText = "position:fixed;top:10px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 20px;border-radius:8px;font-size:14px;z-index:9999;pointer-events:none;";
      hint.textContent = "请在打印对话框中选择「另存为 PDF」→ 保存";
      printWindow.document.body.appendChild(hint);
      setTimeout(() => { hint.remove(); printWindow.print(); }, 1500);
    };

    if (total === 0) {
      tryPrint();
      return;
    }
    imgs.forEach((img) => {
      if (img.complete) {
        loaded++;
        if (loaded === total) tryPrint();
      } else {
        img.addEventListener("load", () => { loaded++; if (loaded === total) tryPrint(); });
        img.addEventListener("error", () => { loaded++; if (loaded === total) tryPrint(); });
      }
    });
    setTimeout(() => { if (loaded < total) tryPrint(); }, 5000);
  };
}
