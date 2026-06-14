"use client";

import { useState, useEffect, useReducer, useRef, useCallback, type ChangeEvent, type DragEvent } from "react";
import { useTheme } from "@/components/ui/theme-provider";
import { useAudio, type LoopMode } from "@/components/ui/audio-provider";
import { LoopIcon } from "@/components/ui/music-player";
import { getAllTracks, addCustomTrack, removeCustomTrack, type AudioTrack } from "@/lib/audio";
import { BACKGROUND_CATEGORIES, getStoredBackground, setStoredBackground } from "@/lib/backgrounds";
import { THEMES, getStoredTheme, setStoredTheme, applyThemeBindings, getThemeById } from "@/lib/themes";
import { getTopbarMode, setTopbarMode, type TopbarMode } from "@/lib/layout-config";
import { getAmbientEffect, setAmbientEffect, getCursorEffect, setCursorEffect, type AmbientEffect, type CursorEffect } from "@/lib/ambient-config";
import { getTimeEnabled, setTimeEnabled, getWeatherMode, setWeatherMode, getMockWeather, setMockWeather, type WeatherType } from "@/lib/theme-runtime";
import { getPrefs, setPrefs, applyPrefs, resetPrefs, DEFAULT_PREFS, FONT_FAMILIES, FONT_SIZES, LINE_HEIGHTS, SPACINGS, THEME_COLOR_PRESETS, DEFAULT_MODULE_ORDER, type UIPreferences, type ModuleVisibility } from "@/lib/ui-preferences";
import { LIVE2D_PRESETS, getLive2DConfig, setLive2DConfig, type Live2DConfig } from "@/lib/live2d-config";
import { fetchModelManifest, type ModelManifestEntry } from "@/lib/model-registry";
// TTS imports removed — feature paused (2026-06-13)
// Re-add when re-enabled: TTS_VOICE_PRESETS, getStoredVoice, setStoredVoice, getFishAudioConfig, setFishAudioConfig, type TTSVoice
import GardenSlider from "@/components/ui/garden-slider";
import { Switch } from "@/components/ui/garden-widgets";
import { persistFile, loadPersistedFile, storeBannerImage, removeBannerImage, loadBannerImage } from "@/lib/file-storage";
import { Live2DPreview } from "@/components/ui/live2d-preview";

// ── Helpers ──────────────────────────────────────────

const MODE_OPTIONS = [
  { value: "light" as const, label: "亮色", icon: "☀️" },
  { value: "dark" as const, label: "暗色", icon: "🌙" },
  { value: "system" as const, label: "跟随系统", icon: "💻" },
];

function getStoredNum(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(key); return v ? Number(v) : fallback; } catch { return fallback; }
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > 20 * 1024 * 1024) { reject(new Error("文件过大（>20MB）")); return; }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("文件读取失败：" + (reader.error?.message || "未知错误")));
    reader.readAsDataURL(file);
  });
}
function createFileURL(file: File): string { return URL.createObjectURL(file); }

function isValidImageOrVideo(file: File): boolean {
  if (file.type.startsWith("image/") || file.type.startsWith("video/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return ["jpg","jpeg","png","gif","webp","svg","bmp","mp4","webm","ogg","mov","avi","mkv"].includes(ext);
}
function isValidAudio(file: File): boolean {
  if (file.type.startsWith("audio/")) return true;
  return ["mp3","wav","ogg","flac","m4a","aac","wma","opus"].includes(file.name.split(".").pop()?.toLowerCase() || "");
}

// ── Section Group component ──────────────────────────

function SectionGroup({ id, title, icon, defaultOpen, children, onDragStart, onDragOver, onDrop, onDragEnd, dragOverId, editMode }: {
  id: string; title: string; icon: string; defaultOpen?: boolean;
  children: React.ReactNode;
  onDragStart?: (e: DragEvent<HTMLDivElement>, id: string) => void;
  onDragOver?: (e: DragEvent<HTMLDivElement>, id: string) => void;
  onDrop?: (e: DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd?: () => void;
  dragOverId?: string | null;
  editMode?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  return (
    <div
      draggable={editMode}
      onDragStart={(e) => onDragStart?.(e, id)}
      onDragOver={(e) => onDragOver?.(e, id)}
      onDrop={(e) => onDrop?.(e, id)}
      onDragEnd={onDragEnd}
      className={`rounded-lg border transition-all mb-4 ${
        dragOverId === id ? "border-primary ring-1 ring-primary/20 bg-primary/[0.02]" : "border-border"
      } ${editMode ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <button
        onClick={() => !editMode && setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/30 interactive rounded-t-lg"
      >
        {editMode && <span className="text-xs text-muted-foreground mr-1">⠿</span>}
        <span className="text-sm">{icon}</span>
        <span className="text-sm font-medium text-foreground flex-1">{title}</span>
        <span className={`text-xs text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}>▸</span>
      </button>
      <div className={`garden-accordion-body ${open ? "open" : "closed"}`}>
        <div className="px-4 pb-4 pt-1 border-t border-border/50">{children}</div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    if (typeof window === "undefined") return ["appearance","dynamic","typography","music","companion","homepage"];
    try {
      const raw = JSON.parse(localStorage.getItem("garden-settings-order") || "null");
      if (Array.isArray(raw) && raw.every((v: unknown) => typeof v === "string")) return raw as string[];
    } catch {}
    return ["appearance","dynamic","typography","music","companion","homepage"];
  });
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData("text/plain", id); e.dataTransfer.effectAllowed = "move";
  }, []);
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverId(id);
  }, []);
  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault(); setDragOverId(null);
    const sourceId = e.dataTransfer.getData("text/plain");
    if (!sourceId || sourceId === targetId) return;
    const newOrder = [...sectionOrder];
    const s = newOrder.indexOf(sourceId); const t = newOrder.indexOf(targetId);
    if (s === -1 || t === -1) return;
    newOrder.splice(s, 1); newOrder.splice(t, 0, sourceId);
    setSectionOrder(newOrder);
    try { localStorage.setItem("garden-settings-order", JSON.stringify(newOrder)); } catch {}
  }, [sectionOrder]);
  const handleDragEnd = useCallback(() => setDragOverId(null), []);

  const renderSection = (id: string) => {
    switch (id) {
      case "appearance": return <AppearanceSection theme={theme} setTheme={setTheme} />;
      case "dynamic": return <DynamicSection />;
      case "typography": return <TypographySection />;
      case "music": return <MusicSection />;
      case "companion": return <CompanionSection />;
      case "homepage": return <HomepageSection />;
      default: return null;
    }
  };

  return (
    <div className="reading-container py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">设置</h1>
          <p className="mt-2 text-sm text-muted-foreground">个性化你的 Digital Garden。</p>
        </div>
        <button onClick={() => setEditMode(!editMode)}
          className={`rounded-full px-3 py-1 text-xs interactive ${editMode ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-secondary"}`}>
          {editMode ? "✓ 完成排序" : "🔧 调整布局"}
        </button>
      </div>

      {sectionOrder.map((id) => (
        <SectionGroup
          key={id}
          id={id}
          title={SECTION_TITLES[id] || id}
          icon={SECTION_ICONS[id] || "📌"}
          defaultOpen={true}
          editMode={editMode}
          dragOverId={dragOverId}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        >
          {renderSection(id)}
        </SectionGroup>
      ))}

    </div>
  );
}

const SECTION_TITLES: Record<string, string> = {
  appearance: "外观 · 主题与背景", dynamic: "动态 · 氛围与特效",
  typography: "排版 · 字体与间距", music: "音乐 · 背景曲目",
  companion: "伙伴 · Live2D 与 AI", homepage: "首页 · 模块管理",
};
const SECTION_ICONS: Record<string, string> = {
  appearance: "🎨", dynamic: "✨", typography: "🔤", music: "🎵", companion: "🌸", homepage: "🏡",
};

// ═══════════════════════════════════════════════════════
// SECTION COMPONENTS
// ═══════════════════════════════════════════════════════

function AppearanceSection({ theme, setTheme }: { theme: string; setTheme: (t: "light"|"dark"|"system") => void }) {
  return (
    <div className="space-y-6">
      {/* Theme */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">花园主题</p>
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
          {THEMES.map((t) => {
            const current = getStoredTheme();
            const pick = (id: string) => {
              setStoredTheme(id);
              document.documentElement.setAttribute("data-theme", id);
              const tdef = getThemeById(id);
              if (tdef) {
                applyThemeBindings(tdef);
                // Also set the display mode
                setTheme(tdef.mode);
              }
              window.dispatchEvent(new Event("storage"));
            };
            return (
              <button key={t.id} onClick={() => pick(t.id)}
                className={`rounded-lg border p-3 text-center interactive ${current === t.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card hover:bg-card-hover"}`}>
                <span className="text-xl">{t.icon}</span>
                <p className="text-xs mt-1 font-medium text-foreground">{t.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Display mode */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">显示模式</p>
        <div className="flex gap-2">
          {MODE_OPTIONS.map(({ value, label, icon }) => (
            <button key={value} onClick={() => setTheme(value)}
              className={`rounded-lg border px-3 py-2 text-xs interactive ${theme === value ? "border-primary bg-primary/5 text-primary font-medium" : "border-border bg-card text-muted-foreground hover:bg-card-hover"}`}>
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Topbar mode */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">导航栏模式</p>
        <TopBarModeInline />
      </div>

      {/* Fullscreen background */}
      <div>
        <p className="text-xs font-medium text-foreground mb-2">全屏背景</p>
        <BackgroundInline />
      </div>

      {/* Page banner */}
      <div>
        <p className="text-xs font-medium text-foreground mb-2">页面横幅</p>
        <BannerInline />
      </div>

      {/* Colors */}
      <ColorPickersInline />
    </div>
  );
}

function TopBarModeInline() {
  const [mode, setMode] = useState<TopbarMode>("fixed");
  useEffect(() => { setMode(getTopbarMode()); }, []);
  const pick = (m: TopbarMode) => { setMode(m); setTopbarMode(m); window.dispatchEvent(new Event("storage")); };
  return (
    <div className="flex gap-2">
      <button onClick={() => pick("fixed")} className={`rounded-full px-3 py-1 text-xs interactive ${mode==="fixed"?"bg-primary text-white":"bg-muted text-muted-foreground hover:bg-secondary"}`}>📌 始终显示</button>
      <button onClick={() => pick("auto-hide")} className={`rounded-full px-3 py-1 text-xs interactive ${mode==="auto-hide"?"bg-primary text-white":"bg-muted text-muted-foreground hover:bg-secondary"}`}>📜 滚动隐藏</button>
    </div>
  );
}

function BackgroundInline() {
  const [selected, setSelected] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setSelected(getStoredBackground() || ""); }, []);

  const applyBg = (path: string) => {
    setSelected(path); setStoredBackground(path);
    window.dispatchEvent(new Event("garden-bg-changed"));
  };

  const handleFile = async (file: File) => {
    if (!isValidImageOrVideo(file)) { setUploadMsg("❌ 格式不支持"); return; }
    setUploading(true); setUploadMsg("⏳...");
    try {
      // Immediate display via blob URL
      const blobUrl = createFileURL(file); applyBg(blobUrl);
      // Persist via IndexedDB (handles large files)
      try {
        const key = await persistFile("bg", file);
        const url = await loadPersistedFile(key);
        if (url) { applyBg(url); setStoredBackground(url); setUploadMsg("✓"); }
        else { setUploadMsg("✓"); }
      } catch { setUploadMsg("✓"); }
    } catch { setUploadMsg("❌ 失败"); }
    finally { setUploading(false); setTimeout(() => setUploadMsg(""), 2500); }
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
        className={`rounded-lg border-2 border-dashed p-3 text-center text-xs transition-colors cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}
      >
        <p className="text-muted-foreground mb-1.5">拖放图片/视频到这里</p>
        <div className="flex items-center justify-center gap-2">
          <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { applyBg(urlInput.trim()); setUrlInput(""); } }}
            placeholder="或粘贴 URL…" className="w-44 rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground interactive focus-ring" />
          <button onClick={() => { applyBg(urlInput.trim()); setUrlInput(""); }} className="rounded bg-primary px-2 py-1 text-xs text-white hover:bg-primary-hover interactive">应用</button>
          <label className="rounded border border-border bg-card px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted interactive cursor-pointer">
            {uploading ? "⏳" : "📁"}
            <input type="file" ref={fileRef} accept="image/*,video/*,.gif"
              onChange={async (e) => { const f = e.target.files?.[0]; if (f) await handleFile(f); e.target.value = ""; }} className="hidden" />
          </label>
        </div>
      </div>
      {uploadMsg && <p className={`text-[0.625rem] ${uploadMsg.startsWith("❌") ? "text-accent" : "text-primary"}`}>{uploadMsg}</p>}

      {/* Presets */}
      <div className="grid gap-1.5 grid-cols-4">
        {BACKGROUND_CATEGORIES.flatMap(c => c.backgrounds).slice(0, 8).map(bg => (
          <button key={bg.path} onClick={() => applyBg(selected === bg.path ? "" : bg.path)}
            className={`relative rounded border-2 overflow-hidden aspect-video interactive ${selected === bg.path ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-secondary"}`} title={bg.label}>
            <img src={bg.path} alt={bg.label} className="w-full h-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>

      {/* Opacity + blur */}
      <SliderPair />{/* defined below to use live state */}
      {selected && <button onClick={() => applyBg("")} className="text-[0.625rem] text-muted-foreground hover:text-foreground interactive">✕ 清除背景</button>}
    </div>
  );
}

function SliderPair() {
  const [opacity, setOpacity] = useState(() => getStoredNum("garden-bg-opacity", 55));
  const [blur, setBlur] = useState(() => getStoredNum("garden-bg-blur", 0));
  const [maskColor, setMaskColor] = useState(() => localStorage.getItem("garden-bg-mask") || "transparent");
  const [maskOpacity, setMaskOpacity] = useState(() => getStoredNum("garden-bg-mask-opacity", 30));

  const setOp = (v: number) => { setOpacity(v); localStorage.setItem("garden-bg-opacity", String(v)); window.dispatchEvent(new Event("garden-bg-changed")); };
  const setBl = (v: number) => { setBlur(v); localStorage.setItem("garden-bg-blur", String(v)); window.dispatchEvent(new Event("garden-bg-changed")); };
  const setMc = (v: string) => { setMaskColor(v); localStorage.setItem("garden-bg-mask", v); window.dispatchEvent(new Event("garden-bg-changed")); };
  const setMo = (v: number) => { setMaskOpacity(v); localStorage.setItem("garden-bg-mask-opacity", String(v)); window.dispatchEvent(new Event("garden-bg-changed")); };

  const maskPresets = [
    { label: "无", value: "transparent" },
    { label: "暗", value: "rgba(0,0,0,0.4)" },
    { label: "暖", value: "rgba(60,50,30,0.3)" },
    { label: "冷", value: "rgba(20,30,50,0.3)" },
  ];

  return (
    <div className="space-y-2">
      <div>
        <span className="text-[0.625rem] text-muted-foreground">透明度</span>
        <GardenSlider value={opacity} onChange={setOp} min={5} max={98} step={1} unit="%" />
      </div>
      <div>
        <span className="text-[0.625rem] text-muted-foreground">模糊</span>
        <GardenSlider value={blur} onChange={setBl} min={0} max={50} step={1} unit="px" />
      </div>
      <div className="space-y-1">
        <span className="text-[0.625rem] text-muted-foreground">蒙版</span>
        <div className="flex flex-wrap gap-1.5">
          {maskPresets.map((p) => (
            <button
              key={p.value}
              onClick={() => setMc(p.value)}
              className={`rounded-full px-2.5 py-0.5 text-[0.625rem] border interactive ${
                maskColor === p.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {maskColor !== "transparent" && (
          <div className="pt-1">
            <GardenSlider value={maskOpacity} onChange={setMo} min={5} max={100} step={5} unit="%" />
          </div>
        )}
      </div>
    </div>
  );
}

function BannerSliderPair() {
  const [opacity, setOpacity] = useState(() => getStoredNum("garden-banner-opacity", 100));
  const [blur, setBlur] = useState(() => getStoredNum("garden-banner-blur", 0));
  const [maskColor, setMaskColor] = useState(() => localStorage.getItem("garden-banner-mask") || "transparent");
  const [maskOpacity, setMaskOpacity] = useState(() => getStoredNum("garden-banner-mask-opacity", 0));

  const setOp = (v: number) => {
    setOpacity(v);
    localStorage.setItem("garden-banner-opacity", String(v));
    window.dispatchEvent(new Event("garden-banner-changed"));
  };
  const setBl = (v: number) => {
    setBlur(v);
    localStorage.setItem("garden-banner-blur", String(v));
    window.dispatchEvent(new Event("garden-banner-changed"));
  };
  const setMc = (v: string) => {
    setMaskColor(v);
    localStorage.setItem("garden-banner-mask", v);
    window.dispatchEvent(new Event("garden-banner-changed"));
  };
  const setMo = (v: number) => {
    setMaskOpacity(v);
    localStorage.setItem("garden-banner-mask-opacity", String(v));
    window.dispatchEvent(new Event("garden-banner-changed"));
  };

  const maskPresets = [
    { label: "无", value: "transparent" },
    { label: "暗", value: "rgba(0,0,0,0.4)" },
    { label: "暖", value: "rgba(60,50,30,0.3)" },
    { label: "冷", value: "rgba(20,30,50,0.3)" },
  ];

  return (
    <div className="space-y-2">
      <div>
        <span className="text-[0.625rem] text-muted-foreground">横幅透明度</span>
        <GardenSlider value={opacity} onChange={setOp} min={10} max={100} step={5} unit="%" />
      </div>
      <div>
        <span className="text-[0.625rem] text-muted-foreground">横幅模糊</span>
        <GardenSlider value={blur} onChange={setBl} min={0} max={30} step={1} unit="px" />
      </div>
      <div className="space-y-1">
        <span className="text-[0.625rem] text-muted-foreground">蒙版</span>
        <div className="flex flex-wrap gap-1.5">
          {maskPresets.map((p) => (
            <button
              key={p.value}
              onClick={() => setMc(p.value)}
              className={`rounded-full px-2.5 py-0.5 text-[0.625rem] border interactive ${
                maskColor === p.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {maskColor !== "transparent" && (
          <div className="pt-1">
            <GardenSlider value={maskOpacity} onChange={setMo} min={5} max={100} step={5} unit="%" />
          </div>
        )}
      </div>
    </div>
  );
}

function BannerInline() {
  const [banner, setBanner] = useState<string | null>(null);
  const [bannerH, setBannerH] = useState(180);
  const [borderless, setBorderless] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("garden-banner-image");
      if (raw === "idb:banner") {
        loadBannerImage().then(setBanner);
      } else {
        setBanner(raw || null);
      }
      setBannerH(Number(localStorage.getItem("garden-banner-height") || 180));
      setBorderless(localStorage.getItem("garden-banner-borderless") === "true");
    } catch {}
  }, []);

  const applyUrl = (src: string | null) => {
    if (src) {
      localStorage.setItem("garden-banner-image", src);
      setBanner(src);
      setMsg("✓ 横幅已应用");
    } else {
      removeBannerImage();
      setBanner(null);
      setMsg("✓ 已移除");
    }
    window.dispatchEvent(new Event("garden-banner-changed"));
    setTimeout(() => setMsg(""), 2500);
  };

  const applyFile = async (dataUrl: string) => {
    await storeBannerImage(dataUrl);
    setBanner(dataUrl);
    setMsg("✓ 横幅已保存（持久化）");
    window.dispatchEvent(new Event("garden-banner-changed"));
    setTimeout(() => setMsg(""), 2500);
  };

  const setH = (h: number) => {
    setBannerH(h);
    localStorage.setItem("garden-banner-height", String(h));
    window.dispatchEvent(new Event("garden-banner-changed"));
  };

  const toggleBorderless = () => {
    const next = !borderless;
    setBorderless(next);
    localStorage.setItem("garden-banner-borderless", String(next));
    window.dispatchEvent(new Event("garden-banner-changed"));
  };

  const handleFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const valid = file.type.startsWith("image/") || file.type.startsWith("video/") || ["mp4","webm","ogg","mov"].includes(ext);
    if (!valid) {
      setMsg("❌ 仅支持图片和视频格式");
      setTimeout(() => setMsg(""), 2000);
      return;
    }
    setMsg("⏳ 处理中…");
    try {
      const dataUrl = await readFileAsDataURL(file); // may throw if >5MB
      await applyFile(dataUrl);
    } catch {
      // Large file: use blob for preview, persist via IndexedDB
      try {
        const blobUrl = createFileURL(file);
        setBanner(blobUrl);
        await storeBannerImage(blobUrl); // will be blob URL temporarily
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("读取失败"));
          reader.readAsDataURL(file);
        });
        await storeBannerImage(dataUrl);
        setBanner(dataUrl);
        setMsg("✓ 横幅已保存");
        window.dispatchEvent(new Event("garden-banner-changed"));
      } catch {
        setMsg("❌ 上传失败");
      }
    }
    setTimeout(() => setMsg(""), 2500);
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  return (
    <div className="space-y-3">
      {/* Preview */}
      {banner && (
        <div className="space-y-2">
          <div
            className="relative w-full rounded-lg overflow-hidden"
            style={{
              height: Math.min(bannerH, 140) + "px",
              border: borderless ? "none" : "1px solid var(--color-border)",
            }}
          >
            <img
              src={banner}
              alt=""
              className="w-full h-full object-cover"
              style={{
                objectPosition: `center ${localStorage.getItem("garden-banner-pos") || 50}%`,
              }}
            />
            <button
              onClick={() => applyUrl(null)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 text-white text-xs hover:bg-black/70 interactive flex items-center justify-center backdrop-blur"
              title="移除横幅"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Upload: URL + local + drag-drop — 放在最上面 */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDropFile}
        className={`rounded-lg border-2 border-dashed p-3 text-center text-xs transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/30"
        }`}
      >
        <p className="text-[0.688rem] text-muted-foreground mb-2">
          {dragOver ? "✨ 松开放入图片" : "拖放图片到此处，或使用下方方式上传"}
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && urlInput.trim()) {
                applyUrl(urlInput.trim());
                setUrlInput("");
              }
            }}
            placeholder="粘贴图片 URL…"
            className="w-40 rounded border border-border bg-card px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground interactive"
          />
          <button
            onClick={() => {
              if (urlInput.trim()) {
                applyUrl(urlInput.trim());
                setUrlInput("");
              }
            }}
            className="rounded bg-primary px-2.5 py-1 text-xs text-white interactive"
          >
            URL 应用
          </button>
          <label className="rounded border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted interactive cursor-pointer">
            📁 本地上传
            <input
              type="file"
              ref={fileRef}
              accept="image/*,video/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) await handleFile(f);
                e.target.value = "";
              }}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Height slider */}
      <div className="flex items-center gap-3">
        <span className="text-[0.625rem] text-muted-foreground w-8 shrink-0">高度</span>
        <GardenSlider value={bannerH} onChange={setH} min={60} max={400} step={10} unit="px" />
      </div>

      {/* Border toggle */}
      <div className="flex items-center gap-2">
        <span className="text-[0.625rem] text-muted-foreground">边界</span>
        <button
          onClick={toggleBorderless}
          className={`rounded-full px-3 py-0.5 text-[0.688rem] interactive ${
            borderless
              ? "bg-muted text-muted-foreground"
              : "bg-primary text-white"
          }`}
        >
          {borderless ? "无边" : "有边"}
        </button>
      </div>

      {/* Opacity + Blur + Mask */}
      <BannerSliderPair />

      {msg && (
        <p className={`text-[0.625rem] ${msg.startsWith("❌") ? "text-red-500" : "text-primary"}`}>
          {msg}
        </p>
      )}
    </div>
  );
}

function ColorPickersInline() {
  const [p, setP] = useState(DEFAULT_PREFS);
  const [pendingColor, setPendingColor] = useState(DEFAULT_PREFS.themeColor);
  const [pendingText, setPendingText] = useState("#3d3929");
  const [useCustom, setUseCustom] = useState(false);
  useEffect(() => {
    const prefs = getPrefs();
    setP(prefs);
    setPendingColor(prefs.themeColor);
    setUseCustom(prefs.useCustomTextColor);
    setPendingText(prefs.textColor || "#3d3929");
  }, []);
  const update = (partial: Partial<UIPreferences>) => {
    setPrefs(partial);
    const n = { ...p, ...partial };
    setP(n);
    applyPrefs(n);
  };

  return (
    <div className="space-y-4">
      {/* ── Theme color ───────────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">主题色</p>
        <div className="flex flex-wrap gap-1.5">
          {THEME_COLOR_PRESETS.map(({ v, label, icon }) => (
            <button
              key={v}
              onClick={() => { setPendingColor(v); update({ themeColor: v }); }}
              title={label}
              className={`w-7 h-7 rounded-full border-2 interactive ${
                pendingColor === v
                  ? "border-foreground scale-110"
                  : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: v }}
            >
              {icon}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={pendingColor}
            onChange={(e) => setPendingColor(e.target.value)}
            className="w-8 h-7 rounded border border-border cursor-pointer"
          />
          <button
            onClick={() => update({ themeColor: pendingColor })}
            className="rounded bg-primary px-2 py-1 text-xs text-white interactive"
          >
            确认
          </button>
          <span className="text-[0.625rem] text-muted-foreground">{pendingColor}</span>
        </div>
      </div>

      {/* ── Text color ────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          文字色
          {!useCustom && (
            <span className="text-muted-foreground/50 ml-1">（跟随主题）</span>
          )}
        </p>

        {/* Follow theme toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (useCustom) {
                // Switch to follow-theme mode
                setUseCustom(false);
                update({ useCustomTextColor: false, textColor: null });
              } else {
                // Switch to custom mode
                setUseCustom(true);
                update({ useCustomTextColor: true, textColor: pendingText });
              }
            }}
            className={`rounded-full px-3 py-0.5 text-[0.688rem] interactive ${
              !useCustom
                ? "bg-primary/15 text-primary font-medium"
                : "bg-muted text-muted-foreground hover:bg-secondary"
            }`}
          >
            🎨 跟随主题
          </button>
          {useCustom && (
            <>
              <input
                type="color"
                value={pendingText}
                onChange={(e) => setPendingText(e.target.value)}
                className="w-8 h-7 rounded border border-border cursor-pointer"
              />
              <button
                onClick={() => update({ textColor: pendingText, useCustomTextColor: true })}
                className="rounded bg-primary px-2 py-1 text-xs text-white interactive"
              >
                确认
              </button>
              <span className="text-[0.625rem] text-muted-foreground">{pendingText}</span>
            </>
          )}
        </div>

        {/* Preset text colors — only show in custom mode */}
        {useCustom && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { v: "#3d3929", label: "墨棕" },
              { v: "#e5e0d8", label: "暖白" },
              { v: "#f0f0f0", label: "亮白" },
              { v: "#d8dce3", label: "冷白" },
              { v: "#1a1a1a", label: "纯黑" },
              { v: "#ffffff", label: "纯白" },
            ].map(({ v, label }) => (
              <button
                key={v}
                onClick={() => {
                  setPendingText(v);
                  update({ textColor: v, useCustomTextColor: true });
                }}
                title={label}
                className="w-7 h-7 rounded-full border-2 interactive hover:scale-105 transition-transform"
                style={{
                  backgroundColor: v,
                  borderColor:
                    pendingText === v ? "var(--color-primary)" : "var(--color-border)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dynamic Section ──────────────────────────────────

function DynamicSection() {
  const [ambient, setAmbient] = useState<AmbientEffect>("none");
  const [cursor, setCursor] = useState<CursorEffect>("none");
  const [timeOn, setTimeOn] = useState(false);
  const [weatherMode, setWMode] = useState<"off"|"mock">("off");
  const [mockW, setMockW] = useState<WeatherType>("sunny");
  useEffect(() => { setAmbient(getAmbientEffect()); setCursor(getCursorEffect()); setTimeOn(getTimeEnabled()); setWMode(getWeatherMode()); setMockW(getMockWeather()); }, []);
  const pickA = (e: AmbientEffect) => { setAmbient(e); setAmbientEffect(e); window.dispatchEvent(new Event("storage")); };
  const pickC = (e: CursorEffect) => { setCursor(e); setCursorEffect(e); window.dispatchEvent(new Event("storage")); };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">环境动效</p>
        <div className="flex flex-wrap gap-1.5">
          {(["none","petal","dust","snow","rain","geometry"] as AmbientEffect[]).map(v => {
            const labels: Record<string,string> = { none:"❌ 无", petal:"🌸 花瓣", dust:"✨ 光尘", snow:"❄️ 飘雪", rain:"🌧 落雨", geometry:"🔷 几何" };
            return <button key={v} onClick={() => pickA(v)} className={`rounded-full px-2.5 py-1 text-[0.688rem] interactive ${ambient===v?"bg-primary text-white":"bg-muted text-muted-foreground hover:bg-secondary"}`}>{labels[v]}</button>;
          })}
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">鼠标特效</p>
        <div className="flex flex-wrap gap-1.5">
          {(["none","petal","dust","snow"] as CursorEffect[]).map(v => {
            const labels: Record<string,string> = { none:"❌ 无", petal:"🌸 花瓣", dust:"✨ 光尘", snow:"❄️ 雪" };
            return <button key={v} onClick={() => pickC(v)} className={`rounded-full px-2.5 py-1 text-[0.688rem] interactive ${cursor===v?"bg-primary text-white":"bg-muted text-muted-foreground hover:bg-secondary"}`}>{labels[v]}</button>;
          })}
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">时间 & 天气</p>
        <div className="flex items-center gap-2">
          <button onClick={() => { const n = !timeOn; setTimeOn(n); setTimeEnabled(n); }}
            className={`rounded-full px-2.5 py-1 text-[0.688rem] interactive ${timeOn?"bg-primary text-white":"bg-muted text-muted-foreground"}`}>🕐 时间 {timeOn?"开":"关"}</button>
          <button onClick={() => { const n: "off"|"mock" = weatherMode==="off"?"mock":"off"; setWMode(n); setWeatherMode(n); }}
            className={`rounded-full px-2.5 py-1 text-[0.688rem] interactive ${weatherMode==="mock"?"bg-primary text-white":"bg-muted text-muted-foreground"}`}>🌤 天气 {weatherMode==="mock"?"开":"关"}</button>
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">🌿 花园生态模式</p>
        <div className="flex items-center gap-2">
          <EcoToggle />
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">🌸 樱花飘落 (Canvas)</p>
        <div className="flex items-center gap-2">
          <SakuraToggle />
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">📺 CRT 扫描线</p>
        <div className="flex items-center gap-2">
          <CrtToggle />
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">📦 桌面小组件</p>
        <div className="flex items-center gap-2">
          <WidgetToggle id="garden-widget-cal" label="📅 月历" />
          <WidgetToggle id="garden-widget-weather" label="🌤 天气" />
        </div>
        <WeatherKeyInput />
      </div>
    </div>
  );
}

function WidgetToggle({ id, label }: { id: string; label: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try { setOn(localStorage.getItem(id) === "true"); } catch {}
  }, [id]);
  const toggle = () => {
    const n = !on;
    setOn(n);
    try { localStorage.setItem(id, String(n)); } catch {}
    window.dispatchEvent(new CustomEvent("garden-prefs"));
  };
  return (
    <button onClick={toggle}
      className={`rounded-full px-2.5 py-1 text-[0.688rem] interactive ${on?"bg-primary text-white":"bg-muted text-muted-foreground"}`}>
      {label} {on?"开":"关"}
    </button>
  );
}

function WeatherKeyInput() {
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  useEffect(() => {
    try { setKey(localStorage.getItem("garden-owm-key") || ""); } catch {}
  }, []);
  const save = () => {
    try { localStorage.setItem("garden-owm-key", key.trim()); } catch {}
    window.dispatchEvent(new CustomEvent("garden-prefs"));
  };
  return (
    <div className="mt-2">
      <button onClick={() => setShow(!show)}
        className="text-[0.625rem] text-muted-foreground hover:text-foreground interactive">
        🔑 OpenWeather API {show ? "▲" : "▼"}
      </button>
      {show && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="输入 API Key…"
            className="flex-1 rounded-md border border-border bg-card px-2 py-1 text-[0.688rem] text-foreground outline-none focus:border-primary"
          />
          <button onClick={save}
            className="rounded-md bg-primary px-2 py-1 text-[0.688rem] text-white hover:bg-primary-hover interactive">
            保存
          </button>
        </div>
      )}
    </div>
  );
}

function EcoToggle() {
  const [mode, setMode] = useState("standard");
  useEffect(() => {
    try { setMode(localStorage.getItem("garden-eco-mode") || "standard"); } catch {}
  }, []);
  const cycle = () => {
    const modes = ["off", "standard", "enhanced"];
    const idx = modes.indexOf(mode);
    const next = modes[(idx + 1) % modes.length];
    setMode(next);
    try { localStorage.setItem("garden-eco-mode", next); } catch {}
    // Notify ecosystem engine
    try { const { getEcosystem } = require("@/ecosystem/garden-ecosystem"); getEcosystem().setMode(next as any); } catch {}
  };
  const labels: Record<string, string> = { off: "关闭", standard: "标准", enhanced: "增强" };
  return (
    <button onClick={cycle}
      className={`rounded-full px-2.5 py-1 text-[0.688rem] interactive ${mode !== "off" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
      🌿 生态 {labels[mode]}
    </button>
  );
}

function SakuraToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try { setOn(localStorage.getItem("garden-sakura") === "true"); } catch {}
  }, []);
  const toggle = () => {
    const n = !on;
    setOn(n);
    try { localStorage.setItem("garden-sakura", String(n)); } catch {}
    window.dispatchEvent(new CustomEvent("garden-prefs"));
  };
  return (
    <button onClick={toggle}
      className={`rounded-full px-2.5 py-1 text-[0.688rem] interactive ${on?"bg-primary text-white":"bg-muted text-muted-foreground"}`}>
      🌸 樱飘 {on?"开":"关"}
    </button>
  );
}

function CrtToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try { setOn(localStorage.getItem("garden-crt") === "true"); } catch {}
  }, []);
  const toggle = () => {
    const n = !on;
    setOn(n);
    try { localStorage.setItem("garden-crt", String(n)); } catch {}
    window.dispatchEvent(new CustomEvent("garden-prefs"));
  };
  return (
    <button onClick={toggle}
      className={`rounded-full px-2.5 py-1 text-[0.688rem] interactive ${on?"bg-primary text-white":"bg-muted text-muted-foreground"}`}>
      📺 CRT {on?"开":"关"}
    </button>
  );
}

// ── Typography Section ────────────────────────────────

function TypographySection() {
  const [p, setP] = useState(DEFAULT_PREFS);
  useEffect(() => { setP(getPrefs()); }, []);
  const update = (partial: Partial<UIPreferences>) => { setPrefs(partial); setP(prev => ({ ...prev, ...partial })); applyPrefs({ ...p, ...partial }); };
  const reset = () => { resetPrefs(); setP({ ...DEFAULT_PREFS, moduleOrder: [...DEFAULT_MODULE_ORDER] }); applyPrefs(DEFAULT_PREFS); };

  return (
    <div className="space-y-4">
      <button onClick={reset} className="text-[0.625rem] text-muted-foreground hover:text-foreground interactive">重置默认</button>

      <div>
        <p className="text-xs text-muted-foreground mb-1.5">字体</p>
        <div className="grid gap-1.5 grid-cols-4">
          {FONT_FAMILIES.map(({ v, label, icon, preview }) => (
            <button key={v} onClick={() => update({ fontFamily: v })}
              className={`rounded border p-2 text-center interactive ${p.fontFamily===v?"border-primary bg-primary/5":"border-border bg-card hover:bg-card-hover"}`}>
              <span className="text-sm block" style={{ fontFamily: v }}>{preview}</span>
              <span className="text-[0.625rem] mt-0.5 block text-muted-foreground">{icon} {label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div><span className="text-[0.625rem] text-muted-foreground">字号</span>
          <GardenSlider value={p.fontSize} onChange={(v) => update({ fontSize: v })} min={10} max={48} step={1} unit="px" /></div>
        <div><span className="text-[0.625rem] text-muted-foreground">行间距</span>
          <GardenSlider value={p.lineHeight} onChange={(v) => update({ lineHeight: v })} min={1.0} max={3.0} step={0.05} /></div>
      </div>

    </div>
  );
}

// ── Settings Music Progress Bar ──────────────────────

function MusicProgressBar() {
  const [stTime, setStTime] = useState(0);
  const [stDur, setStDur] = useState(0);

  useEffect(() => {
    const a = document.querySelector("audio[data-garden-audio]") as HTMLAudioElement | null;
    if (!a) return;
    const onTime = () => { setStTime(a.currentTime); setStDur(a.duration || 0); };
    a.addEventListener("timeupdate", onTime);
    return () => a.removeEventListener("timeupdate", onTime);
  }, []);

  const fmt = (s: number) => {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };
  const pct = stDur > 0 ? (stTime / stDur) * 100 : 0;

  const seek = (e: ChangeEvent<HTMLInputElement>) => {
    const a = document.querySelector("audio[data-garden-audio]") as HTMLAudioElement | null;
    if (!a || !stDur) return;
    a.currentTime = (Number(e.target.value) / 100) * stDur;
    setStTime(a.currentTime);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[0.55rem] text-muted-foreground tabular-nums w-9 text-right">{fmt(stTime)}</span>
      <input
        type="range" min={0} max={100} step={0.1} value={stDur > 0 ? pct : 0}
        onChange={seek}
        className="flex-1"
        style={{ accentColor: "var(--color-primary)", height: "24px", cursor: "pointer" }}
      />
      <span className="text-[0.55rem] text-muted-foreground tabular-nums w-9">{fmt(stDur)}</span>
    </div>
  );
}

// ── Music Section ────────────────────────────────────

function MusicSection() {
  const { enabled, trackId, volume, playing, loopMode, toggle, setTrack, setVolume, play, pause, next, prev, cycleLoop, setLoopMode, currentTrack } = useAudio();
  const [customTracks, setCustomTracks] = useState<AudioTrack[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const LOOP_LABELS: Record<string, string> = { one: "单曲循环", all: "列表循环", shuffle: "随机播放" };
  const LOOP_MODES: LoopMode[] = ["one", "all", "shuffle"];

  useEffect(() => { setCustomTracks(getAllTracks().filter(t => !t.id.match(/^\d+$/))); }, [enabled]);

  const handleFile = async (file: File) => {
    if (!isValidAudio(file)) { setUploadMsg("❌ 格式不支持"); return; }
    setUploadMsg("⏳...");
    try {
      const blobUrl = createFileURL(file);
      const id = "custom-" + Date.now();
      const track: AudioTrack = { id, path: blobUrl, title: file.name.replace(/\.[^.]+$/, "") };
      addCustomTrack(track); setCustomTracks(prev => [...prev, track]); setTrack(id);
      try {
        const dataUrl = await readFileAsDataURL(file);
        const pt: AudioTrack = { id: id+"-p", path: dataUrl, title: file.name.replace(/\.[^.]+$/, "") };
        addCustomTrack(pt); removeCustomTrack(id);
        setCustomTracks(prev => prev.map(t => t.id===id ? pt : t)); setTrack(pt.id);
      } catch {}
      setUploadMsg("✓");
    } catch { setUploadMsg("❌ 失败"); }
    setTimeout(() => setUploadMsg(""), 2500);
  };

  const allTracks = getAllTracks();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={toggle} className={`rounded-full px-3 py-1 text-xs interactive ${enabled?"bg-primary text-white":"bg-muted text-muted-foreground"}`}>{enabled?"已开启":"已关闭"}</button>
        <div className="flex items-center gap-1">
          <button onClick={prev} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground interactive">⏮</button>
          <button onClick={playing ? pause : play} className="text-xs px-2 py-0.5 rounded bg-primary text-white interactive">{playing?"⏸":"▶"}</button>
          <button onClick={next} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground interactive">⏭</button>
        </div>
      </div>
      {currentTrack && <p className="text-[0.625rem] text-muted-foreground truncate">正在播放: {currentTrack.title}</p>}

      {enabled && <MusicProgressBar />}

      {/* ── Loop mode ── */}
      <div className="mt-3">
        <p className="text-xs text-muted-foreground mb-1.5">播放模式</p>
        <div className="flex flex-wrap gap-1.5">
          {LOOP_MODES.map((m) => (
            <button
              key={m}
              onClick={() => setLoopMode(m)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.688rem] interactive ${
                loopMode === m
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
            >
              <LoopIcon mode={m} size={13} />
              {LOOP_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      <div><span className="text-[0.625rem] text-muted-foreground">音量</span>
        <GardenSlider value={volume} onChange={setVolume} min={0} max={100} step={5} unit="%" /></div>

      {enabled && (
        <>
          <div className="grid gap-1 grid-cols-2 max-h-[160px] overflow-y-auto">
            {allTracks.map(t => (
              <div key={t.id} className="flex items-center gap-1">
                <button onClick={() => setTrack(t.id)} className={`flex-1 rounded px-1.5 py-1 text-[0.688rem] text-left truncate interactive ${trackId===t.id?"bg-primary/10 text-primary font-medium":"text-muted-foreground hover:bg-muted"}`}>{t.title}</button>
                {!t.id.match(/^\d+/) && <button onClick={() => { removeCustomTrack(t.id); setCustomTracks(prev => prev.filter(ct => ct.id!==t.id)); if (trackId===t.id) setTrack(allTracks[0]?.id||"01"); }} className="text-[0.625rem] text-muted-foreground hover:text-accent interactive">✕</button>}
              </div>
            ))}
          </div>
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
            className={`block rounded border-2 border-dashed p-2 text-center text-[0.688rem] cursor-pointer interactive ${dragOver?"border-primary bg-primary/5":"border-border text-muted-foreground hover:border-secondary"}`}>
            拖放或点击上传音乐 (MP3/WAV/OGG/FLAC)
            <input type="file" ref={fileRef} accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a" onChange={async (e) => { const f = e.target.files?.[0]; if (f) await handleFile(f); e.target.value = ""; }} className="hidden" />
          </label>
          {uploadMsg && <p className="text-[0.625rem] text-primary">{uploadMsg}</p>}
        </>
      )}
    </div>
  );
}

// ── Companion Section (Live2D + Voice + API) ──────────

function CompanionSection() {
  return (
    <div className="space-y-5">
      {/* ── Live2D: model list + preview (side by side) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Live2DModelMini />
        <Live2DPreview />
      </div>
      <VoiceMini />
      <ApiMini />
    </div>
  );
}

function Live2DModelMini() {
  // ── Registry state ────────────────────────────────────
  const [registry, setRegistry] = useState<ModelManifestEntry[]>([]);
  const [registryLoaded, setRegistryLoaded] = useState(false);
  const [, render] = useReducer((n) => n + 1, 0);
  const config = getLive2DConfig();
  const [customUrl, setCustomUrl] = useState(config.customJsonPath);
  const [msg, setMsg] = useState("");

  // ── Fetch auto-scanned manifest ──────────────────────
  useEffect(() => {
    fetchModelManifest().then((models) => {
      setRegistry(models);
      setRegistryLoaded(true);
    });
  }, []);

  // ── Sync with external config changes ────────────────
  useEffect(() => {
    const sync = () => render();
    window.addEventListener("live2d-config-changed", sync);
    return () => window.removeEventListener("live2d-config-changed", sync);
  }, []);

  // ── Actions ──────────────────────────────────────────
  const selectByPath = (entry: ModelManifestEntry) => {
    if (!entry.jsonPath) {
      console.warn("[Live2D Settings] 模型缺少 jsonPath:", entry.id, entry);
      return;
    }
    console.log("[Live2D Settings] 点击模型卡片 →", {
      id: entry.id,
      name: entry.name,
      jsonPath: entry.jsonPath,
    });
    setLive2DConfig({ modelId: "custom", customJsonPath: entry.jsonPath });
  };
  const applyUrl = () => {
    const u = customUrl.trim(); if (!u) return;
    console.log("[Live2D Settings] 自定义 URL →", u);
    setLive2DConfig({ modelId: "custom", customJsonPath: u });
    setMsg("✓"); setTimeout(() => setMsg(""), 2000);
  };

  // ── Which model is currently active? ──────────────────
  const activePath = config.modelId === "custom" ? config.customJsonPath : "";
  const isActive = (entry: ModelManifestEntry) =>
    (config.modelId === "custom" && entry.jsonPath === activePath) ||
    (config.modelId !== "custom" && LIVE2D_PRESETS.some(p => p.id === config.modelId && p.jsonPath === entry.jsonPath));

  // ── Status helpers ────────────────────────────────────
  const statusBadge = (s: string) => {
    switch (s) {
      case "valid":   return { dot: "bg-emerald-400",     label: "完整",   cls: "text-emerald-400" };
      case "warning": return { dot: "bg-amber-400",        label: "可加载", cls: "text-amber-400" };
      default:        return { dot: "bg-red-400",           label: "损坏",   cls: "text-red-400" };
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs text-muted-foreground">Live2D 模型</p>
        {!registryLoaded && (
          <span className="inline-block w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* ── Model asset cards ───────────────────────────── */}
      <div className="space-y-1 max-h-[340px] overflow-y-auto pr-0.5 mb-2">
        {registry.map((entry) => {
          const badge = statusBadge(entry.status);
          const active = isActive(entry);
          return (
            <button
              key={entry.id}
              onClick={() => selectByPath(entry)}
              title={entry.jsonPath}
              className={`w-full text-left rounded-lg border p-2.5 interactive flex items-center gap-2.5 transition-colors ${
                active
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-card-hover"
              }`}
            >
              {/* Color swatch */}
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.previewColor }}
              />
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[0.75rem] font-medium text-foreground truncate">
                    {entry.name}
                  </span>
                  {entry.groupSize > 1 && (
                    <span className="text-[0.563rem] font-mono px-1 rounded bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
                      ×{entry.groupSize}
                    </span>
                  )}
                  <span className={`text-[0.563rem] font-mono px-1 rounded ${entry.version === "cubism3+" ? "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                    {entry.version === "cubism3+" ? "C3+" : "C2"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[0.563rem] text-muted-foreground font-mono">
                  <span>{entry.textureCount > 0 ? `${entry.textureCount} tex` : "无纹理"}</span>
                  {entry.hasMotions && <span className="text-emerald-500/80">mot</span>}
                  {entry.hasExpressions && <span className="text-sky-500/80">exp</span>}
                  {entry.hasPhysics && <span className="text-amber-500/80">phy</span>}
                </div>
              </div>
              {/* Status badge */}
              <div className="flex items-center gap-1 shrink-0">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                <span className={`text-[0.563rem] ${badge.cls}`}>{badge.label}</span>
              </div>
            </button>
          );
        })}
        {registry.length === 0 && registryLoaded && (
          <p className="text-[0.688rem] text-muted-foreground py-4 text-center">
            未发现本地模型 — 请将模型放入 public/resources/live2d/models/
          </p>
        )}
      </div>

      {/* ── Custom URL input ────────────────────────────── */}
      <div className="flex items-center gap-1.5 border-t border-border pt-2">
        <input
          type="text"
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") applyUrl(); }}
          placeholder="或输入自定义 .model.json URL"
          className="flex-1 rounded border border-border bg-card px-2 py-1 text-[0.688rem] text-foreground placeholder:text-muted-foreground interactive focus-ring"
        />
        <button onClick={applyUrl} className="rounded bg-primary px-2 py-1 text-[0.688rem] text-white interactive">
          应用
        </button>
        {msg && <span className="text-[0.625rem] text-primary">{msg}</span>}
      </div>
    </div>
  );
}

function VoiceMini() {
  // TTS paused (2026-06-13). When re-enabled, restore original component.
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1.5">语音音色</p>
      <p className="text-[0.688rem] text-muted-foreground/60">
        ⏸ 语音功能暂缓 — Fish Audio 已下线，本地 TTS 方案（MeloTTS）待部署完成。
      </p>
    </div>
  );
}

function ApiMini() {
  const [url, setUrl] = useState(""); const [key, setKey] = useState(""); const [model, setModel] = useState("deepseek-v4-flash");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setUrl(localStorage.getItem("garden-companion-api")||"");
    setKey(localStorage.getItem("garden-companion-key")||"");
    setModel(localStorage.getItem("garden-companion-model")||"deepseek-v4-flash");
  }, []);
  const save = () => {
    localStorage.setItem("garden-companion-api", url.trim());
    localStorage.setItem("garden-companion-key", key.trim());
    localStorage.setItem("garden-companion-model", model.trim()||"deepseek-v4-flash");
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  // ── Status check ──────────────────────────────────────
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<{
    provider: string; endpoint: string; model: string;
    reachable: boolean; lastChecked: number;
    balance: { total:string; granted:string; toppedUp:string; currency:string; available:boolean } | null;
    models: string[]; errors: string[];
  } | null>(null);

  const checkStatus = async () => {
    if (!key.trim()) return;
    setChecking(true);
    try {
      const res = await fetch("/api/ai-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: key.trim(),
          endpoint: url.trim() || "https://api.deepseek.com/v1/chat/completions",
          model: model.trim() || "deepseek-v4-flash",
        }),
      });
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setChecking(false);
    }
  };

  const providerLabel =
    status?.provider === "deepseek" ? "DeepSeek 官方"
    : status?.provider === "custom" ? "自定义 OpenAI Compatible"
    : "未知";

  const hasKey = !!key.trim();

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1.5">AI 对话 API</p>
      <div className="space-y-1.5">
        <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="API 端点 URL" className="w-full rounded border border-border bg-card px-2 py-1 text-[0.688rem] text-foreground placeholder:text-muted-foreground interactive focus-ring" />
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="API Key" className="w-full rounded border border-border bg-card px-2 py-1 text-[0.688rem] text-foreground placeholder:text-muted-foreground interactive focus-ring" />
        <div className="flex items-center gap-2">
          <input type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="模型名" className="w-32 rounded border border-border bg-card px-2 py-1 text-[0.688rem] text-foreground placeholder:text-muted-foreground interactive focus-ring" />
          <button onClick={save} className={`rounded px-3 py-1 text-[0.688rem] text-white interactive ${saved?"bg-green-500":"bg-primary hover:bg-primary-hover"}`}>{saved?"✓ 已保存":"保存"}</button>
        </div>
      </div>

      {/* ──  AI Service Status ── */}
      <div className="mt-2.5 pt-2 border-t border-border/50">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">🤖 AI 服务状态</span>
          <button
            onClick={checkStatus}
            disabled={checking || !hasKey}
            className="rounded px-2 py-0.5 text-[0.625rem] bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 interactive"
          >
            {checking ? "检测中…" : status ? "重新检测" : "检测"}
          </button>
        </div>

        {/* No key */}
        {!hasKey && (
          <p className="text-[0.625rem] text-muted-foreground/50">未配置 — 请输入 API Key</p>
        )}

        {/* Status result */}
        {hasKey && status && (
          <div className="space-y-1 text-[0.625rem]">
            {/* Connectivity dot + provider */}
            <div className="flex items-center gap-1.5">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${status.reachable ? "bg-green-500" : "bg-red-500"}`} />
              <span className={status.reachable ? "text-green-600" : "text-red-500"}>
                {status.reachable ? "已连接" : "连接失败"}
              </span>
              <span className="text-muted-foreground/50">· {providerLabel}</span>
            </div>

            {/* API address */}
            <div className="text-muted-foreground/60 truncate">
              <span className="text-muted-foreground/40">API 地址 </span>
              {status.endpoint}
            </div>

            {/* Model */}
            <div className="text-muted-foreground/60">
              <span className="text-muted-foreground/40">模型 </span>
              {status.model}
            </div>

            {/* Balance (DeepSeek only) */}
            {status.balance && (
              <div className="text-muted-foreground/60">
                <span className="text-muted-foreground/40">余额 </span>
                {status.balance.available ? (
                  <span>
                    <span className="text-green-600">¥{status.balance.total}</span>
                    {status.balance.toppedUp !== "0" && status.balance.granted !== "0" && (
                      <span className="text-muted-foreground/40">（充值 ¥{status.balance.toppedUp} + 赠送 ¥{status.balance.granted}）</span>
                    )}
                  </span>
                ) : (
                  <span className="text-red-500">不足</span>
                )}
              </div>
            )}

            {/* Available models */}
            {status.models.length > 0 && (
              <div>
                <span className="text-muted-foreground/40">可用模型 </span>
                <span className="flex flex-wrap gap-1 mt-0.5">
                  {status.models.map(m => (
                    <span key={m} className={`rounded-full px-1.5 py-0.5 text-[0.563rem] ${m === model || m === status.model ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{m}</span>
                  ))}
                </span>
              </div>
            )}

            {/* Errors */}
            {status.errors.length > 0 && (
              <div className="text-red-400 space-y-0.5 mt-1">
                {status.errors.map((e, i) => (
                  <div key={i} className="break-all leading-snug">{e}</div>
                ))}
              </div>
            )}

            {/* Timestamp */}
            {status.lastChecked > 0 && (
              <div className="text-muted-foreground/35">
                最后检测 {new Date(status.lastChecked).toLocaleTimeString("zh-CN", { hour:"2-digit", minute:"2-digit" })}
              </div>
            )}
          </div>
        )}

        {/* Has key but never checked */}
        {hasKey && !status && (
          <p className="text-[0.625rem] text-muted-foreground/50">点击「检测」验证连接</p>
        )}
      </div>
    </div>
  );
}

// ── Homepage Section ─────────────────────────────────

function HomepageSection() {
  const [modules, setModules] = useState<ModuleVisibility>(() => getPrefs().modules);
  const update = (k: keyof ModuleVisibility, v: boolean) => {
    const next = { ...modules, [k]: v };
    setModules(next); setPrefs({ modules: next }); applyPrefs({ ...getPrefs(), modules: next });
  };
  const labels: Record<string,string> = { greeting:"问候语", stats:"花园统计", gardenMemory:"来自花园的记忆", recentEntries:"最近记录" };
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">首页显示的模块（可在首页拖拽排序）</p>
      {Object.keys(modules).map(k => (
        <div key={k} className="flex items-center justify-between py-1">
          <span className="text-xs text-muted-foreground">{labels[k]}</span>
          <Switch checked={modules[k as keyof ModuleVisibility]} onChange={(v) => update(k as keyof ModuleVisibility, v)} />
        </div>
      ))}
    </div>
  );
}
