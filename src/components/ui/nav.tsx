"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./theme-provider";
import { motion, AnimatePresence } from "framer-motion";
import { AvatarEditor } from "./avatar-editor";
import { NAV_ITEMS } from "@/lib/nav-items";

interface UserInfo {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

// NAV_ITEMS imported from @/lib/nav-items (shared with sidebar)

export function Nav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) setCurrentUser(d.user);
      })
      .catch(() => {});
  }, [pathname]);

  const loadUsers = () => {
    fetch("/api/auth/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.users) setAllUsers(d.users);
      })
      .catch(() => {});
  };

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  const cycleTheme = () => {
    const order: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
    setTheme(order[(order.indexOf(theme) + 1) % order.length]);
  };

  const themeEmoji: Record<string, string> = { light: "☀️", dark: "🌙", system: "💻" };

  const logout = async () => {
    // Stop audio before logging out
    const a = document.querySelector("audio"); if (a) { a.pause(); a.src = ""; }
    try { localStorage.setItem("garden-bgm-enabled", "false"); } catch {}
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.replace("/login");
  };

  const switchUser = async (userId: string) => {
    try {
      const res = await fetch("/api/auth/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = "/";
      } else {
        window.location.href = `/login?username=${encodeURIComponent(data.username || "")}`;
      }
    } catch {
      window.location.replace("/login");
    }
  };

  const [pendingDelete, setPendingDelete] = useState<{ userId: string; username: string } | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { userId } = pendingDelete;
    await fetch("/api/auth/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setPendingDelete(null);
    if (userId === currentUser?.id) {
      window.location.replace("/login");
    } else {
      setDeleteSuccess(true);
    }
  };

  const dismissSuccess = () => {
    setDeleteSuccess(false);
    loadUsers();
  };

  const handleAvatarSave = async (dataUrl: string) => {
    const res = await fetch("/api/auth/avatar", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar: dataUrl }),
    });
    if (res.ok) {
      const data = await res.json();
      setCurrentUser((prev) => prev ? { ...prev, avatar: data.avatar } : null);
    }
  };

  const avatarSrc = currentUser?.avatar;
  const avatarInitial = (currentUser?.displayName || currentUser?.username || "?")[0].toUpperCase();

  return (
    <div className="border-b border-nav-border bg-nav-bg backdrop-blur-sm">
      <nav className="garden-nav mx-auto flex h-14 max-w-4xl items-center justify-between px-3 sm:px-6">
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-foreground interactive whitespace-nowrap shrink-0 mr-1"
          >
            Digital Garden
          </Link>
          <div className="hidden sm:flex items-center gap-0.5">
            {NAV_ITEMS.map(({ href, label, icon }) => {
              const active = pathname === href;
              const expanded = active || hoveredNav === href;
              const hovering = !active && hoveredNav === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onMouseEnter={() => {
                    if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
                    setHoveredNav(href);
                  }}
                  onMouseLeave={() => {
                    hoverTimerRef.current = setTimeout(() => setHoveredNav(null), 120);
                  }}
                  className={`inline-flex items-center rounded-md interactive transition-all duration-300 ease-in-out ${
                    active
                      ? "bg-secondary text-foreground px-3 py-1.5 text-sm shadow-sm"
                      : hovering
                        ? "bg-muted/60 text-foreground px-3 py-1.5 text-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30 w-10 h-10 justify-center"
                  }`}
                >
                  <span className="text-lg leading-none shrink-0">{icon}</span>
                  <span
                    className={`whitespace-nowrap text-sm transition-all duration-300 ease-in-out ${
                      expanded
                        ? "max-w-[100px] opacity-100 ml-1.5"
                        : "max-w-0 opacity-0 overflow-hidden"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={cycleTheme}
            className="inline-flex items-center rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted interactive"
            title={`Theme: ${theme}`}
          >
            {themeEmoji[theme]}
          </button>

          {/* User Avatar / Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                if (!userMenuOpen) loadUsers();
              }}
              className="inline-flex items-center rounded-md px-1 py-1 text-sm text-muted-foreground hover:text-foreground hover:bg-muted interactive"
              title={currentUser?.displayName || currentUser?.username || "用户"}
            >
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="avatar"
                  className="w-7 h-7 rounded-full object-cover border border-border transition-transform duration-200 hover:scale-125"
                />
              ) : (
                <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary transition-transform duration-200 hover:scale-125">
                  {avatarInitial}
                </span>
              )}
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-[var(--color-background)] shadow-lg z-50 overflow-hidden"
                >
                  {/* Current user info — with large avatar */}
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-xs text-muted-foreground mb-2">当前账号</p>
                    <div className="flex items-center gap-3">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt="avatar"
                          className="w-12 h-12 rounded-full object-cover border-2 border-border flex-shrink-0 transition-transform duration-200 hover:scale-125"
                        />
                      ) : (
                        <span className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0 border-2 border-border transition-transform duration-200 hover:scale-125">
                          {avatarInitial}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {currentUser?.displayName || currentUser?.username || "未登录"}
                        </p>
                        {currentUser?.username && (
                          <p className="text-[0.688rem] text-muted-foreground truncate">
                            @{currentUser.username}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Other users — switch account */}
                  {allUsers.length > 1 && (
                    <div className="px-2 py-2 border-b border-border">
                      <p className="px-2 text-[0.625rem] text-muted-foreground uppercase tracking-wider mb-1">
                        切换账号
                      </p>
                      {allUsers
                        .filter((u) => u.id !== currentUser?.id)
                        .map((user) => (
                          <div key={user.id} className="flex items-center gap-1">
                            <button
                              onClick={() => switchUser(user.id)}
                              className="flex-1 flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted interactive text-left min-w-0"
                            >
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt=""
                                  className="w-7 h-7 rounded-full object-cover border border-border flex-shrink-0"
                                />
                              ) : (
                                <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                                  {(user.displayName || user.username)[0].toUpperCase()}
                                </span>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm text-foreground truncate">
                                  {user.displayName || user.username}
                                </p>
                                <p className="text-[0.625rem] text-muted-foreground truncate">
                                  @{user.username}
                                </p>
                              </div>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setPendingDelete({ userId: user.id, username: user.displayName || user.username }); }}
                              className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 interactive transition-colors"
                              title={`注销 ${user.displayName || user.username}`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3,6 5,6 21,6" />
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="px-2 py-2 space-y-0.5">
                    <button
                      onClick={() => { setAvatarEditorOpen(true); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted interactive"
                    >
                      <span>📷</span>
                      <span>修改头像</span>
                    </button>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 interactive"
                    >
                      <span>🚪</span>
                      <span>退出登录</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden inline-flex items-center rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground interactive"
          >
            ☰
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden border-t border-nav-border overflow-hidden bg-nav-bg"
          >
            <div className="px-4 py-2 space-y-1">
              {NAV_ITEMS.map(({ href, label, icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`block rounded-md px-3 py-1.5 text-sm ${
                    pathname === href
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {icon} {label}
                </Link>
              ))}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="block w-full text-left rounded-md px-3 py-1.5 text-sm text-red-500 hover:bg-muted"
              >
                🚪 退出花园
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar Editor Modal */}
      <AvatarEditor
        open={avatarEditorOpen}
        onClose={() => setAvatarEditorOpen(false)}
        onSave={handleAvatarSave}
        currentAvatar={currentUser?.avatar || null}
      />

      {/* Delete Account Confirm Dialog — portalled to body */}
      {typeof window !== "undefined" &&
        createPortal(
          <>
            {/* Confirm dialog */}
            <AnimatePresence>
              {pendingDelete && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[9999]"
                >
                  <div
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={() => setPendingDelete(null)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
                  >
                    <p className="text-sm font-medium text-foreground mb-1">注销账号</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      你确认要注销该账号吗？这可能会导致数据丢失，请慎重考虑。
                    </p>
                    <div className="mt-5 flex justify-end gap-2.5">
                      <button
                        onClick={() => setPendingDelete(null)}
                        className="rounded-lg px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted interactive transition-colors"
                      >
                        取消
                      </button>
                      <button
                        onClick={confirmDelete}
                        className="rounded-lg bg-red-500 px-4 py-2 text-xs font-medium text-white hover:bg-red-600 interactive transition-colors"
                      >
                        确认注销
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success dialog */}
            <AnimatePresence>
              {deleteSuccess && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[9999]"
                >
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl text-center"
                  >
                    <p className="text-2xl mb-2">✅</p>
                    <p className="text-sm font-medium text-foreground mb-1">注销成功</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      该账号已永久删除。
                    </p>
                    <div className="mt-5 flex justify-center">
                      <button
                        onClick={dismissSuccess}
                        className="rounded-lg bg-primary px-6 py-2 text-xs font-medium text-white hover:bg-primary-hover interactive transition-colors"
                      >
                        确定
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>,
          document.body,
        )}
    </div>
  );
}
