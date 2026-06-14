"use client";

// ============================================================
// Digital Garden 3.0 — EntryRenderer (Enhanced)
// ============================================================
// 只读渲染：TipTap JSON → HTML
// 新增：图片灯箱 · 代码块语言标签+复制 · 内联高亮
//       · 标题锚点链接（hover 显示 #）
// ============================================================

import { useState, useCallback, useEffect, useRef } from "react";
import { jsonToHtml } from "@/lib/tiptap-render";

// ── Props ─────────────────────────────────────────────

interface EntryRendererProps {
  content: string; // TipTap JSON string from database
}

// ── Image Lightbox ─────────────────────────────────────

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="garden-lightbox" onClick={onClose}>
      <button className="lb-close" onClick={onClose} aria-label="关闭">✕</button>
      <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

// ── Component ─────────────────────────────────────────

export default function EntryRenderer({ content }: EntryRendererProps) {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  let json: Record<string, unknown> | null = null;

  try {
    json = JSON.parse(content);
  } catch {
    return <EmptyContent />;
  }

  if (!json) return <EmptyContent />;

  const html = jsonToHtml(json);
  if (!html) return <EmptyContent />;

  // ── Attach event handlers after render ──────────────

  const handleContainerRef = useCallback((el: HTMLDivElement | null) => {
    (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (!el) return;

    // Image click → lightbox
    const imgs = el.querySelectorAll("img");
    imgs.forEach((img) => {
      if (img.dataset.lightboxBound) return;
      img.dataset.lightboxBound = "1";
      img.addEventListener("click", () => {
        setLightbox({ src: img.src, alt: img.alt || "" });
      });
    });

    // Render Mermaid diagrams
    const mermaidBlocks = el.querySelectorAll("[data-type='mermaid']");
    mermaidBlocks.forEach(async (block) => {
      if (block.querySelector("svg")) return;
      const code = block.textContent || "";
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: document.documentElement.classList.contains("dark") ? "dark" : "default" });
        const id = "rm-" + Math.random().toString(36).slice(2, 10);
        const { svg } = await mermaid.render(id, code);
        const div = document.createElement("div");
        div.className = "flex justify-center overflow-x-auto my-3";
        div.innerHTML = svg;
        block.appendChild(div);
      } catch {}
    });

    // Render inline math: $...$ and $$...$$ patterns
    const walkTextNodes = (node: Node) => {
      if (node.nodeType === 3 && node.textContent?.includes("$")) { // Text node
        const txt = node.textContent;
        const parts = txt.split(/(\${1,2}[^$]+\${1,2})/g);
        if (parts.length <= 1) return;
        const frag = document.createDocumentFragment();
        parts.forEach(async (part) => {
          if ((part.startsWith("$$") && part.endsWith("$$")) || (part.startsWith("$") && part.endsWith("$") && !part.startsWith("$$"))) {
            const isDisplay = part.startsWith("$$");
            const formula = isDisplay ? part.slice(2, -2) : part.slice(1, -1);
            const span = document.createElement("span");
            span.className = isDisplay ? "display-math" : "inline-math";
            try {
              const katex = (await import("katex")).default;
              span.innerHTML = katex.renderToString(formula, { throwOnError: false, displayMode: isDisplay });
              span.style.cssText = isDisplay
                ? "display:block;text-align:center;margin:1em 0;font-size:1.1em"
                : "display:inline-block;vertical-align:middle;font-size:1.05em";
            } catch { span.textContent = part; }
            frag.appendChild(span);
          } else {
            frag.appendChild(document.createTextNode(part));
          }
        });
        node.parentNode?.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        node.childNodes.forEach(walkTextNodes);
      }
    };
    el.childNodes.forEach(walkTextNodes);

    // Render Math blocks
    const mathBlocks = el.querySelectorAll("[data-type='mathBlock']");
    mathBlocks.forEach(async (block) => {
      if (block.querySelector(".katex")) return;
      const formula = block.textContent || "";
      try {
        const katex = (await import("katex")).default;
        const html = katex.renderToString(formula, { throwOnError: false, displayMode: true });
        const div = document.createElement("div");
        div.className = "flex justify-center my-3 text-foreground text-lg";
        div.innerHTML = html;
        block.appendChild(div);
      } catch {}
    });

    // Code copy buttons
    const codeBlocks = el.querySelectorAll(".code-block-wrapper pre");
    codeBlocks.forEach((pre) => {
      const wrapper = pre.parentElement;
      if (!wrapper || wrapper.querySelector(".code-copy-btn")) return;
      const btn = document.createElement("button");
      btn.className = "code-copy-btn";
      btn.textContent = "复制";
      btn.addEventListener("click", async () => {
        const code = pre.textContent || "";
        try {
          await navigator.clipboard.writeText(code);
          btn.textContent = "已复制!";
          setTimeout(() => { btn.textContent = "复制"; }, 2000);
        } catch {
          // Fallback
          const ta = document.createElement("textarea");
          ta.value = code;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          btn.textContent = "已复制!";
          setTimeout(() => { btn.textContent = "复制"; }, 2000);
        }
      });
      wrapper.appendChild(btn);
    });

    // Heading anchor links (hover to reveal "#")
    const headings = el.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id]");
    headings.forEach((h) => {
      if (h.querySelector(".heading-anchor")) return;
      const anchor = document.createElement("a");
      anchor.className = "heading-anchor";
      anchor.href = `#${h.id}`;
      anchor.textContent = "#";
      anchor.title = "复制此段落的链接";
      anchor.addEventListener("click", (e) => {
        e.preventDefault();
        const url = `${window.location.pathname}#${h.id}`;
        navigator.clipboard.writeText(url).catch(() => {});
        history.replaceState(null, "", url);
      });
      h.appendChild(anchor);
    });
  }, [html]);

  return (
    <>
      <div
        ref={handleContainerRef}
        className="prose prose-sm max-w-none text-foreground"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {lightbox && (
        <Lightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}

// ── Empty state ────────────────────────────────────────

function EmptyContent() {
  return (
    <div className="rounded-lg border border-border bg-card p-12 text-center">
      <p className="text-4xl mb-3">🌱</p>
      <p className="text-sm text-muted-foreground">暂无内容</p>
    </div>
  );
}
