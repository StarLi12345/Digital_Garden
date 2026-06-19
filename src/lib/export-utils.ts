// ============================================================
// Digital Garden — Export Utilities
// ============================================================
// MD  → 下载 .md 文件（图片路径转为绝对 URL）
// Word → 下载 .doc 文件（自包含 HTML，图片路径绝对化）
// PDF  → 浏览器打印（选择「另存为 PDF」即可下载）
// ============================================================

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

export function exportMD(title: string, contentMd: string) {
  // Convert relative image paths to absolute so they display in local viewers
  const fixedMd = absolutizeMdPaths(contentMd);
  downloadBlob(fixedMd, `${safeName(title)}.md`, "text/markdown;charset=utf-8");
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

// ── Export: PDF (via browser print → Save as PDF) ───────

export function exportPDF(title: string, htmlBody: string) {
  const withAbsoluteImgs = absolutizeImgPaths(htmlBody);

  const doc = buildHtmlDoc(title, withAbsoluteImgs, `
    @media print {
      body { margin: 0; padding: 1.5em; }
      @page { margin: 1.5cm; size: A4; }
    }
    body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; }
  `);

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("请允许弹出窗口以导出 PDF");
    return;
  }

  printWindow.document.write(doc);
  printWindow.document.close();

  // Wait for all images to load, then trigger print
  printWindow.onload = () => {
    const imgs = printWindow.document.querySelectorAll("img");
    let loaded = 0;
    const total = imgs.length;

    const tryPrint = () => {
      // Show a brief hint then print
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
    // Timeout fallback after 5 seconds
    setTimeout(() => { if (loaded < total) tryPrint(); }, 5000);
  };
}
