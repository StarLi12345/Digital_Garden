"use client";

// ============================================================
// Digital Garden 2.0 — /entry/[slug] (View/Edit 双模式)
// ============================================================
// View mode: 阅读渲染
// Edit mode: 与 /plant 页面一致的编辑体验（封面图/宽编辑区）
// ============================================================

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { TitleInput, TypeSelector } from "@/components/form";
import TagAutocomplete from "@/components/form/tag-autocomplete";
import EditorWrapper from "@/components/editor/editor-wrapper";
import EntryRenderer from "@/components/editor/entry-renderer";
import { CoverImage } from "@/components/editor/cover-image";
import { EditorFontSize } from "@/components/editor/editor-font-size";
import { SourceMode } from "@/components/editor/source-mode";
import SyntaxHelp from "@/components/editor/syntax-help";
import { TocHighlighter } from "@/components/editor/toc-highlighter";
import type { EditorChangePayload } from "@/components/editor/tiptap-editor";
import { countWords, readingTimeMinutes } from "@/lib/word-count";
import { getEntryBySlug, updateEntry, deleteEntry, getBacklinks, getOutlinks, getLinkStats } from "@/actions/entry-actions";
import { exportMD, exportWord, exportPDF, generateExportHtml } from "@/lib/export-utils";
import { sanitizeNode } from "@/lib/tiptap-render";
import { jsonToMarkdown } from "@/lib/markdown";
import { TYPE_LABELS } from "@/lib/constants";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ColoredTag } from "@/components/ui/garden-widgets";
import { formatDateTime } from "@/lib/datetime";
import { toast } from "@/components/ui/toast";

type Mode = "view" | "edit";

interface EntryData {
  title: string;
  type: string;
  tags: string[];
  content: string;
  contentMd: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface EntryPageProps {
  params: Promise<{ slug: string }>;
}

/** Extract cover image from TipTap content: first top-level image node → cover */
function extractCover(contentJson: Record<string, unknown>): {
  coverImage: string | null;
  cleanContent: Record<string, unknown>;
} {
  try {
    const nodes = contentJson.content as any[];
    if (!nodes || nodes.length === 0) return { coverImage: null, cleanContent: contentJson };
    const first = nodes[0];
    // Check if the first paragraph/block contains only an image
    if (first && first.type === "paragraph" && first.content?.length === 1 && first.content[0].type === "image") {
      const imgSrc = first.content[0].attrs?.src as string;
      const rest = nodes.slice(1);
      return {
        coverImage: imgSrc || null,
        cleanContent: { ...contentJson, content: rest.length > 0 ? rest : [{ type: "paragraph", content: [] }] },
      };
    }
    // Check if the first node is directly an image (some TipTap versions)
    if (first && first.type === "image") {
      const imgSrc = first.attrs?.src as string;
      const rest = nodes.slice(1);
      return {
        coverImage: imgSrc || null,
        cleanContent: { ...contentJson, content: rest.length > 0 ? rest : [{ type: "paragraph", content: [] }] },
      };
    }
  } catch {}
  return { coverImage: null, cleanContent: contentJson };
}

export default function EntryPage({ params }: EntryPageProps) {
  const [slug, setSlug] = useState<string | null>(null);
  const [entry, setEntry] = useState<EntryData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [mode, setMode] = useState<Mode>("view");

  // ── Edit form state ──────────────────────────────────
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("Memory");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editContent, setEditContent] = useState<Record<string, unknown> | null>(null);
  const [editContentMd, setEditContentMd] = useState("");
  const [editCover, setEditCover] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showSyntaxHelp, setShowSyntaxHelp] = useState(false);

  // ── Related entries ────────────────────────────────────
  const [backlinks, setBacklinks] = useState<any[]>([]);
  const [outlinks, setOutlinks] = useState<any[]>([]);
  const [linkStats, setLinkStats] = useState<{ backlinks: number; outlinks: number } | null>(null);

  // ── Load entry on mount ──────────────────────────────

  useEffect(() => {
    (async () => {
      const { slug: s } = await params;
      setSlug(s);
      const [data, stats] = await Promise.all([
        getEntryBySlug(s),
        getLinkStats(s),
      ]);
      if (!data) { setNotFound(true); return; }
      setEntry({
        title: data.title,
        type: data.type,
        tags: data.tags.map((t) => t.name),
        content: data.content,
        contentMd: data.contentMd,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
      setLinkStats(stats);
      getBacklinks(s).then(setBacklinks);
      getOutlinks(data.content).then(setOutlinks);
    })();
  }, [params]);

  // ── Enter edit mode ──────────────────────────────────

  const enterEdit = useCallback(() => {
    if (!entry) return;
    setEditTitle(entry.title);
    setEditType(entry.type);
    setEditTags(entry.tags);
    setEditContentMd(entry.contentMd);

    // Parse content and extract cover image
    try {
      const parsed = sanitizeNode(JSON.parse(entry.content));
      const { coverImage, cleanContent } = extractCover(parsed);
      setEditCover(coverImage);
      setEditContent(cleanContent);
    } catch {
      setEditCover(null);
      setEditContent(null);
    }
    setError(null);
    setMode("edit");
  }, [entry]);

  // ── Cancel edit ──────────────────────────────────────

  const cancelEdit = useCallback(() => {
    setMode("view");
    setError(null);
  }, []);

  // ── Save ─────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!slug || !entry) return;
    const title = editTitle.trim();
    if (!title) { setError("标题不能为空"); return; }
    if (!editContent || !editContentMd.trim()) { setError("内容不能为空"); return; }

    setSaving(true);
    setError(null);

    // Convert blob URL cover image to data URL before saving
    let coverSrc = editCover;
    if (coverSrc && coverSrc.startsWith("blob:")) {
      try {
        const blob = await fetch(coverSrc).then((r) => r.blob());
        coverSrc = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch {
        // Keep the blob URL as fallback
      }
    }

    let finalContent = editContent;
    if (coverSrc) {
      finalContent = {
        ...editContent,
        content: [
          { type: "paragraph", content: [{ type: "image", attrs: { src: coverSrc, alt: "cover" } }] },
          ...((editContent as any).content || []),
        ],
      };
    }

    const result = await updateEntry(slug, {
      title,
      type: editType,
      content: JSON.stringify(finalContent),
      contentMd: editContentMd,
      tags: editTags,
    });

    if (result.success) {
      // If slug changed, navigate to new URL with toast
      if (result.data.slug !== slug) {
        toast.success("保存成功");
        setTimeout(() => { window.location.href = `/entry/${result.data.slug}`; }, 600);
        return;
      }
      // Show toast then go back to garden
      toast.success("保存成功");
      setTimeout(() => { window.location.href = "/garden"; }, 600);
    } else {
      setError(result.error);
    }
    setSaving(false);
  }, [slug, entry, editTitle, editType, editContent, editContentMd, editTags, editCover]);

  // ── Editor change handler ────────────────────────────

  const handleEditorChange = useCallback((payload: EditorChangePayload) => {
    setEditContent(payload.content);
    setEditContentMd(payload.contentMd);
    setError(null);
  }, []);

  // ── Ctrl+S ───────────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (mode === "edit" && (e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  }, [mode, handleSave]);

  // ── Delete handler ───────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!slug) return;
    if (!confirm("确定要删除这篇笔记吗？此操作无法撤销。")) return;
    setDeleting(true);
    const result = await deleteEntry(slug);
    if (result.success) {
      window.location.href = "/garden";
    } else {
      alert(result.error || "删除失败");
      setDeleting(false);
    }
  }, [slug]);

  // ── Loading ──────────────────────────────────────────

  if (notFound) {
    return (
      <div className="reading-container py-12 text-center">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-sm text-muted-foreground">未找到这条记录</p>
        <Link href="/garden" className="mt-4 inline-block text-sm text-primary hover:text-primary-hover">
          ← 返回花园
        </Link>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="reading-container py-12 flex items-center justify-center min-h-[300px]">
        <div className="h-4 w-48 rounded bg-muted animate-pulse" />
      </div>
    );
  }

  // ── View Mode ─────────────────────────────────────────

  if (mode === "view") {
    return (
      <><div className="reading-container py-12">
        <Breadcrumb items={[{ label: "花园", href: "/garden" }, { label: entry.title }]} />

        <header className="mb-8">
          <span className="inline-flex items-center rounded-full border border-secondary bg-secondary/50 px-2.5 py-0.5 text-xs text-muted-foreground mb-3">
            {TYPE_LABELS[entry.type] || entry.type}
          </span>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {entry.title}
            </h1>
            {linkStats && (linkStats.backlinks > 0 || linkStats.outlinks > 0) && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary/50 rounded-full px-2 py-0.5">
                {linkStats.outlinks > 0 && <span>🔗 {linkStats.outlinks}</span>}
                {linkStats.backlinks > 0 && <span>↩ {linkStats.backlinks}</span>}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>📅 创建于 {formatDateTime(entry.createdAt)}</span>
            <span>🕐 更新于 {formatDateTime(entry.updatedAt)}</span>
          </div>
          {entry.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {entry.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs text-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="lg:flex lg:gap-10">
          <article className="min-w-0 flex-1 mb-8">
            <EntryRenderer content={entry.content} contentMd={entry.contentMd} />
          </article>
          <aside className="hidden lg:block w-44 shrink-0">
            <div className="sticky top-20">
              <TocHighlighter containerSelector="article" />
            </div>
          </aside>
        </div>

        {(backlinks.length > 0 || outlinks.length > 0) && (
          <section className="mb-8 pt-4 border-t border-border">
            {outlinks.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">🔗 此笔记引用</p>
                <div className="flex flex-wrap gap-2">
                  {outlinks.map((e: any) => (
                    <Link key={e.slug} href={`/entry/${e.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs hover:border-primary/30 hover:bg-muted/50 interactive">
                      <ColoredTag type={e.type} />
                      <span className="text-foreground">{e.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {backlinks.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">↩ 引用此笔记</p>
                <div className="flex flex-wrap gap-2">
                  {backlinks.map((e: any) => (
                    <Link key={e.slug} href={`/entry/${e.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs hover:border-primary/30 hover:bg-muted/50 interactive">
                      <ColoredTag type={e.type} />
                      <span className="text-foreground">{e.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 garden-toolbar px-2 sm:px-3 py-2">
          <button onClick={enterEdit}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover interactive">
            <span className="text-sm leading-none">✏️</span>编辑
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-card px-4 py-2 text-sm text-red-600 hover:bg-red-50 interactive disabled:opacity-50 disabled:cursor-not-allowed">
            <span className="text-sm leading-none">🗑</span>{deleting ? "删除中…" : "删除"}
          </button>
          <div className="relative group">
            <button className="garden-ctrl-btn-muted text-sm px-3 py-1.5 interactive">
              <span className="text-sm leading-none">📥</span>导出
            </button>
            <div className="absolute bottom-full left-0 mb-1 rounded-lg border border-border bg-card shadow-lg p-1.5 min-w-[130px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
              <button
                onClick={async () => {
                  try {
                    const parsed = JSON.parse(entry.content);
                    const freshMd = jsonToMarkdown(parsed);
                    await exportMD(entry.title, freshMd);
                  } catch {
                    await exportMD(entry.title, entry.contentMd);
                  }
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded hover:bg-muted interactive text-left text-foreground"
              >
                📝 Markdown
              </button>
              <button
                onClick={async () => {
                  try {
                    const parsed = JSON.parse(entry.content);
                    const md = jsonToMarkdown(parsed);
                    const html = await generateExportHtml(entry.title, md || entry.contentMd);
                    exportWord(entry.title, html);
                  } catch {}
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded hover:bg-muted interactive text-left text-foreground"
              >
                📄 Word 文档
              </button>
              <button
                onClick={async () => {
                  try {
                    const parsed = JSON.parse(entry.content);
                    const md = jsonToMarkdown(parsed);
                    const html = await generateExportHtml(entry.title, md || entry.contentMd);
                    exportPDF(entry.title, html);
                  } catch {}
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded hover:bg-muted interactive text-left text-foreground"
              >
                🖨 PDF 下载
              </button>
            </div>
          </div>
          <Link href="/garden"
            className="garden-ctrl-btn-muted text-sm px-3 py-1.5 interactive">
            返回列表
          </Link>
        </div>
      </div>
      {/* Word counter (view mode) */}
      {entry.contentMd && (
        <div className="fixed bottom-4 right-4 z-40 rounded-full bg-card border border-border shadow-lg px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground pointer-events-none select-none">
          <span className="font-medium text-foreground">{countWords(entry.contentMd)}</span>
          <span>词</span>
          <span className="text-border">/</span>
          <span>{readingTimeMinutes(countWords(entry.contentMd))} 分钟</span>
        </div>
      )}
    </>
    );
  }

  // ── Edit Mode (plant-style) ───────────────────────────

  return (
    <div className="flex h-[calc(100vh-3.5rem)]" onKeyDown={handleKeyDown}>
      {/* Main editor area — like /plant */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto py-12 px-6" style={{ maxWidth: "1200px" }}>
          {/* Breadcrumb */}
          <Breadcrumb items={[{ label: "花园", href: "/garden" }, { label: entry.title }]} />

          {/* Edit mode badge + syntax help */}
          <div className="flex items-center gap-3 mb-4 mt-2">
            <span className="inline-flex items-center rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">
              编辑中
            </span>
            <div className="flex-1" />
            <button
              onClick={() => setShowSyntaxHelp(true)}
              className="garden-ctrl-btn-muted interactive"
              title="查看 Mermaid 和 LaTeX 语法帮助"
            >
              📖 语法帮助
            </button>
          </div>

          {/* Cover image */}
          <div className="mb-6">
            <CoverImage value={editCover} onChange={setEditCover} />
          </div>

          {/* Title — Notion-style */}
          <div className="mb-8">
            <TitleInput
              value={editTitle}
              onChange={(t) => { setEditTitle(t); setError(null); }}
              variant="notion"
              placeholder="无标题"
              maxLength={120}
            />
          </div>

          {/* Source mode toggle */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => {
                if (sourceMode) {
                  import("marked").then(({ marked }) => {
                    const html = marked.parse(editContentMd) as string;
                    import("@tiptap/core").then(({ generateJSON }) => {
                      import("@tiptap/starter-kit").then((StarterKit) => {
                        const json = generateJSON(html, [StarterKit.default.configure({ heading: { levels: [1,2,3,4,5] } })]);
                        setEditContent(json as Record<string, unknown>);
                      });
                    });
                  });
                } else {
                  // Switching TO source mode: re-generate fresh MD from current TipTap JSON
                  if (editContent) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const freshMd = jsonToMarkdown(editContent as any);
                    setEditContentMd(freshMd);
                  }
                }
                setSourceMode(!sourceMode);
              }}
              className={`rounded-full px-3 py-1 text-[0.688rem] interactive ${
                sourceMode
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
            >
              {sourceMode ? "🎨 退出源代码模式" : "📝 启用源代码模式"}
            </button>
          </div>

          {/* Editor */}
          <div className="min-h-[60vh]">
            {sourceMode ? (
              <SourceMode
                initialMd={editContentMd}
                onChange={(md) => setEditContentMd(md)}
              />
            ) : (
              <EditorWrapper
                initialContent={editContent || undefined}
                onChange={handleEditorChange}
                placeholder="点击开始编辑…支持 Ctrl+V 粘贴图片"
              />
            )}
          </div>

          {/* Editor font size + Meta + Save — wraps on mobile */}
          <div className="mt-5 pt-4 border-t border-border space-y-3">
            <EditorFontSize />
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 garden-toolbar px-2 sm:px-4 py-2">
              <span className="text-[0.6rem] sm:text-xs text-muted-foreground shrink-0">类型</span>
              <TypeSelector value={editType} onChange={setEditType} />
              <div className="flex-1 hidden sm:block" />
              <div className="w-full sm:w-auto sm:flex-1">
                <TagAutocomplete value={editTags} onChange={setEditTags} />
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium interactive ${
                  saving
                    ? "bg-primary text-white opacity-70 cursor-not-allowed"
                    : "bg-primary text-white hover:bg-primary-hover"
                }`}
              >
                {saving ? "保存中…" : "保存"}
              </button>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="garden-ctrl-btn-muted text-sm px-3 py-1.5 interactive disabled:opacity-50"
              >
                取消
              </button>
              {error && <span className="text-xs text-red-500">{error}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Word counter (edit mode) */}
      {editContentMd && (
        <div className="fixed bottom-4 right-4 z-40 rounded-full bg-card border border-border shadow-lg px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground pointer-events-none select-none">
          <span className="font-medium text-foreground">{countWords(editContentMd)}</span>
          <span>词</span>
          <span className="text-border">/</span>
          <span>{readingTimeMinutes(countWords(editContentMd))} 分钟</span>
        </div>
      )}

      {/* Syntax help modal */}
      <SyntaxHelp open={showSyntaxHelp} onClose={() => setShowSyntaxHelp(false)} />
    </div>
  );
}
