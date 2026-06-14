// ============================================================
// Digital Garden — TTS Voice System (PAUSED)
// ============================================================
// 2026-06-13: TTS temporarily paused. Fish Audio removed as cloud
// dependency. Local MeloTTS research preserved in melotts-server/.
// When re-enabled, swap playTTS to call the local TTS service.
// ============================================================

export interface TTSVoice {
  id: string;
  name: string;
  description: string;
  gender: "Female" | "Male";
  /** "fish-audio" = Fish Audio API, "web-speech" = browser native */
  engine: "fish-audio" | "web-speech";
  /** Fish Audio reference_id or SpeechSynthesis voice name */
  referenceId: string;
  /** Only for web-speech fallback */
  pitch?: number;
  rate?: number;
}

export interface TTSResult {
  success: boolean;
  engine: "fish-audio" | "web-speech";
  /** Human-readable error if success=false */
  error?: string;
}

// ── Voice presets ──────────────────────────────────────
// Fish Audio: exactly ONE test model for now (350118cc...)
// Web Speech: Microsoft Edge voices for explicit opt-in

export const TTS_VOICE_PRESETS: TTSVoice[] = [
  // ★ Fish Audio — 唯一启用的测试模型
  {
    id: "fish-garden-default",
    name: "Garden 默认",
    description: "Fish Audio 测试音色 350118cc",
    gender: "Female",
    engine: "fish-audio",
    referenceId: "350118cc5a6d41d294b2ac1a2ae3cc0e",
  },
  // Web Speech (显式选择才使用, 不做静默降级)
  {
    id: "Xiaoxiao",
    name: "晓晓",
    description: "浏览器语音 — 活泼元气少女",
    gender: "Female",
    engine: "web-speech",
    referenceId: "Xiaoxiao",
    pitch: 1.15,
    rate: 1.05,
  },
  {
    id: "Xiaoshuang",
    name: "晓双",
    description: "浏览器语音 — 甜美可爱萝莉音",
    gender: "Female",
    engine: "web-speech",
    referenceId: "Xiaoshuang",
    pitch: 1.35,
    rate: 1.10,
  },
  {
    id: "Xiaoyi",
    name: "晓伊",
    description: "浏览器语音 — 温柔知性女声",
    gender: "Female",
    engine: "web-speech",
    referenceId: "Xiaoyi",
    pitch: 1.02,
    rate: 0.95,
  },
  {
    id: "Yunxi",
    name: "云希",
    description: "浏览器语音 — 阳光开朗男声",
    gender: "Male",
    engine: "web-speech",
    referenceId: "Yunxi",
    pitch: 0.92,
    rate: 1.00,
  },
];

// ── Persistence ────────────────────────────────────────

const STORAGE_KEY = "garden-tts-voice";

export function getStoredVoice(): TTSVoice {
  if (typeof window === "undefined") return TTS_VOICE_PRESETS[0];
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    return TTS_VOICE_PRESETS.find((v) => v.id === id) || TTS_VOICE_PRESETS[0];
  } catch {
    return TTS_VOICE_PRESETS[0];
  }
}

export function setStoredVoice(voiceId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, voiceId);
  } catch {}
}

// ── Find best matching system voice ────────────────────

/** Preload voices — call once on app startup */
export function preloadVoices(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }
}

function findSystemVoice(preset: TTSVoice): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const id = preset.id.toLowerCase();

  // Strategy 1: match voice name containing preset id AND Chinese
  let match = voices.find(
    (v) =>
      v.name.toLowerCase().includes(id) &&
      (v.lang.startsWith("zh-CN") || v.lang.startsWith("zh"))
  );
  if (match) return match;

  // Strategy 2: any zh-CN voice
  match = voices.find((v) => v.lang.startsWith("zh-CN"));
  if (match) return match;

  // Strategy 3: any Chinese voice
  match = voices.find((v) => v.lang.startsWith("zh"));
  return match || null;
}

// ── Fish Audio API config ──────────────────────────────

const FISH_AUDIO_KEY = "garden-fish-audio-key";

export function getFishAudioConfig(): { key: string } {
  if (typeof window === "undefined") return { key: "" };
  return {
    key: localStorage.getItem(FISH_AUDIO_KEY) || "",
  };
}

export function setFishAudioConfig(key: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FISH_AUDIO_KEY, key.trim());
  } catch {}
}

// ── Play TTS (PAUSED) ───────────────────────────────────
// Returns paused status. When re-enabled, swap for real engine.
// To re-enable: replace this function body with the real TTS call.

export async function playTTS(
  text: string,
  preset?: TTSVoice
): Promise<TTSResult> {
  const voice = preset || getStoredVoice();
  console.log("[TTS] playTTS called — feature paused", {
    voiceId: voice.id,
    textLen: text.slice(0, 80).length,
  });

  return {
    success: false,
    engine: voice.engine,
    error: "语音功能暂缓（TTS feature paused）",
  };
}
