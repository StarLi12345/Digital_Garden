// ============================================================
// Digital Garden — CDN Asset Resolution
// ============================================================
// Cloud Migration Phase 2: 静态资源 CDN 分发
//
// 当 NEXT_PUBLIC_CDN_URL 配置时，大文件走 CDN；
// 未配置时回退到本地 /public/ 目录（开发/预览兼容）。
//
// 设计原则:
//   1. 所有 asset URL 通过此模块解析，不直接硬编码路径
//   2. CDN 不可用时自动降级为本地路径
//   3. 零侵入：现有代码加一层 resolveAssetUrl() 即可
// ============================================================

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "";

/**
 * 解析静态资源 URL。
 *
 * 规则：
 *   - 如果配置了 NEXT_PUBLIC_CDN_URL，将 localPath 拼接到 CDN 前缀
 *   - 否则直接返回 localPath（指向 /public/ 目录）
 *
 * @param localPath 本地路径，以 / 开头，如 "/audio/01-tea-time.mp3"
 * @returns 完整资源 URL
 *
 * @example
 *   // CDN 未配置 (本地开发)
 *   resolveAssetUrl("/audio/01-tea-time.mp3") → "/audio/01-tea-time.mp3"
 *
 *   // CDN 已配置
 *   resolveAssetUrl("/audio/01-tea-time.mp3") → "https://cdn.example.com/audio/01-tea-time.mp3"
 */
export function resolveAssetUrl(localPath: string): string {
  if (!localPath.startsWith("/")) {
    console.warn(`[cdn] resolveAssetUrl: path should start with "/", got "${localPath}"`);
    return localPath;
  }
  if (CDN_URL) {
    const base = CDN_URL.replace(/\/+$/, ""); // strip trailing slash
    return `${base}${localPath}`;
  }
  return localPath;
}

/** 检查 CDN 是否已配置 */
export function isCdnEnabled(): boolean {
  return Boolean(CDN_URL);
}

/**
 * 需要走 CDN 的资源目录列表。
 * 这些目录下的文件体积较大（>10MB 合计），不适合直接打进部署包。
 */
export const CDN_ASSET_DIRECTORIES = [
  "/audio/",
  "/backgrounds/",
  "/themes/",
  "/carousel/",
  "/music-player/",
  "/resources/",
] as const;

/** 判断给定路径是否属于大资源目录 */
export function shouldUseCdn(path: string): boolean {
  return CDN_ASSET_DIRECTORIES.some((dir) => path.startsWith(dir));
}
