"use client";

// ============================================================
// Digital Garden — Tag Cloud（仿 Grtblog Framer Motion 标签云）
// ============================================================
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface TagCloudProps {
  tags: { name: string; count: number }[];
}

export function TagCloud({ tags }: TagCloudProps) {
  const [rows, setRows] = useState(2);

  useEffect(() => {
    setRows(Math.max(2, Math.floor(window.innerHeight / 300)));
  }, []);

  if (tags.length === 0) return null;

  // Compute max count once to avoid O(n²) per render
  const maxCount = useMemo(() => Math.max(...tags.map((t) => t.count)), [tags]);

  // Split tags into rows for horizontal scrolling effect
  const perRow = Math.ceil(tags.length / rows);
  const grid = Array.from({ length: rows }, (_, i) =>
    tags.slice(i * perRow, (i + 1) * perRow)
  );

  return (
    <div className="overflow-hidden py-4 select-none">
      {grid.map((row, ri) => (
        <div key={ri} className="flex gap-2 py-1.5" style={{ width: "200%" }}>
          <motion.div
            className="flex gap-2 shrink-0"
            animate={{ x: [0, "-50%"] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 30 + ri * 8,
                ease: "linear",
              },
            }}
          >
            {[...row, ...row].map((tag, i) => (
              <Link
                key={`${tag.name}-${i}`}
                href={`/garden?tag=${encodeURIComponent(tag.name)}`}
                className="shrink-0 rounded-full bg-muted/60 hover:bg-primary/15 hover:text-primary px-3 py-1 text-xs text-muted-foreground interactive whitespace-nowrap"
                style={{
                  opacity: 0.3 + (tag.count / maxCount) * 0.7,
                  fontSize: `${0.7 + (tag.count / maxCount) * 0.4}rem`,
                }}
              >
                {tag.name}
                <span className="ml-1 text-[0.6em] opacity-50">{tag.count}</span>
              </Link>
            ))}
          </motion.div>
        </div>
      ))}
    </div>
  );
}
