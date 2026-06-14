# Editing Experience Review 01

> 编辑体验审查
>
> 背景：用户 80% 的停留时间在 /plant 和编辑模式中。
> 编辑体验不是辅助功能——它是 Digital Garden 的核心交互界面。

---

## 一、当前 TipTap 能力盘点

### 已支持（通过工具栏 + StarterKit）

| 能力 | 工具栏按钮 | 备注 |
|------|:--:|------|
| Heading 2 | H2 | level 限制 [2,3] |
| Heading 3 | H3 | |
| Bold | B | |
| Italic | I | |
| Bullet List | • | |
| Ordered List | 1. | |
| Code Block | </> | |
| Blockquote | ❝ | |
| Undo / Redo | ↩ ↪ | |

### StarterKit 自带但未暴露到工具栏

| 能力 | 触发方式 | 为什么没暴露 |
|------|---------|------------|
| Strike（删除线） | 无按钮 | 设计评审时标记为"不需要" |
| Inline Code（行内代码） | 无按钮 | 同上 |
| Horizontal Rule（分割线） | 无按钮 | 设计评审时标记为"不需要" |
| Hard Break（软换行） | Shift+Enter | 不需要按钮 |

### 完全缺失

| 类别 | 缺失项 |
|------|--------|
| **内容块** | Callout（提示框）、Toggle（折叠块）、Task List（待办）、Divider（分割线按钮） |
| **媒体** | Image（图片）、Video、Audio、File |
| **导航** | Slash Menu（/ 命令）、Floating Toolbar（选中文本弹出） |
| **连接** | Link（超链接） |
| **高级** | Table（表格）、Columns（多列）、Emoji、Mention、Math |
| **编辑** | Drag-and-drop block reorder、Markdown 快捷输入 |

---

## 二、与 Notion / 飞书对比

| 能力 | 当前 DG | Notion | 飞书 | DG 缺失重要性 |
|------|:--:|:--:|:--:|:--:|
| 标题 H2/H3 | ✅ | ✅ | ✅ | — |
| Bold/Italic | ✅ | ✅ | ✅ | — |
| Bullet/Ordered List | ✅ | ✅ | ✅ | — |
| Blockquote | ✅ | ✅ | ✅ | — |
| Code Block | ✅ | ✅ | ✅ | — |
| **Callout（提示框）** | ❌ | ✅ | ✅ | **P0** |
| **Slash Menu（/ 命令）** | ❌ | ✅ | ✅ | **P0** |
| **Link（超链接）** | ❌ | ✅ | ✅ | **P0** |
| Image（图片） | ❌ | ✅ | ✅ | P1 |
| Task List（待办） | ❌ | ✅ | ✅ | P1 |
| Divider（分割线按钮） | ❌ | ✅ | ✅ | P1 |
| Inline Code | ❌ | ✅ | ✅ | P2 |
| Strike（删除线） | ❌ | ✅ | ✅ | P2 |
| Table（表格） | ❌ | ✅ | ✅ | P2 |
| Toggle（折叠） | ❌ | ✅ | ❌ | P2 |
| Columns（多列） | ❌ | ✅ | ❌ | 不做 |
| Emoji Picker | ❌ | ✅ | ✅ | 不做 |
| Mention（@ 人） | ❌ | ✅ | ✅ | 不做 |
| Math / LaTeX | ❌ | ❌ | ✅ | 不做 |

---

## 三、与 Digital Garden 的契合度评估

不是所有 Notion 功能都适合花园。

### 高度契合（应该做）

| 能力 | 为什么适合 Digital Garden |
|------|--------------------------|
| **Callout** | 花园里的"便签"。用户写回忆时想高亮一句话——"那天雨很大，但我记得很清楚"。Callout 是内容的情感容器，不只是排版工具 |
| **Link** | 用户记录学习时想引用外部文章。记录回忆时想关联一个地点链接。链接是内容之间的桥梁——花园的连接从链接开始 |
| **Slash Menu** | 当前工具栏是固定按钮组。用户输入 `/` 应该能插入 Callout、引用、分割线。Slash Menu 是"不离开键盘"的编辑体验——对长期写作者至关重要 |

### 中等契合（可以做，但不急）

| 能力 | 为什么 |
|------|--------|
| **Image** | 回忆类记录天然需要图片。但图片系统（上传、存储、渲染）的工程成本远高于纯文本功能。属于 Phase 3 |
| **Task List** | 想法/学习类记录可能需要待办。但花园不是任务管理工具。如果做，应该轻量——不要提醒、不要截止日期、不要进度 |
| **Divider** | 分割线是 StarterKit 自带能力，只是没暴露按钮。暴露它是 3 行代码的事 |

### 低契合（可能永远不做）

| 能力 | 为什么不适合 |
|------|------------|
| **Table** | 表格是数据处理工具。花园里没有"数据"，只有"记录"。表格会让花园变成飞书 |
| **Columns** | 多列布局是排版工具。花园是线性叙事的（一段回忆、一个想法），不需要杂志排版 |
| **Emoji Picker** | 用户可以用系统自带 emoji 输入法。内置 picker 增加依赖和复杂度，不带来新体验 |
| **Mention** | @ 人是协作工具。Digital Garden 没有协作，没有其他用户 |
| **Math** | 不解释 |
| **Toggle** | 折叠块适合"FAQ"或"长篇文档"。花园的内容是线性的个人叙述，折叠会让内容"藏起来"——这与"遇见过去的自己"矛盾 |

---

## 四、Editing Sprint Roadmap

按 **体验收益 ÷ 开发成本** 排序：

| # | 功能 | 体验收益 | 开发成本 | 收益/成本 |
|:--:|------|:--:|:--:|:--:|
| **E1** | **Slash Menu** | ⭐⭐⭐⭐⭐ | ⭐⭐ 中 | 最高 |
| **E2** | **Callout Block** | ⭐⭐⭐⭐⭐ | ⭐ 极低 | 极高 |
| **E3** | **Link（超链接）** | ⭐⭐⭐⭐ | ⭐⭐ 中 | 高 |
| E4 | Divider 按钮 | ⭐⭐ | ⭐ 极低 | 中 |
| E5 | Task List | ⭐⭐⭐ | ⭐⭐ 中 | 中 |
| E6 | Inline Code + Strike | ⭐⭐ | ⭐ 极低 | 中 |
| E7 | Image | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ 高 | 低 |

### 为什么这样排序

**E1 Slash Menu 排第一**：

不是因为它最炫。而是因为它改变了编辑体验的根本模式——从"抬头找工具栏按钮"变成"输入 `/` 直接选择"。

当前 10 个工具栏按钮已经是视觉噪音。未来加 Callout、Link、Divider、Task List——工具栏会越来越长。Slash Menu 将所有块级操作收进一个 `/` 面板，释放工具栏空间，同时让编辑不离开键盘。

TipTap 官方推荐 `@tiptap/extension-suggestion` 或社区包实现 Slash Menu，但也可以自实现（20-30 行 + 一个 popover 组件）。不引入新依赖。

**E2 Callout 排第二**：

Callout 是"花园便签"。实现成本极低——TipTap 社区有一个轻量的 callout extension，或者可以用 blockquote + 自定义 CSS 模拟。Callout 让用户能在记录中"高亮一句话"——这在情绪和回忆类记录中有独特的情感价值。

**E3 Link 排第三**：

链接是内容之间的桥梁。用户在记录学习时引用外部资料、在记录回忆时关联地点链接。TipTap 的 `@tiptap/extension-link` 是官方扩展，安装即用。

---

## 五、MVP 结论：如果只能做 3 个

| # | 做什么 | 理由 |
|---|--------|------|
| **1. Slash Menu** | 改变编辑交互模式。不离开键盘、不抬头找按钮。让后续所有块级能力（Callout/Link/Divider）有一个统一的入口，而不是堆在工具栏上 |
| **2. Callout** | 最高的体验/成本比。3 行 CSS + 1 个 TipTap node。让花园的内容有了"语气"——不只是黑字白底，而是有一块被轻轻标记的区域 |
| **3. Link** | 让内容开始连接。这不是 Wikilink 的"花园内部连接"——那是 Phase 7。这是基础的"引用外部世界"的能力。它是连接的第一块砖 |

### 为什么不是 Image

Image 对回忆类记录很重要。但它的工程成本（上传组件、存储、Asset 表读写、图片渲染）远远高于 Callout+Slash+Link 三者之和。先做轻的、立刻让用户体验到变化的；重的留给 Phase 3。

---

> **一句话**：3 个功能，让花园的编辑体验从"够用"变成"愿意久坐"。

---

*输出时间：2026-05-31*
*下一阶段依据：本文档作为 Editing Sprint 的功能排序参考*
