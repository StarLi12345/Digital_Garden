# PHASE1_PLAN.md

> Phase 1 — 核心记录体验 开发计划
>
> 版本：v1.0
> 制定日期：2026-05-31
> 依据文档：MVP_v0.1.md §六 Phase 1

---

## 第一部分：Phase 1 功能边界

### Phase 1 目标

**能创建、编辑、保存、查看内容。**

一句话：用户打开 /plant，写完一条记录，保存，在详情页看到它，再编辑它。

### 子任务拆分

---

#### P1.1 — Prisma Client + Server Actions + 自动生成

**功能名称**：数据层基础设施

**功能目的**：
- 创建 Prisma Client 单例
- 实现 5 个核心 Server Action（createEntry / updateEntry / deleteEntry / getEntry / listEntries）
- 实现保存时的自动生成逻辑（slug / excerpt / contentMd）

**用户价值**：
用户不可见。但所有后续子任务都依赖此层。

**为什么属于 Phase 1**：
是整个记录体验的数据基础。没有它，编辑器无法保存，详情页无法加载。

**涉及范围**：
- `src/lib/prisma.ts` — Prisma Client 单例
- `src/lib/markdown.ts` — TipTap JSON → Markdown 转换
- `src/lib/slug.ts` — 标题 → slug 生成
- `src/actions/entry.ts` — 5 个 Server Actions
- Entry 表读写

**拆分理由**：P1.1 包含了 P1.7（自动生成），因为 slug / excerpt / contentMd 的生成逻辑是 createEntry 和 updateEntry 的内置步骤，不适合作为独立任务。分离会导致"创建了 Entry 但 slug 为空"的中间状态。

---

#### P1.2 — TipTap 编辑器组件

**功能名称**：富文本编辑器

**功能目的**：
- 安装 @tiptap/react + 基础扩展
- 创建 Editor 组件，含基础格式化工具栏
- 工具栏：Bold / Italic / H2 / H3 / BulletList / OrderedList / Blockquote / HorizontalRule

**用户价值**：
用户可以在编辑器中输入文字、设置格式、看到排版效果。

**为什么属于 Phase 1**：
没有编辑器就无法"写东西"。这是记录体验的核心载体。

**涉及范围**：
- `package.json` — 新增 tiptap 依赖
- `src/components/editor/` — TipTap 编辑器组件

**独立验收**：可以在一个空白页挂载编辑器，输入文字，使用工具栏格式化。

---

#### P1.3 — 表单组件（标题 / 类型 / 标签）

**功能名称**：Entry 元数据输入组件

**功能目的**：
- TitleInput：标题输入框
- TypeSelector：6 种类型选择器（pill 切换）
- TagInput：标签自由输入（逗号/回车分隔，自动补全已有标签）

**用户价值**：
用户可以在编辑器之外，输入标题、选择类型、添加标签——这三者定义了"这是一条什么样的记录"。

**为什么属于 Phase 1**：
标题和类型是 Entry 的必填字段。标签是组织内容的核心手段。

**涉及范围**：
- `src/components/entry/title-input.tsx`
- `src/components/entry/type-selector.tsx`
- `src/components/entry/tag-input.tsx`

**独立验收**：每个组件可单独在 Storybook 或测试页面中验证交互。

---

#### P1.4 — /plant 新建页面

**功能名称**：创建新 Entry 的完整页面

**功能目的**：
- 组装 P1.2（编辑器）+ P1.3（表单组件）
- 管理表单状态（标题 / 类型 / 标签 / 正文）
- 调用 createEntry Server Action
- 保存成功后跳转到 /entry/[slug]

**用户价值**：
用户第一次真正"写一条记录并保存"。这是 MVP 最核心的用户流程。

**为什么属于 Phase 1**：
这是记录体验的入口。是"打开就能写"的实现。

**涉及范围**：
- `src/app/plant/page.tsx` — 替换占位为真实页面

**依赖**：P1.1 + P1.2 + P1.3

---

#### P1.5 — /entry/[slug] 详情页

**功能名称**：阅读已保存的 Entry

**功能目的**：
- Server Component 通过 slug 查询 Entry
- 渲染标题、类型、标签、时间、正文（TipTap JSON → HTML）
- "编辑"按钮跳转到 /entry/[slug]/edit
- "返回花园"链接
- 404 处理：slug 不存在时显示 "未找到"

**用户价值**：
用户写完后可以看到排版好的内容。这是"记录-保存-回顾"闭环中的"回顾"。

**为什么属于 Phase 1**：
保存后必须有地方看到。详情页是记录体验的终点。

**涉及范围**：
- `src/app/entry/[slug]/page.tsx` — 替换占位为真实页面

**依赖**：P1.1

---

#### P1.6 — /entry/[slug]/edit 编辑页

**功能名称**：修改已有 Entry

**功能目的**：
- 加载已有 Entry 数据
- 预填 P1.2（编辑器）+ P1.3（表单组件）
- 调用 updateEntry Server Action
- 保存后回到详情页
- "取消"按钮回到详情页

**用户价值**：
用户可以修改之前写的内容。记录不是一次性的——可以持续完善。

**为什么属于 Phase 1**：
编辑是"写"的自然延续。如果只能创建不能编辑，记录体验就不完整。

**涉及范围**：
- `src/app/entry/[slug]/edit/page.tsx` — 替换占位为真实页面

**依赖**：P1.1 + P1.2 + P1.3

---

#### P1.7 — Home 数据接入

**功能名称**：首页接入真实数据

**功能目的**：
- 调用 listEntries 获取最近 10 条 Entry
- 渲染 Entry 卡片列表（替换空状态占位）
- 卡片显示：标题 + 类型标签 + 摘要 + 时间
- 点击卡片 → /entry/[slug]

**用户价值**：
打开首页看到的不是空状态——而是自己最近写的东西。这是"愿意每天打开"的关键。

**为什么属于 Phase 1**：
首页是用户每次打开看到的第一个画面。空状态保持太久会失去信任感。虽然 MVP_v0.1 将 Home 数据接入放在 Phase 2.3，但此处与 P1.5 的 getEntry / listEntries 共用同一套 Server Actions，几乎零额外成本。

**注意**：此任务在 MVP_v0.1.md 中标记为 Phase 2.3。如果严格控制范围，可以延后到 Phase 2。建议在 P1.4-P1.6 完成后评估是否提前。

**涉及范围**：
- `src/app/page.tsx` — 替换空状态为真实列表

**依赖**：P1.1

---

### 子任务汇总

| # | 名称 | 类型 | 依赖 | 预计新增文件 |
|---|------|------|------|------------|
| P1.1 | Server Actions + 自动生成 | 数据层 | 无 | 4 |
| P1.2 | TipTap 编辑器 | UI 组件 | 无 | 1-2 |
| P1.3 | 表单组件 | UI 组件 | 无 | 3 |
| P1.4 | /plant 新建页 | 页面集成 | P1.1 + P1.2 + P1.3 | 0（修改） |
| P1.5 | /entry/[slug] 详情页 | 页面集成 | P1.1 | 0（修改） |
| P1.6 | /entry/[slug]/edit 编辑页 | 页面集成 | P1.1 + P1.2 + P1.3 | 0（修改） |
| P1.7 | Home 数据接入 | 页面集成 | P1.1 | 0（修改） |

---

## 第二部分：任务影响分析

### P1.1 — Server Actions + 自动生成

| 维度 | 详情 |
|------|------|
| 涉及页面 | 无（纯后端） |
| 涉及数据库表 | Entry（CRUD）、Tag（查询/创建）、EntryTag（关联）、Asset（预留） |
| 新增组件 | 无 |
| 涉及 Server Actions | ✅ createEntry, updateEntry, deleteEntry, getEntry, listEntries |
| 涉及文档 | DATABASE.md（可能更新 EntryType 校验说明） |
| 预计新增文件 | `src/lib/prisma.ts`、`src/lib/markdown.ts`、`src/lib/slug.ts`、`src/actions/entry.ts` |
| 预计修改文件 | 无 |

### P1.2 — TipTap 编辑器

| 维度 | 详情 |
|------|------|
| 涉及页面 | 无（独立组件，在测试页面验证） |
| 涉及数据库表 | 无 |
| 新增组件 | `Editor.tsx`（含 Toolbar） |
| 涉及 Server Actions | 否 |
| 涉及文档 | ANIMATION_GUIDE.md（如果编辑器有自定义动画） |
| 预计新增文件 | `src/components/editor/editor.tsx` |
| 预计修改文件 | `package.json`（+tiptap 依赖） |

### P1.3 — 表单组件

| 维度 | 详情 |
|------|------|
| 涉及页面 | 无（独立组件） |
| 涉及数据库表 | Tag（TagInput 需要查询已有标签做自动补全） |
| 新增组件 | `TitleInput.tsx`、`TypeSelector.tsx`、`TagInput.tsx` |
| 涉及 Server Actions | 否（TagInput 可先用本地 state，后续接 Server Action） |
| 涉及文档 | 无 |
| 预计新增文件 | `src/components/entry/title-input.tsx`、`src/components/entry/type-selector.tsx`、`src/components/entry/tag-input.tsx` |
| 预计修改文件 | 无 |

### P1.4 — /plant 新建页

| 维度 | 详情 |
|------|------|
| 涉及页面 | `/plant` |
| 涉及数据库表 | Entry（写入）、Tag（查询/创建）、EntryTag（写入） |
| 新增组件 | 无（组装已有组件） |
| 涉及 Server Actions | ✅ 调用 createEntry |
| 涉及文档 | 无 |
| 预计新增文件 | 无 |
| 预计修改文件 | `src/app/plant/page.tsx` |

### P1.5 — /entry/[slug] 详情页

| 维度 | 详情 |
|------|------|
| 涉及页面 | `/entry/[slug]` |
| 涉及数据库表 | Entry（读取）、Tag（联表查询）、EntryTag（联表查询） |
| 新增组件 | 可能需要 `ContentRenderer` 组件（TipTap JSON → HTML） |
| 涉及 Server Actions | ✅ 调用 getEntry |
| 涉及文档 | 无 |
| 预计新增文件 | 可能新增 `src/components/entry/content-renderer.tsx` |
| 预计修改文件 | `src/app/entry/[slug]/page.tsx` |

### P1.6 — /entry/[slug]/edit 编辑页

| 维度 | 详情 |
|------|------|
| 涉及页面 | `/entry/[slug]/edit` |
| 涉及数据库表 | Entry（读取+更新）、Tag（查询/创建）、EntryTag（更新） |
| 新增组件 | 无（复用 P1.2 + P1.3） |
| 涉及 Server Actions | ✅ 调用 getEntry + updateEntry |
| 涉及文档 | 无 |
| 预计新增文件 | 无 |
| 预计修改文件 | `src/app/entry/[slug]/edit/page.tsx` |

### P1.7 — Home 数据接入（可选）

| 维度 | 详情 |
|------|------|
| 涉及页面 | `/` |
| 涉及数据库表 | Entry（读取）、Tag（联表查询） |
| 新增组件 | 可能需要 `EntryCard` 组件 |
| 涉及 Server Actions | ✅ 调用 listEntries |
| 涉及文档 | 无 |
| 预计新增文件 | 可能新增 `src/components/entry/entry-card.tsx` |
| 预计修改文件 | `src/app/page.tsx` |

---

## 第三部分：验收标准

### P1.1 — Server Actions + 自动生成

- [ ] `npx prisma generate` 无错误
- [ ] createEntry 可创建一条 Entry，数据写入 SQLite
- [ ] 创建时自动生成 slug（从标题，中文转拼音，冲突时追加随机字符）
- [ ] 创建时自动生成 excerpt（contentMd 前 200 字符，去除 Markdown 标记）
- [ ] 创建时自动生成 contentMd（TipTap JSON → Markdown 转换）
- [ ] getEntry 可通过 slug 查询到完整的 Entry（含 tags）
- [ ] listEntries 可按时间倒序返回 Entry 列表
- [ ] updateEntry 可修改 title、content、type、tags
- [ ] updateEntry 更新时同步更新 slug（如果标题变化）、excerpt、contentMd
- [ ] deleteEntry 可删除 Entry 及其关联的 EntryTag
- [ ] deleteEntry 删除 Entry 时 Asset 保留（onDelete: SetNull 验证）
- [ ] 所有 Server Action 有基本的错误处理（不抛未捕获异常）

### P1.2 — TipTap 编辑器

- [ ] 编辑器可正常挂载，显示输入光标
- [ ] Bold 按钮可切换加粗
- [ ] Italic 按钮可切换斜体
- [ ] H2 / H3 按钮可切换标题级别
- [ ] BulletList / OrderedList 按钮可创建列表
- [ ] Blockquote 按钮可创建引用块
- [ ] HorizontalRule 按钮可插入分割线
- [ ] 中文输入法正常（无字符重复、无卡顿）
- [ ] 撤销/重做（Ctrl+Z / Ctrl+Y）正常
- [ ] 编辑器输出为 TipTap JSON 对象

### P1.3 — 表单组件

- [ ] TitleInput 可输入文本，显示 placeholder
- [ ] TypeSelector 显示 6 种类型，点击可选中
- [ ] TypeSelector 当前选中类型有明显视觉标识
- [ ] TagInput 可输入文本，逗号或回车创建标签
- [ ] TagInput 已添加的标签可删除（点击 ×）
- [ ] TagInput 输入时查询已有标签并显示补全建议
- [ ] TagInput 不输入时显示 placeholder

### P1.4 — /plant 新建页

- [ ] 页面包含 TitleInput、TypeSelector、Editor、TagInput
- [ ] 填写所有字段后点击保存，调用 createEntry
- [ ] 保存成功 → 跳转到 /entry/[slug]
- [ ] 标题为空时不允许保存（显示提示）
- [ ] 保存过程中按钮显示 loading 状态
- [ ] 保存失败时显示错误提示

### P1.5 — /entry/[slug] 详情页

- [ ] 通过 URL slug 正确加载 Entry
- [ ] 显示标题、类型 badge、标签列表
- [ ] 显示创建时间和更新时间
- [ ] 正文（TipTap JSON）正确渲染为可读 HTML
- [ ] "编辑"按钮可跳转到 /entry/[slug]/edit
- [ ] slug 不存在时显示 "未找到" 提示
- [ ] 页面不出现 hydration warning

### P1.6 — /entry/[slug]/edit 编辑页

- [ ] 加载已有 Entry 数据，预填所有字段
- [ ] 标题输入框显示已有标题
- [ ] 类型选择器选中当前类型
- [ ] 编辑器显示已有正文
- [ ] 标签输入显示已有标签
- [ ] 修改内容后点击保存，调用 updateEntry
- [ ] 保存成功 → 跳转回 /entry/[slug] 并看到更新
- [ ] "取消"按钮回到 /entry/[slug]（不保存修改）

### P1.7 — Home 数据接入（可选）

- [ ] 首页加载最近 10 条 Entry（按 updatedAt 倒序）
- [ ] 有 Entry 时显示卡片列表（标题 + 类型 + 摘要 + 时间）
- [ ] 无 Entry 时显示空状态（🌱 还没有任何记录）
- [ ] 点击卡片 → 跳转到 /entry/[slug]

---

## 第四部分：Phase 1 禁止事项

以下功能**明确不属于 Phase 1**。如果开发过程中发现"顺手就能做"，必须忍住。

### 数据层禁止

| 禁止项 | 原因 | 计划阶段 |
|--------|------|---------|
| User 模型 | 单人本地使用 | 公网部署时 |
| Link 模型 | Wikilink / Backlinks | Phase 7 (v0.8) |
| EntryVersion 模型 | 历史版本 | Phase 6 (v0.7) |
| AIJob / MemoryGraph 等模型 | AI 功能 | Phase 5 (v0.6) |
| 修改已有模型结构 | 当前 Schema 已验收 | — |
| PostgreSQL 迁移 | MVP 用 SQLite | 生产部署前 |

### 功能层禁止

| 禁止项 | 原因 | 计划阶段 |
|--------|------|---------|
| 自动保存 | 属于 Phase 2.1 | Phase 2 |
| 草稿恢复 | 属于 Phase 2 | Phase 2 |
| 图片上传 | 属于 Phase 2.2 | Phase 2 |
| 图片拖拽/粘贴 | 属于 Phase 2.2 | Phase 2 |
| 搜索 | 属于 Phase 2.5 | Phase 2 |
| 标签筛选（在 Garden 页） | 属于 Phase 2.4 | Phase 2 |
| 类型筛选（在 Garden 页） | 属于 Phase 2.4 | Phase 2 |
| Slash Menu | 体验增强 | Phase 1 (ROADMAP v0.2) 或更晚 |
| 专注模式 | 体验增强 | Phase 1 (ROADMAP v0.2) 或更晚 |
| 字数统计 | 体验增强 | Phase 1 (ROADMAP v0.2) 或更晚 |
| 时间问候（动态） | Home 已有静态版本 | Phase 2.3 |
| 花园状态统计 | 属于 Phase 3 | Phase 3 (v0.4) |
| AI 摘要 / 标签建议 | AI 功能 | Phase 5 (v0.6) |
| 数据导出 | 设置页功能 | Phase 3+ |

### 体验层禁止

| 禁止项 | 原因 |
|--------|------|
| 封面系统 | Phase 2 (v0.3) |
| 自定义字体 | 增加依赖，非 MVP 必需 |
| 粒子动画 / 樱花 / Live2D 等 | 永不允许（ANIMATION_GUIDE.md 已明确） |
| SEO 优化 | 私人本地使用，不需要搜索引擎 |
| 性能优化专项 | 过早优化。先做对，再做快。 |
| PWA / Service Worker | 非 MVP 范围 |
| 多语言 i18n | 当前仅中文 |
| 移动端适配专项 | 当前桌面优先 |

---

## 第五部分：开发顺序建议

```
P1.1 — Server Actions + 自动生成
  │
  ├──────────────┬──────────────┐
  ▼              ▼              ▼
P1.2           P1.3           P1.5
TipTap         表单组件        详情页
编辑器         (独立UI)       (Read-only)
  │              │
  └──────┬───────┘
         ▼
       P1.4
    /plant 新建页
    (组装 UI + 调用 Action)
         │
         ▼
       P1.6
  /entry/[slug]/edit
    编辑页（完整闭环）
         │
         ▼
       P1.7
    Home 数据接入
    （可选，低风险）
```

### 为什么这样排序

| 顺序 | 原因 |
|------|------|
| **P1.1 最先** | 数据层是所有后续任务的基础。没有 Server Actions，页面无法保存/加载。 |
| **P1.2 + P1.3 并行** | 两个都是纯 UI 组件，互不依赖。可与 P1.5 同步开发（P1.5 也是独立的）。 |
| **P1.5 可提前** | 详情页是只读的，最简单。不依赖编辑器组件。只需 P1.1 的 getEntry。可以在 P1.2/P1.3 完成前先做。 |
| **P1.4 在组件就绪后** | /plant 需要编辑器+表单组件全部就绪。它是第一个"完整集成"页面。 |
| **P1.6 在 P1.4 之后** | 编辑页与新建页共享 UI 组件。P1.4 验证了集成链路后，P1.6 主要是"预填数据"的增量工作。 |
| **P1.7 最后** | 风险最低，纯展示。可以在 P1.4-P1.6 稳定后再接入。 |

### 风险分析

| 任务 | 风险 | 缓解 |
|------|------|------|
| P1.1 | TipTap JSON → Markdown 转换可能不准确 | 使用 tiptap-markdown 官方扩展，不自己写解析器 |
| P1.2 | TipTap 中文输入法兼容性 | 使用官方 React 封装，不做自定义输入处理 |
| P1.4 | 多个组件状态同步复杂 | 使用统一的 form state 管理（useReducer 或简化的 hook） |
| P1.6 | 预填数据时编辑器初始化时序 | TipTap 提供 `editor.commands.setContent()` API |

---

## 第六部分：Phase 1 准备度检查

### 【已具备】

| 项目 | 状态 | 说明 |
|------|:--:|------|
| 数据库 Schema | ✅ | Entry / Tag / EntryTag / Asset 已定义，迁移已执行 |
| SQLite 数据库文件 | ✅ | `prisma/dev.db` 可读写 |
| 全部 6 个路由 | ✅ | 占位页面已存在，可直接替换 |
| Theme 系统 | ✅ | Light / Dark / System，cookie 持久化，无闪烁 |
| Layout 结构 | ✅ | Nav + Main + Footer + PageTransition |
| Framer Motion | ✅ | pageVariants 已集成到 Layout |
| Design Tokens | ✅ | 14 颜色 + 3 圆角 + 2 阴影，全部通过 CSS 变量 |
| TailwindCSS 工具类 | ✅ | `.interactive` + `.focus-ring` 可用 |
| Git 版本控制 | ✅ | 11 个 Commit，一快照一 Commit 规范已确立 |
| 开发规范 | ✅ | BUILD_RULES.md + ANIMATION_GUIDE.md + DATABASE.md |

### 【存在风险】

| 风险 | 严重度 | 说明 |
|------|:--:|------|
| **Prisma Client 单例未创建** | 🔴 高 | 当前项目中没有 `src/lib/prisma.ts`，Server Actions 无法连接数据库 |
| **TipTap 未安装** | 🔴 高 | 编辑器是 Phase 1 核心依赖，尚未安装 `@tiptap/react` 及扩展 |
| **TipTap ↔ Markdown 转换未验证** | 🟡 中 | 双存储是架构硬约束。如果转换不准确，会导致搜索和导出出问题 |
| **中文拼音 slug 生成** | 🟡 中 | 需要将中文标题转为 URL 安全的拼音 slug。Node.js 原生不支持拼音 |
| **TipTap JSON 渲染到 HTML** | 🟡 中 | 详情页需要将 JSON 渲染为可读 HTML。需要安全的渲染方式 |
| **ROADMAP.md 与 MVP_v0.1.md 任务分配不一致** | 🔵 低 | ROADMAP 将"自动保存+草稿恢复"放在 Phase 1，MVP_v0.1 放在 Phase 2。按 MVP_v0.1.md 执行 |

### 【建议】

1. **P1.1 优先处理拼音问题**：标题 → slug 的转换需要拼音库（如 `pinyin` 包）或简单的 URL 编码方案。建

议先在 P1.1 中评估方案并确定策略。

2. **TipTap 扩展最小化安装**：只安装 P1.2 需要的扩展（@tiptap/starter-kit 已包含 Bold/Italic/H2/H3/List/Blockquote/HR，无需单独安装）。

3. **contentRenderer 使用 TipTap 官方方案**：TipTap 提供 `generateHTML()` 方法将 JSON 转为 HTML。不要自己写解析器。

4. **form state 管理先简单后复杂**：P1.4 的 form state 可以用一个简单的 `useState` 对象 + `useCallback` 管理。Phase 2 再评估是否需要更复杂的状态管理。

5. **P1.7 建议延后到 Phase 2**：虽然接入成本低，但为了保持 Phase 1 的范围干净，建议将 Home 数据接入留在 Phase 2.3。本计划中先不纳入 P1.7 的强制执行。

---

## 附录：文档冲突说明

### ROADMAP.md vs MVP_v0.1.md

ROADMAP.md 将"自动保存、草稿恢复、Ctrl+S 保存、字数统计、阅读时间、专注模式"全部放在 Phase 1 (v0.2)。

MVP_v0.1.md 将这些功能拆分：
- Phase 1：仅基础 CRUD + 编辑器 + 手动保存
- Phase 2：自动保存 + 草稿恢复 + 搜索 + 图片上传

**当前执行策略**：遵循 MVP_v0.1.md。ROADMAP.md 是早期宏观规划，MVP_v0.1.md 是经过范围裁剪后的执行文档。

### ARCHITECTURE.md vs MVP_v0.1.md

已在 Phase 0.2 的 DATABASE.md §9 中记录 8 个字段冲突。Phase 1 不修改 Schema。

---

> **Phase 1 的核心原则**：做完一个功能，验收一个功能，提交一个功能。
>
> 不要一口气写完全部代码再回头补验收。
