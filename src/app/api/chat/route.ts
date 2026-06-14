// ============================================================
// Digital Garden 3.0 — /api/chat — AI Companion API Route
// ============================================================
// Proxies chat requests to the user-configured LLM API.
// Supports SSE streaming and garden-aware context injection.
// Falls back to local response generation if API is unavailable.
// ============================================================

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildSystemPrompt, generateLocalResponse, type GardenStats } from "@/lib/garden-knowledge";
import { searchEntries } from "@/actions/entry-actions";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message: string = (body.message || "").trim();
    const history: ChatMessage[] = body.history || [];

    if (!message) {
      return Response.json({ error: "消息不能为空" }, { status: 400 });
    }

    // Read API config from headers (client sends from localStorage)
    const apiUrl = req.headers.get("x-garden-api-url") || "";
    const apiKey = req.headers.get("x-garden-api-key") || "";
    const apiModel = req.headers.get("x-garden-api-model") || "deepseek-v4-flash";

    // Gather garden stats for the system prompt
    const stats = await getGardenStats();

    // Search for relevant entries in the user's message
    const contextEntries = await getContextEntries(message);

    // Build system prompt
    const systemPrompt = buildSystemPrompt(stats);
    const contextBlock = contextEntries.length > 0
      ? `\n\n相关笔记内容：\n${contextEntries.map((e) => `- [${e.title}](/entry/${e.slug}): ${e.excerpt || ""}`).join("\n")}\n`
      : "";

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt + contextBlock },
      ...history.slice(-20), // Last 20 messages for context
      { role: "user", content: message },
    ];

    // If no API configured, fall back to local response
    if (!apiUrl || !apiKey) {
      const localResponse = generateLocalResponse(message, stats);
      // Include context in local mode too
      const contextNote = contextEntries.length > 0
        ? `\n\n📖 找到 ${contextEntries.length} 篇相关笔记：${contextEntries.map((e) => e.title).join("、")}`
        : "";
      return Response.json({ reply: localResponse + contextNote, mode: "local" });
    }

    // Call the configured LLM API with streaming
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: apiModel,
          messages,
          stream: true,
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });

      if (!response.ok || !response.body) {
        // Non-streaming fallback
        const nonStreamBody = JSON.stringify({
          model: apiModel,
          messages,
          max_tokens: 2048,
          temperature: 0.7,
        });
        const nonStreamRes = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: nonStreamBody,
        });

        if (nonStreamRes.ok) {
          const data = await nonStreamRes.json();
          const reply = data.choices?.[0]?.message?.content || "";
          return Response.json({ reply, mode: "api" });
        }

        // API failed, fall back to local
        const localResponse = generateLocalResponse(message, stats);
        return Response.json({ reply: localResponse, mode: "local" });
      }

      // Stream response as SSE
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body!.getReader();
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
                if (data === "[DONE]") {
                  controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
                  continue;
                }
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || "";
                  if (content) {
                    controller.enqueue(
                      new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`)
                    );
                  }
                } catch {
                  // Skip malformed JSON lines
                }
              }
            }
          } catch {
            // Stream error — send what we have
          } finally {
            controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch {
      // API call failed entirely
      const localResponse = generateLocalResponse(message, stats);
      return Response.json({ reply: localResponse, mode: "local" });
    }
  } catch {
    return Response.json({ error: "处理请求时出错" }, { status: 500 });
  }
}

// ── Helpers ───────────────────────────────────────────

async function getGardenStats(): Promise<GardenStats | null> {
  try {
    const entryCount = await prisma.entry.count();
    const tagCount = await prisma.tag.count();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthCount = await prisma.entry.count({
      where: { createdAt: { gte: monthStart } },
    });
    // Get this month's entry types
    const recentEntries = await prisma.entry.findMany({
      where: { createdAt: { gte: monthStart } },
      select: { type: true },
    });
    const typeMap = new Map<string, number>();
    for (const e of recentEntries) {
      typeMap.set(e.type, (typeMap.get(e.type) || 0) + 1);
    }
    const recentTypes = [...typeMap.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get top tags
    const tags = await prisma.tag.findMany({
      include: { entries: true },
      orderBy: { entries: { _count: "desc" } },
      take: 5,
    });
    const topTags = tags.map((t) => t.name);

    return { entryCount, tagCount, thisMonthCount, recentTypes, topTags };
  } catch {
    return null;
  }
}

async function getContextEntries(query: string): Promise<{ slug: string; title: string; excerpt: string | null }[]> {
  try {
    // Use Prisma to find entries whose titles appear in the query
    const allEntries = await prisma.entry.findMany({
      select: { slug: true, title: true, excerpt: true },
      take: 50,
    });

    const queryLower = query.toLowerCase();
    const relevant = allEntries.filter(
      (e) => queryLower.includes(e.title.slice(0, 3).toLowerCase())
    );

    return relevant.slice(0, 3);
  } catch {
    return [];
  }
}
