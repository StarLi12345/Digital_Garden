"use client";

// ============================================================
// Digital Garden 3.0 — /chat — AI Companion
// ============================================================
// Interactive chat with garden-aware AI.
// Features: streaming responses, session history
// Markdown rendering, garden context injection.
// ============================================================

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { marked } from "marked";
// playTTS import removed — TTS paused (2026-06-13)
// Re-add when TTS is re-enabled

// ── Types ─────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  streaming?: boolean;
}

interface Session {
  id: string;
  name: string;
  messages: Message[];
  createdAt: number;
}

// ── Constants ─────────────────────────────────────────

const SESSIONS_KEY = "garden-chat-sessions";
const API_CONFIG_KEYS = {
  url: "garden-companion-api",
  key: "garden-companion-key",
  model: "garden-companion-model",
};

// ── Helpers ───────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function loadSessions(): Session[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {}
}

function getApiConfig() {
  if (typeof window === "undefined")
    return { url: "", key: "", model: "" };
  return {
    url: localStorage.getItem(API_CONFIG_KEYS.url) || "",
    key: localStorage.getItem(API_CONFIG_KEYS.key) || "",
    model: localStorage.getItem(API_CONFIG_KEYS.model) || "",
  };
}

// ── Markdown Renderer ─────────────────────────────────

function MarkdownContent({ content }: { content: string }) {
  const html = useMemo(() => {
    try { return marked.parse(content, { async: false }) as string; }
    catch { return content; }
  }, [content]);

  return (
    <div
      className="prose prose-sm max-w-none text-foreground chat-markdown"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── Sidebar Content (shared between mobile/desktop) ───

function SidebarContent({
  sessions, activeSessionId, onSelect, onNew, onDelete, onClose,
}: {
  sessions: Session[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="p-3 flex items-center gap-1.5 shrink-0">
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted interactive flex items-center justify-center shrink-0"
          title="关闭侧栏"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4l-6 8M5 4l6 8"/></svg>
        </button>
        <button
          onClick={onNew}
          className="flex-1 rounded-md bg-primary text-white px-2.5 py-1.5 text-xs font-medium hover:bg-primary-hover interactive"
        >
          + 新对话
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {sessions.length === 0 ? (
          <p className="px-2.5 py-4 text-xs text-muted-foreground text-center">
            暂无对话记录
          </p>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className={`group flex items-center rounded-lg px-2.5 py-1.5 cursor-pointer interactive text-xs transition-colors ${
                s.id === activeSessionId
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
              onClick={() => onSelect(s.id)}
            >
              <span className="truncate flex-1">{s.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 ml-1 shrink-0"
                title="删除对话"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}

// ── Main Component ────────────────────────────────────

export default function ChatPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  // TTS per-message state: messageId → 'loading' | 'playing' | error string
  const [ttsState, setTtsState] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load sessions on mount
  useEffect(() => {
    const loaded = loadSessions();
    setSessions(loaded);
    if (loaded.length > 0) {
      setActiveSessionId(loaded[0].id);
    }
  }, []);

  // Skip scroll on initial mount, scroll on all subsequent updates.
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  // Create new session
  const newSession = useCallback(() => {
    const session: Session = {
      id: generateId(),
      name: "新对话",
      messages: [],
      createdAt: Date.now(),
    };
    const updated = [session, ...sessions];
    setSessions(updated);
    setActiveSessionId(session.id);
    saveSessions(updated);
  }, [sessions]);

  // Delete session
  const deleteSession = useCallback(
    (id: string) => {
      const updated = sessions.filter((s) => s.id !== id);
      setSessions(updated);
      if (activeSessionId === id) {
        setActiveSessionId(updated.length > 0 ? updated[0].id : null);
      }
      saveSessions(updated);
    },
    [sessions, activeSessionId]
  );

  // Send message
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    if (!activeSessionId) {
      // Auto-create a session
      const session: Session = {
        id: generateId(),
        name: text.slice(0, 30),
        messages: [],
        createdAt: Date.now(),
      };
      const updated = [session, ...sessions];
      setSessions(updated);
      setActiveSessionId(session.id);
      saveSessions(updated);
      // We'll let the next effect handle the send
      // But for simplicity, we'll use this new session right away
      // Actually, let's handle it inline
      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: text,
        timestamp: Date.now(),
      };
      const aiMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        streaming: true,
      };
      session.messages = [userMsg, aiMsg];
      session.name = text.slice(0, 30);
      const finalUpdated = [session, ...sessions];
      setSessions(finalUpdated);
      saveSessions(finalUpdated);
      setInput("");
      setSending(true);

      const config = getApiConfig();
      try {
        await streamChat(
          config,
          session.messages.filter((m) => !m.streaming),
          (chunk) => {
            setSessions((prev) =>
              prev.map((s) =>
                s.id === session.id
                  ? {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === aiMsg.id
                          ? { ...m, content: m.content + chunk }
                          : m
                      ),
                    }
                  : s
              )
            );
          },
          () => {
            setSessions((prev) => {
              const updated = prev.map((s) =>
                s.id === session.id
                  ? {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === aiMsg.id
                          ? { ...m, streaming: false }
                          : m
                      ),
                    }
                  : s
              );
              saveSessions(updated);
              return updated;
            });
            setSending(false);
          }
        );
      } catch {
        setSessions((prev) => {
          const updated = prev.map((s) =>
            s.id === session.id
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === aiMsg.id
                      ? { ...m, content: "抱歉，出了点问题，请稍后重试。", streaming: false }
                      : m
                  ),
                }
              : s
          );
          saveSessions(updated);
          return updated;
        });
        setSending(false);
      }
      return;
    }

    // Normal flow with active session
    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    const aiMsg: Message = {
      id: generateId(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      streaming: true,
    };

    const updatedSessions = sessions.map((s) => {
      if (s.id !== activeSessionId) return s;
      return {
        ...s,
        messages: [...s.messages, userMsg, aiMsg],
        name: s.messages.length === 0 ? text.slice(0, 30) : s.name,
      };
    });
    setSessions(updatedSessions);
    saveSessions(updatedSessions);
    setInput("");
    setSending(true);

    const session = updatedSessions.find((s) => s.id === activeSessionId)!;
    const config = getApiConfig();
    try {
      await streamChat(
        config,
        session.messages.filter((m) => !m.streaming),
        (chunk) => {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === activeSessionId
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === aiMsg.id
                        ? { ...m, content: m.content + chunk }
                        : m
                    ),
                  }
                : s
            )
          );
        },
        () => {
          setSessions((prev) => {
            const updated = prev.map((s) =>
              s.id === activeSessionId
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === aiMsg.id
                        ? { ...m, streaming: false }
                        : m
                    ),
                  }
                : s
            );
            saveSessions(updated);
            return updated;
          });
          setSending(false);
        }
      );
    } catch {
      setSessions((prev) => {
        const updated = prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === aiMsg.id
                    ? { ...m, content: "抱歉，出了点问题，请稍后重试。", streaming: false }
                    : m
                ),
              }
            : s
        );
        saveSessions(updated);
        return updated;
      });
      setSending(false);
    }
  }, [input, sending, activeSessionId, sessions]);

  // Handle keyboard
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  // Text-to-Speech for AI messages — PAUSED (2026-06-13)
  // Fish Audio removed; local MeloTTS deployment pending.
  // When re-enabled, restore original speak() with real playTTS call.
  const speak = useCallback(
    async (msgId: string, _text: string) => {
      setTtsState((prev) => ({ ...prev, [msgId]: "语音功能暂缓" }));
      // Wait 2s then clear the notice
      setTimeout(() => {
        setTtsState((prev) => {
          const next = { ...prev };
          delete next[msgId];
          return next;
        });
      }, 2500);
    },
    []
  );

  // ── Mobile-aware sidebar ─────────────────────────────
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // On mobile, default sidebar closed
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
    else setSidebarOpen(true);
  }, [isMobile]);

  // ── Render ───────────────────────────────────────────

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]" data-page="chat">
      {/* Mobile sidebar — full-screen overlay like ChatGPT mobile */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--color-background)" }}>
          {/* Header bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted interactive flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4l-6 8M5 4l6 8"/></svg>
            </button>
            <span className="text-sm font-medium text-foreground">对话列表</span>
            <button
              onClick={() => { newSession(); setSidebarOpen(false); }}
              className="ml-auto rounded-md bg-primary text-white px-3 py-1.5 text-xs font-medium hover:bg-primary-hover interactive"
            >
              + 新对话
            </button>
          </div>
          {/* Session list */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
            {sessions.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">暂无对话记录</p>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className={`group flex items-center rounded-lg px-3 py-2.5 cursor-pointer interactive text-sm transition-colors ${
                    s.id === activeSessionId
                      ? "bg-muted text-foreground font-medium"
                      : "text-foreground hover:bg-muted/60"
                  }`}
                  onClick={() => { setActiveSessionId(s.id); setSidebarOpen(false); }}
                >
                  <span className="truncate flex-1">{s.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                    className="opacity-60 hover:opacity-100 text-muted-foreground hover:text-red-500 ml-2 shrink-0 p-1"
                    title="删除对话"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Desktop sidebar — inline layout */}
      {!isMobile && (
        <aside
          className={`shrink-0 sticky top-14 self-start border-r border-border bg-card/40 flex flex-col transition-all duration-200 ${
            sidebarOpen ? "w-52 h-[calc(100vh-3.5rem)]" : "w-0 border-r-0 overflow-hidden"
          }`}
        >
          {sidebarOpen && (
            <SidebarContent
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelect={setActiveSessionId}
              onNew={newSession}
              onDelete={deleteSession}
              onClose={() => setSidebarOpen(false)}
            />
          )}
        </aside>
      )}

      {/* Sidebar expand handle when collapsed (desktop only) */}
      {!isMobile && !sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="shrink-0 w-8 border-r border-border bg-card/30 flex flex-col items-center pt-3 gap-3 text-muted-foreground hover:text-foreground hover:bg-muted/30 interactive"
          title="打开侧栏"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3h10v2H3zM3 7h7v2H3zM3 11h5v2H3z"/></svg>
        </button>
      )}

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header: hamburger + title */}
        {isMobile && (
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted interactive flex items-center justify-center"
              title="对话列表"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 3h12v2H2zM2 7h8v2H2zM2 11h5v2H2z"/>
              </svg>
            </button>
            <span className="text-sm font-medium text-foreground truncate">
              {activeSession?.name || "花园伙伴"}
            </span>
            <button
              onClick={newSession}
              className="ml-auto w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted interactive flex items-center justify-center"
              title="新对话"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 3v10M3 8h10"/>
              </svg>
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 px-4 py-4 space-y-4">
          {!activeSession || activeSession.messages.length === 0 ? (
            <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 3.5rem - 4.5rem)" }}>
              <div className="text-center">
                <p className="text-4xl mb-3">🌸</p>
                <p className="text-sm text-muted-foreground">
                  我是你的花园伙伴，有什么可以帮你？
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  试试问：&quot;帮我找到关于React的笔记&quot; 或 &quot;给我推荐相关笔记&quot;
                </p>
              </div>
            </div>
          ) : (
            activeSession.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-white"
                      : "bg-muted/50 text-foreground border border-border"
                  }`}
                >
                  {msg.role === "assistant" && msg.content ? (
                    <MarkdownContent content={msg.content} />
                  ) : msg.role === "assistant" && msg.streaming ? (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <span className="animate-pulse">●</span>
                      <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>●</span>
                      <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>●</span>
                    </span>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  )}

                  {/* TTS button for assistant messages — PAUSED */}
                  {msg.role === "assistant" && msg.content && !msg.streaming && (() => {
                    const s = ttsState[msg.id];
                    const isPaused = s === "语音功能暂缓";
                    return isPaused ? (
                      <span className="mt-1.5 text-[0.625rem] text-muted-foreground/50 cursor-default select-none">
                        🔊 暂缓
                      </span>
                    ) : (
                      <button
                        onClick={() => speak(msg.id, msg.content)}
                        className="mt-1.5 text-[0.625rem] interactive text-muted-foreground hover:text-foreground"
                        title="语音功能暂缓"
                      >
                        🔊 播放
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border p-3">
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息… (Ctrl+Enter 发送)"
              rows={1}
              className="flex-1 resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              style={{ minHeight: "2.5rem", maxHeight: "8rem" }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium interactive ${
                !input.trim() || sending
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary-hover"
              }`}
            >
              {sending ? "…" : "发送"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Streaming Chat Helper ─────────────────────────────

async function streamChat(
  config: { url: string; key: string; model: string },
  messages: { role: string; content: string }[],
  onChunk: (text: string) => void,
  onDone: () => void
) {
  const history = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-garden-api-url": config.url,
      "x-garden-api-key": config.key,
      "x-garden-api-model": config.model,
    },
    body: JSON.stringify({
      message: messages[messages.length - 1]?.content || "",
      history: history.slice(0, -1), // Exclude the last message (it's the current)
    }),
  });

  // Check if it's a streaming response
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/event-stream")) {
    const reader = response.body?.getReader();
    if (!reader) { onDone(); return; }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) onChunk(parsed.content);
          } catch {}
        }
      }
    } catch {}
    onDone();
    return;
  }

  // Non-streaming response
  const data = await response.json();
  if (data.reply) {
    onChunk(data.reply);
  }
  onDone();
}
