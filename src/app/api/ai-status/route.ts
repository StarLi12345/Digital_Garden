// ============================================================
// POST /api/ai-status — DeepSeek AI service health check
// ============================================================
// Proxies balance + model list queries to DeepSeek API.
// API key is passed via x-garden-api-key header (never stored).
// ============================================================

import { NextRequest, NextResponse } from "next/server";

export interface AIStatusResponse {
  // ── Identity ──
  provider: "deepseek" | "custom" | "unknown";
  endpoint: string;
  model: string;

  // ── Connectivity ──
  reachable: boolean;
  lastChecked: number;

  // ── Balance (DeepSeek only) ──
  balance: {
    total: string;
    granted: string;
    toppedUp: string;
    currency: string;
    available: boolean;
  } | null;

  // ── Available models ──
  models: string[];

  // ── Diagnostics ──
  errors: string[];
}

export async function POST(req: NextRequest) {
  const errors: string[] = [];

  try {
    const body = await req.json().catch(() => ({}));
    const apiKey =
      (body.apiKey as string)?.trim() ||
      req.headers.get("x-garden-api-key") ||
      "";

    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key is required" },
        { status: 400 }
      );
    }

    const endpoint = body.endpoint || "https://api.deepseek.com/v1/chat/completions";
    const model = body.model || "deepseek-v4-flash";

    // Detect provider
    const isDeepSeek = endpoint.includes("api.deepseek.com");
    const baseUrl = isDeepSeek
      ? "https://api.deepseek.com"
      : new URL(endpoint).origin;

    // ── Parallel: balance + models ──────────────────────
    const [balanceResult, modelResult] = await Promise.allSettled([
      fetchDeepSeekBalance(baseUrl, apiKey),
      isDeepSeek ? fetchDeepSeekModels(baseUrl, apiKey) : Promise.resolve([]),
    ]);

    const balance =
      balanceResult.status === "fulfilled" ? balanceResult.value : null;
    if (balanceResult.status === "rejected") {
      errors.push(`Balance: ${balanceResult.reason}`);
    }

    const models =
      modelResult.status === "fulfilled" ? modelResult.value : [];
    if (!isDeepSeek) {
      models.push(model);
    }
    if (modelResult.status === "rejected") {
      errors.push(`Models: ${modelResult.reason}`);
    }

    return NextResponse.json({
      provider: isDeepSeek ? "deepseek" : "custom",
      endpoint,
      model,
      reachable: balance !== null || models.length > 0,
      lastChecked: Date.now(),
      balance,
      models,
      errors,
    } satisfies AIStatusResponse);
  } catch (e: any) {
    return NextResponse.json(
      {
        provider: "unknown",
        endpoint: "",
        model: "",
        reachable: false,
        lastChecked: Date.now(),
        balance: null,
        models: [],
        errors: [e?.message || "Unknown error"],
      } satisfies AIStatusResponse,
      { status: 500 }
    );
  }
}

// ── DeepSeek balance ────────────────────────────────────

async function fetchDeepSeekBalance(
  baseUrl: string,
  apiKey: string
): Promise<AIStatusResponse["balance"]> {
  const res = await fetch(`${baseUrl}/user/balance`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const data = await res.json();
  const info = data.balance_infos?.[0];

  return {
    total: info?.total_balance ?? "0",
    granted: info?.granted_balance ?? "0",
    toppedUp: info?.topped_up_balance ?? "0",
    currency: info?.currency ?? "CNY",
    available: data.is_available ?? false,
  };
}

// ── DeepSeek models ─────────────────────────────────────

async function fetchDeepSeekModels(
  baseUrl: string,
  apiKey: string
): Promise<string[]> {
  const res = await fetch(`${baseUrl}/models`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const data = await res.json();
  return (data.data || []).map((m: any) => m.id as string);
}
