"use client";

// ============================================================
// Digital Garden — Account Dashboard
// ============================================================
// 个人花园档案：头像 · 统计 · 写作画像 · 密码管理
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AvatarEditor } from "@/components/ui/avatar-editor";
import { useToast } from "@/components/ui/toast";

interface UserInfo { id: string; username: string; displayName: string; avatar: string | null; }

interface Stats {
  username: string; displayName: string; avatar: string | null;
  createdAt: string; daysSinceRegistration: number; lastActive: string;
  totalEntries: number; totalChars: number; tagCount: number;
  maxStreak: number; mostActiveType: string;
  typeBreakdown: { type: string; label: string; count: number }[];
}

export default function AccountPage() {
  const router = useRouter();
  const toast = useToast();
  const [visibility, setVisibility] = useState<string>("public");
  const [visibilityLoading, setVisibilityLoading] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [viewStats, setViewStats] = useState<{totalViews:number;todayViews:number;weekViews:number;popularEntries:{slug:string;title:string;views:number}[]} | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarOpen, setAvatarOpen] = useState(false);

  // Username form
  const [editUsername, setEditUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [unError, setUnError] = useState("");
  const [unLoading, setUnLoading] = useState(false);

  // Password form
  const [oldPw, setOldPw] = useState(""); const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState(""); const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false); const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then(r => r.ok ? r.json() : null),
      fetch("/api/auth/stats").then(r => r.ok ? r.json() : null),
      fetch("/api/auth/visibility").then(r => r.ok ? r.json() : null),
    ]).then(async ([meData, statsData, visData]) => {
      // Fetch per-user view stats after we know the userId
      const userId = meData?.user?.id;
      const viewData = userId
        ? await fetch(`/api/views?userId=${encodeURIComponent(userId)}`).then(r => r.ok ? r.json() : null)
        : null;
      if (meData?.user) setUser(meData.user);
      if (statsData) setStats(statsData);
      if (visData?.visibility) setVisibility(visData.visibility);
      if (viewData?.totalViews !== undefined) setViewStats(viewData);
    }).finally(() => setLoading(false));
  }, []);

  const handleAvatarSave = (dataUrl: string) => {
    if (!user) return;
    setUser({ ...user, avatar: dataUrl });
    setAvatarOpen(false);
    toast.success("头像已更新");
  };

  const toggleVisibility = async () => {
    const next = visibility === "public" ? "private" : "public";
    setVisibilityLoading(true);
    try {
      const res = await fetch("/api/auth/visibility", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: next }),
      });
      const data = await res.json();
      if (res.ok) { setVisibility(next); toast.success(next === "public" ? "已设为公开" : "已设为私密"); }
      else toast.error(data.error || "操作失败");
    } catch { toast.error("网络错误"); }
    finally { setVisibilityLoading(false); }
  };

  const handleUsername = async () => {
    setUnError("");
    if (!newUsername.trim() || newUsername.trim() === user?.username) {
      setEditUsername(false); setNewUsername(""); return;
    }
    setUnLoading(true);
    try {
      const res = await fetch("/api/auth/username", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (user) setUser({ ...user, username: data.username });
        toast.success("用户名已更新");
        setEditUsername(false); setNewUsername("");
      } else { setUnError(data.error || "修改失败"); }
    } catch { setUnError("网络错误"); }
    finally { setUnLoading(false); }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setPwError(""); setPwSuccess(false);
    if (newPw !== confirmPw) { setPwError("两次输入的新密码不一致"); return; }
    if (newPw.length < 2) { setPwError("新密码至少需要2个字符"); return; }
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPwSuccess(true); setOldPw(""); setNewPw(""); setConfirmPw("");
      } else { setPwError(data.error || "修改失败"); }
    } catch { setPwError("网络错误"); }
    finally { setPwLoading(false); }
  };

  if (loading) return <div className="max-w-xl mx-auto px-4 py-16 text-center"><p className="text-muted-foreground text-sm">加载中…</p></div>;
  if (!user) return <div className="max-w-xl mx-auto px-4 py-16 text-center"><p className="text-muted-foreground text-sm mb-3">请先登录</p><button onClick={() => router.push("/login")} className="text-primary text-sm hover:underline interactive">前往登录</button></div>;

  const S = stats;
  const avatarSrc = user.avatar;
  const avatarInitial = (user.displayName || user.username || "?")[0].toUpperCase();

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-xl font-semibold text-foreground mb-8">🌱 我的花园档案</h1>

      {/* ── Profile Header ───────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
          <button onClick={() => setAvatarOpen(true)} className="shrink-0 interactive group" title="点击更换头像">
            {avatarSrc ? (
              <img src={avatarSrc} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-border transition-transform duration-200 group-hover:scale-110" />
            ) : (
              <span className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary border-2 border-border transition-transform duration-200 group-hover:scale-110">
                {avatarInitial}
              </span>
            )}
          </button>
          <div>
            <p className="text-lg font-semibold text-foreground">{user.displayName || user.username}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {editUsername ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => { setNewUsername(e.target.value); setUnError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleUsername(); if (e.key === "Escape") { setEditUsername(false); setNewUsername(""); } }}
                    placeholder={user.username}
                    autoFocus
                    className="w-32 sm:w-40 rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button onClick={handleUsername} disabled={unLoading} className="text-xs text-primary hover:underline interactive">
                    {unLoading ? "…" : "✓"}
                  </button>
                  <button onClick={() => { setEditUsername(false); setNewUsername(""); setUnError(""); }} className="text-xs text-muted-foreground hover:text-foreground interactive">✕</button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                  <button onClick={() => { setEditUsername(true); setNewUsername(""); }} className="text-[0.625rem] text-primary/60 hover:text-primary interactive">✎ 修改</button>
                </>
              )}
            </div>
            {unError && <p className="text-xs text-red-500 mt-0.5">{unError}</p>}
            {S && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                🗓 已入驻 {S.daysSinceRegistration} 天 · {S.totalEntries} 篇笔记
              </p>
            )}
            <button onClick={() => setAvatarOpen(true)} className="text-xs text-primary mt-1.5 hover:underline interactive">更换头像</button>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={toggleVisibility}
                disabled={visibilityLoading}
                className={`rounded-full px-3 py-0.5 text-[0.688rem] interactive transition-all ${
                  visibility === "public"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                }`}
              >
                {visibility === "public" ? "🌐 公开" : "🔒 私密"}
              </button>
              <span className="text-[0.625rem] text-muted-foreground">
                {visibility === "public" ? "所有人可见" : "仅自己可见"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ───────────────────────────────── */}
      {S && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon="📝" value={S.totalEntries} label="笔记" />
          <StatCard icon="🏷" value={S.tagCount} label="标签" />
          <StatCard icon="✍️" value={formatChars(S.totalChars)} label="创作字数" />
          <StatCard icon="🔥" value={S.maxStreak + "天"} label="最长连续" />
        </div>
      )}

      {/* ── Type Breakdown ────────────────────────────── */}
      {S && S.typeBreakdown.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <h2 className="text-sm font-medium text-foreground mb-3">📊 写作画像</h2>
          <div className="space-y-2">
            {S.typeBreakdown.map(t => (
              <div key={t.type} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16 shrink-0">{t.label}</span>
                <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary/60 transition-all duration-500" style={{ width: `${Math.max(3, (t.count / S.totalEntries) * 100)}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-6 text-right">{t.count}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground/70 mt-3">
            最爱写「{S.mostActiveType}」· 共 {S.totalEntries} 篇，{formatChars(S.totalChars)} 字
          </p>
        </div>
      )}

      {/* ── Garden View Stats ─────────────────────────── */}
      {viewStats && (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 mb-6">
          <h2 className="text-sm font-medium text-foreground mb-3">👁 我的笔记访问</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{viewStats.totalViews}</p>
              <p className="text-[0.625rem] text-muted-foreground">总访问</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{viewStats.todayViews}</p>
              <p className="text-[0.625rem] text-muted-foreground">今日</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{viewStats.weekViews}</p>
              <p className="text-[0.625rem] text-muted-foreground">近7天</p>
            </div>
          </div>
          {viewStats.popularEntries.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">🔥 热门笔记</p>
              <div className="space-y-1">
                {viewStats.popularEntries.slice(0, 5).map((e) => (
                  <div key={e.slug} className="flex items-center justify-between text-sm">
                    <a href={`/entry/${e.slug}`} className="text-foreground hover:text-primary interactive truncate flex-1 mr-2">
                      {e.title}
                    </a>
                    <span className="text-[0.625rem] text-muted-foreground shrink-0">{e.views} 次</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Password ──────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <h2 className="text-sm font-medium text-foreground mb-4">🔐 修改密码</h2>
        <form onSubmit={handlePassword} className="space-y-3">
          <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" placeholder="旧密码" required />
          <div className="flex flex-col sm:flex-row gap-2">
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" placeholder="新密码" required />
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" placeholder="确认新密码" required />
          </div>
          {pwError && <p className="text-xs text-red-500">{pwError}</p>}
          {pwSuccess && <p className="text-xs text-green-600">✅ 密码修改成功</p>}
          <button type="submit" disabled={pwLoading} className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:opacity-90 interactive disabled:opacity-50">{pwLoading ? "修改中…" : "修改密码"}</button>
        </form>
      </div>

      <AvatarEditor open={avatarOpen} currentAvatar={user.avatar || null} onSave={handleAvatarSave} onClose={() => setAvatarOpen(false)} />
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────

function StatCard({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <p className="text-2xl mb-0.5">{icon}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-[0.625rem] text-muted-foreground">{label}</p>
    </div>
  );
}

function formatChars(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + "w";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}
