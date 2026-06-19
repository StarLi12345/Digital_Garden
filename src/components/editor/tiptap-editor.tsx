"use client";

// ============================================================
// Digital Garden — TipTap Editor v5
// ============================================================
// · JS 驱动悬停 "+"（宽触发区 · 按钮保持 · 延迟消失）
// · 可见编辑器边界 · 闪烁光标 · 占位提示
// · Ctrl+V 粘贴图片 · / 斜杠命令 · [[ 内部引用
// ============================================================

import { useCallback, useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { WikiLinkAwareLink } from "./wikilink-extension";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import ImageExtension from "@tiptap/extension-image";
import { TextStyleKit as TextStyle } from "@tiptap/extension-text-style";
import { Color as TipTapColor } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import { Callout } from "./callout-extension";
import { MermaidBlock } from "./mermaid-extension";
import { MathBlock } from "./math-extension";
import { KeyboardShortcuts } from "./shortcuts-extension";
import { DragHandle } from "./drag-handle-extension";
import { BlockMenu, WikiLinkPopover, MediaPrompt, NumberingPopover, HIGHLIGHT_COLORS } from "./block-menu";
import { jsonToMarkdown } from "@/lib/markdown";
import { searchEntries } from "@/actions/entry-actions";

// ── Helpers ────────────────────────────────────────────

function FmtBtn({ editor, action, label, title }: { editor: any; action: string; label: string; title: string }) {
  if (!editor) return null;
  const isActive = (() => {
    if (action.startsWith("align")) {
      return editor.isActive({ textAlign: action.replace("align", "").toLowerCase() });
    }
    return editor.isActive(
      action === "highlight" ? "highlight" :
      action === "strike" ? "strike" :
      action
    );
  })();
  const run = () => {
    const c = editor.chain().focus();
    switch (action) {
      case "bold": c.toggleBold().run(); break;
      case "italic": c.toggleItalic().run(); break;
      case "underline": c.toggleUnderline().run(); break;
      case "strike": c.toggleStrike().run(); break;
      case "code": c.toggleCode().run(); break;
      case "link": {
        if (editor.isActive("link")) { c.unsetLink().run(); }
        else { const url = window.prompt("链接 URL"); if (url) c.setLink({ href: url }).run(); }
        break;
      }
      case "highlight": {
        // With multicolor: true, toggleHighlight needs a matching color to remove.
        // Better: unset any existing highlight, or apply default if none active.
        if (editor.isActive("highlight")) {
          c.unsetHighlight().run();
        } else {
          c.toggleHighlight({ color: "#fff176" }).run();
        }
        break;
      }
      case "heading": c.toggleHeading({ level: 2 }).run(); break;
      case "paragraph": c.setParagraph().run(); break;
      case "blockquote": c.toggleBlockquote().run(); break;
      case "bulletList": c.toggleBulletList().run(); break;
      case "orderedList": c.toggleOrderedList().run(); break;
      case "alignLeft": c.setTextAlign("left").run(); break;
      case "alignCenter": c.setTextAlign("center").run(); break;
      case "alignRight": c.setTextAlign("right").run(); break;
    }
  };
  return (
    <button onMouseDown={(e) => { e.preventDefault(); run(); }} title={title}
      className={`w-7 h-7 rounded text-xs font-medium interactive flex items-center justify-center ${isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
      {label}
    </button>
  );
}

function insertImageAtPos(view: any, src: string, pos?: number) {
  const imgNode = view.state.schema.nodes.image;
  const { tr } = view.state;
  const insertPos = pos ?? view.state.selection.from;
  if (imgNode) {
    view.dispatch(tr.insert(insertPos, imgNode.create({ src })));
  } else {
    const html = `<img src="${src}" alt="" />`;
    const dom = new DOMParser().parseFromString(html, "text/html").body.firstChild;
    if (dom) {
      const node = view.state.schema.nodeFromDOM(dom as HTMLElement);
      if (node) view.dispatch(tr.insert(insertPos, node));
    }
  }
}

// ── Props ──────────────────────────────────────────────

export interface EditorChangePayload {
  content: Record<string, unknown>;
  contentMd: string;
}

interface TipTapEditorProps {
  initialContent?: Record<string, unknown>;
  onChange?: (payload: EditorChangePayload) => void;
  placeholder?: string;
}

// ── Component ──────────────────────────────────────────

export default function TipTapEditor({
  initialContent, onChange, placeholder = "请开始你的编辑…",
}: TipTapEditorProps) {
  const [blockMenu, setBlockMenu] = useState<{ x: number; y: number } | null>(null);
  const [wikiSearch, setWikiSearch] = useState<string | null>(null);
  const [mediaPrompt, setMediaPrompt] = useState<"image" | "video" | "audio" | "link" | null>(null);
  const [wikiEntries, setWikiEntries] = useState<{ slug: string; title: string }[]>([]);
  const [numPopover, setNumPopover] = useState<{ x: number; y: number; pos: number } | null>(null);
  const [highlightPicker, setHighlightPicker] = useState<{ x: number; y: number } | null>(null);

  // ── Hover "+" state ──────────────────────────────────
  const [hoverPlus, setHoverPlus] = useState<{ x: number; y: number; blockPos: number } | null>(null);
  const hoverPlusBtnRef = useRef<HTMLButtonElement>(null);
  const isOverBtnRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorDomRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5] } }),
      WikiLinkAwareLink.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      Callout, MermaidBlock, MathBlock, DragHandle, TaskList, TaskItem.configure({ nested: true }), Underline,
      Highlight.configure({ multicolor: true }),
      ImageExtension.configure({ inline: false, allowBase64: true }),
      TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right"] }),
      TextStyle, TipTapColor,
      KeyboardShortcuts,
    ],
    content: initialContent || { type: "doc", content: [{ type: "paragraph", content: [] }] },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none text-foreground leading-relaxed",
        "data-placeholder": placeholder,
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) return false;
            const reader = new FileReader();
            reader.onload = () => insertImageAtPos(view, reader.result as string);
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          event.preventDefault();
          const files = Array.from(event.dataTransfer.files).filter(f => f.type.startsWith("image/"));
          if (files.length === 0) return false;
          // Insert each image at the drop position, then offset for subsequent inserts
          const basePos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
          files.forEach((file, idx) => {
            const reader = new FileReader();
            reader.onload = () => {
              insertImageAtPos(view, reader.result as string, basePos != null ? basePos + idx : undefined);
            };
            reader.readAsDataURL(file);
          });
          return true;
        }
        return false;
      },
      handleClickOn: (view, pos, node, _nodePos, event, direct) => {
        if (!direct) return false;
        // Click on an ordered list item → show numbering popover
        if (node.type.name === "listItem" && view.state.doc.resolve(pos).parent.attrs?.order !== undefined) {
          // Check if click was near the left edge (marker area)
          const coords = view.coordsAtPos(pos);
          const clickX = (event as MouseEvent).clientX;
          if (clickX < coords.left + 40) {
            setNumPopover({
              x: coords.left,
              y: coords.top - 4,
              pos,
            });
            return false;
          }
        }
        setNumPopover(null);
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (!onChange) return;
      const json = editor.getJSON();
      const md = jsonToMarkdown(json as Parameters<typeof jsonToMarkdown>[0]);
      onChange({ content: json, contentMd: md });
    },
  });

  // ── Slash command: "/" at line start → menu ──────────

  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      const { $from } = editor.state.selection;
      const textBefore = $from.parent.textBetween(0, $from.parentOffset);
      if (textBefore === "/" && $from.parentOffset === 1) {
        const coords = editor.view.coordsAtPos($from.pos);
        setBlockMenu({ x: coords.left, y: coords.bottom + 6 });
      }
    };
    editor.on("update", handler);
    return () => { editor.off("update", handler); };
  }, [editor]);

  // ── Hover "+" — robust mousemove with persistence ────

  const clearHideTimer = () => {
    if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
  };

  const showPlus = (x: number, y: number, blockPos: number) => {
    clearHideTimer();
    // Clamp x so the "+" button never slides off-screen left (mobile fix)
    const clampedX = Math.max(8, x);
    setHoverPlus({ x: clampedX, y, blockPos });
  };

  const hidePlusDelayed = () => {
    // Only hide if mouse is NOT over the button itself
    if (isOverBtnRef.current) return;
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      if (!isOverBtnRef.current) setHoverPlus(null);
    }, 150); // 150ms delay before hiding
  };

  useEffect(() => {
    const container = editorDomRef.current;
    if (!container || !editor) return;

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const block = target.closest(
        ".ProseMirror p, .ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror ul, .ProseMirror ol, .ProseMirror blockquote, .ProseMirror pre, .ProseMirror [data-type]"
      );
      if (!block) { hidePlusDelayed(); return; }

      const blockRect = block.getBoundingClientRect();
      const relativeX = e.clientX - blockRect.left;
      const relativeY = e.clientY - blockRect.top;

      if (relativeX >= -70 && relativeX <= 15 && relativeY >= 0 && relativeY <= blockRect.height) {
        showPlus(
          blockRect.left - 52,
          blockRect.top + blockRect.height / 2,
          0
        );
      } else {
        hidePlusDelayed();
      }
    };

    const handleMouseLeave = () => hidePlusDelayed();

    // Touch support: show + button on tap near left edge, persist until dismissed
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
      if (!target) return;
      // If tapping the + button itself, let the button's onClick handle it
      if (hoverPlusBtnRef.current?.contains(target)) return;
      const block = target.closest(
        ".ProseMirror p, .ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5, .ProseMirror ul, .ProseMirror ol, .ProseMirror blockquote, .ProseMirror pre, .ProseMirror [data-type]"
      );
      if (!block) { setHoverPlus(null); return; }
      const blockRect = block.getBoundingClientRect();
      const relativeX = touch.clientX - blockRect.left;
      // Wider zone for mobile: tap within first 54px of block (or just outside left edge)
      if (relativeX >= -8 && relativeX <= 54) {
        showPlus(blockRect.left - 52, blockRect.top + blockRect.height / 2, 0);
      } else {
        setHoverPlus(null); // tapped elsewhere in editor → dismiss
      }
    };
    // Dismiss + only if touch is OUTSIDE the editor container
    const handleTouchDismiss = (e: TouchEvent) => {
      const target = e.target as Node;
      if (container.contains(target)) return; // let container handler decide
      if (hoverPlusBtnRef.current?.contains(target)) return;
      setHoverPlus(null);
    };
    container.addEventListener("mousemove", handleMouseMove, { passive: true });
    container.addEventListener("mouseleave", handleMouseLeave);
    const handleScroll = () => setHoverPlus(null);
    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("touchstart", handleTouchDismiss, { passive: true });
    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("scroll", handleScroll);
      document.removeEventListener("touchstart", handleTouchDismiss);
      clearHideTimer();
    };
  }, [editor]);

  // ── Floating format toolbar (Notion-style text selection) ─

  const [formatBar, setFormatBar] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      const { from, to, empty } = editor.state.selection;
      if (empty || from === to) { setFormatBar(null); return; }
      const { view } = editor;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);
      setFormatBar({
        x: (start.left + end.right) / 2,
        y: start.top - 44,
      });
    };
    editor.on("selectionUpdate", handler);
    editor.on("blur", () => setFormatBar(null));
    return () => { editor.off("selectionUpdate", handler); editor.off("blur", () => setFormatBar(null)); };
  }, [editor]);

  // ── Hover "+" button mouse enter/leave ───────────────

  const handleBtnEnter = useCallback(() => {
    isOverBtnRef.current = true;
    clearHideTimer();
  }, []);

  const handleBtnLeave = useCallback(() => {
    isOverBtnRef.current = false;
    hidePlusDelayed();
  }, []);

  // ── Wiki search [[ ───────────────────────────────────
  const [wikiLoading, setWikiLoading] = useState(false);

  useEffect(() => {
    if (wikiSearch !== null) {
      setWikiLoading(true);
      (async () => {
        try {
          const results = await searchEntries(wikiSearch || "");
          setWikiEntries(results.map((e: { slug: string; title: string }) => ({ slug: e.slug, title: e.title })));
        } catch { setWikiEntries([]); }
        setWikiLoading(false);
      })();
    }
  }, [wikiSearch]);

  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      const { from, empty } = editor.state.selection;
      if (!empty) return;
      const $pos = editor.state.doc.resolve(from);
      const textBefore = $pos.parent.textContent.slice(0, $pos.parentOffset);
      const match = textBefore.match(/\[\[([^\]\]]*)$/);
      setWikiSearch(match ? match[1] : null);
    };
    editor.on("selectionUpdate", handler);
    editor.on("update", handler);
    return () => { editor.off("selectionUpdate", handler); editor.off("update", handler); };
  }, [editor]);

  // ── Block menu actions ───────────────────────────────

  const handleBlockAction = useCallback((action: string, level?: number, color?: string) => {
    if (!editor) return;
    const { $from } = editor.state.selection;
    const textBefore = $from.parent.textBetween(0, $from.parentOffset);
    const c = editor.chain().focus();

    if (textBefore === "/" || textBefore.endsWith("/")) {
      const deleteFrom = $from.pos - 1;
      c.deleteRange({ from: deleteFrom, to: $from.pos });
    }

    switch (action) {
      case "heading": c.toggleHeading({ level: (level || 2) as 1|2|3|4|5 }).run(); break;
      case "paragraph": c.setParagraph().run(); break;
      case "bold": c.toggleBold().run(); break;
      case "italic": c.toggleItalic().run(); break;
      case "underline": c.toggleUnderline().run(); break;
      case "highlight": {
        if (color === "clear") {
          c.unsetHighlight().run();
        } else {
          c.toggleHighlight({ color: color || "#fff176" }).run();
        }
        break;
      }
      case "blockquote": c.toggleBlockquote().run(); break;
      case "codeBlock": c.toggleCodeBlock().run(); break;
      case "horizontalRule": c.setHorizontalRule().run(); break;
      case "callout": c.toggleWrap("callout").run(); break;
      case "bulletList": c.toggleBulletList().run(); break;
      case "orderedList": c.toggleOrderedList().run(); break;
      case "taskList": c.toggleTaskList().run(); break;
      case "alignLeft": c.setTextAlign("left").run(); break;
      case "alignCenter": c.setTextAlign("center").run(); break;
      case "alignRight": c.setTextAlign("right").run(); break;
      case "color": {
        if (color && color !== "default") {
          c.setColor(color).run();
        } else {
          c.unsetColor().run();
        }
        break;
      }
      case "image": setMediaPrompt("image"); break;
      case "video": setMediaPrompt("video"); break;
      case "audio": setMediaPrompt("audio"); break;
      case "link": {
        if (editor.isActive("link")) c.unsetLink().run();
        else setMediaPrompt("link");
        break;
      }
      case "wikiLink": setWikiSearch(""); break;
      case "mermaid": editor.chain().focus().insertContent({ type: "mermaid", content: [{ type: "text", text: "graph TD\n  A[开始] --> B[结束]" }] }).run(); break;
      case "mathBlock": editor.chain().focus().insertContent({ type: "mathBlock", content: [{ type: "text", text: "E = mc^2" }] }).run(); break;
    }
  }, [editor]);

  const handleMediaConfirm = useCallback((url: string, label?: string) => {
    if (!editor) return;
    switch (mediaPrompt) {
      case "image": editor.chain().focus().insertContent(`<img src="${url}" alt="" />`).run(); break;
      case "video": editor.chain().focus().insertContent(`<div data-type="video"><video src="${url}" controls style="max-width:100%;border-radius:8px;"></video></div>`).run(); break;
      case "audio": editor.chain().focus().insertContent(`<div data-type="audio"><audio src="${url}" controls style="width:100%;"></audio></div>`).run(); break;
      case "link": editor.chain().focus().setLink({ href: url }).insertContent(label || url).run(); break;
    }
    setMediaPrompt(null);
  }, [editor, mediaPrompt]);

  const handleWikiSelect = useCallback((slug: string, title: string) => {
    if (!editor) return;
    const { from } = editor.state.selection;
    const $pos = editor.state.doc.resolve(from);
    const textBefore = $pos.parent.textContent.slice(0, $pos.parentOffset);
    const bracketIdx = textBefore.lastIndexOf("[[");
    // Insert as a proper link mark, not raw markdown text.
    // This renders as clickable "title" in visual mode, and [title](/entry/slug) in source mode.
    const linkNode = {
      type: "text",
      text: title,
      marks: [{ type: "link", attrs: { href: `/entry/${slug}` } }],
    };
    if (bracketIdx >= 0) {
      const deleteFrom = from - (textBefore.length - bracketIdx);
      editor.chain().focus().deleteRange({ from: deleteFrom, to: from })
        .insertContent(linkNode).run();
    } else {
      editor.chain().focus().insertContent(linkNode).run();
    }
    setWikiSearch(null);
  }, [editor]);

  const handleHoverPlusClick = useCallback(() => {
    if (!editor) return;
    editor.commands.focus();
  }, [editor]);

  // ── Render ────────────────────────────────────────────

  return (
    <div
      className="relative garden-editor-area"
      style={{ position: "relative" }}
      ref={editorDomRef}
    >
      {/* Editor body */}
      <EditorContent editor={editor} />

      {/* Hover "+" button — fixed positioning, persists on hover */}
      {hoverPlus && (
        <button
          ref={hoverPlusBtnRef}
          onClick={() => {
            handleHoverPlusClick();
            const btn = hoverPlusBtnRef.current;
            if (btn) {
              const r = btn.getBoundingClientRect();
              setBlockMenu({ x: r.right + 4, y: r.top - 4 });
            }
          }}
          onMouseEnter={handleBtnEnter}
          onMouseLeave={handleBtnLeave}
          className="fixed z-50 w-6 h-6 rounded bg-muted border border-border text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-primary/30 interactive flex items-center justify-center text-sm shadow-sm"
          style={{
            left: hoverPlus.x,
            top: hoverPlus.y,
            transform: "translateY(-50%)",
          }}
          title="插入内容块"
        >+</button>
      )}

      {/* Floating format toolbar — expanded selection menu */}
      {formatBar && (
        <div
          className="fixed z-50 flex items-center gap-0.5 rounded-lg border border-border bg-card shadow-lg px-1.5 py-1 animate-toast-in overflow-x-auto flex-nowrap"
          style={{
            left: Math.max(8, Math.min(formatBar.x - 160, window.innerWidth - Math.min(window.innerWidth - 16, 340))),
            top: Math.max(10, formatBar.y),
            maxWidth: Math.min(window.innerWidth - 16, 340),
          }}
        >
          <FmtBtn editor={editor} action="bold" label="B" title="粗体" />
          <FmtBtn editor={editor} action="italic" label="I" title="斜体" />
          <FmtBtn editor={editor} action="underline" label="U" title="下划线" />
          <FmtBtn editor={editor} action="strike" label="S" title="删除线" />
          <FmtBtn editor={editor} action="code" label="◻" title="行内代码" />
          <div className="w-px h-4 bg-border mx-0.5" />
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              const btn = e.currentTarget as HTMLElement;
              const rect = btn.getBoundingClientRect();
              setHighlightPicker(highlightPicker ? null : { x: rect.left, y: rect.bottom + 4 });
            }}
            className={`w-7 h-7 rounded text-xs font-medium interactive flex items-center justify-center ${editor?.isActive("highlight") ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            title="高亮（背景色）"
          >🖍</button>
          <FmtBtn editor={editor} action="link" label="🔗" title="链接" />
          <div className="w-px h-4 bg-border mx-0.5" />
          <FmtBtn editor={editor} action="heading" label="H" title="标题" />
          <FmtBtn editor={editor} action="paragraph" label="¶" title="正文" />
          <FmtBtn editor={editor} action="blockquote" label="❝" title="引用" />
          <FmtBtn editor={editor} action="bulletList" label="•" title="无序列表" />
          <FmtBtn editor={editor} action="orderedList" label="1." title="有序列表" />
          <div className="w-px h-4 bg-border mx-0.5" />
          <FmtBtn editor={editor} action="alignLeft" label="⫷" title="左对齐" />
          <FmtBtn editor={editor} action="alignCenter" label="⫿" title="居中" />
          <FmtBtn editor={editor} action="alignRight" label="⫸" title="右对齐" />
        </div>
      )}

      {/* Highlight color picker */}
      {highlightPicker && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setHighlightPicker(null)} />
          <div
            className="fixed z-50 rounded-lg border border-border bg-card shadow-lg p-1.5 flex flex-wrap gap-1"
            style={{
              left: Math.min(highlightPicker.x, window.innerWidth - 200),
              top: Math.min(highlightPicker.y, window.innerHeight - 120),
              maxWidth: 200,
            }}
          >
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => {
                  if (!editor) return;
                  const ch = editor.chain().focus();
                  if (c.value === "clear") {
                    ch.unsetHighlight().run();
                  } else {
                    ch.toggleHighlight({ color: c.value }).run();
                  }
                  setHighlightPicker(null);
                }}
                className="w-7 h-7 rounded border border-border/50 interactive hover:scale-110"
                style={{
                  backgroundColor: c.color || "transparent",
                  border: c.value === "clear" ? "2px dashed var(--color-border)" : undefined,
                }}
                title={c.label}
              />
            ))}
          </div>
        </>
      )}

      {/* Block menu popover */}
      {blockMenu && (
        <BlockMenu onSelect={handleBlockAction} position={blockMenu} onClose={() => setBlockMenu(null)} />
      )}

      {/* Numbering popover for ordered lists */}
      {numPopover && (
        <NumberingPopover
          editor={editor}
          position={numPopover}
          onClose={() => setNumPopover(null)}
        />
      )}

      {/* Wiki link popover */}
      {wikiSearch !== null && (
        <WikiLinkPopover
          search={wikiSearch}
          onSelect={handleWikiSelect}
          onClose={() => setWikiSearch(null)}
          entries={wikiEntries}
          loading={wikiLoading}
          position={hoverPlus || { x: window.innerWidth / 2, y: window.innerHeight / 3 }}
        />
      )}

      {/* Media prompt */}
      {mediaPrompt && (
        <MediaPrompt type={mediaPrompt} onConfirm={handleMediaConfirm} onCancel={() => setMediaPrompt(null)} />
      )}

      <style jsx global>{`
        /* ── Editor boundary（EL Card + 聚焦光环）─── */
        .garden-editor-area {
          min-height: 500px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-card);
          box-shadow: var(--shadow-lighter);
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .garden-editor-area:focus-within {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 20%, transparent);
        }

        /* ── ProseMirror base ───────────────────────── */
        .garden-editor-area .ProseMirror {
          outline: none;
          position: relative;
          padding: 1.2em 3em;
          min-height: 480px;
          max-height: 62vh;
          overflow-y: auto;
          font-size: var(--editor-font-size, 14px);
        }

        @media (max-width: 768px) {
          .garden-editor-area .ProseMirror {
            padding: 1em 0.8em;
          }
        }
        @media (max-width: 400px) {
          .garden-editor-area .ProseMirror {
            padding: 0.8em 0.5em;
          }
        }

        /* ── Collapse top margin for first block ────── */
        .garden-editor-area .ProseMirror > :first-child {
          margin-top: 0 !important;
        }

        /* ── Placeholder ────────────────────────────── */
        .garden-editor-area .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--color-muted-foreground);
          pointer-events: none;
          height: 0;
          font-style: italic;
          opacity: 0.5;
        }

        /* ── Blinking cursor for empty editor ───────── */
        .garden-editor-area .ProseMirror-focused p.is-editor-empty:first-child {
          position: relative;
        }

        /* ── Media ──────────────────────────────────── */
        .ProseMirror video, .ProseMirror audio {
          max-width: 100%;
          border-radius: 8px;
        }
        .ProseMirror img {
          max-width: 100%;
          border-radius: 8px;
          cursor: default;
        }

        /* ── Internal links ─────────────────────────── */
        a[href^="/entry/"] {
          color: var(--color-primary) !important;
          text-decoration: none !important;
          border-bottom: 1px dashed var(--color-primary) !important;
        }
        a[href^="/entry/"]:hover {
          border-bottom-style: solid !important;
        }
      `}</style>
    </div>
  );
}
