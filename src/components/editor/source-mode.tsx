"use client";

// ============================================================
// Digital Garden 2.0 — Source Code Mode (Markdown 编辑 + 预览)
// ============================================================
// 左侧 Markdown 源码编辑 · 右侧实时 HTML 预览
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { marked } from "marked";

// Configure marked for safe rendering
marked.setOptions({ breaks: true, gfm: true });

interface SourceModeProps {
  initialMd: string;
  onChange: (md: string) => void;
}

export function SourceMode({ initialMd, onChange }: SourceModeProps) {
  const [md, setMd] = useState(initialMd);
  const [html, setHtml] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const rendered = marked.parse(md) as string;
      setHtml(rendered);
    } catch {
      setHtml("<p style='color:red'>Markdown 解析错误</p>");
    }
  }, [md]);

  useEffect(() => {
    // Scroll sync: when user scrolls editor, sync preview
    const editor = document.getElementById("source-editor");
    const preview = previewRef.current;
    if (!editor || !preview) return;

    const syncScroll = () => {
      const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
      preview.scrollTop = ratio * (preview.scrollHeight - preview.clientHeight);
    };

    editor.addEventListener("scroll", syncScroll, { passive: true });
    return () => editor.removeEventListener("scroll", syncScroll);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setMd(value);
      onChange(value);
    },
    [onChange]
  );

  return (
    <div
      className="source-mode-container"
      style={{ height: "62vh", fontFamily: "var(--font-mono, monospace)" }}
    >
      {/* Left: Markdown Editor */}
      <div className="source-mode-editor flex-1 min-w-0">
        <textarea
          id="source-editor"
          value={md}
          onChange={handleChange}
          className="w-full h-full resize-none p-6 text-sm font-mono leading-relaxed outline-none border-none"
          style={{ background: "transparent", color: "var(--color-foreground)" }}
          placeholder="在此编写 Markdown…"
          spellCheck={false}
        />
      </div>

      {/* Divider */}
      <div className="w-px bg-border shrink-0" />

      {/* Right: Live Preview */}
      <div
        ref={previewRef}
        className="source-mode-preview flex-1 min-w-0 overflow-y-auto p-6 prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <style jsx>{`
        .source-mode-container {
          display: flex;
          gap: 0;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-card);
          box-shadow: var(--shadow-lighter);
          overflow: hidden;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .source-mode-container:focus-within {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
        }
        .source-mode-editor {
          background: var(--color-card);
        }
        .source-mode-preview {
          background: var(--color-muted);
        }
      `}</style>
    </div>
  );
}
