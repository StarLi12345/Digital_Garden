// ============================================================
// Digital Garden 3.0 — WikiLink TipTap Extension
// ============================================================
// Extends the standard Link extension to visually distinguish
// internal wiki links (/entry/...) from external links.
//
// Strategy: We wrap the existing Link extension with HTML
// attributes that add a CSS class + data attribute when the
// href points to an internal entry. This is more pragmatic
// than a full custom Mark since wiki links use standard <a> tags.
// ============================================================

import LinkExtension from "@tiptap/extension-link";

/**
 * Enhanced Link extension that adds `.wiki-link` CSS class
 * and `data-wiki-link` attribute to internal /entry/ links.
 *
 * Use this in place of the standard Link extension in the editor.
 */
export const WikiLinkAwareLink = LinkExtension.extend({
  renderHTML({ HTMLAttributes }) {
    const href = (HTMLAttributes.href as string) || "";

    if (href.startsWith("/entry/")) {
      return [
        "a",
        {
          ...HTMLAttributes,
          class: `wiki-link ${(HTMLAttributes.class as string) || ""}`.trim(),
          "data-wiki-link": "true",
        },
        0,
      ];
    }

    // External link: standard rendering
    return ["a", HTMLAttributes, 0];
  },
});
