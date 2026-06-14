"use client";

// ============================================================
// Digital Garden 2.0 — /garden (Enhanced Garden)
// ============================================================
// 时间轴 · 搜索 · 筛选 · 排序 · Obsidian式浏览
// ============================================================

import { useState, useEffect, useMemo, type ChangeEvent } from "react";
import Link from "next/link";
import { listEntries } from "@/actions/entry-actions";
import { ENTRY_TYPES, TYPE_LABELS } from "@/lib/constants";
import { ColoredTag } from "@/components/ui/garden-widgets";
import { getGraphData } from "@/actions/entry-actions";
import { fmtDate, formatMonth, getSeason, relativeTime } from "@/lib/datetime";

// ── Types ─────────────────────────────────────────────

interface EntrySummary {
  id: string; title: string; slug: string; type: string;
  excerpt: string | null; content: string; createdAt: Date | string; updatedAt: Date | string;
  tags: { id: string; name: string; slug: string }[];
}

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

type ViewMode = "list" | "timeline" | "graph" | "calendar";
type SortMode = "createdAt" | "updatedAt";

// ── Calendar View ──────────────────────────────────────

function CalendarView({ entries }: { entries: any[] }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDow = new Date(year, month - 1, 1).getDay();
  const today = new Date();

  const entryDates: Record<number, number> = {};
  entries.forEach(e => {
    const d = new Date(e.createdAt);
    if (d.getFullYear() === year && d.getMonth() + 1 === month) {
      entryDates[d.getDate()] = (entryDates[d.getDate()] || 0) + 1;
    }
  });

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  const dowLabels = ["日","一","二","三","四","五","六"];

  return (
    <div className="garden-card p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="text-xs text-muted-foreground hover:text-foreground interactive">◀</button>
        <span className="text-sm font-medium text-foreground">{year}年{month}月</span>
        <button onClick={nextMonth} className="text-xs text-muted-foreground hover:text-foreground interactive">▶</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {dowLabels.map(d => <div key={d} className="text-[0.625rem] text-muted-foreground py-1">{d}</div>)}
        {Array.from({ length: firstDow }).map((_, i) => <div key={"e"+i} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const count = entryDates[day] || 0;
          const isToday = today.getFullYear() === year && today.getMonth()+1 === month && today.getDate() === day;
          return (
            <div key={day} className={`relative rounded py-1.5 text-xs ${isToday ? "bg-primary/10 text-primary font-semibold" : "text-foreground"} ${count > 0 ? "cursor-pointer hover:bg-muted" : ""}`}>
              <span>{day}</span>
              {count > 0 && <div className="mx-auto mt-0.5 h-1 w-1 rounded-full bg-primary/60" title={`${count}条`} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────

export default function GardenPage() {
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [sortMode, setSortMode] = useState<SortMode>("createdAt");
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await listEntries(1000);
      setEntries(data);
      setLoading(false);
      getGraphData().then(setGraphData);
    })();
  }, []);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const seen = new Set<string>();
    const tags: { name: string }[] = [];
    for (const e of entries) {
      for (const t of e.tags) {
        if (!seen.has(t.name)) { seen.add(t.name); tags.push({ name: t.name }); }
      }
    }
    return tags.sort((a, b) => a.name.localeCompare(b.name));
  }, [entries]);

  // Filtered entries (year first, then search/type/tag)
  const filtered = useMemo(() => {
    let result = entries;
    if (yearFilter) {
      result = result.filter((e) => new Date(e.createdAt).getFullYear() === yearFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((e) =>
        e.title.toLowerCase().includes(q) || (e.excerpt || "").toLowerCase().includes(q));
    }
    if (typeFilter) result = result.filter((e) => e.type === typeFilter);
    if (tagFilter) result = result.filter((e) => e.tags.some((t) => t.name === tagFilter));
    return result;
  }, [entries, search, typeFilter, tagFilter, yearFilter]);

  // Group by month — uses sortMode to determine grouping date
  const groupedByMonth = useMemo(() => {
    const getDate = (e: EntrySummary) =>
      sortMode === "updatedAt" ? new Date(e.updatedAt) : new Date(e.createdAt);

    const sorted = [...filtered].sort(
      (a, b) => getDate(b).getTime() - getDate(a).getTime());
    const groups: { month: string; entries: typeof sorted; year: number; monthNum: number }[] = [];
    for (const e of sorted) {
      const d = getDate(e);
      const m = `${d.getFullYear()}年${d.getMonth() + 1}月`;
      const last = groups[groups.length - 1];
      if (last && last.month === m) {
        last.entries.push(e);
      } else {
        groups.push({ month: m, entries: [e], year: d.getFullYear(), monthNum: d.getMonth() + 1 });
      }
    }
    return groups;
  }, [filtered, sortMode]);

  // Stats
  const thisMonth = formatMonth(new Date());
  const thisMonthCount = entries.filter((e) => formatMonth(e.createdAt) === thisMonth).length;

  // Years for navigation
  const years = useMemo(() => {
    const set = new Set<number>();
    for (const e of entries) set.add(new Date(e.createdAt).getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [entries]);

  // ── Entry Card ───────────────────────────────────────

  const renderCard = (entry: EntrySummary, showRelative: boolean = false) => {
    const cover = extractCover(entry.content);
    return (
    <Link key={entry.id} href={`/entry/${entry.slug}`}
      className="garden-card flex overflow-hidden hover:shadow-md interactive group">
      {cover && (
        <div className="w-24 sm:w-32 shrink-0">
          <img src={cover} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}
      <div className="flex items-start justify-between gap-2 flex-1 min-w-0 p-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {entry.title}
          </h3>
          {entry.excerpt && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{entry.excerpt}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span className="text-[0.625rem] text-muted-foreground" title="创建时间">
            {sortMode === "createdAt"
              ? (showRelative ? relativeTime(entry.createdAt) : fmtDate(entry.createdAt))
              : (showRelative ? relativeTime(entry.updatedAt) : fmtDate(entry.updatedAt))
            }
          </span>
          {sortMode === "createdAt" && (
            <span className="text-[0.625rem] text-muted-foreground/60" title="最近修改">
              修改 {fmtDate(entry.updatedAt)}
            </span>
          )}
          {sortMode === "updatedAt" && (
            <span className="text-[0.625rem] text-muted-foreground/60" title="创建时间">
              创建 {fmtDate(entry.createdAt)}
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[0.625rem] text-muted-foreground">
        <ColoredTag type={entry.type} label={TYPE_LABELS[entry.type] || entry.type} />
        {entry.tags.slice(0, 3).map((t) => (
          <span key={t.name} className="text-muted-foreground/70">#{t.name}</span>
        ))}
        {entry.tags.length > 3 && <span className="text-muted-foreground/50">+{entry.tags.length - 3}</span>}
      </div>
    </Link>
  );
  };

  // ── Render ───────────────────────────────────────────

  return (
    <div className="reading-container py-12">
      {/* Header */}
      <section className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">🌱 花园</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {entries.length > 0
            ? `${entries.length} 条记录 · 本月已写 ${thisMonthCount} 条`
            : "浏览、搜索、筛选你的所有记录。"}
        </p>
      </section>

      {/* Search + Sort row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[200px] flex items-center gap-3 rounded-md border border-border bg-card px-4 py-2.5 focus-within:ring-1 focus-within:ring-primary/30 interactive">
          <span className="text-sm">🔍</span>
          <input type="text" value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setTagFilter(""); }}
            placeholder="搜索标题或内容…"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
          {search && (
            <button onClick={() => setSearch("")} className="text-xs text-muted-foreground hover:text-foreground interactive shrink-0">清除</button>
          )}
        </div>

        {/* Sort mode toggle */}
        <div className="flex items-center gap-1 rounded-md border border-border bg-muted/50 p-0.5">
          <button
            onClick={() => setSortMode("createdAt")}
            className={`rounded px-2.5 py-1 text-xs interactive transition-colors ${
              sortMode === "createdAt" ? "bg-card text-foreground font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            创建时间
          </button>
          <button
            onClick={() => setSortMode("updatedAt")}
            className={`rounded px-2.5 py-1 text-xs interactive transition-colors ${
              sortMode === "updatedAt" ? "bg-card text-foreground font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            修改时间
          </button>
        </div>
      </div>

      {/* Filters + View toggle row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button onClick={() => setTypeFilter("")}
          className={`rounded-full px-3 py-1 text-xs interactive ${!typeFilter ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-secondary"}`}>
          全部
        </button>
        {ENTRY_TYPES.map((t) => (
          <button key={t} onClick={() => setTypeFilter(typeFilter === t ? "" : t)}
            className={`rounded-full px-3 py-1 text-xs interactive ${typeFilter === t ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-secondary"}`}>
            {TYPE_LABELS[t]}
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-0.5 rounded-md border border-border bg-muted/50 p-0.5">
          {(["timeline", "list", "graph", "calendar"] as ViewMode[]).map((mode) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`rounded px-2.5 py-1 text-xs interactive ${viewMode === mode ? "bg-card text-foreground font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {{ timeline: "📅 时间", list: "📋 列表", graph: "🕸 关联", calendar: "🗓 日历" }[mode]}
            </button>
          ))}
        </div>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {allTags.map(({ name }) => (
            <button key={name} onClick={() => setTagFilter(tagFilter === name ? "" : name)}
              className={`rounded-full px-2.5 py-0.5 text-[0.688rem] interactive ${tagFilter === name ? "bg-primary/15 text-primary font-medium" : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
              #{name}
            </button>
          ))}
        </div>
      )}

      {/* Year navigation — moved to top, clickable */}
      {years.length > 0 && filtered.length > 0 && (
        <div className="mb-6 pb-4 border-b border-border">
          <p className="text-xs text-muted-foreground mb-2.5">
            记录年份
            {yearFilter && (
              <button
                onClick={() => setYearFilter(null)}
                className="ml-2 text-primary hover:text-primary-hover interactive"
              >
                清除筛选
              </button>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setYearFilter(yearFilter === y ? null : y)}
                className={`rounded-full px-3 py-1 text-xs interactive transition-all ${
                  yearFilter === y
                    ? "bg-primary text-white font-medium"
                    : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {y}年
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-5 animate-pulse">
              <div className="h-4 w-2/3 rounded bg-muted mb-2" />
              <div className="h-3 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        viewMode === "list" ? (
          <div className="space-y-2.5">{filtered.map(e => renderCard(e))}</div>
        ) : viewMode === "calendar" ? (
          <CalendarView entries={filtered} />
        ) : viewMode === "graph" ? (
          <div className="space-y-6">
            {graphData.links.length === 0 ? (
              <div className="garden-card p-8 text-center">
                <p className="text-2xl mb-2">🕸</p>
                <p className="text-sm text-muted-foreground">笔记之间还没有关联</p>
                <p className="text-xs text-muted-foreground mt-1">在编辑器中用 [[ 引用其他笔记来建立连接</p>
              </div>
            ) : (
              graphData.nodes.filter(n => graphData.links.some(l => l.source === n.id || l.target === n.id)).map(node => {
                const related = graphData.links.filter(l => l.source === node.id || l.target === node.id);
                const relatedNodes = graphData.nodes.filter(n => n.id !== node.id && related.some(l => l.source === n.id || l.target === n.id));
                if (relatedNodes.length === 0) return null;
                return (
                  <div key={node.id} className="garden-card p-4">
                    <Link href={`/entry/${node.id}`} className="text-sm font-medium text-foreground hover:text-primary interactive">{node.title}</Link>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {relatedNodes.map(rn => (
                        <Link key={rn.id} href={`/entry/${rn.id}`}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[0.688rem] text-muted-foreground hover:border-primary/30 hover:text-foreground interactive">
                          <ColoredTag type={rn.type} />{rn.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Timeline view */
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-border ml-[7px]" />
            <div className="space-y-10">
              {groupedByMonth.map(({ month, entries: monthEntries, year, monthNum }) => {
                const season = getSeason(monthNum);
                const isCurrentMonth = month === thisMonth;
                return (
                  <section key={month} className="relative pl-8">
                    <div className={`absolute left-0 top-1 w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center -translate-x-1/2 z-10 ${isCurrentMonth ? "border-primary bg-primary/20" : "border-border bg-card"}`}>
                      {isCurrentMonth && <div className="w-[5px] h-[5px] rounded-full bg-primary" />}
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <h3 className={`text-base font-semibold ${isCurrentMonth ? "text-primary" : "text-foreground"}`}>
                        {month}
                      </h3>
                      <span className="text-xs text-muted-foreground">{season.icon} {season.name}</span>
                      <span className="text-xs text-muted-foreground">· {monthEntries.length} 条</span>
                      {isCurrentMonth && (
                        <span className="rounded-full bg-primary/10 text-primary text-[0.625rem] px-2 py-0.5 font-medium">本月</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {monthEntries.map((e) => renderCard(e, true))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-16 text-center">
          <div className="text-6xl mb-4">🌱</div>
          <p className="text-base text-foreground font-medium">花园里还没有任何植物</p>
          <p className="text-sm text-muted-foreground mt-2">每一颗种子都会在未来开花。现在种下第一颗吧。</p>
          <Link href="/plant"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover interactive">
            ✏️ 写点什么
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-16 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm text-foreground font-medium">没有找到匹配的记录</p>
          <button onClick={() => { setSearch(""); setTypeFilter(""); setTagFilter(""); setYearFilter(null); }}
            className="mt-3 text-sm text-primary hover:text-primary-hover interactive">
            清除所有筛选 →
          </button>
        </div>
      )}
    </div>
  );
}
