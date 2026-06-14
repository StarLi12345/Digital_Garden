"use client";

// ============================================================
// Digital Garden 3.0 — WorldTree View
// ============================================================
// D3 tree layout with:
// - Adaptive separation (wider when siblings crowd)
// - Alternating label position (above/below) to prevent overlap
// - Dynamic height via CSS aspect-ratio from layout bounds
// ============================================================

import { useMemo, useRef, useEffect, useCallback, useState } from "react";
import { tree as d3Tree, hierarchy as d3Hierarchy } from "d3-hierarchy";

export interface GraphNode {
  id: string; title: string; type: string; createdAt?: string;
}
export interface GraphLink {
  source: string; target: string;
}

interface WorldTreeViewProps {
  graphData: { nodes: GraphNode[]; links: GraphLink[] };
  nodeOpacities: Map<string, number>;
  visibleLinkKeys: Set<string>;
  onNodeClick: (node: GraphNode) => void;
  highlightedNodeIds: Set<string>;
  nodeColors: Record<string, string>;
  followMode?: boolean;
  animProgress?: number;
}

interface TreeNode {
  id: string; name: string; type: string;
  children: TreeNode[];
  color: string;
  siblingIndex?: number;
  siblingCount?: number;
}

export function WorldTreeView({
  graphData, nodeOpacities, visibleLinkKeys,
  onNodeClick, highlightedNodeIds, nodeColors,
  followMode = false, animProgress = 1,
}: WorldTreeViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState({ scale: 1, panX: 0, panY: 0, dragging: false, dragStartX: 0, dragStartY: 0 });
  const initialCenterDone = useRef(false);

  // Zoom on wheel
  useEffect(() => {
    const el = svgRef.current; if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const d = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => ({ ...z, scale: Math.min(3, Math.max(0.2, z.scale * d)) }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Pan on drag
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as Element).tagName === "svg") {
      setZoom((z) => ({ ...z, dragging: true, dragStartX: e.clientX - z.panX, dragStartY: e.clientY - z.panY }));
    }
  }, []);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!zoom.dragging) return;
    setZoom((z) => ({ ...z, panX: e.clientX - z.dragStartX, panY: e.clientY - z.dragStartY }));
  }, [zoom.dragging]);
  const onMouseUp = useCallback(() => setZoom((z) => ({ ...z, dragging: false })), []);

  // ── Build tree ────────────────────────────────────────
  const treeRoot = useMemo(() => {
    const { nodes, links } = graphData;
    if (nodes.length === 0) return null;

    const sorted = [...nodes].sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return da - db;
    });

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const parentMap = new Map<string, string | null>();

    for (const node of sorted) {
      const selfTime = node.createdAt ? new Date(node.createdAt).getTime() : Infinity;
      let bestParent: string | null = null, bestDiff = Infinity;

      for (const link of links) {
        if (link.target === node.id && link.source !== node.id) {
          const p = nodeMap.get(link.source);
          if (p?.createdAt) {
            const pt = new Date(p.createdAt).getTime();
            if (pt < selfTime && (selfTime - pt) < bestDiff) {
              bestDiff = selfTime - pt;
              bestParent = link.source;
            }
          }
        }
      }
      parentMap.set(node.id, bestParent);
    }

    function build(id: string, depth: number): TreeNode {
      const node = nodeMap.get(id)!;
      const children = sorted
        .filter((n) => parentMap.get(n.id) === id && n.id !== id)
        .map((n, i) => {
          const child = build(n.id, depth + 1);
          child.siblingIndex = i;
          return child;
        });

      // Set sibling count on children
      children.forEach((c) => { c.siblingCount = children.length; });

      return {
        id: node.id, name: node.title || node.id, type: node.type,
        children, color: nodeColors[node.type] || "#888",
        siblingIndex: undefined, siblingCount: undefined,
      };
    }

    const rootIds = sorted.filter((n) => parentMap.get(n.id) === null).map((n) => n.id);
    if (rootIds.length === 0) return null;

    const children = rootIds.map((id, i) => { const c = build(id, 1); c.siblingIndex = i; c.siblingCount = rootIds.length; return c; });

    return {
      id: "__root__", name: "🌱", type: "root",
      children, color: "#6b9e4a",
    } as TreeNode;
  }, [graphData]);

  // ── D3 layout (adaptive separation) ────────────────────
  const layoutData = useMemo(() => {
    if (!treeRoot || treeRoot.children.length === 0) return null;

    const root = d3Hierarchy(treeRoot);

    const V = 150; // vertical spacing

    // Base horizontal spacing: wider when there are more nodes total
    const totalNodes = graphData.nodes.length;
    const H = totalNodes > 30 ? 55 : totalNodes > 15 ? 65 : 80;

    const layout = d3Tree<TreeNode>()
      .nodeSize([H, V])
      .separation((a, b) => {
        const sameParent = a.parent === b.parent;
        // Slightly more space between different-parent nodes
        return sameParent ? 1.1 : 1.6;
      });

    layout(root);

    const positionedNodes: { x: number; y: number; data: TreeNode }[] = [];
    const positionedLinks: { sx: number; sy: number; tx: number; ty: number; data: TreeNode }[] = [];
    const maxDepth = root.height || 1;

    // Top-down: root at depth 0 → top, leaves at bottom
    root.each((node) => {
      positionedNodes.push({
        x: node.x!, y: (node.depth || 0) * V, data: node.data,
      });
    });

    root.links().forEach((link) => {
      positionedLinks.push({
        sx: link.source.x!, sy: link.source.depth * V,
        tx: link.target.x!, ty: link.target.depth * V,
        data: link.target.data,
      });
    });

    // Bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    positionedNodes.forEach(({ x, y }) => {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    });

    const pad = 80;
    return {
      nodes: positionedNodes, links: positionedLinks,
      width: Math.max(800, maxX - minX + pad * 2),
      height: Math.max(500, maxY - minY + pad * 2),
      offsetX: -minX + pad,
      offsetY: -minY + pad,
    };
  }, [treeRoot]);

  // Follow mode: instant center on current wavefront node.
  useEffect(() => {
    if (!followMode || !layoutData) return;
    const timeMap = new Map(graphData.nodes.map((n) => [n.id, n.createdAt || ""]));
    const layoutNodes = layoutData.nodes.filter((n) => n.data.id !== "__root__");
    layoutNodes.sort((a, b) => (timeMap.get(a.data.id)||"").localeCompare(timeMap.get(b.data.id)||""));
    const idx = Math.floor(animProgress * (layoutNodes.length - 1));
    const target = layoutNodes[Math.max(0, Math.min(idx, layoutNodes.length - 1))];
    if (!target) return;

    const c = containerRef.current;
    if (!c) return;
    const tx = target.x + (layoutData.offsetX || 0);
    const ty = target.y + (layoutData.offsetY || 0);

    setZoom((z) => ({
      ...z,
      panX: (c.clientWidth / 2) - tx * z.scale,
      panY: (c.clientHeight * 0.35) - ty * z.scale,
    }));
  }, [followMode, animProgress, layoutData]);

  // Auto-center on first layout (only when not following)
  useEffect(() => {
    if (!layoutData || initialCenterDone.current) return;
    initialCenterDone.current = true;
    const c = containerRef.current; if (!c) return;
    // Center horizontally, start from top
    setZoom((z) => ({ ...z, panX: c.clientWidth / 2 - layoutData.width / 2, panY: 20 }));
  }, [layoutData]);

  // ── Render ───────────────────────────────────────────

  if (!layoutData || !treeRoot) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <p className="text-sm text-muted-foreground">需要更多笔记才能构建世界树 🌱</p>
      </div>
    );
  }

  const { nodes, links, width, height, offsetX, offsetY } = layoutData;
  const aspect = (width / height).toFixed(4);

  const handleNodeClick = (data: TreeNode) => {
    if (data.id === "__root__") return;
    if ((nodeOpacities.get(data.id) || 0) < 0.3) return;
    const fn = graphData.nodes.find((n) => n.id === data.id);
    if (fn) onNodeClick(fn);
  };

  return (
    <div ref={containerRef} className="w-full overflow-hidden" style={{ minHeight: "500px" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full cursor-grab"
        style={{ aspectRatio: aspect, background: "transparent", display: "block" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <g transform={`translate(${zoom.panX},${zoom.panY}) scale(${zoom.scale})`}>
        <defs>
          <radialGradient id="sg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6b9e4a" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#6b9e4a" stopOpacity="0"/>
          </radialGradient>
        </defs>

        {/* Branches */}
        {links.map((link, i) => {
          const op = Math.min(1, (nodeOpacities.get(link.data.id) || 0));
          const vis = op > 0.3;
          const mx = (link.sx + link.tx) / 2, my = (link.sy + link.ty) / 2;
          const d = `M${link.sx+offsetX},${link.sy+offsetY} Q${mx+offsetX},${my+offsetY} ${link.tx+offsetX},${link.ty+offsetY}`;
          return <path key={i} d={d} fill="none" stroke={vis?`rgba(107,158,74,${0.35*op})`:"rgba(107,158,74,0.04)"} strokeWidth={vis?1.8:0.6} strokeLinecap="round"/>;
        })}

        {/* Root glow */}
        {(() => {
          const rn = nodes.find(n=>n.data.id==="__root__");
          if (rn) return <circle key="rootglow" cx={rn.x+offsetX} cy={rn.y+offsetY} r={50} fill="url(#sg)"/>;
          return null;
        })()}

        {/* Nodes */}
        {nodes.map(({ x, y, data }) => {
          if (data.id === "__root__") {
            return (
              <g key="__root__" transform={`translate(${x+offsetX},${y+offsetY})`}>
                <circle r={30} fill="#6b9e4a" opacity={0.12}/>
                <circle r={22} fill="#6b9e4a" opacity={0.45}/>
                <circle r={15} fill="#5a8a3e" opacity={0.9}/>
                <text textAnchor="middle" dy="0.38em" fontSize={18}>🌱</text>
              </g>
            );
          }

          const opacity = nodeOpacities.get(data.id) || 0;
          if (opacity < 0.04) return null;

          const color = data.color;
          const highlighted = highlightedNodeIds.has(data.id);
          const fs = 12, radius = 7;
          const displayName = data.name.length > 12 ? data.name.slice(0,11)+"…" : data.name;

          // Alternate label position to avoid overlap with neighbors:
          // even siblingIndex → label below, odd → label above
          const si = data.siblingIndex ?? 0;
          const above = (si % 2 === 1);
          const dy = above ? -(radius + fs + 3) : (radius + fs + 2);

          return (
            <g key={data.id} transform={`translate(${x+offsetX},${y+offsetY})`}
               onClick={() => handleNodeClick(data)}
               style={{cursor:opacity>0.3?"pointer":"default"}}>
              {highlighted && opacity>0.5 && <circle r={radius+8} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={2}/>}
              <circle r={radius} fill={color} opacity={Math.min(1,opacity)}/>
              <text textAnchor="middle" dy={dy} fontSize={fs}
                    fill="currentColor" className="fill-foreground"
                    opacity={Math.min(1,opacity)}>
                {displayName}
              </text>
              {/* Tiny dot to mark label position */}
              {opacity > 0.3 && <circle r={1} cy={dy} fill="currentColor" className="fill-foreground" opacity={0.3}/>}
            </g>
          );
        })}
        </g>
      </svg>
    </div>
  );
}
