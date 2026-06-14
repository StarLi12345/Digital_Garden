"use client";

// ============================================================
// Digital Garden 3.0 — StarNet View (Force-Directed Graph)
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
  const autoZoomed = useRef(false);
  const [dims, setDims] = useState({ width: 800, height: 500 });
  // Collect node positions from canvas renders for follow mode
  const nodePosRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // ResizeObserver — canvas doesn't auto-size, must measure container
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setDims({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Follow mode: use positions collected during canvas rendering
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
      const graphOffset = ch * 0.15 / z;
      fgRef.current.centerAt?.(pos.x, pos.y + graphOffset, 0);
    }
  }, [followMode, animProgress, graphData.nodes]);

  const data = useMemo(() => ({
    nodes: graphData.nodes.map((n) => ({
      id: n.id, name: n.title, type: n.type,
    })),
    links: graphData.links.map((l) => ({
      source: l.source, target: l.target, key: linkKey(l),
    })),
  }), [graphData.nodes, graphData.links]);

  const handleNodeClick = useCallback(
    (node: any) => {
      const op = nodeOpacities.get(node.id) || 0;
      if (op < 0.3) return; // ignore clicks on invisible nodes
      const fullNode = graphData.nodes.find((n) => n.id === node.id);
      if (fullNode) onNodeClick(fullNode);
    },
    [graphData, onNodeClick, nodeOpacities]
  );

  const handleEngineStop = useCallback(() => {
    if (!autoZoomed.current && fgRef.current && graphData.nodes.length > 0) {
      autoZoomed.current = true;
      fgRef.current?.zoomToFit?.(400, 80);
    }
  }, [graphData.nodes.length]);

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
          // Store position for follow mode
          if (node.x != null && node.y != null) {
            nodePosRef.current.set(vid, { x: node.x, y: node.y });
          }

          const opacity = nodeOpacities.get(vid) || 0;

          if (opacity < 0.07) {
            // Tiny anchor dot
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, 0.6, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(100,100,100,0.04)";
            ctx.fill();
            return;
          }

          // Determine color
          const baseColor = nodeColors[node.type] || "#888";
          let color = baseColor;
          if (highlightedNodeIds.size > 0 && !highlightedNodeIds.has(vid)) {
            color = "rgba(150,150,150,0.15)";
          }

          const label = (node.name || vid) as string;
          const fontSize = Math.max(4, 10 / globalScale);
          const radius = Math.min(20, Math.max(3, 4 * (node.type === "Learning" ? 1.5 : 1)));

          // Save context for global alpha
          ctx.save();
          ctx.globalAlpha = Math.min(1, opacity);

          // Glow
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, radius + 2, 0, 2 * Math.PI);
          ctx.fillStyle = color.replace(")", ",0.25)").replace("rgb", "rgba");
          ctx.fill();

          // Main circle
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();

          // Highlight ring
          if (highlightedNodeIds.size > 0 && highlightedNodeIds.has(vid)) {
            ctx.strokeStyle = "rgba(255,255,255,0.9)";
            ctx.lineWidth = 2.5 / globalScale;
            ctx.stroke();
          }

          // Label
          ctx.font = `${fontSize}px system-ui, sans-serif`;
          ctx.fillStyle = dark ? "#e0e0e0" : "#333";
          ctx.textAlign = "center";
          ctx.fillText(
            label.length > 12 ? label.slice(0, 11) + "…" : label,
            node.x!,
            node.y! + radius + fontSize + 2
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
        cooldownTicks={150}
        d3AlphaDecay={0.015}
        d3VelocityDecay={0.25}
        onNodeDragEnd={(node: any) => {
          // Reheat neighbors on drag to create the springy feel
          if (fgRef.current) {
            node.fx = undefined;
            node.fy = undefined;
          }
        }}
        enableZoomInteraction
        enablePanInteraction
      />
    </div>
  );
}
