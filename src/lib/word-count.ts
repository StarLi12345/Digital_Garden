// ============================================================
// Digital Garden — Shared Word Counter
// ============================================================
// Used by /plant, /entry/[slug] (view + edit), /drafts
// ============================================================

/**
 * Clean markdown for word counting — strips non-text content.
 * Notion/飞书 approach: only count human-readable prose, excluding
 * images, code blocks, formulas, URLs, and raw data.
 */
export function cleanForWordCount(md: string): string {
  if (!md) return "";
  let text = md;

  // 1. Fenced code blocks (```...```) including mermaid
  text = text.replace(/```[\s\S]*?```/g, " ");
  // 2. Image markdown ![...](...)
  text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
  // 3. HTML <img> tags
  text = text.replace(/<img[^>]*\/?>/gi, " ");
  // 4. LaTeX math blocks $$...$$
  text = text.replace(/\$\$[\s\S]*?\$\$/g, " ");
  // 5. Inline LaTeX $...$
  text = text.replace(/(?<!\$)\$(?!\$)[^$\n]+\$(?!\$)/g, " ");
  // 6. Links [text](url) → keep text
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  // 7. Bare URLs
  text = text.replace(/https?:\/\/\S+/g, " ");
  // 8. HTML tags
  text = text.replace(/<[^>]*>/g, " ");
  // 9. Base64 data blobs
  text = text.replace(/data:[^;]*;base64,[A-Za-z0-9+/=]+/g, " ");
  // 10. Normalize whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

export function countWords(md: string): number {
  const cleaned = cleanForWordCount(md);
  const chineseChars = (cleaned.match(/[一-鿿㐀-䶿]/g) || []).length;
  const englishWords = (cleaned.replace(/[一-鿿㐀-䶿]/g, " ").match(/\b\w+\b/g) || []).length;
  return chineseChars + englishWords;
}

export const WORDS_PER_MINUTE = 200;

export function readingTimeMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}
