# MVP v0.1

> 第一个真正可用的 Digital Garden。
>
> 不是骨架。不是 Demo。是一个每天愿意打开写东西的地方。

---

## 一、版本目标

**让用户能够自然地记录、保存和找回自己的内容。**

一句话：打开就能写，写了不会丢，以后能找到。

---

## 二、用户故事

### US-1 记录一条内容

> 作为用户，
> 我希望打开编辑器，输入标题和正文，选择一种内容类型（回忆/想法/情绪/梦境/故事/学习），
> 然后保存它，
> 以便未来再次看到这条记录。

### US-2 自动保存

> 作为用户，
> 我希望编辑器在我输入时自动保存草稿，
> 以便我不会因为误关页面而丢失内容。

### US-3 浏览花园

> 作为用户，
> 我希望在首页看到最近记录的内容列表，
> 以便快速了解自己最近在想什么、记录了什么。

### US-4 按类型筛选

> 作为用户，
> 我希望按内容类型（回忆/想法/情绪/梦境/故事/学习）筛选条目，
> 以便专注于某一类记录的回顾。

### US-5 搜索内容

> 作为用户，
> 我希望通过关键词搜索标题和正文，
> 以便快速找到某条特定记录。

### US-6 用标签整理

> 作为用户，
> 我希望给内容添加标签，
> 以便用自己习惯的方式组织和查找内容。

### US-7 插入图片

> 作为用户，
> 我希望在编辑器中粘贴或上传图片，
> 以便图文并茂地记录当下的画面。

### US-8 阅读一条记录

> 作为用户，
> 我希望点击列表中的条目后看到完整的排版内容，
> 以便舒适地回顾自己写下的东西。

### US-9 再次编辑

> 作为用户，
> 我希望从详情页进入编辑模式修改已保存的内容，
> 以便修正或补充记录。

### US-10 切换外观

> 作为用户，
> 我希望在亮色和暗色主题之间切换，
> 以便在不同光线环境下舒适地使用。

---

## 三、功能范围

### 包含（必须开发）

| 功能 | 为什么保留 |
|------|-----------|
| **Entry CRUD** | 整个系统的核心。没有它就什么都没有。 |
| **6 种内容类型** | 项目定义的核心分类方式（Memory / Thought / Emotion / Dream / Story / Learning）。这是 Entry 的内置属性，不是额外功能。 |
| **TipTap 编辑器** | 架构选型已定。提供基础富文本（标题、加粗、斜体、列表、引用、分割线）。不包含 Slash Menu——用工具栏即可。 |
| **自动保存** | 如果用户写了 20 分钟然后浏览器崩了，他就不会再打开第二次。这是信任问题，不是功能问题。 |
| **标签** | 最轻量的内容组织方式。比文件夹灵活，比分类自由。MVP 中只做"创建条目时添加标签 + 按标签筛选"，不做标签管理后台。 |
| **图片上传** | 记录回忆时图片是刚需。但 MVP 只做最简版：粘贴/点击上传 → 存入本地 public 目录 → 返回 URL 插入编辑器。不包含相册、封面提取、图片管理后台。 |
| **搜索** | "找到内容"的核心手段。MVP 做标题 + 正文全文搜索。不做高级筛选、不做搜索历史、不做搜索建议。 |
| **首页** | 打开即见的入口。MVP 只包含：时间问候 + 最近条目列表 + 新建按钮。不包含花园状态、今日种子、回忆绽放。 |
| **花园浏览页** | 按类型/标签筛选 + 搜索 + 卡片列表。这是"找到内容"的主要界面。 |
| **详情页** | 阅读已保存内容的排版页面。含标题、类型、标签、时间、正文。一个"编辑"按钮。 |
| **设置页** | MVP 只做主题切换（亮色/暗色）。登录信息、数据导出、AI 配置全部后置。 |

### 不包含（明确延期）

以下每一项都来自四份文档中规划的能力，但在 MVP 中**主动移除**：

| 功能 | 延后原因 | 计划阶段 |
|------|---------|---------|
| Slash Menu | 工具栏已满足 MVP 编辑需求。Slash Menu 是体验优化，不是基础能力。 | Phase 1 (v0.2) |
| 专注模式 | 写作体验增强，不是基础可用性。 | Phase 1 (v0.2) |
| 字数统计 / 阅读时间 | 锦上添花。不阻碍"写 + 保存 + 找到"。 | Phase 1 (v0.2) |
| 草稿恢复 | 自动保存已覆盖主要风险。显式草稿管理面板是额外复杂度。 | Phase 1 (v0.2) |
| 封面系统 | 涉及自动提取、手动设置、首页展示链路。MVP 用第一张图片做列表缩略图即可。 | Phase 2 (v0.3) |
| 相册系统 | 需要独立的图片浏览和管理界面。 | Phase 2 (v0.3) |
| 花园状态统计 | "种子/生长中/开花"的语义需要额外字段和逻辑。 | Phase 3 (v0.4) |
| 今日种子（引导语） | 需要引导语库和每日轮换逻辑。 | Phase 3 (v0.4) |
| 回忆绽放（历史同日） | 需要时间维度的复杂查询。 | Phase 4 (v0.5) |
| 时光机 | 独立的 Timeline 页面，大量时间维度查询。 | Phase 4 (v0.5) |
| 历史版本 | 需要独立的版本表、快照逻辑、版本比较 UI。 | Phase 6 (v0.7) |
| AI 园丁（摘要/标签/分析） | 需要 DeepSeek 集成、异步任务、prompt 工程。 | Phase 5 (v0.6) |
| Wikilink `[[ ]]` | 需要解析器 + Link 表 + 双向查询。 | Phase 7 (v0.8) |
| Backlinks | 依赖 Link 表和 Wikilink 基础设施。 | Phase 7 (v0.8) |
| 知识图谱 | 依赖完整的关联网络和可视化能力。 | Phase 7 (v0.8) |
| 数据导出 | 重要但 MVP 可以先手动操作数据库。 | Phase 3+ |
| 多用户 / 权限 | 项目明确定位为单人使用。 | 不做 |

---

## 四、页面清单

### 4.1 Home（`/`）

**职责**：打开后看到的第一眼。像推开自己的房门。

**最少需要**：
- 时间问候（根据当前小时显示：早上好 / 下午好 / 晚上好）
- 最近 10 条 Entry 卡片列表（标题 + 类型标签 + 摘要 + 日期）
- 右上角"新建"按钮 → 跳转编辑器
- 顶部导航：Home / Garden / Settings

**不需要**：
- ~~花园状态统计~~
- ~~今日种子引导语~~
- ~~回忆绽放~~
- ~~成长进度条~~

### 4.2 Garden（`/garden`）

**职责**：浏览、筛选、搜索所有内容。

**最少需要**：
- 搜索框（关键词全文搜索）
- 类型筛选条（全部 / Memory / Thought / Emotion / Dream / Story / Learning）
- 标签筛选（点击标签过滤）
- 卡片流列表（分页或无限滚动，MVP 先用分页）
- 每条卡片显示：标题、类型、标签、摘要、日期
- 点击卡片 → 进入详情页

**不需要**：
- ~~时间排序切换（默认按更新时间倒序即可）~~
- ~~画廊视图~~
- ~~时间轴视图~~

### 4.3 Editor（`/plant` 新建，`/entry/[slug]/edit` 编辑）

**职责**：记录内容的核心页面。

**最少需要**：
- 标题输入框
- 类型选择器（6 种类型下拉或 pill 选择）
- TipTap 编辑器（基础格式化工具栏：粗体、斜体、H2/H3、列表、引用、分割线、图片插入）
- 图片粘贴 / 点击上传（TipTap 原生图片扩展）
- 标签输入（逗号或回车分隔，自由输入，不限制已有标签）
- 自动保存（3 秒防抖，保存到 localStorage + 后端）
- 手动保存按钮（Ctrl+S）
- 保存后跳转到详情页

**不需要**：
- ~~Slash Menu~~
- ~~专注模式~~
- ~~字数统计~~
- ~~封面手动设置~~
- ~~历史版本入口~~

### 4.4 Entry Detail（`/entry/[slug]`）

**职责**：阅读和回顾一条记录。

**最少需要**：
- 标题
- 类型标签
- 标签列表
- 创建时间 / 更新时间
- 正文内容（TipTap JSON 渲染或 Markdown 渲染）
- "编辑"按钮 → 跳转编辑页
- "返回"按钮 → 回到上一页

**不需要**：
- ~~关联内容推荐~~
- ~~Backlinks 面板~~
- ~~历史版本列表~~
- ~~分享按钮~~

### 4.5 Settings（`/settings`）

**职责**：最小化的个性化设置。

**最少需要**：
- 主题切换（亮色 / 暗色 / 跟随系统）
- 设置持久化（localStorage + cookie，避免页面闪烁）

**不需要**：
- ~~数据导出~~
- ~~备份管理~~
- ~~AI 配置~~
- ~~账户信息~~
- ~~外观微调（字体、字号、间距）~~
- ~~花园名称自定义~~

---

## 五、数据模型

### 5.1 MVP 实际需要的模型

#### Entry

```prisma
model Entry {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  type        EntryType
  content     String   // TipTap JSON
  contentMd   String   // Markdown（搜索 + 未来导出用）
  excerpt     String?  // 纯文本摘要（列表卡片用，取前 200 字）
  isPrivate   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tags        EntryTag[]
  assets      Asset[]
}

enum EntryType {
  Memory
  Thought
  Emotion
  Dream
  Story
  Learning
}
```

#### Tag

```prisma
model Tag {
  id      String     @id @default(cuid())
  name    String     @unique
  slug    String     @unique
  entries EntryTag[]
}
```

#### EntryTag（多对多关联）

```prisma
model EntryTag {
  entry   Entry  @relation(fields: [entryId], references: [id], onDelete: Cascade)
  entryId String
  tag     Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)
  tagId   String

  @@id([entryId, tagId])
}
```

#### Asset

```prisma
model Asset {
  id        String   @id @default(cuid())
  url       String
  fileName  String
  fileSize  Int
  mimeType  String
  entryId   String?
  entry     Entry?   @relation(fields: [entryId], references: [id], onDelete: SetNull)
  createdAt DateTime @default(now())
}
```

### 5.2 暂时不需要的模型

| 模型 | 不需要的原因 | 计划引入 |
|------|------------|---------|
| **User** | MVP 单人使用，不需要登录和用户系统。对本地运行而言是过度设计。 | v0.2+（如果部署到公网则提前） |
| **Link** | Wikilink / Backlinks / 知识关联全部后置。 | Phase 7 (v0.8) |
| **EntryVersion** | 历史版本系统整体后置。 | Phase 6 (v0.7) |
| **Cover / Gallery** | 封面系统和相册系统后置。图片作为 Asset 挂在 Entry 上即可。 | Phase 2 (v0.3) |
| **Setting** | 当前只有一个主题偏好，存 localStorage 即可。 | 设置项超过 5 个时引入 |

### 5.3 关于 content 双存储的说明

ARCHITECTURE.md 要求保留 `content`（TipTap JSON）和 `contentMd`（Markdown）双字段。

MVP 中：
- `content`：编辑器读写的主字段
- `contentMd`：保存时从 TipTap JSON 自动转换，用于全文搜索和未来导出

这是架构层面的硬约束，不是可选功能。MVP 必须实现这个转换。

---

## 六、任务拆解

### Phase 0：项目地基

**目标**：项目能跑起来，数据库能迁移，页面骨架搭好。

| # | 子任务 | 完成标准 |
|---|--------|---------|
| 0.1 | `create-next-app` 初始化项目，TypeScript + TailwindCSS + Prisma | `npm run dev` 可启动 |
| 0.2 | 配置 Prisma Schema（Entry / Tag / EntryTag / Asset），SQLite 开发 | `npx prisma migrate dev` 成功 |
| 0.3 | 全局布局组件（Layout / Nav），暗色模式 Tailwind 配置 | 页面切换时主题正确应用，无闪烁 |
| 0.4 | 路由骨架：`/` `/garden` `/plant` `/entry/[slug]` `/entry/[slug]/edit` `/settings` | 所有路由可访问，返回占位内容 |
| 0.5 | Framer Motion 页面过渡动画 | 路由切换有基础过渡效果 |

**完成标准**：`npm run dev` → 浏览器打开 → 看到有导航的空白页面，六个路由可访问。

---

### Phase 1：核心记录体验

**目标**：能创建、编辑、保存、查看内容。

| # | 子任务 | 完成标准 |
|---|--------|---------|
| 1.1 | Server Actions：createEntry / updateEntry / deleteEntry / getEntry / listEntries | CRUD 全部可用，数据写入 SQLite |
| 1.2 | TipTap 编辑器组件，基础工具栏（Bold / Italic / H2 / H3 / BulletList / OrderedList / Blockquote / HorizontalRule） | 编辑器可输入、格式化内容 |
| 1.3 | 标题输入 + 类型选择器 + 标签输入组件 | 可输入标题、选择类型、添加标签 |
| 1.4 | 新建页面 `/plant`：组装标题 + 编辑器 + 类型 + 标签 → 保存 | 填写所有字段 → 点击保存 → 数据库新增 Entry |
| 1.5 | 详情页 `/entry/[slug]`：渲染标题、类型、标签、时间、正文 | 从列表点击 → 看到排版好的内容 |
| 1.6 | 编辑页 `/entry/[slug]/edit`：加载已有数据 → 修改 → 更新保存 | 从详情页点"编辑" → 修改内容 → 保存 → 回到详情页 |
| 1.7 | 保存时自动生成 `slug`（从标题）、`excerpt`（contentMd 前 200 字）、`contentMd`（TipTap JSON → Markdown） | 每次保存自动生成三个字段 |

**完成标准**：可以创建一条 Memory，保存，在详情页看到它，再编辑它。

---

### Phase 2：可靠性与可发现性

**目标**：内容不丢失，能找到历史内容，页面完整。

| # | 子任务 | 完成标准 |
|---|--------|---------|
| 2.1 | 自动保存：3 秒防抖，先写 localStorage，再写后端。页面刷新后恢复。 | 输入内容 → 等 3 秒 → 刷新页面 → 编辑器内容还在 |
| 2.2 | 图片上传：TipTap 图片扩展，粘贴/拖拽/点击上传 → 存入 `public/uploads/` → 返回 URL 插入 | 粘贴图片 → 图片出现在编辑器 → 保存 → 详情页图片正常显示 |
| 2.3 | 首页 `/`：时间问候 + 最近 10 条 Entry 列表 + 新建按钮 | 打开首页 → 看到问候语 + 最近条目 |
| 2.4 | 花园页 `/garden`：搜索框 + 类型筛选 + 标签筛选 + 分页卡片列表 | 搜索关键词 → 结果过滤；点击类型 → 只显示该类型；点击标签 → 只显示该标签 |
| 2.5 | 搜索 API：`contentMd` 全文搜索 + `title` 模糊搜索 | 输入"东京" → 返回标题或正文包含"东京"的 Entry |
| 2.6 | 设置页 `/settings`：主题切换（亮色/暗色/跟随系统），持久化 | 切换暗色 → 刷新页面 → 仍是暗色 |
| 2.7 | 整体 UI 打磨：二次元温暖风格，卡片样式，过渡动画，空状态处理 | 所有页面没有明显的"未完成"感 |

**完成标准**：完整走通"打开首页 → 新建 → 写作（自动保存+粘贴图片）→ 保存 → 在花园搜索找到 → 再次阅读 → 修改"的完整闭环。

---

## 七、验收标准

### 核心闭环（必须全部通过）

- [ ] **创建内容**：在 `/plant` 页面输入标题、选择类型、写正文、加标签，点击保存，成功创建 Entry
- [ ] **阅读内容**：从首页或花园页点击一条 Entry，进入详情页，标题/类型/标签/时间/正文正确显示
- [ ] **编辑内容**：从详情页点击"编辑"，修改标题或正文，保存，回到详情页看到更新后的内容
- [ ] **自动保存**：在编辑器中输入内容，等 3 秒，关闭页面（不点保存），重新打开 `/plant`，内容恢复
- [ ] **搜索内容**：在花园页搜索框输入关键词，返回标题或正文匹配的结果
- [ ] **标签筛选**：在花园页点击某个标签，只显示包含该标签的 Entry
- [ ] **类型筛选**：在花园页选择"Dream"，只显示类型为 Dream 的 Entry
- [ ] **图片插入**：在编辑器中粘贴一张图片，图片正确显示，保存后在详情页正确渲染
- [ ] **主题切换**：在设置页切换暗色模式，所有页面立即生效，刷新后保持

### 体验要求（非功能性）

- [ ] 中文输入法不卡顿、不出现重复字符
- [ ] 编辑器撤销/重做（Ctrl+Z / Ctrl+Y）正常工作
- [ ] Ctrl+S 手动保存有反馈（toast 或状态图标）
- [ ] 页面首次加载 < 3 秒（本地环境）
- [ ] 所有空状态都有提示文案（如"还没有记录，去种下第一颗种子吧 🌱"）

---

## 八、风险控制

### 8.1 最容易做成屎山的地方

#### 风险 1：编辑器状态管理

TipTap 编辑器的状态（content JSON）+ 标题 + 类型 + 标签 + 自动保存状态，这些状态混在组件里会迅速失控。

**控制方式**：
- 所有编辑器状态集中在一个 `useEditorState` hook 中管理
- 不把 TipTap 实例直接暴露给父组件
- 自动保存逻辑独立为一个 `useAutoSave` hook，与编辑器 UI 解耦

#### 风险 2：Server Actions 与 TipTap JSON 的边界

TipTap JSON 是复杂的嵌套结构。Server Actions 传递这个 JSON 时容易出现序列化问题。

**控制方式**：
- Server Actions 只接收和返回纯数据，不做转换
- `content ↔ contentMd` 的转换放在独立的 `lib/markdown.ts` 中
- 不把 TipTap 的 Node 类传到后端

#### 风险 3：搜索实现

MVP 用 SQLite 的 LIKE 做全文搜索没问题，但不要把这层逻辑写死在页面组件里。

**控制方式**：
- 搜索逻辑封装在独立的 `lib/search.ts` 或 Prisma 查询函数中
- 后续切换到 PostgreSQL 全文搜索（`tsvector`）时只需换这一层

#### 风险 4：图片存储

图片直接存 `public/uploads/`，文件名冲突、路径管理、部署后的持久化都是隐患。

**控制方式**：
- 文件名使用 `cuid + 原始扩展名`
- 图片上传逻辑封装在 `lib/upload.ts` 中
- 预留切换到对象存储的接口

#### 风险 5：多对多标签的 N+1 查询

Entry 列表页加载标签时容易出现 N+1。

**控制方式**：
- Prisma 查询时统一 `include: { tags: { include: { tag: true } } }`
- 列表查询时一次性加载所有关联标签

### 8.2 必须控制复杂度的约束

| 约束 | 说明 |
|------|------|
| **不引入全局状态管理** | MVP 用 React Server Components + Server Actions + URL state 足够。不引入 Zustand / Redux / Jotai。 |
| **不引入第三方 UI 库** | 只用 TailwindCSS + 少量自定义组件。不引入 Radix UI / shadcn/ui / Headless UI（除非遇到不可逾越的无障碍问题）。 |
| **不引入 ORM 上层抽象** | 直接用 Prisma Client。不在上面再加 Repository 层。 |
| **不做 API Route** | MVP 全部用 Server Actions。不创建 `/api/*` 路由。 |
| **不做 SSG/ISR** | MVP 全部动态渲染。内容变了页面就变，不需要缓存策略。 |
| **TipTap 扩展最小化** | 只安装 MVP 需要的扩展。不安装 @tiptap/extension-* 全家桶。 |

---

## 九、MVP 结束条件

### 宣布"MVP v0.1 完成，可以开始 v0.2"的条件：

1. **Phase 0 + Phase 1 + Phase 2 全部子任务完成**，且验收标准全部通过。

2. **自己连续使用 3 天**，每天至少：
   - 打开首页，看到最近记录
   - 新建一条记录（不同类型）
   - 通过搜索或标签找到一条旧记录
   - 没有遇到数据丢失或明显卡顿

3. **内容安全感建立**：在编辑器中连续写 15 分钟，不开 DevTools，不担心内容丢失。

4. **没有已知的阻断性 Bug**：
   - 中文输入正常
   - 保存不丢数据
   - 图片不裂
   - 主题不闪烁

满足以上 4 条后，**MVP v0.1 即为完成**。

可以进入 v0.2（Phase 1：Slash Menu、专注模式、草稿恢复面板、字数统计）。

---

## 附录：MVP 技术约束速查

| 项 | 选择 |
|----|------|
| 框架 | Next.js (App Router) |
| 语言 | TypeScript (strict) |
| 样式 | TailwindCSS |
| 动画 | Framer Motion |
| 编辑器 | TipTap |
| 数据库 | SQLite (开发) / PostgreSQL (生产) |
| ORM | Prisma |
| 后端 | Server Actions（不用 API Routes） |
| 图片存储 | `public/uploads/`（本地文件系统） |
| 认证 | 无（MVP 单人本地使用） |
| 部署 | 暂不考虑（可本地 `npm run dev` 或 `next start`） |

---

> **MVP v0.1 不是第一个版本，而是第一个"家"。**
>
> 不需要完美，但需要让人愿意回去。
