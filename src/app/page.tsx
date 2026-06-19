"use client";

// ============================================================
// Digital Garden — / (Home) — 阅读优先排版
// ============================================================
// 700px 正文宽度 · 博客园节奏 · 模块拖拽排序
// ============================================================

import { useState, useEffect, useCallback, type DragEvent } from "react";
import Link from "next/link";
import { listEntries, getGardenMemory, getGardenStats } from "@/actions/entry-actions";
import { TYPE_LABELS } from "@/lib/constants";
import { getPrefs, setPrefs, type ModuleVisibility } from "@/lib/ui-preferences";
import { Statistic } from "@/components/ui/garden-widgets";
import { TagCloud } from "@/components/ui/tag-cloud";
import { relativeTime, getGreeting, fmtDate } from "@/lib/datetime";
import dynamic from "next/dynamic";
import { pickRandomSlides } from "@/lib/carousel-data";

const GardenCarousel = dynamic(
  () => import("@/components/ui/garden-carousel").then((m) => ({ default: m.GardenCarousel })),
  { ssr: false }
);

interface EntrySummary {
  id: string; title: string; slug: string; type: string;
  excerpt: string | null; content: string; createdAt: Date | string; updatedAt: Date | string;
  tags: { name: string }[];
}

/** Extract first image src from TipTap JSON content */
function extractCover(content: string | null): string | null {
  if (!content) return null;
  try {
    const doc = JSON.parse(content);
    const nodes = doc.content as any[];
    if (!nodes) return null;
    for (const node of nodes) {
      if (node.type === "paragraph" && node.content) {
        for (const child of node.content) {
          if (child.type === "image") return child.attrs?.src || null;
        }
      }
      if (node.type === "image") return node.attrs?.src || null;
    }
  } catch {}
  return null;
}

interface MemoryEntry {
  id: string; title: string; slug: string; type: string;
  excerpt: string | null; createdAt: Date | string; tags: { name: string }[];
}

type ModuleKey = "greeting" | "stats" | "gardenMemory" | "recentEntries";

export default function HomePage() {
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [entryCount, setEntryCount] = useState(0);
  const [tagCount, setTagCount] = useState(0);
  const [tagFreq, setTagFreq] = useState<{ name: string; count: number }[]>([]);
  const [globalViews, setGlobalViews] = useState<{totalViews:number;todayViews:number;weekViews:number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [memory, setMemory] = useState<MemoryEntry | null>(null);
  const [modules, setModules] = useState<ModuleVisibility>(() => getPrefs().modules);
  const [moduleOrder, setModuleOrder] = useState<string[]>(() => getPrefs().moduleOrder);
  const [dragOverModule, setDragOverModule] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const handler = () => {
      const prefs = getPrefs();
      setModules(prefs.modules);
      setModuleOrder(prefs.moduleOrder);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  useEffect(() => {
    (async () => {
      const data = await listEntries();
      setEntries(data);
      setLoading(false);
    })();
    (async () => {
      const stats = await getGardenStats();
      setEntryCount(stats.entryCount);
      setTagCount(stats.tagCount);
      setTagFreq(stats.tagFreq);
    })();
    (async () => {
      const m = await getGardenMemory();
      setMemory(m as MemoryEntry | null);
    })();
    fetch("/api/views").then(r => r.json()).then(d => {
      if (d.totalViews !== undefined) setGlobalViews(d);
    }).catch(() => {});
  }, []);

  const recent = entries.slice(0, 5);

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, modKey: string) => {
    e.dataTransfer.setData("text/plain", modKey);
    e.dataTransfer.effectAllowed = "move";
  }, []);
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, modKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverModule(modKey);
  }, []);
  const handleDragLeave = useCallback(() => setDragOverModule(null), []);
  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, targetKey: string) => {
    e.preventDefault();
    setDragOverModule(null);
    const sourceKey = e.dataTransfer.getData("text/plain");
    if (!sourceKey || sourceKey === targetKey) return;
    const newOrder = [...moduleOrder];
    const srcIdx = newOrder.indexOf(sourceKey);
    const tgtIdx = newOrder.indexOf(targetKey);
    if (srcIdx === -1 || tgtIdx === -1) return;
    newOrder.splice(srcIdx, 1);
    newOrder.splice(tgtIdx, 0, sourceKey);
    setModuleOrder(newOrder);
    setPrefs({ moduleOrder: newOrder });
  }, [moduleOrder]);
  const handleDragEnd = useCallback(() => setDragOverModule(null), []);

  const renderSection = (key: ModuleKey) => {
    switch (key) {
      case "greeting":
        if (!modules.greeting) return null;
        return (
          <section key={key} className="mb-10">
            <p className="text-xs text-muted-foreground tracking-wide uppercase">{getGreeting()} · Digital Garden</p>
            <h1 className="mt-3 text-xl font-semibold tracking-tight text-foreground">欢迎回到你的花园</h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              这里是你记录回忆、想法、情绪、梦境、故事与学习的地方。<br />每一颗种子，都会在未来开花。
            </p>
          </section>
        );

      case "stats":
        if (!modules.stats || loading) return null;
        return (
          <section key={key} className="mb-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <Statistic value={entryCount} label="条记录" animated />
              <Statistic value={tagCount} label="个标签" animated />
              {globalViews && (
                <>
                  <Statistic value={globalViews.totalViews} label="次访问" animated />
                  <Statistic value={globalViews.todayViews} label="今日访客" animated />
                </>
              )}
            </div>
            {tagFreq.length > 0 && <TagCloud tags={tagFreq.slice(0, 20)} />}
          </section>
        );

      case "gardenMemory":
        if (!modules.gardenMemory || loading || !memory) return null;
        return (
          <section key={key} className="mb-10">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">🌿 来自花园</h2>
            <Link href={`/entry/${memory.slug}`}
              className="block garden-card border-l-2 border-l-accent p-5 hover:bg-muted/50 interactive">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-accent font-medium">{relativeTime(memory.createdAt)}</span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{TYPE_LABELS[memory.type] || memory.type}</span>
              </div>
              <h3 className="text-base font-medium text-foreground">{memory.title}</h3>
              {memory.excerpt && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{memory.excerpt}</p>}
              {memory.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {memory.tags.map((t) => <span key={t.name} className="text-xs text-muted-foreground">#{t.name}</span>)}
                </div>
              )}
            </Link>
          </section>
        );

      case "recentEntries":
        if (!modules.recentEntries) return null;
        return (
          <section key={key}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">最近记录</h2>
              <Link href="/plant"
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover interactive">
                ✏️ 写点什么
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="garden-card p-5 animate-pulse">
                    <div className="h-4 w-2/3 rounded bg-muted mb-2" />
                    <div className="h-3 w-full rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : recent.length > 0 ? (
              <div className="space-y-3">
                {recent.map((entry, idx) => {
                  const cover = extractCover(entry.content);
                  return (
                    <Link key={entry.id} href={`/entry/${entry.slug}`}
                      className="garden-card flex overflow-hidden hover:shadow-md transition-all interactive group">
                      {cover && (
                        <div className={`${idx % 2 === 0 ? "order-1" : "order-2"} w-28 sm:w-36 shrink-0`}>
                          <img src={cover} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      )}
                      <div className={`flex-1 min-w-0 p-4 ${cover ? (idx % 2 === 0 ? "order-2" : "order-1") : ""}`}>
                        <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {entry.title}
                        </h3>
                        {entry.excerpt && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{entry.excerpt}</p>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-[0.625rem] text-muted-foreground">
                          <span>📅 {fmtDate(entry.updatedAt)}</span>
                          <span className="rounded-full bg-secondary/50 px-1.5 py-0.5 text-[0.625rem]">
                            {TYPE_LABELS[entry.type] || entry.type}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {entryCount > 5 && (
                  <Link href="/garden" className="block text-center text-xs text-muted-foreground hover:text-foreground interactive py-2">
                    查看全部 {entryCount} 条记录 →
                  </Link>
                )}
              </div>
            ) : (
              <div className="garden-card p-12 text-center">
                <p className="text-4xl mb-3">🌱</p>
                <p className="text-sm text-muted-foreground">还没有任何记录。</p>
                <p className="text-sm text-muted-foreground mt-1">种下第一颗种子吧。</p>
              </div>
            )}
          </section>
        );
      default: return null;
    }
  };

  const visibleModules = moduleOrder.filter((k) => modules[k as ModuleKey] && renderSection(k as ModuleKey) !== null);

  const [heroSlides] = useState(() => pickRandomSlides(8));

  return (
    <>
    {/* ── Hero Carousel ── */}
    <GardenCarousel slides={heroSlides} height="min(360px, 50vh)" className="mb-0" />

    <div className="reading-container py-12">
      <div className="flex justify-end mb-6">
        <button onClick={() => setEditMode(!editMode)}
          className={`rounded-full px-2.5 py-1 text-[0.688rem] interactive ${editMode ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-secondary"}`}>
          {editMode ? "✓ 完成排序" : "🔧 调整布局"}
        </button>
      </div>

      <div>
        {visibleModules.map((key) => (
          <div key={key}
            draggable={editMode}
            onDragStart={(e) => handleDragStart(e, key)}
            onDragOver={(e) => handleDragOver(e, key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, key)}
            onDragEnd={handleDragEnd}
            className={`relative rounded-lg transition-all ${editMode ? "cursor-grab active:cursor-grabbing" : ""} ${dragOverModule === key ? "ring-2 ring-primary/20 bg-primary/[0.01]" : ""}`}>
            {editMode && (
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-xs text-muted-foreground cursor-grab opacity-40 hover:opacity-80">⠿</div>
            )}
            {renderSection(key as ModuleKey)}
          </div>
        ))}
      </div>

      {visibleModules.length === 0 && !loading && (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">🌱</p>
          <p className="text-sm text-muted-foreground">去设置中开启首页模块吧。</p>
          <Link href="/settings" className="inline-block mt-3 text-sm text-primary hover:text-primary-hover interactive">前往设置 →</Link>
        </div>
      )}
    </div>
    </>
  );
}
