"use client";

// ============================================================
// Digital Garden — TOC Scroll Highlighter
// ============================================================
// 参考博客园 awescnb/geek 设计：
// IntersectionObserver 追踪内容区标题，高亮当前章节
// ============================================================

import { useEffect, useState, useRef, useCallback } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TocHighlighterProps {
  /** CSS selector to find the content container with headings */
  containerSelector?: string;
}

export function TocHighlighter({ containerSelector = "article" }: TocHighlighterProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Scan for headings and build TOC items
  useEffect(() => {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const headings = container.querySelectorAll("h2, h3");
    const toc: TocItem[] = [];
    headings.forEach((h, i) => {
      const id = h.id || `toc-h${i}`;
      if (!h.id) h.id = id;
      toc.push({
        id,
        text: h.textContent || "",
        level: h.tagName === "H2" ? 2 : 3,
      });
    });
    setItems(toc);
  }, [containerSelector]);

  // IntersectionObserver to track active heading
  useEffect(() => {
    if (items.length === 0) return;

    const headingElements = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    if (headingElements.length === 0) return;

    if (observerRef.current) observerRef.current.disconnect();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break; // Use the first visible one (closest to top)
          }
        }
      },
      {
        rootMargin: "-80px 0px -70% 0px", // Trigger when heading is near top
        threshold: 0,
      }
    );

    headingElements.forEach((el) => observer.observe(el));
    observerRef.current = observer;

    return () => observer.disconnect();
  }, [items]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <nav className="toc-nav text-xs">
      <p className="text-[0.625rem] text-muted-foreground uppercase tracking-wider mb-2 font-medium">目录</p>
      <ul className="space-y-0.5 border-l border-border">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => scrollTo(item.id)}
              className={`block w-full text-left py-1 text-xs truncate interactive transition-colors hover:text-foreground ${
                item.level === 2 ? "pl-3" : "pl-6"
              } ${
                activeId === item.id
                  ? "text-primary font-medium border-l-2 border-primary -ml-px"
                  : "text-muted-foreground border-l-2 border-transparent -ml-px"
              }`}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
