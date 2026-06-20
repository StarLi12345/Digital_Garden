"use client";

// ============================================================
// Digital Garden 3.0 — EntryRenderer (Component-Tree Mode)
// ============================================================
// Renders TipTap JSON as a React component tree.
// Each block type gets its own component — mermaid/math blocks
// render their diagrams directly, no string manipulation needed.
// ============================================================

import { useState, useMemo } from "react";
import { DocRenderer } from "./view-blocks";

// ── Image Lightbox ─────────────────────────────────────

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div className="garden-lightbox" onClick={onClose}>
      <button className="lb-close" onClick={onClose} aria-label="关闭">✕</button>
      <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

// ── Props ─────────────────────────────────────────────

interface EntryRendererProps {
  content: string;
  contentMd?: string;
}

// ── Component ─────────────────────────────────────────

export default function EntryRenderer({ content }: EntryRendererProps) {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const json = useMemo(() => {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && parsed.type) {
        return parsed as Record<string, unknown>;
      }
    } catch { /* */ }
    return null;
  }, [content]);

  if (!json) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <p className="text-4xl mb-3">🌱</p>
        <p className="text-sm text-muted-foreground">暂无内容</p>
      </div>
    );
  }

  const headingIndex = new Map<string, number>();

  return (
    <>
      <div
        className="prose prose-sm max-w-none text-foreground"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === "IMG") {
            setLightbox({ src: (target as HTMLImageElement).src, alt: (target as HTMLImageElement).alt || "" });
          }
        }}
      >
        <DocRenderer node={json as any} headingIndex={headingIndex} />
      </div>

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
