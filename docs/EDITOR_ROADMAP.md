# Editor Roadmap — Digital Garden

> 编辑体验路线图
>
> 核心问题：Digital Garden 应该增强什么样的表达能力？
> 核心边界：Digital Garden 不应该变成什么？

---

## Editing Vision

### 目标

让用户在花园里**愿意久坐**。

不是"功能最全的编辑器"。是"最不想离开的写作角落"。

### 原则

| # | 原则 | 含义 |
|---|------|------|
| 1 | **表达优先于效率** | Callout 比 Slash Menu 重要。因为 Callout 让内容更丰富，Slash Menu 只让操作更快 |
| 2 | **温暖优先于强大** | 花园便签（柔和背景 + 左边框）比 Notion 警告框（黄底 + 图标）更适合这里 |
| 3 | **能力先于入口** | 先有 Callout/Link/Divider 这些"能力本身"，再用 Slash Menu 做统一入口。能力不足时，入口是空的 |
| 4 | **线性叙事优先于结构化** | 花园内容是线性的——一段回忆、一个想法、一场梦。不需要表格、多列、折叠 |

### Digital Garden 不应该变成什么

```
❌ Notion — 不是数据库、不是项目管理、不是 wiki
❌ 飞书文档 — 不是协作工具、不是审批流、不是知识库
❌ Obsidian — 不是知识图谱、不是双向链接网络
❌ VS Code — 不是代码编辑器
❌ Figma — 不是设计工具
```

**Digital Garden 是：一个人记录、整理、遇见自己的私人空间。**

编辑器应该让这个行为更自然、更丰富、更温暖。

---

## 已实现能力

| 能力 | 类型 | 工具栏 |
|------|------|:--:|
| H2 / H3 标题 | 块级 | ✅ |
| Bold / Italic | 行内 | ✅ |
| Bullet List / Ordered List | 块级 | ✅ |
| Code Block | 块级 | ✅ |
| Blockquote | 块级 | ✅ |
| Undo / Redo | 编辑 | ✅ |
| Strike（删除线） | 行内 | ❌ 隐藏 |
| Inline Code | 行内 | ❌ 隐藏 |
| Horizontal Rule | 块级 | ❌ 隐藏 |

---

## 计划能力（Editing Sprint）

按"长期写作舒适度"重新排序：

---

# Editing Sprint Replan Review

> 重新评估：不是尽快做出 Notion，而是优先提升长期写作舒适度。

---

## 一、用户真实停留时间分析

### 用户在编辑器中的主要行为

观察一个典型的 Digital Garden 写作会话：

```
1. 打开 /plant
2. 写标题（5 秒）
3. 选类型（1 秒）
4. 写正文（10-30 分钟）        ← 80% 的时间在这里
5. 添加标签（10 秒）
6. 保存（1 秒）
```

用户 80% 的编辑时间在做一件事：**输入和调整文本。**

不是插入复杂块。不是频繁切换格式。是**连续书写**——像写日记一样，文字从脑子里流到屏幕上。

### 这意味着什么

- 用户不需要"快速插入 20 种块"——他一次写作会话可能只会用到 2-3 种块
- 用户需要的是"让这段文字更有表达力"——一段回忆中高亮某个瞬间，一个想法中引用一篇文章
- Slash Menu 的价值在**块类型很多**时体现（如 Notion 的 50+ 种块）。当前花园只有 5 种块，Slash Menu 是空的
- **先丰富块能力，再提供快速入口**

### 结论

当前项目**还没有进入需要 Slash Menu 的阶段。**

用户不会因为"没有 / 命令"而觉得编辑器不好用。用户会因为"想高亮一段话但没有 Callout"而觉得表达受限。

---

## 二、编辑能力与 Digital Garden 契合度逐个评估

### E2 Callout — 花园便签

**它解决什么问题**：用户在写回忆/情绪时，想对某一段话做视觉标记——"这是重要的""这一段我特别想记住"。当前的 blockquote 是"引用别人说的话"，不是"标记自己的话"。

**它是否增强表达能力**：✅ 是。Callout 创造了一种新的内容语气——"被轻轻标记的区域"。它不是排版，是情感容器。

**它是否增强办公能力**：❌ 不是。Notion 的 Callout 是"提示/警告/信息"——办公用途。花园的 Callout 是"便签/标记/珍藏"——个人用途。

**它是否符合 Digital Garden 产品人格**：✅ 完全符合。如果设计正确（柔和背景、左侧 accent 线、无 icon、无颜色标签），它就是"花园里的一张便签"。

**实现成本**：极低。可以在现有 Blockquote 基础上通过 CSS 扩展实现，不需要新增 TipTap Extension。

---

### E3 Link — 超链接

**它解决什么问题**：用户记录学习时引用外部资料。记录回忆时关联地点链接。记录想法时引用启发自己的文章。

**它是否增强表达能力**：✅ 是。链接让内容可以"伸出手"——指向外部世界的一个点。它是花园和外界的桥梁。

**它是否增强办公能力**：⚠️ 中性。链接既可以用于"参考文献"（办公），也可以用于"这是我提到的那首歌"（个人）。取决于使用场景。

**它是否符合 Digital Garden 产品人格**：✅ 适合。回忆里引用一首歌的链接、想法中附上一篇启发文章——这是个人记录的自然行为。

**实现成本**：中等。TipTap 官方 `@tiptap/extension-link` 安装即用。需要处理：点击打开 vs 编辑模式、hover 预览、链接安全性。

---

### E4 Divider — 分割线

**它解决什么问题**：同一天内不同主题之间的视觉分隔。用户在一条记录中写了两件不相关的事——用分割线隔开。

**它是否增强表达能力**：⚠️ 轻微。分割线不增加表达能力，只增加"信息组织能力"。但它是所有写作工具的基本能力——连纯文本 Markdown 都有 `---`。

**它是否增强办公能力**：❌ 不是。

**它是否符合 Digital Garden 产品人格**：✅ 中性。不影响花园感，也不会增强花园感。是基础设施。

**实现成本**：极低。StarterKit 自带 `HorizontalRule` 扩展。只需在工具栏加一个按钮（2 行代码）。

---

### E6 Inline Code + Strike

**它解决什么问题**：Inline Code 用于标记"这个词是术语"。Strike 用于标记"这个想法已被否定但我想保留它"。

**它是否增强表达能力**：✅ 轻微。Strike 有独特的情感价值——"我原来这么想，现在不了"。这是个人写作中常见的表达。Inline Code 在非技术写作中几乎用不到。

**它是否增强办公能力**：⚠️ Inline Code 偏向技术文档。Strike 是通用的。

**它是否符合 Digital Garden 产品人格**：Strike ✅ Inline Code ❌。Strike（删除线）在个人写作中有情感意义——保留被修正的想法。Inline Code 几乎只用于技术文档。

**实现成本**：极低。均为 StarterKit 自带。只需在工具栏加按钮。

---

### E1 Slash Menu — / 命令面板

**它解决什么问题**：当编辑器有足够多的块类型时，用户无需记住每个块的快捷键或工具栏按钮——输入 `/` 即可搜索和选择。

**它是否增强表达能力**：❌ 不直接增强。Slash Menu 是"能力的入口"，不是"能力本身"。如果只有 5 种块，Slash Menu 的价值微不足道。

**它是否增强办公能力**：⚠️ 中性。这是效率工具，不改变内容的性质。

**它是否符合 Digital Garden 产品人格**：⚠️ 可能负面。Slash Menu 是"命令行"隐喻——打字、搜索、选择。它让交互更高效，但也更"机械"。花园是温暖缓慢的——`/` 命令的气质需要谨慎设计。

**实现成本**：中高。需要一个 popover/dropdown 组件、键盘导航、搜索过滤、与 TipTap 的集成。如果自实现，约 100 行代码。

---

### E5 Task List — 待办列表

**它解决什么问题**：用户记录想法时可能包含行动项。

**它是否增强表达能力**：❌ 不是表达。是任务管理。

**它是否增强办公能力**：✅ 是。这是典型的办公/生产力功能。

**它是否符合 Digital Garden 产品人格**：❌ 不符合。花园不是任务管理工具。待办列表会让花园向"效率工具"倾斜。

**实现成本**：中等。TipTap 有 `@tiptap/extension-task-list` + `@tiptap/extension-task-item`。

---

## 三、重新计算优先级

按 **用户体验收益 ÷ 实现成本**，结合"长期写作舒适度"：

| 新排序 | 功能 | 为什么提前/延后 |
|:--:|------|----------------|
| **E1** | **Callout（花园便签）** | 最高的表达收益/成本比。不需要新依赖。它是"能力"，不是"入口" |
| **E2** | **Link（超链接）** | 让内容能伸出手。写作中引用外部资源的自然需求 |
| **E3** | **Divider + Strike** | 两个都是 StarterKit 自带、极低成本。一起做——一个写代码的会话搞定两个 |
| E4 | Slash Menu | 当前 5 种块不需要 / 命令。**等到 Callout/Link/Divider 就位后再做**——那时 Slash Menu 下面有东西了 |
| E5 | Inline Code | 花园用户几乎不需要 |
| — | Task List | **移出 Editing Sprint**。办公功能，不符合花园人格 |

---

## 四、Callout 专项设计评审

### 设计方向：🌱 花园便签（Garden Note）

不是 Notion 的"警告框"。不是飞书的"提示条"。

**是花园里一张被轻轻标记的便签。**

### 视觉设计

```
┌──┬─────────────────────────────────────┐
│🌱│ 那天雨很大。                          │
│  │ 但我记得很清楚——                      │
│  │ 那是第一次在东京的便利店躲雨。         │
│  │ 雨停后天特别蓝。                      │
└──┴─────────────────────────────────────┘
```

**设计规格**：

```
背景：bg-accent/8（极淡的陶土色，温暖但不抢眼）
左边框：border-l-2 border-accent（陶土色细线）
内边距：pl-4 pr-4 py-3（留足呼吸空间）
圆角：rounded-md
字体：不变（继承正文样式）
前缀图标：🌱（可选，默认不显示——只有一种风格）
```

### Light Mode

```
背景：#fdf5f0（淡淡的暖色）
边框：#d4956a（陶土色）
文字：继承 --color-foreground
```

### Dark Mode

```
背景：#2a221d（温暖的深色）
边框：#e0a87c（亮陶土色）
文字：继承 --color-foreground
```

### 风格决策

| 决策 | Notion Callout | 花园便签 |
|------|:--:|:--:|
| 背景色 | 按类型（蓝/黄/红/绿） | 统一暖色——不需要"信息/警告/成功"分类 |
| 图标 | emoji + 文字 | 无图标（或仅左边框作为视觉标记） |
| 类型切换 | 支持 | 不支持——只有一种温柔的颜色 |
| 命名 | "Callout" | "花园便签"或直接不命名——用户看到左边框就知道它是标记区域 |

### 技术方案

**推荐：基于 Blockquote 扩展 CSS，不新增 TipTap Extension。**

理由：
1. Callout 和 Blockquote 的 DOM 结构相同（`<blockquote>` + 内容）
2. 区别仅在 CSS 样式
3. 不需要安装新依赖
4. 不影响现有 Blockquote 功能

**实现方式 A（推荐）：CSS Only**

```css
/* 现有 blockquote 样式 — 引用 */
.prose blockquote {
  border-left: 2px solid var(--color-border);
  color: var(--color-muted-foreground);
  font-style: italic;
}

/* 新增 callout 样式 — 花园便签 */
.prose .callout {
  border-left: 2px solid var(--color-accent);
  background: /* light: #fdf5f0, dark: #2a221d */;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-style: normal;
  color: var(--color-foreground);
}
```

在 TipTap 中，Blockquote 和 Callout 用同一个节点，通过 `attrs.class` 区分：

```typescript
// Callout 插入
editor.chain().focus().setBlockquote().run();
// 给当前 blockquote 添加 .callout class
editor.chain().focus().updateAttributes('blockquote', { class: 'callout' }).run();
```

**实现方式 B（备选）：自定义 Extension**

如果未来 Callout 需要独立于 Blockquote 的复杂行为（如自定义编辑、子节点限制），可以基于 `@tiptap/core` 的 `Node.create` 创建独立节点。

**MVP 建议**：方式 A。10 行 CSS + 5 行 toolbar 逻辑。

### 工具栏设计

当前工具栏按钮 `❝`（Blockquote）保持不变——点击插入普通引用。

新增按钮 `🌱`（Callout）——点击插入花园便签。

视觉上相邻但独立。用户不需要理解"Callout 是 Blockquote 的子类"——两个按钮，两个功能。

### Design Token 兼容性

| Token | 用途 | 当前存在？ |
|-------|------|:--:|
| `--color-accent` | 左边框颜色 | ✅ `#d4956a` / `#e0a87c` |
| callout 背景 | 极淡暖色 | ⚠️ 需新增 `--color-callout` |

建议新增一个 Design Token：

```css
:root {
  --color-callout: #fdf5f0;  /* light — 极淡陶土色 */
}
.dark {
  --color-callout: #2a221d;  /* dark — 温暖深色 */
}
```

---

## 五、总结

### 新 Editing Sprint 排序

```
E1: Callout（花园便签）         ← 最高的表达收益/成本比
E2: Link（超链接）              ← 让内容能伸出手
E3: Divider + Strike            ← 极低成本，一次会话搞定两个
E4: Slash Menu                   ← 等上面三个就位后再做
—
Task List、Inline Code           ← 移出 Editing Sprint
```

### 为什么 Slash Menu 排到 E4

不是不重要。是**时机不对**。Slash Menu 是能力的入口。如果入口下面只有 5-6 种块，它的价值微乎其微。先让花园有 Callout、Link、Divider——这些是"表达的内容"。然后 Slash Menu 作为"更快地使用它们的方式"自然有意义。

**先种花，再修路。**

---

> **Editing Vision 一句话**：让花园的编辑器成为用户最不想离开的写作角落——不是功能最多，而是最温暖。

---

*输出时间：2026-05-31*
