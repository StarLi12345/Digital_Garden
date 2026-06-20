"use client";

// ============================================================
// Digital Garden 2.0 — /drafts 草稿箱
// ============================================================
// 集中管理所有暂存草稿 · 卡片式展示 · 一键恢复/删除
// ============================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";

const DRAFTS_KEY = "digital-garden-drafts";

interface FormState {
  title: string; type: string; tags: string[];
  content: Record<string, unknown> | null; contentMd: string;
  coverImage: string | null;
}

interface Draft {
  id: string;
  name: string;
  createdAt: number;
  form: FormState;
}

function loadDrafts(): Draft[] {
  try {
    const r = localStorage.getItem(DRAFTS_KEY);
    return r ? JSON.parse(r) : [];
  } catch { return []; }
}

function saveDrafts(drafts: Draft[]) {
  try { localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts)); } catch {}
}

import { countWords } from "@/lib/word-count";

export default function DraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    setDrafts(loadDrafts());
    // Also load server-side drafts (for logged-in users, cross-device sync)
    import("@/actions/entry-actions").then(({ loadDraftsFromServer }) => {
      loadDraftsFromServer().then((serverDrafts) => {
        if (serverDrafts.length === 0) return;
        setDrafts((prev) => {
          const existing = new Set(prev.map((d) => d.id));
          const merged = [...prev];
          for (const sd of serverDrafts) {
            const id = sd.slug.replace("draft-", "");
            if (!existing.has(id)) {
              merged.push({
                id,
                name: sd.title,
                createdAt: new Date(sd.updatedAt).getTime(),
                form: {
                  title: sd.title, type: sd.type || "Memory", tags: sd.tags || [],
                  content: (() => { try { return JSON.parse(sd.content); } catch { return null; } })(),
                  contentMd: sd.contentMd, coverImage: sd.coverImage,
                },
              });
            }
          }
          return merged;
        });
      }).catch(() => {});
    });
  }, []);

  const handleDelete = (id: string) => {
    const updated = drafts.filter((d) => d.id !== id);
    setDrafts(updated);
    saveDrafts(updated);
    // Also delete server-side draft
    import("@/actions/entry-actions").then(({ deleteDraftFromServer }) => {
      deleteDraftFromServer(id).catch(() => {});
    });
  };

  const handleLoad = (draft: Draft) => {
    router.push(`/plant?draft=${draft.id}`);
  };

  const handleClearAll = () => {
    if (drafts.length === 0) return;
    if (confirm(`确定要清空全部 ${drafts.length} 个草稿吗？`)) {
      setDrafts([]);
      saveDrafts([]);
    }
  };

  return (
    <div className="reading-container py-12">
      <Breadcrumb items={[{ label: "花园", href: "/garden" }, { label: "草稿箱" }]} />

      <div className="flex items-center justify-between mb-6 mt-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">草稿箱</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {drafts.length > 0
              ? `${drafts.length} 个草稿 · 自动暂存`
              : "暂存的内容会出现在这里"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {drafts.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-[0.688rem] text-muted-foreground hover:text-red-500 interactive"
            >
              清空全部
            </button>
          )}
          <Link
            href="/plant"
            className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover interactive"
          >
            ✏️ 新建笔记
          </Link>
        </div>
      </div>

      {drafts.length === 0 ? (
        <div className="garden-card p-16 text-center">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-sm text-muted-foreground">草稿箱是空的</p>
          <p className="text-xs text-muted-foreground mt-1">
            在编写页面点击「💾 暂存」会将内容保存在这里
          </p>
          <Link
            href="/plant"
            className="mt-6 inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover interactive"
          >
            去写点什么 ✨
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((draft) => (
              <div
                key={draft.id}
                className="garden-card p-5 flex items-start gap-4 group"
              >
                {/* Cover thumbnail */}
                {draft.form.coverImage && (
                  <div className="w-24 h-16 shrink-0 rounded-md overflow-hidden bg-muted">
                    <img
                      src={draft.form.coverImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {draft.form.title || "未命名草稿"}
                  </h3>
                  <p className="text-[0.625rem] text-muted-foreground mt-1">
                    {new Date(draft.createdAt).toLocaleString("zh-CN")}
                    {draft.form.contentMd && (
                      <span className="ml-3">
                        {countWords(draft.form.contentMd)} 词
                      </span>
                    )}
                    {draft.form.type && draft.form.type !== "Memory" && (
                      <span className="ml-3">{draft.form.type}</span>
                    )}
                    {draft.form.tags.length > 0 && (
                      <span className="ml-3">
                        {draft.form.tags.slice(0, 3).map((t) => `#${t}`).join(" ")}
                      </span>
                    )}
                  </p>
                  {draft.form.contentMd && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                      {draft.form.contentMd.slice(0, 200)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleLoad(draft)}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary-hover interactive"
                  >
                    继续编辑
                  </button>
                  <button
                    onClick={() => handleDelete(draft.id)}
                    className="rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground hover:text-red-500 interactive"
                    title="删除草稿"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
