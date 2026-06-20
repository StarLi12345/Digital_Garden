"use client";

// ============================================================
// Digital Garden 3.0 — StarNet View (Force-Directed Graph)
// ============================================================
// Layout: let force simulation place connected nodes naturally,
// then pin orphan nodes right next to the largest cluster.
// ============================================================

import { useCallback, useRef, useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d"),
  { ssr: false }
);

export interface GraphNode {
  id: string; title: string; type: string; createdAt?: string;
}

export interface GraphLink {
  source: string; target: string;
}

interface StarNetViewProps {
  graphData: { nodes: GraphNode[]; links: GraphLink[] };
  nodeOpacities: Map<string, number>;
  visibleLinkKeys: Set<string>;
  onNodeClick: (node: GraphNode) => void;
  highlightedNodeIds: Set<string>;
  nodeColors: Record<string, string>;
  followMode?: boolean;
  animProgress?: number;
  dark?: boolean;
}

function linkKey(l: GraphLink) { return `${l.source}→${l.target}`; }

export function StarNetView({
  graphData, nodeOpacities, visibleLinkKeys,
  onNodeClick, highlightedNodeIds, nodeColors,
  followMode = false, animProgress = 1, dark = false,
}: StarNetViewProps) {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodePosRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const [dims, setDims] = useState({ width: 800, height: 500 });

  // ResizeObserver
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setDims({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Follow mode
  useEffect(() => {
    if (!followMode || !fgRef.current) return;
    const nodesWithTime = graphData.nodes
      .filter((n) => n.createdAt)
      .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    if (nodesWithTime.length === 0) return;
    const idx = Math.floor(animProgress * (nodesWithTime.length - 1));
    const targetId = nodesWithTime[Math.max(0, Math.min(idx, nodesWithTime.length - 1))].id;
    const pos = nodePosRef.current.get(targetId);
    if (pos) {
      const z = fgRef.current.zoom?.() || 1;
      const ch = containerRef.current?.clientHeight || 500;
      fgRef.current.centerAt?.(pos.x, pos.y + ch * 0.15 / z, 0);
    }
  }, [followMode, animProgress, graphData.nodes]);

  // Identify linked vs orphan nodes
  const linkedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const link of graphData.links) {
      ids.add(typeof link.source === "string" ? link.source : (link.source as any).id);
      ids.add(typeof link.target === "string" ? link.target : (link.target as any).id);
    }
    return ids;
  }, [graphData.links]);

  const data = useMemo(() => {
    const cx = dims.width / 2;
    const cy = dims.height / 2;
    const orphans = graphData.nodes.filter((n) => !linkedIds.has(n.id));
    const orphanCount = orphans.length;

    return {
      nodes: graphData.nodes.map((n, i) => {
        const isOrphan = !linkedIds.has(n.id);
        const orphanIdx = isOrphan ? orphans.indexOf(n) : -1;
        return {
          id: n.id, name: n.title, type: n.type,
          // Start orphans near center so they never appear far away
          ...(isOrphan && orphanCount > 0 ? {
            x: cx + 120 + (orphanIdx % 3) * 10,
            y: cy - 60 + orphanIdx * 30,
          } : {}),
        };
      }),
      links: graphData.links.map((l) => ({
        source: l.source, target: l.target, key: linkKey(l),
      })),
    };
  }, [graphData.nodes, graphData.links, linkedIds, dims.width, dims.height]);

  const handleNodeClick = useCallback(
    (node: any) => {
      const op = nodeOpacities.get(node.id) || 0;
      if (op < 0.3) return;
      const fullNode = graphData.nodes.find((n) => n.id === node.id);
      if (fullNode) onNodeClick(fullNode);
    },
    [graphData, onNodeClick, nodeOpacities]
  );

  // ── After simulation: pin orphans right next to the largest cluster ──
  const placedRef = useRef(false);
  useEffect(() => { placedRef.current = false; }, [graphData.nodes.length, graphData.links.length]);

  const handleEngineStop = useCallback(() => {
    const fg = fgRef.current;
    if (!fg) return;

    if (!placedRef.current && data.nodes.length > 0) {
      placedRef.current = true;
      try {
        const nodes = data.nodes as any[];

        // Find the largest connected component's bounding box
        const mainIds = new Set(linkedIds);
        // Also include all connected nodes (transitively)
        // Use BFS from first linked node to get the main component
        let mainMinX = Infinity, mainMinY = Infinity, mainMaxX = -Infinity, mainMaxY = -Infinity;
        let mainCount = 0;
        const orphans: any[] = [];

        for (const node of nodes) {
          if (linkedIds.has(node.id)) {
            // Connected node: track bounding box
            if (node.x != null) {
              mainMinX = Math.min(mainMinX, node.x);
              mainMaxX = Math.max(mainMaxX, node.x);
            }
            if (node.y != null) {
              mainMinY = Math.min(mainMinY, node.y);
              mainMaxY = Math.max(mainMaxY, node.y);
            }
            mainCount++;
          } else if (node.x != null && node.y != null) {
            // Orphan node
            orphans.push(node);
          }
        }

        // Clear any existing pins
        for (const node of nodes) {
          node.fx = undefined;
          node.fy = undefined;
        }

        if (orphans.length > 0) {
          if (mainCount > 0) {
            // Place orphans in a tight column right next to the main cluster
            const mainH = mainMaxY - mainMinY;
            const gap = 50; // spacing between orphans
            // Start 15px to the right of the cluster, vertically centered
            const startX = mainMaxX + 15;
            const totalH = orphans.length * gap;
            const startY = mainMinY + (mainH - totalH) / 2;

            orphans.forEach((node: any, i: number) => {
              node.fx = startX;
              node.fy = startY + i * gap;
              node.x = node.fx;
              node.y = node.fy;
            });
          } else {
            // All nodes are orphans — center grid
            const cx = dims.width / 2;
            const cy = dims.height / 2;
            const cols = Math.ceil(Math.sqrt(orphans.length));
            orphans.forEach((node: any, i: number) => {
              node.fx = cx + (i % cols) * 60 - (cols * 30);
              node.fy = cy + Math.floor(i / cols) * 50 - (Math.ceil(orphans.length / cols) * 25);
              node.x = node.fx;
              node.y = node.fy;
            });
          }
        }

        fg.d3ReheatSimulation?.();
      } catch { /* ignore */ }
    }

    fg.zoomToFit?.(400, 20);
  }, [data, linkedIds, dims.width, dims.height]);

  return (
    <div ref={containerRef} className="w-full" style={{ height: "calc(100vh - 220px)", minHeight: "500px" }}>
      <ForceGraph2D
        ref={fgRef}
        width={dims.width}
        height={dims.height}
        graphData={data}
        nodeLabel="name"
        nodeRelSize={4}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const vid = node.id as string;
          if (node.x != null && node.y != null) {
            nodePosRef.current.set(vid, { x: node.x, y: node.y });
          }
          const opacity = nodeOpacities.get(vid) || 0;
          if (opacity < 0.07) {
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, 0.6, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(100,100,100,0.04)";
            ctx.fill();
            return;
          }
          const baseColor = nodeColors[node.type] || "#888";
          let color = baseColor;
          if (highlightedNodeIds.size > 0 && !highlightedNodeIds.has(vid)) {
            color = "rgba(150,150,150,0.15)";
          }
          const label = (node.name || vid) as string;
          const fontSize = Math.max(4, 10 / globalScale);
          const radius = Math.min(20, Math.max(3, 4 * (node.type === "Learning" ? 1.5 : 1)));
          ctx.save();
          ctx.globalAlpha = Math.min(1, opacity);
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, radius + 2, 0, 2 * Math.PI);
          ctx.fillStyle = color.replace(")", ",0.25)").replace("rgb", "rgba");
          ctx.fill();
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
          if (highlightedNodeIds.size > 0 && highlightedNodeIds.has(vid)) {
            ctx.strokeStyle = "rgba(255,255,255,0.9)";
            ctx.lineWidth = 2.5 / globalScale;
            ctx.stroke();
          }
          ctx.font = `${fontSize}px system-ui, sans-serif`;
          ctx.fillStyle = dark ? "#e0e0e0" : "#333";
          ctx.textAlign = "center";
          ctx.fillText(
            label.length > 12 ? label.slice(0, 11) + "…" : label,
            node.x!, node.y! + radius + fontSize + 2
          );
          ctx.restore();
        }}
        linkColor={(link: any) => {
          const key = link.key || linkKey(link);
          return visibleLinkKeys.has(key) ? "rgba(150,150,150,0.25)" : "rgba(150,150,150,0.02)";
        }}
        linkWidth={(link: any) => {
          const key = link.key || linkKey(link);
          return visibleLinkKeys.has(key) ? 0.6 : 0.1;
        }}
        linkDirectionalArrowLength={0}
        onNodeClick={handleNodeClick}
        onEngineStop={handleEngineStop}
        cooldownTicks={60}
        onNodeDragEnd={(node: any) => {
          if (linkedIds.has(node.id)) {
            node.fx = undefined;
            node.fy = undefined;
          } else {
            node.fx = node.x;
            node.fy = node.y;
          }
        }}
        enableZoomInteraction
        enablePanInteraction
      />
    </div>
  );
}
