"use client";

// ============================================================
// Digital Garden 2.0 — Sidebar (embedded toggle, narrow strip)
// ============================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSidebarOpen, setSidebarOpen } from "@/lib/layout-config";
import { motion, AnimatePresence } from "framer-motion";
import { NAV_ITEMS } from "@/lib/nav-items";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(getSidebarOpen());
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    setSidebarOpen(next);
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Sidebar — sticky, doesn't scroll with page */}
      <aside
        className={`shrink-0 sticky top-14 border-r border-border bg-card transition-all duration-300 ease-in-out flex flex-col ${
          open ? "w-56" : "w-12"
        }`}
      >
        {/* Toggle button — embedded inside sidebar */}
        <div className="px-1.5 pt-3 pb-2 flex justify-center">
          <button
            onClick={toggle}
            className="text-xs text-muted-foreground hover:text-foreground interactive p-1.5 rounded-md hover:bg-muted transition-colors"
            title={open ? "收起侧边栏" : "展开侧边栏"}
          >
            {open ? (
              <span className="flex items-center gap-1.5">
                <span className="text-sm">◀</span>
                <span className="text-[0.688rem]">收起</span>
              </span>
            ) : (
              <span className="text-sm">▶</span>
            )}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-1.5 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon }) => (
            <SidebarLink key={href} href={href} icon={icon} label={label} collapsed={!open} />
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  collapsed,
}: {
  href: string;
  icon: string;
  label: string;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`flex items-center rounded-md text-sm interactive transition-all ${
        collapsed
          ? "justify-center px-0 py-2"
          : "gap-2.5 px-2.5 py-1.5"
      } ${
        active
          ? "bg-secondary text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      <span className="text-sm leading-none flex-shrink-0">{icon}</span>
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
