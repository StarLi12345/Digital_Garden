"use client";

// ============================================================
// Digital Garden — 花园之门 v6（登录/注册）
// ============================================================
// · CSS 手绘花园场景（可切换为图片背景）
// · 光暗双模跟随系统
// · 注册成功后跳回登录 + Toast 提示
// · 背景偏好持久化（localStorage）
// ============================================================

import { useState, useRef, type FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ui/theme-provider";
import { toast } from "@/components/ui/toast";

type Mode = "login" | "register";

// ═══════════════════════════════════════════════════════════════
// Constants — 可选背景图（project resource library）
// ═══════════════════════════════════════════════════════════════

const IMAGE_BACKGROUNDS = [
  { id: "main", src: "/themes/garden/backgrounds/main.webp", label: "秋霞花语" },
  { id: "alt-01", src: "/themes/garden/backgrounds/alt-01.webp", label: "瞭台小憩" },
  { id: "alt-02", src: "/themes/garden/backgrounds/alt-02.webp", label: "晨曦古迹" },
  { id: "moonlight", src: "/themes/garden/backgrounds/moonlight-04.webp", label: "翠庭秘境" },
  { id: "carousel", src: "/carousel/p01.webp", label: "时之律者" },
];

const BG_PREF_KEY = "garden-login-bg";

// ═══════════════════════════════════════════════════════════════
// 纯 CSS 手绘花园场景（深/浅双模）
// ═══════════════════════════════════════════════════════════════
function GardenScene() {
  const { resolved } = useTheme();
  const isDark = resolved === "dark";

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 天空渐变 */}
      <div
        className="absolute inset-0 transition-all duration-[2s]"
        style={{
          background: isDark
            ? "linear-gradient(180deg, #0d1b2a 0%, #1b2838 25%, #1a2c3e 50%, #152030 75%, #0c1728 100%)"
            : "linear-gradient(180deg, #fdf6e8 0%, #fce8c8 20%, #f5d8a8 45%, #e8c8a0 65%, #f0dcc0 85%, #faf0e0 100%)",
        }}
      />

      {/* 山脉 SVG */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
        {/* 最远层山脉 */}
        <path d="M0 500 Q100 380 220 420 Q340 360 420 400 Q500 340 580 390 Q660 330 740 380 Q820 350 900 410 Q1000 370 1100 420 Q1160 400 1200 430 L1200 800 L0 800Z"
          fill={isDark ? "#152535" : "#e8d5b8"} style={{ transition: "fill 2s" }} />
        {/* 第二层山 */}
        <path d="M0 540 Q80 440 180 480 Q280 400 400 450 Q500 410 600 460 Q700 420 800 470 Q880 440 1000 480 Q1100 430 1200 470 L1200 800 L0 800Z"
          fill={isDark ? "#1a2f40" : "#dcc8a0"} style={{ transition: "fill 2s" }} />
        {/* 第三层山 */}
        <path d="M0 580 Q60 500 150 530 Q250 470 380 510 Q480 460 600 500 Q720 450 850 500 Q950 460 1080 510 Q1150 480 1200 500 L1200 800 L0 800Z"
          fill={isDark ? "#1f3548" : "#c9b28a"} style={{ transition: "fill 2s" }} />
        {/* 近景草地 */}
        <path d="M0 620 Q50 580 140 600 Q220 570 340 590 Q440 560 550 585 Q650 565 760 590 Q860 570 980 595 Q1080 575 1200 595 L1200 800 L0 800Z"
          fill={isDark ? "#1a2a1f" : "#a8c888"} style={{ transition: "fill 2s" }} />
        {/* 前景草地 */}
        <path d="M0 660 Q60 630 160 650 Q250 620 360 645 Q460 625 560 650 Q660 630 760 655 Q860 635 960 658 Q1060 640 1200 650 L1200 800 L0 800Z"
          fill={isDark ? "#142418" : "#8fb878"} style={{ transition: "fill 2s" }} />
        {/* 最前景 */}
        <path d="M0 720 Q70 690 180 710 Q280 685 400 705 Q500 690 600 710 Q700 690 820 708 Q920 688 1040 705 Q1140 690 1200 700 L1200 800 L0 800Z"
          fill={isDark ? "#0e1c10" : "#7aa868"} style={{ transition: "fill 2s" }} />

        {/* 大树 1 — 左侧 */}
        <g>
          <rect x="160" y="520" width="14" height="120" rx="5" fill={isDark ? "#2a2218" : "#6b5030"} style={{ transition: "fill 2s" }} />
          <ellipse cx="167" cy="500" rx="60" ry="55" fill={isDark ? "#1a3a1f" : "#6ba858"} style={{ transition: "fill 2s" }} />
          <ellipse cx="145" cy="510" rx="40" ry="42" fill={isDark ? "#1d4225" : "#5a9448"} style={{ transition: "fill 2s" }} />
          <ellipse cx="190" cy="505" rx="38" ry="44" fill={isDark ? "#1b3e22" : "#62a050"} style={{ transition: "fill 2s" }} />
          <ellipse cx="167" cy="485" rx="50" ry="40" fill={isDark ? "#1f4628" : "#78b868"} style={{ transition: "fill 2s" }} />
        </g>

        {/* 大树 2 — 右侧 */}
        <g>
          <rect x="980" y="535" width="12" height="105" rx="5" fill={isDark ? "#2a2218" : "#6b5030"} style={{ transition: "fill 2s" }} />
          <ellipse cx="986" cy="520" rx="50" ry="48" fill={isDark ? "#19381e" : "#5d9a4a"} style={{ transition: "fill 2s" }} />
          <ellipse cx="965" cy="528" rx="35" ry="38" fill={isDark ? "#1b3e22" : "#4e8a3c"} style={{ transition: "fill 2s" }} />
          <ellipse cx="1007" cy="525" rx="33" ry="36" fill={isDark ? "#1c4024" : "#56a248"} style={{ transition: "fill 2s" }} />
          <ellipse cx="986" cy="505" rx="42" ry="36" fill={isDark ? "#1e4528" : "#6ab058"} style={{ transition: "fill 2s" }} />
        </g>

        {/* 远树剪影 */}
        {[[280,500,0.6],[320,515,0.7],[500,495,0.55],[700,490,0.65],[750,510,0.5],[820,505,0.6],[880,515,0.55],[1050,500,0.6]].map(([cx,cy,s], i) => (
          <g key={`t-${i}`}>
            <ellipse cx={cx as number} cy={cy as number} rx={25*(s as number)} ry={30*(s as number)} fill={isDark ? "#1a3022" : "#6aa858"} style={{ transition: "fill 2s" }} />
            <ellipse cx={cx as number} cy={(cy as number)-8} rx={18*(s as number)} ry={22*(s as number)} fill={isDark ? "#1c3625" : "#7ab868"} style={{ transition: "fill 2s" }} />
          </g>
        ))}

        {/* 花朵 — 前景草地上 */}
        {[[50,660,"#f0a0b0"],[100,670,"#f5c0a0"],[200,665,"#f0a0c0"],[330,675,"#f8d0a0"],[420,660,"#f0a0b0"],[510,672,"#f5b0b0"],[620,658,"#f0c0a0"],[730,670,"#f0a0b0"],[850,662,"#f5b0a0"],[940,675,"#f0a0c0"],[1080,665,"#f5c0a0"],[1150,672,"#f0a0b0"]].map(([fx,fy,fc], i) => (
          <g key={`f-${i}`}>
            <circle cx={fx as number} cy={(fy as number)-4} r={4} fill={fc as string} opacity={0.7} />
            <circle cx={(fx as number)+3} cy={(fy as number)-1} r={3.5} fill={fc as string} opacity={0.65} />
            <circle cx={(fx as number)-3} cy={(fy as number)-1} r={3.5} fill={fc as string} opacity={0.65} />
            <circle cx={(fx as number)+2} cy={(fy as number)+3} r={3} fill={fc as string} opacity={0.55} />
            <circle cx={(fx as number)-2} cy={(fy as number)+3} r={3} fill={fc as string} opacity={0.55} />
            <circle cx={fx as number} cy={fy as number} r={2} fill="#fae060" opacity={0.8} />
          </g>
        ))}
      </svg>

      {/* 太阳/月亮 */}
      <motion.div className="absolute rounded-full" style={{
        width: 80, height: 80, right: "18%", top: "8%",
        background: isDark
          ? "radial-gradient(circle, rgba(220,210,180,0.9) 0%, rgba(200,190,160,0.4) 40%, transparent 70%)"
          : "radial-gradient(circle, rgba(255,240,200,0.9) 0%, rgba(255,220,150,0.5) 30%, rgba(255,200,100,0.15) 60%, transparent 75%)",
        filter: isDark ? "blur(4px)" : "blur(8px)",
        transition: "background 2s, filter 2s",
      }} animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />

      {/* 星星（深色）/ 云朵（浅色） */}
      {isDark
        ? Array.from({ length: 25 }, (_, i) => (
            <motion.div key={`star-${i}`} className="absolute" style={{
              width: 2+(i%3), height: 2+(i%3),
              left: `${(i*47+13)%100}%`, top: `${(i*31+7)%45}%`,
              background: "white", borderRadius: "50%", opacity: 0,
            }} animate={{ opacity: [0.15, 0.7, 0.15] }}
              transition={{ duration: 2+(i%4)*1.5, repeat: Infinity, delay: i*0.5, ease: "easeInOut" }} />
          ))
        : [["10%","12%",120],["55%","18%",100],["30%","22%",80]].map(([l,t,w], i) => (
            <motion.div key={`cloud-${i}`} className="absolute" style={{
              width: w as number, height: 35, left: l as string, top: t as string,
              background: "rgba(255,255,255,0.3)", borderRadius: "50%", filter: "blur(10px)",
            }} animate={{ x: [0, i%2===0?30:-25, 0] }}
              transition={{ duration: 18-i*2, repeat: Infinity, ease: "easeInOut" }} />
          ))
      }

      {/* 萤火虫/光点 */}
      {Array.from({ length: 10 }, (_, i) => (
        <motion.div key={`ff-${i}`} className="absolute" style={{
          width: 4, height: 4, opacity: 0,
          left: `${15+(i*85)/10}%`, top: `${55+(i%5)*8}%`,
          background: isDark ? "rgba(180,220,120,0.7)" : "rgba(255,200,120,0.5)",
          borderRadius: "50%",
          boxShadow: isDark ? "0 0 6px 3px rgba(180,220,120,0.3)" : "0 0 6px 3px rgba(255,200,100,0.2)",
        }} animate={{
          x: [0, (i%3-1)*40, 0], y: [0, -(20+(i%5)*10), 0],
          opacity: [0, 0.6, 0], scale: [0.8, 1.3, 0.8],
        }} transition={{ duration: 3+(i%4)*2, repeat: Infinity, delay: i*1.2, ease: "easeInOut" }} />
      ))}

      {/* 落叶 */}
      {Array.from({ length: 6 }, (_, i) => (
        <motion.div key={`leaf-${i}`} className="absolute" style={{
          width: 8+(i%3)*4, height: (8+(i%3)*4)*0.6,
          left: `${20+(i*70)/6}%`, top: "-5%",
          background: isDark ? "rgba(140,180,120,0.4)" : "rgba(180,160,100,0.5)",
          borderRadius: "50%", transform: `rotate(${i*40}deg)`,
        }} animate={{
          y: ["-10%", "110vh"],
          x: [0, (i%3-1)*80, i%2===0?30:-30, 0],
          rotate: [i*40, i*40+180+(i%3)*90],
          opacity: [0, 0.5, 0.5, 0],
        }} transition={{ duration: 8+(i%4)*3, repeat: Infinity, delay: i*2.5, ease: "easeInOut" }} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Ambient canvas — slow-drifting firefly particles
// ═══════════════════════════════════════════════════════════════

function AmbientParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const w = () => window.innerWidth;
    const h = () => window.innerHeight;
    const count = 14 + Math.floor(Math.random() * 12); // 14–25

    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      size: number; glow: number;
      alpha: number; aDir: number;
      r: number; g: number; b: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      // Warm golden-green palette — looks good on any background
      const shade = 180 + Math.floor(Math.random() * 60);
      particles.push({
        x: Math.random() * w(), y: Math.random() * h(),
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: 1.5 + Math.random() * 3.5,
        glow: 4 + Math.random() * 10,
        alpha: 0.12 + Math.random() * 0.28,
        aDir: 0.002 + Math.random() * 0.004,
        r: shade + Math.floor(Math.random() * 40),
        g: shade + Math.floor(Math.random() * 30),
        b: Math.floor(shade * 0.6) + Math.floor(Math.random() * 30),
      });
    }

    let raf = 0;
    const render = () => {
      ctx.clearRect(0, 0, w(), h());

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around screen edges
        if (p.x < -40) p.x = w() + 40;
        if (p.x > w() + 40) p.x = -40;
        if (p.y < -40) p.y = h() + 40;
        if (p.y > h() + 40) p.y = -40;

        // Random course correction
        if (Math.random() < 0.003) {
          p.vx += (Math.random() - 0.5) * 0.15;
          p.vy += (Math.random() - 0.5) * 0.15;
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (speed > 0.35) { p.vx *= 0.35 / speed; p.vy *= 0.35 / speed; }
        }

        // Bioluminescence pulse
        p.alpha += p.aDir;
        if (p.alpha > 0.6) p.aDir = -Math.abs(p.aDir);
        if (p.alpha < 0.06) p.aDir = Math.abs(p.aDir);

        // Outer glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.glow);
        grad.addColorStop(0, `rgba(${p.r},${p.g},${p.b},${p.alpha.toFixed(2)})`);
        grad.addColorStop(0.3, `rgba(${p.r},${p.g},${p.b},${(p.alpha * 0.45).toFixed(2)})`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.glow, 0, Math.PI * 2); ctx.fill();

        // Core
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${(p.alpha * 0.85).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      }

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }} />;
}

// ═══════════════════════════════════════════════════════════════
// 背景切换按钮 + 图片预览
// ═══════════════════════════════════════════════════════════════
function BackgroundToggle({
  current,
  onChange,
}: {
  current: string; // "css" | image-id
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-5 right-5 z-20">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-12 right-0 bg-card/85 backdrop-blur-lg border border-border/60 rounded-2xl p-3 shadow-lg flex gap-2 overflow-x-auto"
            style={{ minWidth: 200, maxWidth: "calc(100vw - 40px)" }}
          >
            {/* CSS 手绘模式 */}
            <button
              onClick={() => { onChange("css"); setOpen(false); }}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[0.65rem] transition-all ${
                current === "css"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-400/30"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <div className="w-12 h-8 rounded-md overflow-hidden border border-border/40" style={{
                background: "linear-gradient(180deg, #fdf6e8 0%, #7aa868 100%)",
              }}>
                <div className="w-full h-full flex items-center justify-center text-[0.5rem] text-white/60">CSS</div>
              </div>
              手绘花园
            </button>
            {IMAGE_BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => { onChange(bg.id); setOpen(false); }}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[0.65rem] transition-all ${
                  current === bg.id
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-400/30"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <div className="w-12 h-8 rounded-md overflow-hidden border border-border/40">
                  <img src={bg.src} alt={bg.label} className="w-full h-full object-cover" />
                </div>
                {bg.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card/60 backdrop-blur-md border border-border/50 text-[0.7rem] text-muted-foreground hover:text-foreground interactive shadow-sm"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21,15 16,10 5,21" />
        </svg>
        背景
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 主表单
// ═══════════════════════════════════════════════════════════════
function LoginForm() {
  const { resolved } = useTheme();
  const isDark = resolved === "dark";
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ── Lock scroll on both html & body so the Windows scrollbar
  //     doesn't leave an 8px gap on the right edge.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  // ── 背景偏好 ────────────────────────────────────
  const [bgMode, setBgMode] = useState<string>("moonlight");

  // 从 localStorage 恢复（用户主动切换后覆盖默认）
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BG_PREF_KEY);
      if (saved && saved !== "css") setBgMode(saved);
      else setBgMode("moonlight"); // force default to moonlight
    } catch { /* ignore */ }
  }, []);

  // 持久化
  const handleBgChange = (id: string) => {
    setBgMode(id);
    try { localStorage.setItem(BG_PREF_KEY, id); } catch { /* ignore */ }
  };

  // ── 从 URL 参数预填用户名 ─────────────────────
  useEffect(() => {
    const u = searchParams.get("username");
    if (u) { setUsername(u); setMode("login"); }
  }, [searchParams]);

  // ── 登录/注册提交 ──────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        // 登录
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim(), password: password.trim() }),
        });

        if (res.ok) {
          router.push("/");
          router.refresh();
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "登录失败");
          setPassword("");
        }
      } else {
        // 注册
        const body: Record<string, string> = {
          username: username.trim(),
          password: password.trim(),
        };
        if (displayName.trim()) body.displayName = displayName.trim();

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          // 注册成功 → 显示 toast → 切换回登录 → 清空密码
          toast.success("注册成功！请登录你的账号");
          setMode("login");
          setPassword("");
          setDisplayName("");
          setError("");
        } else {
          // 注册失败 → toast 提示
          toast.error(data.error || "注册失败，请重试");
          setPassword("");
          setError(data.error || "注册失败");
        }
      }
    } catch {
      const msg = "网络错误，请重试";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── 当前背景图 ──────────────────────────────────
  const currentImageBg = IMAGE_BACKGROUNDS.find((b) => b.id === bgMode);

  // ── 卡片样式 ────────────────────────────────────
  const cardBg = isDark
    ? "rgba(22,28,20,0.82)"
    : "rgba(255,252,245,0.7)";
  const cardBorder = isDark
    ? "rgba(255,255,255,0.13)"
    : "rgba(200,180,150,0.3)";
  const cardShadow = isDark
    ? "0 8px 40px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)"
    : "0 8px 40px rgba(100,80,40,0.08), 0 2px 8px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.5)";
  const inputBg = isDark
    ? "rgba(0,0,0,0.35)"
    : "rgba(255,255,255,0.6)";
  const inputBorder = isDark
    ? "rgba(255,255,255,0.18)"
    : "rgba(180,160,130,0.35)";
  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* ── 背景：图片 或 CSS 手绘 ── */}
      {currentImageBg ? (
        <div key={bgMode} className="absolute inset-0 overflow-hidden">
          {/* 呼吸缩放动画 */}
          <div
            className="animate-login-bg-zoom"
            style={{
              position: "absolute",
              top: "-4%",
              left: "-4%",
              width: "108%",
              height: "108%",
              willChange: "transform",
            }}
          >
            <img
              src={currentImageBg.src}
              alt=""
              className="w-full h-full object-cover block"
            />
          </div>
          {/* 主题色彩遮罩 + 深色模式暗化 */}
          <div
            className="absolute inset-0 transition-all duration-500"
            style={{
              background: isDark
                ? "rgba(0,0,0,0.55)"
                : "rgba(255,250,240,0.25)",
            }}
          />
          <AmbientParticles />
        </div>
      ) : (
        <GardenScene />
      )}

      {/* ── 暗角 ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.15) 100%)",
        }}
      />

      {/* ── 背景切换按钮 ── */}
      <BackgroundToggle current={bgMode} onChange={handleBgChange} />

      {/* ── Full-viewport edge glow ──────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: `inset 0 0 80px 30px rgba(160,200,140,0.18)`,
        }}
      />

      {/* ── 卡片容器 ── */}
      <div className="absolute inset-0 flex items-center justify-center overflow-y-auto px-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="relative w-full max-w-[400px] mx-4"
        >
          {/* 玻璃拟态卡片 */}
          <div
            className="rounded-[1.75rem] overflow-hidden"
            style={{
              background: cardBg,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: `1px solid ${cardBorder}`,
              boxShadow: cardShadow,
            }}
          >
            <div className="relative px-5 sm:px-8 py-6 sm:py-8" style={isDark ? { color: "#d4d4d4" } : {}}>
              {/* 顶部光晕线 */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-px"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(160,180,120,0.25), transparent)",
                }}
              />

              {/* Logo & 标题 */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.15 }}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-[1.1rem] mb-4"
                  style={{
                    background: isDark
                      ? "linear-gradient(135deg, rgba(140,180,120,0.15), rgba(100,140,80,0.08))"
                      : "linear-gradient(135deg, rgba(180,210,160,0.2), rgba(140,180,120,0.1))",
                    border: `1px solid ${isDark ? "rgba(140,180,120,0.12)" : "rgba(140,180,130,0.15)"}`,
                    boxShadow: "0 2px 12px rgba(120,150,100,0.06)",
                  }}
                >
                  <span className="text-2xl leading-none select-none">🌱</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                  className="text-[1.25rem] font-semibold tracking-[-0.01em] text-foreground dark:text-white"
                >
                  Digital Garden
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32, duration: 0.4 }}
                  className="mt-1.5 text-[0.78rem] leading-relaxed text-muted-foreground"
                >
                  {mode === "login"
                    ? "推开花园的门，世界安静下来"
                    : "种下一颗种子，从这里开始"}
                </motion.p>
              </div>

              {/* 表单 */}
              <motion.form
                onSubmit={handleSubmit}
                key={mode}
                initial={{ opacity: 0, x: mode === "login" ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5"
                autoComplete="off"
              >
                <input type="text" name="username" autoComplete="username" style={{ display: "none" }} tabIndex={-1} readOnly />
                <input type="password" name="password" autoComplete="current-password" style={{ display: "none" }} tabIndex={-1} readOnly />

                <AnimatePresence>
                  {mode === "register" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                      animate={{ height: "auto", opacity: 1, marginBottom: 14 }}
                      exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label className="block text-[0.68rem] text-muted-foreground mb-1.5 ml-1 font-medium">
                        昵称 <span className="opacity-30">选填</span>
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="如何称呼你？"
                        disabled={loading}
                        className="w-full rounded-xl border px-4 py-[0.6rem] text-[0.85rem] text-foreground placeholder:text-muted-foreground dark:placeholder:text-white/60 focus:outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/8 transition-all duration-200"
                        style={{ background: inputBg, borderColor: inputBorder }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-[0.68rem] text-muted-foreground mb-1.5 ml-1 font-medium">账号</label>
                  <input
                    type="text" name="garden-user"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(""); }}
                    placeholder="请输入账号"
                    autoFocus={!searchParams.get("username")}
                    disabled={loading}
                    className="w-full rounded-xl border px-4 py-[0.6rem] text-[0.85rem] text-foreground placeholder:text-muted-foreground dark:placeholder:text-white/60 focus:outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/8 transition-all duration-200"
                    style={{ background: inputBg, borderColor: inputBorder }}
                  />
                </div>

                <div>
                  <label className="block text-[0.68rem] text-muted-foreground mb-1.5 ml-1 font-medium">密码</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    name="garden-pass"
                    placeholder={mode === "register" ? "设置密码" : "请输入密码"}
                    autoFocus={!!searchParams.get("username")}
                    disabled={loading}
                    className="w-full rounded-xl border px-4 py-[0.6rem] text-[0.85rem] text-foreground placeholder:text-muted-foreground dark:placeholder:text-white/60 focus:outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/8 transition-all duration-200"
                    style={{ background: inputBg, borderColor: inputBorder }}
                  />
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={!username.trim() || !password.trim() || loading}
                    className="relative w-full rounded-xl py-[0.65rem] text-[0.85rem] font-medium text-white interactive disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 overflow-hidden group"
                    style={{
                      background: "linear-gradient(135deg, #7a9668 0%, #6d8a5c 50%, #6a8658 100%)",
                      boxShadow: "0 2px 12px rgba(122,150,104,0.2), 0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <span className="relative inline-flex items-center gap-2">
                      {loading ? (
                        <>
                          <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="inline-block">🌱</motion.span>
                          处理中…
                        </>
                      ) : mode === "login" ? "进入花园" : "注册新账号"}
                    </span>
                  </button>
                </div>
              </motion.form>

              {/* 错误信息 */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-4 text-[0.78rem] text-red-400/85 text-center"
                  >{error}</motion.p>
                )}
              </AnimatePresence>

              {/* 模式切换 */}
              <div className="mt-5 text-center">
                <button
                  onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setPassword(""); }}
                  disabled={loading}
                  className="text-[0.78rem] text-muted-foreground/70 dark:text-white/60 hover:text-emerald-600 dark:hover:text-emerald-400 interactive transition-colors"
                >
                  {mode === "login" ? "还没有账号？创建 →" : "已有账号？去登录 →"}
                </button>
              </div>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-5 text-center text-[0.68rem] text-muted-foreground/30 tracking-wide"
          >
            这片花园只属于你
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 页面入口
// ═══════════════════════════════════════════════════════════════
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
