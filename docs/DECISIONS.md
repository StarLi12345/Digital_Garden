# DECISIONS.md

> Digital Garden 产品与架构决策记录。
>
> 每一个重要决策，记录"为什么这样选择"和"替代方案是什么"。
>
> 目的：未来回头看时，知道当时为什么走这条路。

---

## 决策索引

| # | 日期 | 决策 | 分类 |
|---|------|------|------|
| D-001 | 2026-05-31 | 项目定位：私人数字花园 | 产品 |
| D-002 | 2026-05-31 | 6 种核心内容类型 | 产品 |
| D-003 | 2026-05-31 | 开发优先级 | 产品 |
| D-004 | 2026-05-31 | 技术栈选型 | 架构 |
| D-005 | 2026-05-31 | 双存储策略 | 架构 |
| D-006 | 2026-05-31 | 单人模式，无用户系统 | 架构 |
| D-007 | 2026-05-31 | Server Actions 替代 API Routes | 架构 |
| D-008 | 2026-05-31 | SQLite 开发，PostgreSQL 生产 | 架构 |
| D-009 | 2026-05-31 | 不使用第三方 UI 库 | 架构 |
| D-010 | 2026-05-31 | Prisma 5 而非 Prisma 7 | 架构 |
| D-011 | 2026-05-31 | 快照系统作为版本控制人类可读层 | 工程 |
| D-012 | 2026-05-31 | AI 边界：辅助而非生产 | 产品 |
| D-013 | 2026-05-31 | Git 作为唯一时间事实源（SSOT） | 工程 |

---

## D-001：项目定位

**日期**：2026-05-31

**决策**：Digital Garden 是一个私人数字花园，不是博客、知识库或办公软件。

**背景**：市面上有很多笔记应用（Notion）、知识管理工具（Obsidian）、博客系统。它们面向效率、发布、协作。Digital Garden 的目标不同：它是一个长期陪伴自己的私人空间，重点是记录、保存、回顾个人痕迹，最终成长为数字生命载体。

**替代方案**：
- 方案 A：做成类似 Obsidian 的知识管理工具 → 拒绝，因为焦点不同。Obsidian 面向知识组织和双向链接，Digital Garden 面向个人生命轨迹。
- 方案 B：做成博客系统 → 拒绝，因为博客面向公开发布，Digital Garden 是私密的。

**影响**：所有功能设计必须回答"它是否帮助用户更好地记录、回顾或成长？"。效率、发布、协作等功能不在范围内。

**来源**：[README.md](../README.md) [PRODUCT.md](PRODUCT.md)

---

## D-002：6 种核心内容类型

**日期**：2026-05-31

**决策**：Entry 按 6 种类型分类：Memory、Thought、Emotion、Dream、Story、Learning。

**背景**：需要一种轻量的内容分类方式。类型是 Entry 的内置属性，决定记录的性质。

**替代方案**：
- 方案 A：不分类，所有内容平铺 → 拒绝。缺少基本组织结构，后期难以浏览和筛选。
- 方案 B：用文件夹分类 → 拒绝。与"温暖私人空间"的定位不符，文件夹是生产力工具的心智模型。
- 方案 C：纯标签分类 → 部分采纳。标签作为自由维度的补充，类型作为一级分类。

**影响**：Entry 模型强制包含 `type` 字段。所有创建和筛选界面围绕这 6 种类型设计。

**来源**：[README.md](../README.md) [ARCHITECTURE.md](architecture.md)

---

## D-003：开发优先级

**日期**：2026-05-31

**决策**：开发顺序为 记录体验 > 回忆体验 > 成长体验 > AI 能力 > 知识关联。

**背景**：需要决定在有限时间内先做什么。核心原则：先让用户能"记录"，再让用户能"回顾"，最后才是"关联"和"AI"。

**替代方案**：
- 方案 A：AI 先行，先做智能标签和摘要 → 拒绝。AI 是辅助，不是基础。没有内容就没有分析对象。
- 方案 B：知识关联先行，先做 Wikilink → 拒绝。双向链接需要内容积累才有价值。

**影响**：MVP v0.1 聚焦记录体验，v0.2-v0.5 逐步扩展，v0.6+ 才引入 AI，v0.8+ 才引入关联。

**来源**：[ROADMAP.md](ROADMAP.md) [MVP_v0.1.md](MVP_v0.1.md)

---

## D-004：技术栈选型

**日期**：2026-05-31

**决策**：

| 层 | 选择 |
|----|------|
| 框架 | Next.js (App Router) |
| 语言 | TypeScript (strict) |
| 样式 | TailwindCSS |
| 动画 | Framer Motion |
| 编辑器 | TipTap |
| ORM | Prisma |
| 数据库 | SQLite（开发）/ PostgreSQL（生产） |
| AI | DeepSeek API（后期） |

**背景**：需要一个长期可维护的技术栈。Next.js 提供全栈能力，TypeScript 提供类型安全，TipTap 是基于 ProseMirror 的成熟编辑器，Prisma 是 TypeScript 生态中最成熟的 ORM。

**替代方案**：
- 方案 A：Vite + React Router → 拒绝。需要自己搭建后端，增加复杂度。
- 方案 B：Remix → 拒绝。生态和社区不如 Next.js 成熟。
- 方案 C：Slate.js / Quill 编辑器 → 拒绝。Slate 不稳定，Quill 过时。TipTap 基于 ProseMirror，是行业标准。
- 方案 D：Drizzle ORM → 拒绝。Prisma 的 Schema 设计和迁移工具更成熟。

**影响**：所有后续开发围绕此技术栈进行。不可随意切换核心依赖。

**来源**：[ARCHITECTURE.md](architecture.md)

---

## D-005：双存储策略

**日期**：2026-05-31

**决策**：每条 Entry 同时存储 `content`（TipTap JSON）和 `contentMd`（Markdown）。

**背景**：TipTap 基于 JSON 存储，能精确还原编辑器状态（格式、嵌入、样式）。但 JSON 不可读、不可直接搜索、不可导出。Markdown 解决了这些问题。

**替代方案**：
- 方案 A：只存 TipTap JSON → 拒绝。无法做全文搜索，导出困难，绑定私有格式。
- 方案 B：只存 Markdown → 拒绝。编辑器体验受限，富媒体（图片、嵌入）处理复杂。
- 方案 C：存 HTML → 拒绝。HTML 比 Markdown 更难维护和迁移。

**影响**：每次保存时需执行 TipTap JSON → Markdown 转换。全文搜索基于 contentMd 字段。这是架构硬约束，不可省略。

**来源**：[ARCHITECTURE.md](architecture.md)

---

## D-006：单人模式

**日期**：2026-05-31

**决策**：MVP 不实现用户系统、登录、权限。项目为单用户设计。

**背景**：Digital Garden 是私人空间。多人协作、团队空间等是明确的非目标。在不需要登录的场景下引入用户系统，属于过度设计。

**替代方案**：
- 方案 A：加一个简单的密码登录 → 暂缓。本地运行时不需要。部署到公网时再评估。
- 方案 B：OAuth 登录 → 拒绝。与私人空间定位冲突。

**影响**：Prisma Schema 中没有 User 模型。所有内容访问无权限检查。如果部署到公网，需要在此决策基础上增加保护层。

**来源**：[ARCHITECTURE.md](architecture.md) [MVP_v0.1.md](MVP_v0.1.md)

---

## D-007：Server Actions 替代 API Routes

**日期**：2026-05-31

**决策**：MVP 全部使用 Next.js Server Actions，不创建 `/api/*` Route Handler。

**背景**：Next.js App Router 的 Server Actions 可以直接在组件中调用服务端逻辑，减少样板代码。对于 MVP 的 CRUD 操作规模，不需要独立的 API 层。

**替代方案**：
- 方案 A：传统的 `/api/*` REST API → 暂缓。API Routes 在 MVP 阶段增加不必要的复杂度。未来如果需要外部访问或移动端，可以再加。
- 方案 B：tRPC → 拒绝。引入额外依赖，违反最小依赖原则。

**影响**：所有数据操作通过 Server Actions 完成。组件中直接 `import` 和调用 Action 函数。未来迁移到 API Routes 时，Action 内部的逻辑可以复用。

**来源**：[MVP_v0.1.md](MVP_v0.1.md) [BUILD_RULES.md](BUILD_RULES.md)

---

## D-008：SQLite 开发，PostgreSQL 生产

**日期**：2026-05-31

**决策**：开发阶段使用 SQLite，部署时切换到 PostgreSQL。

**背景**：SQLite 零配置、文件存储、不需要额外服务。开发体验极好。PostgreSQL 适合生产环境的并发和可靠性。Prisma 支持两者，切换只需修改 datasource。

**替代方案**：
- 方案 A：全程 SQLite → 部分采纳。个人本地使用完全够用。但架构文档预留了 PostgreSQL 选项。
- 方案 B：全程 PostgreSQL → 暂缓。开发阶段需要安装和配置数据库服务，增加环境搭建成本。
- 方案 C：MySQL → 拒绝。PostgreSQL 生态更好，全文搜索能力更强。

**影响**：Prisma Schema 中的 provider 为 `sqlite`，开发时数据库文件为 `prisma/dev.db`。生产切换时修改 provider 和连接字符串。

**来源**：[ROADMAP.md](ROADMAP.md) [ARCHITECTURE.md](architecture.md)

---

## D-009：不使用第三方 UI 库

**日期**：2026-05-31

**决策**：MVP 只用 TailwindCSS + 少量自定义组件，不引入 Radix UI / shadcn/ui / Headless UI。

**背景**：每引入一个 UI 库就增加一个长期维护依赖。二次元温暖风格可以通过 TailwindCSS 实现，不需要组件库来定义视觉风格。

**替代方案**：
- 方案 A：shadcn/ui → 暂缓。组件质量高，但引入了 Radix 依赖链。MVP 的 UI 复杂度不需要。
- 方案 B：Headless UI → 暂缓。无障碍支持好，但体积和依赖不是零。

**影响**：所有 UI 组件手写。遇到无障碍问题时再评估是否引入 Headless UI。

**来源**：[MVP_v0.1.md](MVP_v0.1.md)

---

## D-010：Prisma 5 而非 Prisma 7

**日期**：2026-05-31

**决策**：使用 Prisma 5.22.0，暂不升级到 Prisma 7。

**背景**：Phase 0.1 初始化时，npm 默认安装了 Prisma 7.8.0。Prisma 7 移除了 schema 中的 `url` 字段，要求使用 `prisma.config.ts` 和 adapter 模式。这增加了配置复杂度，且 Prisma 7 的文档和社区资源不如 5.x 丰富。

**替代方案**：
- 方案 A：使用 Prisma 7 → 暂时拒绝。新配置模式增加了理解成本，对 MVP 没有收益。
- 方案 B：使用 Prisma 6 → 可选。Prisma 6 仍支持传统 url 配置。但 5.x 是更成熟的 LTS 选择。

**影响**：`prisma/schema.prisma` 中使用传统 `url = env("DATABASE_URL")` 格式。未来升级 Prisma 7+ 时需迁移配置方式。

**来源**：Phase 0.1 开发过程中的实时决策

---

## D-011：快照系统

**日期**：2026-05-31

**决策**：在 Git 之上建立人类可读的快照系统（`snapshots/` 目录 + `CHANGELOG.md` + `Timeline.md`）。

**背景**：Git 是强大的版本控制工具，但对非程序员不友好。用户希望"点击日期就能恢复"，而不是记 Git Hash。快照系统在 Git 之上提供了一层人类可读的抽象。

**替代方案**：
- 方案 A：只用 Git → 拒绝。不符合"图形化和人类可读"的目标。
- 方案 B：GitHub Desktop → 部分采纳。作为辅助工具，但不作为主要界面。
- 方案 C：自建 Git GUI → 远期目标。开发成本太高，不属于 MVP。

**影响**：每次任务完成后必须创建快照。`snapshot.md` 供人阅读，`metadata.json` 供程序读取。恢复操作通过 AI 辅助或手动 Git 命令完成。

**来源**：项目时间线系统建设决策

---

## D-012：AI 边界

**日期**：2026-05-31

**决策**：AI 只做辅助（摘要、标签建议、回忆关联），不做核心内容生产。

**背景**：Digital Garden 的核心是"人"的记录和成长，不是"AI 生成的文字"。如果 AI 替代了人的思考和书写，项目就失去了意义。

**替代方案**：
- 方案 A：AI 自动写日记 → 拒绝。违背"记录优先"原则。
- 方案 B：AI 替代用户组织内容结构 → 拒绝。用户应该主导自己的内容组织。
- 方案 C：不用 AI → 拒绝。AI 作为辅助工具（摘要、提醒、关联提示）有价值，不应完全排除。

**影响**：AI 功能（Phase 5 / v0.6）的设计必须遵循"辅助而非替代"原则。AI 的输出始终是建议，由用户决定是否采纳。

**来源**：[README.md](../README.md) [ARCHITECTURE.md](architecture.md)

---

## D-013：Git 作为唯一时间事实源

**日期**：2026-05-31

**决策**：项目中所有时间记录必须以 Git commit timestamp 为唯一合法来源。CHANGELOG、Snapshot metadata、Timeline 中的时间必须从 git log 提取，禁止 AI 生成或手写时间。

**背景**：项目早期的 CHANGELOG 和 Snapshot 时间由 AI 生成（例如 "2026-05-31 09:15"），与实际的 Git commit timestamp（10:17）存在系统性偏差（30-60 分钟）。这导致：时间线不可信、审计不可行、无法从文档时间回推到 commit。

**替代方案**：
- 方案 A：保持现状，AI 继续生成时间 → 拒绝。时间不可靠的系统不具备审计能力。
- 方案 B：混合来源（git + AI + 手写）→ 拒绝。多来源导致一致性不可保证。
- 方案 C：单一来源（git only）→ 采纳。创建审计脚本自动校验和修复。

**影响**：
- 新增 `scripts/audit-engine.mjs`：时间一致性自动校验和修复
- CHANGELOG.md 按 git log 顺序重建（oldest → newest，单调递增）
- 所有 snapshot metadata.json 增加 `timestamp_source: "git"` 字段
- BUILD_RULES.md 新增 §9 时间系统规则
- 未来所有时间记录必须来自 git，AI 不得自行生成时间

**来源**：System Upgrade v2 — Git-Driven Audit Engineering

---

## 决策格式说明

每个决策包含：

- **日期**：决策时间
- **决策**：一句话概括
- **背景**：为什么要做这个决策
- **替代方案**：考虑过哪些其他方案，以及为什么拒绝
- **影响**：这个决策对项目意味着什么
- **来源**：关联的文档或快照

---

> **不做决策也是一种决策。**
>
> 当你不确定时，先记录"暂不决定"和"等待更多信息"。
