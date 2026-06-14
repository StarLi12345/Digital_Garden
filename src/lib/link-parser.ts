// ============================================================
// Digital Garden 3.0 — TipTap JSON Link Parser
// ============================================================
// Structurally walks TipTap JSON trees to extract:
//   - Wiki links (internal /entry/ links)
//   - Headings (for anchor generation & TOC)
//   - Unlinked mentions (entry titles appearing as plain text)
//
// Replaces the fragile regex-on-JSON-string approach with
// proper document tree traversal.
// ============================================================

// ── Types ─────────────────────────────────────────────

export interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TipTapNode {
  type: string;
  content?: TipTapNode[];
  text?: string;
  marks?: TipTapMark[];
  attrs?: Record<string, unknown>;
}

export interface LinkInfo {
  /** Target entry slug */
  slug: string;
  /** Display text of the link */
  text: string;
  /** Surrounding context (up to 60 chars) */
  context: string;
  /** 0-based index of the block containing this link */
  blockIndex: number;
  /** Target heading anchor, if any (e.g. "/entry/slug#heading") */
  anchor: string | null;
}

export interface HeadingInfo {
  text: string;
  level: number;
  blockIndex: number;
  /** Slugified ID for anchor linking */
  id: string;
}

export interface LinkStats {
  backlinks: number;
  outlinks: number;
}

// ── Constants ─────────────────────────────────────────

/** Regex matching internal wiki links: /entry/<slug> or /entry/<slug>#<anchor> */
const ENTRY_LINK_RE = /^\/entry\/([a-zA-Z0-9-]+)(?:#(.+))?$/;

/** All entry type labels the user might type in text */
const ENTRY_TYPE_LABELS = [
  "Memory", "Thought", "Emotion", "Dream", "Story", "Learning",
];

// ── Public API ────────────────────────────────────────

/**
 * Extract all outgoing wiki links from a TipTap JSON document.
 * Walks the tree structurally, finding `mark.type === 'link'` nodes
 * whose href starts with "/entry/".
 *
 * @param json - TipTap JSON object (editor.getJSON() output)
 * @returns Array of LinkInfo, one per link found
 */
export function parseOutlinks(json: TipTapNode): LinkInfo[] {
  if (!json || typeof json !== "object") return [];
  const results: LinkInfo[] = [];
  let blockIndex = 0;
  walkForLinks(json, results, { blockIndex: () => blockIndex++ }, "");
  return results;
}

/**
 * Extract all headings from a TipTap JSON document.
 * Generalizes the logic duplicated in plant/page.tsx.
 *
 * @param json - TipTap JSON object
 * @returns Array of HeadingInfo with text, level, blockIndex, and slugified id
 */
export function extractHeadings(json: TipTapNode): HeadingInfo[] {
  if (!json) return [];
  const results: HeadingInfo[] = [];
  let blockIndex = 0;
  walkForHeadings(json, results, { blockIndex: () => blockIndex++ });
  return results;
}

/**
 * Find entry titles that appear as plain text in the document
 * but are NOT already linked. Powers the "unlinked mentions" feature.
 *
 * @param json - TipTap JSON document
 * @param allTitles - Array of { slug, title } for all entries in the garden
 * @returns Array of slugs that are mentioned but not linked
 */
export function findUnlinkedMentions(
  json: TipTapNode,
  allTitles: { slug: string; title: string }[],
): { slug: string; title: string }[] {
  if (!json || !allTitles.length) return [];

  // Collect all text from the document
  const fullText = collectText(json);

  // Collect slugs that are already linked
  const linkedSlugs = new Set(
    parseOutlinks(json).map((l) => l.slug),
  );

  // Find titles that appear in text but whose slug isn't linked
  const unlinked: { slug: string; title: string }[] = [];
  for (const entry of allTitles) {
    if (linkedSlugs.has(entry.slug)) continue;
    // Case-insensitive title search in full text
    if (entry.title.length >= 2 && fullText.toLowerCase().includes(entry.title.toLowerCase())) {
      unlinked.push(entry);
    }
  }

  return unlinked;
}

/**
 * Get a flat text representation of all text nodes in the document.
 * Useful for content-based operations.
 */
export function collectText(json: TipTapNode): string {
  if (!json) return "";
  const parts: string[] = [];
  walkText(json, parts);
  return parts.join(" ");
}

/**
 * Get the set of unique slugs linked from this document.
 * More efficient than parseOutlinks() when only slugs are needed.
 */
export function getLinkedSlugs(json: TipTapNode): Set<string> {
  if (!json) return new Set();
  const slugs = new Set<string>();
  walkForSlugs(json, slugs);
  return slugs;
}

// ── Internal walkers ──────────────────────────────────

interface WalkContext {
  blockIndex: () => number;
}

function walkForLinks(
  node: TipTapNode,
  results: LinkInfo[],
  ctx: WalkContext,
  currentBlockText: string,
): void {
  // Block-level nodes: capture the text of this block for context
  if (isBlockNode(node.type)) {
    const blockText = collectText(node);
    const blockIdx = ctx.blockIndex();

    // Walk children to find link marks
    if (node.content) {
      for (const child of node.content) {
        walkLinkMarks(child, results, blockText.slice(0, 60), blockIdx);
      }
    }
    return;
  }

  // doc or other container: recurse into children
  if (node.content) {
    for (const child of node.content) {
      walkForLinks(child, results, ctx, currentBlockText);
    }
  }
}

function walkLinkMarks(
  node: TipTapNode,
  results: LinkInfo[],
  context: string,
  blockIdx: number,
): void {
  if (node.type === "text" && node.marks) {
    for (const mark of node.marks) {
      if (mark.type !== "link") continue;
      const href = (mark.attrs?.href as string) || "";
      const match = href.match(ENTRY_LINK_RE);
      if (match) {
        results.push({
          slug: match[1],
          text: node.text || "",
          context,
          blockIndex: blockIdx,
          anchor: match[2] || null,
        });
      }
    }
  }

  // Recurse into children (for nested inline content)
  if (node.content) {
    for (const child of node.content) {
      walkLinkMarks(child, results, context, blockIdx);
    }
  }
}

function walkForSlugs(node: TipTapNode, slugs: Set<string>): void {
  if (node.type === "text" && node.marks) {
    for (const mark of node.marks) {
      if (mark.type !== "link") continue;
      const href = (mark.attrs?.href as string) || "";
      const match = href.match(ENTRY_LINK_RE);
      if (match) slugs.add(match[1]);
    }
  }
  if (node.content) {
    for (const child of node.content) {
      walkForSlugs(child, slugs);
    }
  }
}

function walkForHeadings(
  node: TipTapNode,
  results: HeadingInfo[],
  ctx: WalkContext,
): void {
  if (node.type === "heading") {
    const text = collectText(node).slice(0, 80);
    const level = (node.attrs?.level as number) || 1;
    const id = slugifyHeading(text);
    results.push({
      text,
      level: Math.min(level, 5),
      blockIndex: ctx.blockIndex(),
      id,
    });
    return; // Don't recurse into heading content (already collected)
  }

  if (node.content) {
    for (const child of node.content) {
      walkForHeadings(child, results, ctx);
    }
  }
}

function walkText(node: TipTapNode, parts: string[]): void {
  if (node.type === "text" && node.text) {
    parts.push(node.text);
  }
  if (node.content) {
    for (const child of node.content) {
      walkText(child, parts);
    }
  }
}

// ── Utilities ─────────────────────────────────────────

/** Check if a node type is a block-level container */
function isBlockNode(type: string): boolean {
  return [
    "paragraph", "heading", "blockquote", "codeBlock",
    "bulletList", "orderedList", "taskList", "listItem",
    "callout", "mermaid", "mathBlock", "horizontalRule",
    "image", "video", "audio",
  ].includes(type);
}

/** Slugify heading text for use as an anchor ID */
function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w一-鿿\s-]/g, "") // remove special chars, keep CJK
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || `heading-${Date.now()}`;
}
