// ============================================================
// Digital Garden 2.0 — Export Utilities
// ============================================================
// MD → 直接下载 | Word → HTML 包装 .doc | PDF → 浏览器打印
// ============================================================

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

/** Build a complete HTML document for rich export */
function buildHtmlDoc(title: string, htmlBody: string, extraStyle = ""): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body { font-family: "Microsoft YaHei", "微软雅黑", Georgia, serif; font-size: 15px; line-height: 1.85; color: #222; max-width: 720px; margin: 2em auto; padding: 0 1.5em; }
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

/** Export as Markdown */
export function exportMD(title: string, contentMd: string) {
  downloadBlob(contentMd, `${safeName(title)}.md`, "text/markdown;charset=utf-8");
}

/** Export as Word (.doc) — self-contained HTML that Word can open */
export function exportWord(title: string, htmlBody: string) {
  // Convert relative image paths to absolute URLs
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const withAbsoluteImgs = htmlBody.replace(
    /<img\s+src="(\/[^"]+)"/g,
    (_, path) => `<img src="${origin}${path}"`
  );

  const wordMeta = `
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40"`;
  const doc = buildHtmlDoc(title, withAbsoluteImgs)
    .replace("<html>", `<html ${wordMeta}>`)
    .replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta http-equiv="Content-Type" content="text/html; charset=utf-8">');
  downloadBlob(doc, `${safeName(title)}.doc`, "application/msword;charset=utf-8");
}

/** Export as PDF — uses browser's native PDF engine via print (handles Chinese reliably) */
export function exportPDF(title: string, htmlBody: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const withAbsoluteImgs = htmlBody.replace(
    /<img\s+src="(\/[^"]+)"/g,
    (_, path) => `<img src="${origin}${path}"`
  );

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("请允许弹出窗口以导出 PDF");
    return;
  }

  const doc = buildHtmlDoc(title, withAbsoluteImgs, `
    @media print {
      body { margin: 0; padding: 1.5em; }
      @page { margin: 1.5cm; size: A4; }
    }
    body { font-family: "Microsoft YaHei", "微软雅黑", "PingFang SC", "Noto Sans SC", sans-serif; }
  `);

  printWindow.document.write(doc);
  printWindow.document.close();

  // Wait for images to load, then trigger print
  printWindow.onload = () => {
    const imgs = printWindow.document.querySelectorAll("img");
    let loaded = 0;
    const total = imgs.length;
    if (total === 0) {
      setTimeout(() => printWindow.print(), 300);
      return;
    }
    imgs.forEach((img) => {
      if (img.complete) {
        loaded++;
        if (loaded === total) setTimeout(() => printWindow.print(), 300);
      } else {
        img.onload = () => {
          loaded++;
          if (loaded === total) setTimeout(() => printWindow.print(), 300);
        };
        img.onerror = () => {
          loaded++;
          if (loaded === total) setTimeout(() => printWindow.print(), 300);
        };
      }
    });
  };
}
