// ============================================================
// POST /api/tts — TTS proxy (PAUSED)
// ============================================================
// TTS feature is temporarily paused (2026-06-13).
// Fish Audio was removed as a cloud dependency; MeloTTS local
// deployment was attempted but blocked by network restrictions.
// When re-enabled, this route will proxy to a local TTS service.
// ============================================================

import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      error: "语音功能暂缓（TTS feature paused）",
      hint: "Fish Audio has been removed. Local TTS (MeloTTS) deployment is pending. See melotts-server/ for research progress.",
      paused: true,
    },
    { status: 503 }
  );
}
