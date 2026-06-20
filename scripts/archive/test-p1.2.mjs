// P1.2 Verification Script
// Tests: jsonToMarkdown conversion accuracy
// Run: node scripts/test-p1.2.mjs

// Inline the markdown converter for standalone testing
function jsonToMarkdown(json) {
  if (!json || typeof json !== "object") return "";

  function renderNode(node) {
    switch (node.type) {
      case "doc": return renderChildren(node);
      case "paragraph": return renderInline(node) + "\n\n";
      case "heading": {
        const level = node.attrs?.level || 2;
        return "#".repeat(level) + " " + renderInline(node) + "\n\n";
      }
      case "bulletList": {
        if (!node.content) return "";
        return node.content.map((item, i) => {
          const text = renderInline(item);
          return "- " + text + "\n";
        }).join("") + "\n";
      }
      case "orderedList": {
        if (!node.content) return "";
        return node.content.map((item, i) => {
          const text = renderInline(item);
          return (i + 1) + ". " + text + "\n";
        }).join("") + "\n";
      }
      case "listItem": return renderInline(node);
      case "blockquote": {
        const text = renderInline(node);
        return text.split("\n").filter(l => l.trim()).map(l => "> " + l).join("\n") + "\n\n";
      }
      case "codeBlock": {
        const text = node.content ? node.content.map(c => c.text || "").join("") : "";
        const lang = node.attrs?.language || "";
        return "```" + lang + "\n" + text + "\n```\n\n";
      }
      case "horizontalRule": return "---\n\n";
      case "hardBreak": return "\n";
      case "text": return renderText(node);
      default: return node.content ? renderChildren(node) : "";
    }
  }

  function renderChildren(node) {
    if (!node.content) return "";
    return node.content.map(c => renderNode(c)).join("");
  }

  function renderInline(node) {
    if (!node.content) return "";
    return node.content.map(c => {
      if (c.type === "text") return renderText(c);
      if (c.type === "hardBreak") return "\n";
      return c.content ? renderChildren(c) : "";
    }).join("");
  }

  function renderText(node) {
    let text = node.text || "";
    if (!node.marks || node.marks.length === 0) return text;
    for (const mark of node.marks) {
      switch (mark.type) {
        case "bold": text = "**" + text + "**"; break;
        case "italic": text = "*" + text + "*"; break;
        case "strike": text = "~~" + text + "~~"; break;
        case "code": text = "`" + text + "`"; break;
      }
    }
    return text;
  }

  return renderNode(json).trim();
}

// ── Test cases ─────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, input, expected) {
  const result = jsonToMarkdown(input);
  if (result === expected) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}`);
    console.log(`     expected: ${JSON.stringify(expected)}`);
    console.log(`     got:      ${JSON.stringify(result)}`);
    failed++;
  }
}

console.log("=== P1.2 Markdown Converter Verification ===\n");

// 1. Empty doc
test("Empty doc", { type: "doc", content: [] }, "");

// 2. Simple paragraph
test("Simple paragraph", {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Hello World" }] }],
}, "Hello World");

// 3. Bold
test("Bold", {
  type: "doc",
  content: [{
    type: "paragraph",
    content: [{ type: "text", text: "Hello", marks: [{ type: "bold" }] }],
  }],
}, "**Hello**");

// 4. Italic
test("Italic", {
  type: "doc",
  content: [{
    type: "paragraph",
    content: [{ type: "text", text: "World", marks: [{ type: "italic" }] }],
  }],
}, "*World*");

// 5. Bold + Italic
test("Bold + Italic", {
  type: "doc",
  content: [{
    type: "paragraph",
    content: [{ type: "text", text: "Both", marks: [{ type: "bold" }, { type: "italic" }] }],
  }],
}, "***Both***");

// 6. H2
test("Heading 2", {
  type: "doc",
  content: [{
    type: "heading",
    attrs: { level: 2 },
    content: [{ type: "text", text: "Title" }],
  }],
}, "## Title");

// 7. H3
test("Heading 3", {
  type: "doc",
  content: [{
    type: "heading",
    attrs: { level: 3 },
    content: [{ type: "text", text: "Subtitle" }],
  }],
}, "### Subtitle");

// 8. Bullet list
test("Bullet list", {
  type: "doc",
  content: [{
    type: "bulletList",
    content: [
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Item 1" }] }] },
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Item 2" }] }] },
    ],
  }],
}, "- Item 1\n- Item 2");

// 9. Ordered list
test("Ordered list", {
  type: "doc",
  content: [{
    type: "orderedList",
    content: [
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "First" }] }] },
      { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Second" }] }] },
    ],
  }],
}, "1. First\n2. Second");

// 10. Blockquote
test("Blockquote", {
  type: "doc",
  content: [{
    type: "blockquote",
    content: [{ type: "paragraph", content: [{ type: "text", text: "Quoted text" }] }],
  }],
}, "> Quoted text");

// 11. Code block
test("Code block", {
  type: "doc",
  content: [{
    type: "codeBlock",
    attrs: { language: "typescript" },
    content: [{ type: "text", text: "const x = 1;" }],
  }],
}, "```typescript\nconst x = 1;\n```");

// 12. Mixed content
test("Mixed content", {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "我的日记" }],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "今天天气很好。" },
      ],
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "心情不错" },
        { type: "text", text: "。" },
      ],
    },
  ],
}, "## 我的日记\n\n今天天气很好。\n\n心情不错。");

// 13. Unknown node → degrade
test("Unknown node → degrade", {
  type: "doc",
  content: [{
    type: "fancyWidget",
    content: [{ type: "text", text: "degraded text" }],
  }],
}, "degraded text");

console.log(`\n=== ${passed} passed, ${failed} failed ===`);

if (failed > 0) process.exit(1);
console.log("All tests passed ✅");
