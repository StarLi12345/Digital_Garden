// ============================================================
// Digital Garden — Audio Library (Enhanced)
// ============================================================
// 内置曲目 + 用户自定义上传。
// 云端部署时大音频文件走 CDN（Phase 2）。
// localStorage keys: garden-bgm-enabled, garden-bgm-track, garden-bgm-volume
//                    garden-bgm-custom-tracks (JSON array)
// ============================================================

import { resolveAssetUrl } from "./cdn";

export interface AudioTrack {
  id: string;
  path: string;
  title: string;
}

interface AudioRawPath {
  id: string;
  title: string;
  localPath: string;
}

// ── Built-in tracks (local paths, resolved at consumption) ─

const AUDIO_RAW_PATHS: AudioRawPath[] = [
  { id: "01", localPath: "/audio/01-tea-time.mp3", title: "☕ Tea Time" },
  { id: "02", localPath: "/audio/02-time-flows.mp3", title: "⏳ Time Flows Ever Onward" },
  { id: "03", localPath: "/audio/03-grassy-turtles.mp3", title: "🐢 Grassy Turtles and Seed Rats" },
  { id: "04", localPath: "/audio/04-spring-dance.mp3", title: "🌸 Spring Dance" },
  { id: "05", localPath: "/audio/05-ordinary-life.mp3", title: "🏡 An Ordinary Life" },
  { id: "06", localPath: "/audio/06-cradle-of-galaxy.mp3", title: "🌌 Cradle of Galaxy" },
  { id: "07", localPath: "/audio/07-chinese-tea.mp3", title: "🍵 上海紅茶館 (Piano)" },
  { id: "08", localPath: "/audio/08-capriccio.mp3", title: "🎹 少女綺想曲 (Piano)" },
  { id: "09", localPath: "/audio/09-cuishoyue.mp3", title: "🗾 東方萃夢想・砕月 (Piano)" },
  { id: "10", localPath: "/audio/10-distant-sky.mp3", title: "🕊 遠い空へ (ヨスガノソラ)" },
  { id: "11", localPath: "/audio/11-three-thousand-worlds.mp3", title: "🌏 三千世界" },
  { id: "12", localPath: "/audio/12-go-to-the-beach.mp3", title: "🏖 想去海边" },
  { id: "13", localPath: "/audio/13-ten-thousand-sorrows.mp3", title: "🎸 一万次悲伤" },
  { id: "14", localPath: "/audio/14-beautiful-future.mp3", title: "✨ 最美好的前途" },
  { id: "15", localPath: "/audio/15-sakura.mp3", title: "🌸 さくら (Sakura)" },
  { id: "16", localPath: "/audio/16-into-the-dark.mp3", title: "🌑 Into The Dark" },
];

/** Built-in tracks with CDN-resolved paths */
export const AUDIO_TRACKS: AudioTrack[] = AUDIO_RAW_PATHS.map((t) => ({
  id: t.id,
  title: t.title,
  path: resolveAssetUrl(t.localPath),
}));

export const BGM_ENABLED_KEY = "garden-bgm-enabled";
export const BGM_TRACK_KEY = "garden-bgm-track";
export const BGM_VOLUME_KEY = "garden-bgm-volume";
export const BGM_CUSTOM_TRACKS_KEY = "garden-bgm-custom-tracks";

// ── Custom tracks (user-uploaded via FileReader data URL) ──

export function getCustomTracks(): AudioTrack[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BGM_CUSTOM_TRACKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addCustomTrack(track: AudioTrack) {
  const tracks = getCustomTracks();
  // Avoid duplicates by path
  if (tracks.some((t) => t.path === track.path)) return;
  tracks.push(track);
  try {
    localStorage.setItem(BGM_CUSTOM_TRACKS_KEY, JSON.stringify(tracks));
  } catch {
    // Quota exceeded — remove oldest
    tracks.shift();
    try { localStorage.setItem(BGM_CUSTOM_TRACKS_KEY, JSON.stringify(tracks)); } catch {}
  }
}

export function removeCustomTrack(id: string) {
  const tracks = getCustomTracks().filter((t) => t.id !== id);
  try { localStorage.setItem(BGM_CUSTOM_TRACKS_KEY, JSON.stringify(tracks)); } catch {}
}

export function getAllTracks(): AudioTrack[] {
  return [...AUDIO_TRACKS, ...getCustomTracks()];
}
