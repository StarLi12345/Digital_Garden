"use client";

// ============================================================
// Digital Garden — Breadcrumb（仿 Layui 面包屑）
// ============================================================
import Link from "next/link";

interface Crumb { label: string; href?: string; }

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6" aria-label="面包屑导航">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-muted-foreground/40">/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground interactive transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
