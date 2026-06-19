"use client";

// ============================================================
// Digital Garden — Block Insert Menu（Enhanced）
// ============================================================
// hover "+" 弹出菜单 + 内部引用 [[ 搜索
// 支持: 标题H1-H5 / 格式 / 媒体 / 列表 / 块 / 链接
// ============================================================

import { useState, useRef, useEffect, type ReactNode } from "react";

// ── Menu item types ───────────────────────────────────

interface MenuItem {
  label: string; icon: string; action: string;
  color?: string;
  children?: { label: string; icon: string; action: string; level?: number }[];
}

const COLORS = [
  { label: "默认", value: "default", color: "var(--color-foreground)" },
  { label: "赤红", value: "#ef4444", color: "#ef4444" },
  { label: "天蓝", value: "#3b82f6", color: "#3b82f6" },
  { label: "花园绿", value: "#6b8c5c", color: "#6b8c5c" },
  { label: "暖橙", value: "#d4956a", color: "#d4956a" },
  { label: "樱粉", value: "#c97a8b", color: "#c97a8b" },
  { label: "紫罗兰", value: "#8b5cf6", color: "#8b5cf6" },
  { label: "琥珀", value: "#f59e0b", color: "#f59e0b" },
];

export const HIGHLIGHT_COLORS = [
  { label: "亮黄（默认）", value: "#fff176", color: "#fff176" },
  { label: "浅绿", value: "#c8e6c9", color: "#c8e6c9" },
  { label: "浅蓝", value: "#bbdefb", color: "#bbdefb" },
  { label: "浅粉", value: "#f8bbd0", color: "#f8bbd0" },
  { label: "浅橙", value: "#ffe0b2", color: "#ffe0b2" },
  { label: "浅紫", value: "#e1bee7", color: "#e1bee7" },
  { label: "浅灰", value: "#e0e0e0", color: "#e0e0e0" },
  { label: "清除", value: "clear", color: "transparent" },
];

const MENU_GROUPS: { label: string; items: MenuItem[] }[] = [
  { label: "文本", items: [
    { label: "标题 H1-H5", icon: "H", action: "heading", children: [
      { label: "H1 大标题", icon: "H1", action: "heading", level: 1 },
      { label: "H2 标题", icon: "H2", action: "heading", level: 2 },
      { label: "H3 小标题", icon: "H3", action: "heading", level: 3 },
      { label: "H4", icon: "H4", action: "heading", level: 4 },
      { label: "H5", icon: "H5", action: "heading", level: 5 },
      { label: "正文", icon: "¶", action: "paragraph" },
    ]},
    { label: "粗体", icon: "B", action: "bold" },
    { label: "斜体", icon: "I", action: "italic" },
    { label: "下划线", icon: "U", action: "underline" },
    { label: "高亮（背景色）", icon: "🖍", action: "highlight", children: HIGHLIGHT_COLORS.map(c => ({ label: c.label, icon: "◉", action: "highlight", color: c.value })) },
    { label: "文字颜色", icon: "🎨", action: "color", children: COLORS.map(c => ({ icon: "●", action: "color", ...c })) },
    { label: "左对齐", icon: "⫷", action: "alignLeft" },
    { label: "居中", icon: "⫿", action: "alignCenter" },
    { label: "右对齐", icon: "⫸", action: "alignRight" },
  ]},
  { label: "块", items: [
    { label: "引用", icon: "❝", action: "blockquote" },
    { label: "代码块", icon: "</>", action: "codeBlock" },
    { label: "分割线", icon: "—", action: "horizontalRule" },
    { label: "便签/高亮", icon: "🌱", action: "callout" },
    { label: "流程图 Mermaid", icon: "📊", action: "mermaid" },
    { label: "数学公式 LaTeX", icon: "📐", action: "mathBlock" },
  ]},
  { label: "列表", items: [
    { label: "无序列表", icon: "•", action: "bulletList" },
    { label: "有序列表", icon: "1.", action: "orderedList" },
    { label: "任务清单", icon: "☐", action: "taskList" },
  ]},
  { label: "媒体 & 链接", items: [
    { label: "图片", icon: "🖼", action: "image" },
    { label: "视频", icon: "🎬", action: "video" },
    { label: "音频", icon: "🎵", action: "audio" },
    { label: "链接", icon: "🔗", action: "link" },
    { label: "内部引用 [[]]", icon: "📎", action: "wikiLink" },
  ]},
];

// ── Block Menu ────────────────────────────────────────

export function BlockMenu({
  onSelect, position, onClose,
}: {
  onSelect: (action: string, level?: number, color?: string) => void;
  position: { x: number; y: number };
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        className="fixed z-50 rounded-lg border border-border bg-card shadow-lg p-1.5 min-w-[200px] max-h-[450px] overflow-y-auto"
        style={{ left: Math.min(position.x, window.innerWidth - 220), top: Math.max(10, Math.min(position.y, window.innerHeight - 460)) }}
      >
        {MENU_GROUPS.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <div className="my-1 border-t border-border/30" />}
            <p className="px-3 py-1 text-[0.625rem] text-muted-foreground/60 uppercase tracking-wider">{group.label}</p>
            {group.items.map((item) => (
              <div key={item.action}>
                <button
                  onClick={() => {
                    if (item.children) { setExpanded(expanded === item.action ? null : item.action); }
                    else { onSelect(item.action); onClose(); }
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs rounded hover:bg-muted interactive text-left"
                >
                  <span className="w-5 text-center text-sm shrink-0">{item.icon}</span>
                  <span className="flex-1 text-foreground">{item.label}</span>
                  {item.children && <span className="text-muted-foreground text-[0.625rem]">▸</span>}
                </button>
                {item.children && expanded === item.action && (
                  <div className="ml-5 border-l border-border pl-2">
                    {item.action === "color" ? COLORS.map(c => (
                      <button key={c.value} onClick={() => { onSelect("color", undefined, c.value); onClose(); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded hover:bg-muted interactive text-left">
                        <span className="w-4 h-4 rounded-full border border-border/50" style={{ backgroundColor: c.color }} />
                        <span className="text-foreground">{c.label}</span>
                      </button>
                    )) : item.action === "highlight" ? HIGHLIGHT_COLORS.map(c => (
                      <button key={c.value} onClick={() => { onSelect("highlight", undefined, c.value); onClose(); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded hover:bg-muted interactive text-left">
                        <span className="w-4 h-4 rounded border border-border/50" style={{ backgroundColor: c.color || "transparent", border: c.value === "clear" ? "2px dashed" : undefined }} />
                        <span className="text-foreground">{c.label}</span>
                      </button>
                    )) : item.children!.map(child => (
                      <button key={child.label} onClick={() => { onSelect(child.action, child.level); onClose(); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded hover:bg-muted interactive text-left">
                        <span className="w-5 text-center text-[0.625rem] font-semibold text-muted-foreground">{child.icon}</span>
                        <span className="text-foreground">{child.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

// ── Wiki Link Popover ─────────────────────────────────

export function WikiLinkPopover({
  search, onSelect, onClose, entries, loading, position,
}: {
  search: string;
  onSelect: (slug: string, title: string) => void;
  onClose: () => void;
  entries: { slug: string; title: string }[];
  loading?: boolean;
  position?: { x: number; y: number };
}) {
  // Local search state for filtering
  const [localSearch, setLocalSearch] = useState(search || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, []);

  const effectiveSearch = search || localSearch;
  const filtered = entries.filter((e) =>
    e.title.toLowerCase().includes(effectiveSearch.toLowerCase())
  ).slice(0, 8);

  const left = position ? Math.min(position.x, window.innerWidth - 280) : window.innerWidth / 2 - 130;
  const top = position ? Math.max(10, Math.min(position.y, window.innerHeight - 300)) : window.innerHeight / 3;

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        className="fixed z-50 rounded-lg border border-border bg-card shadow-lg p-2"
        style={{ left, top, width: 280, maxHeight: 320 }}
      >
        <p className="px-3 py-1.5 text-[0.625rem] text-muted-foreground uppercase tracking-wider">
          内部引用
        </p>
        <div className="px-2 pb-1">
          <input
            ref={inputRef}
            type="text"
            placeholder="输入关键词搜索已有笔记…"
            value={effectiveSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && filtered.length === 1) {
                onSelect(filtered[0].slug, filtered[0].title);
                onClose();
              }
            }}
            className="w-full rounded-md border border-border bg-muted px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50"
          />
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
          {loading ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">加载中…</p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              {effectiveSearch ? "无匹配笔记" : "输入关键词搜索已有笔记…"}
            </p>
          ) : (
            filtered.map((e) => (
              <button
                key={e.slug}
                onClick={() => { onSelect(e.slug, e.title); onClose(); }}
                className="w-full text-left px-3 py-2 text-xs rounded hover:bg-muted interactive flex items-center gap-2"
              >
                <span className="text-foreground truncate">{e.title}</span>
                <span className="text-muted-foreground text-[0.625rem] shrink-0">/{e.slug}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ── Media URL Prompt (inline) ─────────────────────────

export function MediaPrompt({
  type, onConfirm, onCancel,
}: {
  type: "image" | "video" | "audio" | "link";
  onConfirm: (url: string, label?: string) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const labels: Record<string, string> = { image: "图片", video: "视频", audio: "音频", link: "链接" };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()}
        className="rounded-lg border border-border bg-card shadow-xl p-4 w-[380px] space-y-3">
        <p className="text-sm font-medium text-foreground">插入{labels[type]}</p>
        <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder={type === "link" ? "https://..." : "输入 URL 地址…"}
          onKeyDown={(e) => { if (e.key === "Enter" && url.trim()) onConfirm(url.trim(), label.trim() || undefined); }}
          autoFocus
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        {type === "link" && (
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder="链接文字（可选）"
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        )}
        <div className="flex items-center justify-end gap-2">
          <button onClick={onCancel} className="text-xs px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground interactive">取消</button>
          <button onClick={() => url.trim() && onConfirm(url.trim(), label.trim() || undefined)}
            disabled={!url.trim()}
            className="text-xs px-4 py-1.5 rounded-md bg-primary text-white hover:bg-primary-hover interactive disabled:opacity-50">插入</button>
        </div>
        <p className="text-[0.625rem] text-muted-foreground">也支持拖放文件到编辑器直接上传</p>
      </div>
    </div>
  );
}

// ── Numbering Popover (有序列表编号控制) ───────────

export function NumberingPopover({
  editor, position, onClose,
}: {
  editor: any;
  position: { x: number; y: number; pos: number };
  onClose: () => void;
}) {
  if (!editor) return null;

  const restartList = () => {
    editor.chain().focus().updateAttributes("orderedList", { start: 1 }).run();
    onClose();
  };

  const setStart = () => {
    const val = window.prompt("起始编号", "1");
    if (val && /^\d+$/.test(val)) {
      editor.chain().focus().updateAttributes("orderedList", { start: Number(val) }).run();
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        className="fixed z-50 rounded-lg border border-border bg-card shadow-lg p-1.5 min-w-[160px]"
        style={{
          left: Math.min(position.x, window.innerWidth - 180),
          top: Math.max(10, position.y),
        }}
      >
        <p className="px-3 py-1 text-[0.625rem] text-muted-foreground/60 uppercase tracking-wider">
          编号
        </p>
        <button
          onClick={restartList}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded hover:bg-muted interactive text-left"
        >
          <span className="text-foreground">🔢 从 1 开始</span>
        </button>
        <button
          onClick={setStart}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded hover:bg-muted interactive text-left"
        >
          <span className="text-foreground">✏️ 自定义起始值…</span>
        </button>
      </div>
    </>
  );
}
