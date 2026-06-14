"use client";

// ============================================================
// Digital Garden 2.0 — /plant (Notion/飞书风格编辑空间)
// ============================================================
// · 多草稿箱 · 智能大纲 · 字数统计 · 宽编辑区
// · 封面图 · Notion 式极简大标题 · / 斜杠 + 悬停 +
// · Ctrl+V 粘贴 · 类型+标签
// ============================================================

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TitleInput, TypeSelector, TagInput } from "@/components/form";
import EditorWrapper from "@/components/editor/editor-wrapper";
import { CoverImage } from "@/components/editor/cover-image";
import { EditorFontSize } from "@/components/editor/editor-font-size";
import { SourceMode } from "@/components/editor/source-mode";
import type { EditorChangePayload } from "@/components/editor/tiptap-editor";
import { createEntry } from "@/actions/entry-actions";
import { jsonToMarkdown } from "@/lib/markdown";

const DRAFTS_KEY = "digital-garden-drafts";
const DRAFT_DEBOUNCE_MS = 1000;

interface FormState {
  title: string; type: string; tags: string[];
  content: Record<string, unknown> | null; contentMd: string;
  coverImage: string | null;
}
const INITIAL_FORM: FormState = {
  title: "", type: "Memory", tags: [], content: null, contentMd: "", coverImage: null,
};

interface Draft {
  id: string;
  name: string;
  createdAt: number;
  form: FormState;
}

// ── Draft utilities ────────────────────────────────────

function loadDrafts(): Draft[] {
  if (typeof window === "undefined") return [];
  try {
    const r = localStorage.getItem(DRAFTS_KEY);
    return r ? JSON.parse(r) : [];
  } catch { return []; }
}

function saveDrafts(drafts: Draft[]) {
  try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts)); } catch {}
}

const WORDS_PER_MINUTE = 200; // Chinese reading speed

function countWords(md: string): number {
  // Chinese: count characters; English: count words
  const chineseChars = (md.match(/[一-鿿㐀-䶿]/g) || []).length;
  const englishWords = (md.replace(/[一-鿿㐀-䶿]/g, " ").match(/\b\w+\b/g) || []).length;
  return chineseChars + englishWords;
}

function readingTimeMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

// ── Heading extraction ─────────────────────────────────

interface Heading { text: string; level: number; }

function extractHeadings(content: Record<string, unknown> | null): Heading[] {
  if (!content) return [];
  const result: Heading[] = [];
  const walk = (node: Record<string, unknown>) => {
    if (node.type === "heading") {
      let text = "";
      const walkText = (n: Record<string, unknown>) => {
        if (n.type === "text") text += (n.text as string) || "";
        if (n.content && Array.isArray(n.content))
          n.content.forEach((c: unknown) => walkText(c as Record<string, unknown>));
      };
      walkText(node);
      result.push({
        text: text.slice(0, 60),
        level: (node.attrs as Record<string, number>)?.level || 1,
      });
    }
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach((c: unknown) => walk(c as Record<string, unknown>));
    }
  };
  walk(content);
  return result;
}

// ── Component ──────────────────────────────────────────

function PlantPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Draft box state
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [validation, setValidation] = useState<{ title?: string; content?: string }>({});
  const [sourceMode, setSourceMode] = useState(false);
  const canSave = form.title.trim().length > 0 && form.content !== null && form.contentMd.trim().length > 0;

  // Word count
  const wordCount = countWords(form.contentMd);
  const readTime = readingTimeMinutes(wordCount);

  // Headings (for TOC)
  const headings = extractHeadings(form.content);
  const hasHeadings = headings.length > 0;

  // Load drafts on mount
  useEffect(() => {
    setDrafts(loadDrafts());
  }, []);

  // Load a specific draft from query param (from /drafts "继续编辑")
  useEffect(() => {
    const draftId = searchParams.get("draft");
    if (!draftId) return;
    const all = loadDrafts();
    const target = all.find((d) => d.id === draftId);
    if (target) {
      setForm(target.form);
      setCurrentDraftId(target.id);
    }
  }, [searchParams]);

  // Autosave current draft
  const isDirty = form.title !== "" || form.tags.length > 0 || form.content !== null || form.coverImage !== null;
  useEffect(() => {
    if (!isDirty) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDrafts((prev) => {
        const now = Date.now();
        let updated: Draft[];
        if (currentDraftId) {
          updated = prev.map((d) =>
            d.id === currentDraftId
              ? { ...d, name: form.title || "未命名草稿", form, createdAt: d.createdAt }
              : d
          );
          // Also update the draft in-place
        } else {
          const newDraft: Draft = {
            id: `draft-${now}`,
            name: form.title || "未命名草稿",
            createdAt: now,
            form,
          };
          setCurrentDraftId(newDraft.id);
          updated = [...prev, newDraft];
        }
        saveDrafts(updated);
        return updated;
      });
    }, DRAFT_DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [form.title, form.type, form.tags, form.content, form.contentMd, form.coverImage]);

  // ── Draft operations ────────────────────────────────

  const handleNewDraft = () => {
    setForm(INITIAL_FORM);
    setCurrentDraftId(null);
    setError(null);
    setValidation({});
    setShowDrafts(false);
  };

  const handleLoadDraft = (draft: Draft) => {
    setForm(draft.form);
    setCurrentDraftId(draft.id);
    setError(null);
    setValidation({});
    setShowDrafts(false);
  };

  const handleDeleteDraft = (draftId: string) => {
    setDrafts((prev) => {
      const updated = prev.filter((d) => d.id !== draftId);
      saveDrafts(updated);
      return updated;
    });
    if (currentDraftId === draftId) {
      setForm(INITIAL_FORM);
      setCurrentDraftId(null);
    }
  };

  // ── Form handlers ────────────────────────────────────

  const handleTitleChange = useCallback((t: string) => { setForm((p) => ({ ...p, title: t })); setError(null); }, []);
  const handleTypeChange = useCallback((t: string) => { setForm((p) => ({ ...p, type: t })); }, []);
  const handleTagsChange = useCallback((tags: string[]) => { setForm((p) => ({ ...p, tags })); }, []);
  const handleEditorChange = useCallback((payload: EditorChangePayload) => {
    setForm((p) => ({ ...p, content: payload.content, contentMd: payload.contentMd }));
    setError(null);
  }, []);
  const handleCoverChange = useCallback((url: string | null) => {
    setForm((p) => ({ ...p, coverImage: url }));
  }, []);

  const handleSave = useCallback(async () => {
    const v: { title?: string; content?: string } = {};
    if (!form.title.trim()) v.title = "请输入标题";
    if (!form.content || !form.contentMd.trim()) v.content = "请输入正文内容";
    if (Object.keys(v).length > 0) { setValidation(v); return; }
    setValidation({});
    if (!canSave || !form.content) return;
    setSaving(true);
    setError(null);

    // Convert blob URL cover image to data URL before saving
    let coverSrc = form.coverImage;
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

    let finalContent = form.content;
    if (coverSrc) {
      finalContent = {
        ...form.content,
        content: [
          { type: "paragraph", content: [{ type: "image", attrs: { src: coverSrc, alt: "cover" } }] },
          ...((form.content as any).content || []),
        ],
      };
    }

    const result = await createEntry({
      title: form.title.trim(),
      type: form.type,
      content: JSON.stringify(finalContent),
      contentMd: form.contentMd,
      tags: form.tags,
    });

    if (result.success) {
      // Remove this draft
      if (currentDraftId) {
        setDrafts((prev) => {
          const updated = prev.filter((d) => d.id !== currentDraftId);
          saveDrafts(updated);
          return updated;
        });
      }
      router.push(`/entry/${result.data.slug}`);
    } else {
      setError(result.error);
      setSaving(false);
    }
  }, [form, canSave, router, currentDraftId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave]
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)]" onKeyDown={handleKeyDown}>
      {/* ====== TOC SIDEBAR (Typora-style, auto-hide when empty) ====== */}
      {hasHeadings && (
        <aside className="w-44 shrink-0 border-r border-border bg-card/40 overflow-y-auto p-4 hidden xl:block">
          <p className="text-[0.625rem] text-muted-foreground uppercase tracking-wider mb-3">大纲</p>
          <nav className="space-y-0.5">
            {headings.map((h, i) => (
              <button
                key={i}
                onClick={() => {
                  const all = document.querySelectorAll(`.ProseMirror h${h.level}`);
                  // Match by index within same-level headings
                  const sameLevel = headings
                    .map((hd, idx) => ({ ...hd, idx }))
                    .filter((hd) => hd.level === h.level);
                  const matchIdx = sameLevel.findIndex((hd) => hd.idx === i);
                  const target = all[Math.min(matchIdx >= 0 ? matchIdx : all.length - 1, all.length - 1)];
                  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`block w-full text-left py-0.5 rounded px-1.5 truncate text-[0.688rem] hover:bg-muted interactive ${
                  h.level === 1 ? "font-semibold text-foreground" : ""
                } ${h.level === 2 ? "font-medium text-foreground pl-2" : ""} ${
                  h.level >= 3 ? "text-muted-foreground pl-4" : ""
                }`}
                title={h.text}
              >
                {h.text || "无标题"}
              </button>
            ))}
          </nav>
        </aside>
      )}

      {/* ====== MAIN EDITOR ====== */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto py-12 px-6" style={{ maxWidth: "920px" }}>
          {/* Draft box link */}
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/drafts"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted interactive"
            >
              📋 草稿箱
              {drafts.length > 0 && (
                <span className="bg-primary/15 text-primary text-[0.625rem] px-1.5 py-0.5 rounded-full font-medium">
                  {drafts.length}
                </span>
              )}
            </Link>
            {currentDraftId && (
              <span className="text-[0.625rem] text-muted-foreground/60">自动暂存中</span>
            )}
            <button
              onClick={handleNewDraft}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[0.688rem] text-muted-foreground hover:text-foreground hover:bg-muted interactive"
            >
              + 新建
            </button>
          </div>

          {/* Cover image */}
          <div className="mb-6">
            <CoverImage value={form.coverImage} onChange={handleCoverChange} />
          </div>

          {/* Title */}
          <div className="mb-8">
            <TitleInput
              value={form.title}
              onChange={(t) => {
                handleTitleChange(t);
                setValidation((v) => ({ ...v, title: undefined }));
              }}
              variant="notion"
              placeholder="无标题"
              maxLength={120}
            />
            {validation.title && (
              <p className="text-xs text-red-500 mt-1">⚠ {validation.title}</p>
            )}
          </div>

          {/* Source mode toggle */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => {
                if (sourceMode) {
                  // Switching back to visual — convert MD to TipTap JSON
                  import("marked").then(({ marked }) => {
                    const html = marked.parse(form.contentMd) as string;
                    import("@tiptap/core").then(({ generateJSON }) => {
                      import("@tiptap/starter-kit").then((StarterKit) => {
                        const json = generateJSON(html, [StarterKit.default.configure({ heading: { levels: [1,2,3,4,5] } })]);
                        setForm((p) => ({ ...p, content: json as Record<string, unknown> }));
                      });
                    });
                  });
                } else {
                  // Switching TO source mode: re-generate fresh MD from current TipTap JSON
                  const content = form.content;
                  if (content) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const freshMd = jsonToMarkdown(content as any);
                    setForm((p) => ({ ...p, contentMd: freshMd }));
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
          <div className="min-h-[65vh]">
            {sourceMode ? (
              <SourceMode
                initialMd={form.contentMd}
                onChange={(md) => {
                  setForm((p) => ({ ...p, contentMd: md }));
                }}
              />
            ) : (
              <EditorWrapper
                initialContent={form.content ? (form.content as Record<string, unknown>) : undefined}
                onChange={(p) => {
                  handleEditorChange(p);
                  setValidation((v) => ({ ...v, content: undefined }));
                }}
                placeholder="点击开始编辑，或输入 / 打开菜单…支持 Ctrl+V 粘贴图片"
              />
            )}
            {validation.content && (
              <p className="text-xs text-red-500 mt-1">⚠ {validation.content}</p>
            )}
          </div>

          {/* Editor font size + Meta + Save */}
          <div className="mt-5 pt-4 border-t border-border space-y-3">
            <EditorFontSize />
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground shrink-0">类型</span>
              <TypeSelector value={form.type} onChange={handleTypeChange} />
            </div>
            <TagInput value={form.tags} onChange={handleTagsChange} />
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => {
                  // 暂存：手动触发一次立即保存到草稿箱
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  const now = Date.now();
                  const draftId = currentDraftId || `draft-${now}`;
                  setDrafts((prev) => {
                    const draft: Draft = {
                      id: draftId,
                      name: form.title || "未命名草稿",
                      createdAt: currentDraftId
                        ? (prev.find((d) => d.id === draftId)?.createdAt || now)
                        : now,
                      form,
                    };
                    const updated = currentDraftId
                      ? prev.map((d) => (d.id === draftId ? draft : d))
                      : [...prev, draft];
                    saveDrafts(updated);
                    if (!currentDraftId) setCurrentDraftId(draftId);
                    return updated;
                  });
                }}
                className="inline-flex items-center gap-1 rounded-md border border-border px-4 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground interactive"
              >
                💾 暂存
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave || saving}
                className={`inline-flex items-center gap-1 rounded-md px-4 py-1.5 text-sm font-medium interactive ${
                  canSave && !saving
                    ? "bg-primary text-white hover:bg-primary-hover"
                    : "bg-primary text-white opacity-50 cursor-not-allowed"
                }`}
              >
                {saving ? "上传中…" : "📤 上传"}
              </button>
              {error && <span className="text-xs text-red-500">{error}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ====== WORD COUNTER (fixed, bottom-right) ====== */}
      {form.contentMd && (
        <div className="fixed bottom-4 right-4 z-40 rounded-full bg-card border border-border shadow-lg px-4 py-2 flex items-center gap-2 text-xs text-muted-foreground pointer-events-none select-none">
          <span className="font-medium text-foreground">{wordCount}</span>
          <span>词</span>
          <span className="text-border">/</span>
          <span>{readTime} 分钟</span>
        </div>
      )}
    </div>
  );
}

export default function PlantPage() {
  return (
    <Suspense>
      <PlantPageInner />
    </Suspense>
  );
}
