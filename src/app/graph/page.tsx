"use client";

// ============================================================
// Digital Garden 3.0 — /graph — Knowledge Graph
// ============================================================
// - StarNet (force) & WorldTree (dag) views
// - Search, type filter, node click → entry
// - ⏳ Timeline: each node fades in with smooth opacity transition
//   (layout stays stable; only per-node opacity changes)
// ============================================================

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ui/theme-provider";
import { getGraphData } from "@/actions/entry-actions";
import { StarNetView } from "@/components/graph/starnet-view";
import { WorldTreeView } from "@/components/graph/worldtree-view";
import { ENTRY_TYPES, TYPE_LABELS } from "@/lib/constants";

type ViewMode = "starnet" | "worldtree";

interface GraphNode {
  id: string; title: string; type: string; createdAt?: string;
}
interface GraphLink {
  source: string; target: string;
}
interface GraphData {
  nodes: GraphNode[]; links: GraphLink[];
}

const TYPE_COLORS: Record<string, string> = {
  Memory: "#c9a96e", Thought: "#7ba5c4", Emotion: "#d4848c",
  Dream: "#8c7ec4", Story: "#6dab7c", Learning: "#d49e5c",
};

// Speed: ms per node (1 node revealed every N ms)
const SPEEDS = [
  { label: "½×", msPerNode: 2000 },
  { label: "1×", msPerNode: 1000 },
  { label: "2×", msPerNode: 500 },
  { label: "4×", msPerNode: 250 },
];
const TICK_MS = 25; // 40fps tick

function linkKey(l: GraphLink) { return `${l.source}→${l.target}`; }

export default function GraphPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [mode, setMode] = useState<ViewMode>("starnet");
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());

  // Timeline
  const [playing, setPlaying] = useState(false);
  const [followMode, setFollowMode] = useState(false);
  const [animProgress, setAnimProgress] = useState(1);
  const [speedMsPerNode, setSpeedMsPerNode] = useState(1000); // default 1× = 1s/node
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setGraphData(await getGraphData() as GraphData); } catch {} finally { setLoading(false); }
    })();
  }, []);

  // Sorted nodes by creation time
  const sortedNodes = useMemo(() =>
    [...graphData.nodes].sort((a, b) =>
      (a.createdAt ? new Date(a.createdAt).getTime() : 0) -
      (b.createdAt ? new Date(b.createdAt).getTime() : 0)
    ), [graphData.nodes]);

  const totalNodes = sortedNodes.length || 1;

  // ── Animation timer ──────────────────────────────────
  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (!playing) return;

    const totalMs = totalNodes * speedMsPerNode; // total duration at current speed

    timerRef.current = setInterval(() => {
      setAnimProgress((prev) => {
        const step = TICK_MS / totalMs;
        const next = prev + step;
        if (next >= 1) { setPlaying(false); return 1; }
        return next;
      });
    }, TICK_MS);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, speedMsPerNode, totalNodes]);

  // ── Per-node opacity (smooth fade-in) ────────────────
  // Each node fades from 0→1 over a short window as the wavefront passes
  const FADE_WINDOW = 0.04; // 4% of total progress = smooth fade

  const nodeOpacities = useMemo(() => {
    const map = new Map<string, number>();
    sortedNodes.forEach((n, i) => {
      const threshold = i / totalNodes;
      if (animProgress >= threshold + FADE_WINDOW) {
        map.set(n.id, 1); // fully visible
      } else if (animProgress >= threshold) {
        // Fade in: 0 → 1 within the window
        const t = (animProgress - threshold) / FADE_WINDOW;
        map.set(n.id, Math.max(0.06, t)); // never fully invisible (anchor dot)
      } else if (animProgress >= threshold - 0.01) {
        map.set(n.id, 0.06); // about to appear: anchor dot
      } else {
        map.set(n.id, 0.06); // invisible (tiny anchor dot)
      }
    });
    return map;
  }, [sortedNodes, totalNodes, animProgress, FADE_WINDOW]);

  // Fully visible node set (opacity >= 0.95) for link visibility
  const visibleNodeIds = useMemo(() => {
    const s = new Set<string>();
    nodeOpacities.forEach((op, id) => { if (op >= 0.95) s.add(id); });
    return s;
  }, [nodeOpacities]);

  const visibleLinkKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const l of graphData.links) {
      if (visibleNodeIds.has(l.source) && visibleNodeIds.has(l.target)) {
        keys.add(linkKey(l));
      }
    }
    return keys;
  }, [graphData.links, visibleNodeIds]);

  // ── Type filter ──────────────────────────────────────
  const typeFilteredOpacities = useMemo(() => {
    if (typeFilter.size === 0) return nodeOpacities;
    const m = new Map(nodeOpacities);
    m.forEach((op, id) => {
      const node = graphData.nodes.find((n) => n.id === id);
      if (node && !typeFilter.has(node.type)) m.set(id, 0.04); // hide filtered
    });
    return m;
  }, [nodeOpacities, typeFilter, graphData.nodes]);

  const typeVisibleIds = useMemo(() => {
    const s = new Set<string>();
    typeFilteredOpacities.forEach((op, id) => { if (op >= 0.5) s.add(id); });
    return s;
  }, [typeFilteredOpacities]);

  const typeVisibleLinks = useMemo(() => {
    if (typeFilter.size === 0) return visibleLinkKeys;
    const keys = new Set<string>();
    for (const l of graphData.links) {
      if (typeVisibleIds.has(l.source) && typeVisibleIds.has(l.target)) keys.add(linkKey(l));
    }
    return keys;
  }, [graphData.links, typeVisibleIds, visibleLinkKeys, typeFilter.size]);

  // ── Search highlight ──────────────────────────────────
  const highlightedIds = useMemo(() => {
    if (!search.trim()) return new Set<string>();
    const q = search.toLowerCase();
    const s = new Set<string>();
    for (const n of graphData.nodes) {
      if (typeVisibleIds.has(n.id) && n.title.toLowerCase().includes(q)) s.add(n.id);
    }
    return s;
  }, [search, graphData.nodes, typeVisibleIds]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    router.push(`/entry/${node.id}`);
  }, [router]);

  const toggleTypeFilter = (type: string) => {
    setTypeFilter((prev) => { const n = new Set(prev); if (n.has(type)) n.delete(type); else n.add(type); return n; });
  };

  const resetAnim = () => { setPlaying(false); setAnimProgress(1); };
  const startAnim = () => { setAnimProgress(0); setPlaying(true); };
  const togglePlay = () => {
    if (playing) { setPlaying(false); return; }
    if (animProgress >= 1) startAnim(); else setPlaying(true);
  };

  const animDateLabel = useMemo(() => {
    if (sortedNodes.length === 0) return "";
    const idx = Math.floor(animProgress * (sortedNodes.length - 1));
    const n = sortedNodes[Math.min(idx, sortedNodes.length - 1)];
    return n?.createdAt ? new Date(n.createdAt).toLocaleDateString("zh-CN", { year:"numeric", month:"short", day:"numeric" }) : "";
  }, [sortedNodes, animProgress]);

  const visibleCount = typeVisibleIds.size;
  const visibleLinkCount = typeVisibleLinks.size;

  // ── Render ────────────────────────────────────────────

  return (
    <div className="mx-auto w-full px-4 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Knowledge Graph</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {loading ? "加载中…" : `${visibleCount} 节点 · ${visibleLinkCount} 边`}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
          <button onClick={() => setMode("starnet")} className={`px-3 py-1 text-xs rounded-md interactive ${mode==="starnet"?"bg-card text-foreground shadow-sm":"text-muted-foreground hover:text-foreground"}`}>🌌 StarNet</button>
          <button onClick={() => setMode("worldtree")} className={`px-3 py-1 text-xs rounded-md interactive ${mode==="worldtree"?"bg-card text-foreground shadow-sm":"text-muted-foreground hover:text-foreground"}`}>🌳 WorldTree</button>
        </div>
      </div>

      {/* ── Timeline Bar ────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4 rounded-lg border border-border bg-card/50 px-3 py-2">
        <button onClick={togglePlay} className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white hover:bg-primary-hover interactive shrink-0" title={playing?"暂停":animProgress<1?"继续":"从头播放"}>
          {playing ? "⏸" : "▶"}
        </button>

        <input
          type="range" min={0} max={1} step={0.001}
          value={animProgress}
          onChange={(e) => { setPlaying(false); setAnimProgress(parseFloat(e.target.value)); }}
          className="flex-1 min-w-[120px] h-1.5 appearance-none bg-muted rounded-full cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
        />

        <span className="text-[0.688rem] text-muted-foreground whitespace-nowrap min-w-[6rem] text-right">
          {animProgress >= 1 ? "至今" : animDateLabel}
        </span>

        <span className="text-[0.625rem] text-muted-foreground/60 whitespace-nowrap w-8 text-right">
          {Math.round(animProgress * 100)}%
        </span>

        {SPEEDS.map((s) => (
          <button key={s.msPerNode} onClick={() => setSpeedMsPerNode(s.msPerNode)}
            className={`px-1.5 py-0.5 rounded text-[0.625rem] interactive ${speedMsPerNode===s.msPerNode?"bg-primary/10 text-primary":"text-muted-foreground hover:text-foreground"}`}
          >{s.label}</button>
        ))}

        <span className="text-muted-foreground/30 mx-0.5">|</span>

        <button
          onClick={() => setFollowMode(!followMode)}
          className={`px-1.5 py-0.5 rounded text-[0.625rem] interactive ${followMode?"bg-primary/10 text-primary":"text-muted-foreground hover:text-foreground"}`}
          title={followMode ? "视角固定" : "视角跟随"}
        >
          {followMode ? "🎯 跟随" : "📍 固定"}
        </button>

        <button onClick={resetAnim} className="garden-ctrl-btn-muted shrink-0 interactive">↺ 重置</button>
      </div>

      {/* Search + Type filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <input type="text" placeholder="搜索笔记…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
          {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">✕</button>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(ENTRY_TYPES as readonly string[]).map((t) => {
            const active = typeFilter.size === 0 || typeFilter.has(t);
            return (
              <button key={t} onClick={() => toggleTypeFilter(t)}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.688rem] interactive border ${active?"border-primary/30 bg-primary/5 text-foreground":"border-border bg-card text-muted-foreground"}`}
                style={{ borderColor: active ? TYPE_COLORS[t] : undefined, backgroundColor: active ? `${TYPE_COLORS[t]}15` : undefined }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[t] }} />{TYPE_LABELS[t] || t}
              </button>
            );
          })}
        </div>
        {(typeFilter.size > 0 || search) && (
          <button onClick={() => { setTypeFilter(new Set()); setSearch(""); }} className="garden-ctrl-btn-muted interactive">清除</button>
        )}
      </div>

      {/* Graph */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]"><div className="text-center"><div className="h-8 w-8 mx-auto mb-3 rounded-full border-2 border-primary border-t-transparent animate-spin" /><p className="text-xs text-muted-foreground">加载图谱数据…</p></div></div>
        ) : graphData.nodes.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]"><div className="text-center"><p className="text-4xl mb-3">🌱</p><p className="text-sm text-muted-foreground">还没有笔记，去 /plant 种下第一颗种子吧～</p></div></div>
        ) : mode === "starnet" ? (
          <StarNetView graphData={graphData} nodeOpacities={typeFilteredOpacities} visibleLinkKeys={typeVisibleLinks} onNodeClick={handleNodeClick} highlightedNodeIds={highlightedIds} nodeColors={TYPE_COLORS} followMode={followMode} animProgress={animProgress} dark={isDark} />
        ) : (
          <WorldTreeView graphData={graphData} nodeOpacities={typeFilteredOpacities} visibleLinkKeys={typeVisibleLinks} onNodeClick={handleNodeClick} highlightedNodeIds={highlightedIds} nodeColors={TYPE_COLORS} followMode={followMode} animProgress={animProgress} />
        )}
      </div>
    </div>
  );
}
