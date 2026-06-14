# BUILD_RULES.md

> Digital Garden 开发约束文档。
>
> 目的：约束 AI 和开发者的行为，防止自由发挥导致项目偏离方向。
>
> 本文件是所有开发活动的最高行为规范。

---

## 1. 开发原则

### 原则一：MVP 优先

当前阶段的唯一目标是完成 [MVP_v0.1.md](./MVP_v0.1.md) 定义的范围。

任何不属于 MVP 的功能——即使"实现起来很简单"——也不做。

**判断标准**：打开 MVP_v0.1.md → 查看"三、功能范围 → 包含"表格。不在表里的，不做。

### 原则二：最小依赖

能用浏览器原生 API 解决的，不引入库。
能用 TailwindCSS 解决的，不引入组件库。
能用 Prisma 原生查询的，不引入 ORM 上层封装。

**引入新依赖的前置条件**（必须同时满足）：
1. 该能力确实无法用已有依赖实现
2. 该能力属于当前 Phase 的必需功能
3. 依赖体积 < 50KB（gzipped）
4. 依赖有活跃维护（最近 3 个月有 commit）

违反任一条件 → 寻找替代方案或暂缓。

### 原则三：不提前实现未来功能

这是最容易犯的错误。

当你发现"这里加一个钩子就能支持未来的 Wikilink"——不要加。

当你发现"这个字段以后 AI 会用"——不要加。

当你发现"这个接口设计成泛化的，以后好扩展"——不要泛化。

**未来功能的唯一正确归宿是 ROADMAP.md，不是当前代码。**

### 原则四：不为了"优雅"重构已工作的代码

满足以下条件的代码，**禁止重构**：
- 已通过 Phase 验收
- 没有 Bug
- 不影响当前 Phase 的开发

"这样写更优雅"、"这个模式更标准"、"以后好维护"——这些理由不成立。

**唯一允许重构的情况**：不重构就无法实现当前 Phase 的功能。

### 原则五：不因个人偏好修改架构文档

[ARCHITECTURE.md](./architecture.md) 是经过设计的架构决策，不是建议。

如果你认为某个架构决策有问题：
1. 在开发日志中记录
2. 继续按 ARCHITECTURE.md 执行
3. 在 Phase 验收时提出讨论

**不得在开发过程中擅自偏离架构设计。**

---

## 2. 文档优先级

当多份文档对同一问题有不同描述时，按以下优先级裁决：

| 优先级 | 文档 | 说明 |
|--------|------|------|
| **1（最高）** | README.md / PRODUCT.md | 项目愿景与设计原则。定义"这个项目是什么、不是什么"。 |
| **2** | ARCHITECTURE.md | 技术架构决策。定义"怎么做"。 |
| **3** | ROADMAP.md | 开发阶段规划。定义"什么时候做"。 |
| **4** | MVP_v0.1.md | 当前版本的具體任务。定义"现在做什么"。 |

### 冲突裁决规则

```
如果 README.md 说"不是博客"，
而你在做一个"文章列表页"——
你错了，README.md 覆盖你。

如果 ARCHITECTURE.md 说"双存储（content + contentMd）"，
而你觉得"先用 content 就行"——
你错了，ARCHITECTURE.md 覆盖你。

如果 ROADMAP.md 说图片系统在 Phase 2，
而你觉得"图片上传很简单先做了吧"——
你错了，ROADMAP.md 覆盖你。

如果 MVP_v0.1.md 说设置页只有主题切换，
而你觉得"再加个字体设置也不难"——
你错了，MVP_v0.1.md 覆盖你。
```

### 文档冲突时的处理流程

1. 标记冲突点
2. 按优先级执行高优先级文档
3. 在任务汇报中注明冲突及处理方式
4. **不要自行修改文档来解决冲突**——文档修改需要人工决策

---

## 3. AI 开发约束

### 3.1 禁止行为（红线）

以下行为**绝对禁止**，没有例外：

| 禁止行为 | 示例 |
|----------|------|
| **擅自增加功能** | "我顺便加了个草稿恢复面板。"——禁止。 |
| **擅自修改数据库结构** | "我加了个 `pinned` 字段，以后置顶会用。"——禁止。 |
| **擅自引入大型依赖** | "我装了 Radix UI，组件更专业。"——禁止。 |
| **擅自重构已验收模块** | "Phase 1 的 Entry 创建我重写了一下，更符合 Clean Architecture。"——禁止。 |
| **擅自修改架构文档** | "我把 ARCHITECTURE.md 里的双存储改成单存储了，更简单。"——禁止。 |
| **擅自跨 Phase 开发** | "Phase 1 还没验收，但我先把 Phase 2 的搜索做了。"——禁止。 |
| **擅自改变命名规范** | "`/plant` 不太好理解，我改成 `/new` 了。"——禁止。ARCHITECTURE.md 定义的路由不可改。 |

### 3.2 必须行为

| 必须行为 | 说明 |
|----------|------|
| **逐任务汇报** | 每完成一个子任务（Phase X.Y），立即汇报，不等下一个。 |
| **等待确认** | 汇报后等待人工确认，再进入下一个子任务。不可连续推进。 |
| **输出变更摘要** | 每次汇报包含：完成了什么、修改了哪些文件、如何验证。 |
| **标明修改文件** | 使用完整的相对路径列出所有被修改的文件。 |
| **遵循 Phase 顺序** | Phase 0 → Phase 1 → Phase 2。不可跳跃，不可并行跨 Phase 开发。 |
| **读文档再动手** | 每次新对话开始，必须先读取 BUILD_RULES.md 和当前 Phase 对应的文档。 |

### 3.3 汇报模板

每完成一个子任务，使用以下格式汇报：

```markdown
## 完成：Phase X.Y — [子任务名称]

### 完成内容
[具体做了什么]

### 修改文件
- `src/xxx/xxx.ts` — [改了什么]
- `src/xxx/xxx.tsx` — [改了什么]

### 运行结果
[运行了什么命令，输出是什么]

### 如何验证
1. [验证步骤 1]
2. [验证步骤 2]

### 下一步
Phase X.Y+1 — [下一个子任务名称]
```

---

## 4. 开发节奏

### 4.1 Phase 锁定

当前开发**严格锁定**在 [MVP_v0.1.md](./MVP_v0.1.md) 定义的阶段：

```
Phase 0：项目地基        ← 当前从这里开始
Phase 1：核心记录体验
Phase 2：可靠性与可发现性
```

### 4.2 阶段切换条件

| 从 | 到 | 条件 |
|----|----|------|
| Phase 0 | Phase 1 | Phase 0 全部子任务完成 + 所有完成标准通过 + 人工确认 |
| Phase 1 | Phase 2 | Phase 1 全部子任务完成 + 所有完成标准通过 + 人工确认 |
| Phase 2 | 结束 | Phase 2 全部子任务完成 + MVP 验收标准全部通过 + 3 天使用验证 |

### 4.3 禁止的行为

- **跨阶段开发**：Phase 0 没结束，不碰 Phase 1 的编辑器
- **提前优化**：Phase 0 的数据查询不需要加缓存，"以后数据多了会慢"不是理由
- **过度抽象**：Phase 0 不需要"可扩展的插件系统"

### 4.4 每个 Phase 内部的执行顺序

子任务按编号顺序执行（0.1 → 0.2 → 0.3 → ...）。

如果某个子任务不依赖前一个子任务，可以在单次汇报中提出并行方案，但必须：
1. 先说明理由
2. 得到确认后再并行执行

---

## 5. 验收机制

### 5.1 子任务验收

每个子任务完成后：
1. 开发者（人或 AI）输出汇报
2. 人工审查变更内容
3. 人工按照"完成标准"逐项验证
4. 通过 → 进入下一个子任务
5. 不通过 → 修改后重新验收

### 5.2 Phase 验收

每个 Phase 全部子任务完成后：
1. 对照该 Phase 的"完成标准"逐项检查
2. 运行 `npm run build` 确认无编译错误
3. 人工手动走一遍该 Phase 覆盖的用户故事
4. 通过 → 进入下一个 Phase

### 5.3 MVP 最终验收

Phase 2 结束后，对照 MVP_v0.1.md 第七章"验收标准"：
1. 逐项勾选核心闭环
2. 逐项检查体验要求
3. 连续使用 3 天
4. 全部通过 → MVP v0.1 完成

### 5.4 验收失败的处理

如果验收不通过：
1. 明确记录失败项
2. 修复（只修复失败项，不夹带其他改动）
3. 重新验收
4. 重复直到通过

---

## 6. 技术约束速查

### 6.1 技术栈锁定

以下技术选型来自 ARCHITECTURE.md，**不可更改**：

| 层级 | 技术 | 说明 |
|------|------|------|
| 框架 | Next.js (App Router) | 不可换成 Pages Router 或 Remix |
| 语言 | TypeScript (strict) | 不可用 `any` 绕过类型检查 |
| 样式 | TailwindCSS | 不可引入 CSS-in-JS 方案 |
| 动画 | Framer Motion | 动画需求统一用此库 |
| 编辑器 | TipTap | 不可换成 Slate / Quill / Lexical |
| ORM | Prisma | 不可换成 Drizzle / TypeORM |
| 数据库 | SQLite → PostgreSQL | 开发期 SQLite，不可换成 MySQL |
| 后端 | Server Actions | 不可创建 `/api/*` Route Handler |

### 6.2 目录结构约束

遵循 Next.js App Router 约定：

```
src/
  app/
    page.tsx              # / 首页
    garden/
      page.tsx            # /garden 花园页
    plant/
      page.tsx            # /plant 新建
    entry/
      [slug]/
        page.tsx          # /entry/[slug] 详情
        edit/
          page.tsx         # /entry/[slug]/edit 编辑
    settings/
      page.tsx            # /settings 设置
  components/
    ui/                   # 通用 UI 组件
    editor/               # 编辑器相关组件
    entry/                # Entry 相关组件
  lib/
    prisma.ts             # Prisma 客户端
    markdown.ts           # TipTap JSON ↔ Markdown
    upload.ts             # 图片上传
    search.ts             # 搜索
  actions/
    entry.ts              # Entry Server Actions
    asset.ts              # Asset Server Actions
prisma/
  schema.prisma           # 数据模型
```

### 6.3 命名约束

| 事项 | 约束 | 来源 |
|------|------|------|
| 路由 | 使用 ARCHITECTURE.md 定义的路由名称 | ARCHITECTURE.md §7 |
| 模型 | 使用 ARCHITECTURE.md 定义的实体名 | ARCHITECTURE.md §5 |
| 类型枚举 | `EntryType` = Memory / Thought / Emotion / Dream / Story / Learning | README.md |
| 文件夹 | 小写 + 连字符（Next.js 约定） | - |

---

## 7. 违规处理

### 7.1 自查清单

每次提交代码前，开发者应自查：

- [ ] 我实现的功能在 MVP_v0.1.md 的"包含"清单里吗？
- [ ] 我引入新依赖了吗？（如果是，满足前置条件吗？）
- [ ] 我修改了数据库 Schema 吗？（如果是，在 MVP 范围内吗？）
- [ ] 我重构了已验收的代码吗？（如果是，有必要吗？）
- [ ] 我修改了架构文档吗？（如果是，经过人工确认吗？）
- [ ] 我遵循了当前 Phase 的边界吗？
- [ ] 我更新了 CHANGELOG.md 吗？
- [ ] 我创建了 snapshot 吗？
- [ ] 我完成了 Git Commit 吗？

### 7.2 AI 开发者的额外约束

AI 开发者在每轮对话中：

1. **第一件事**：读取 BUILD_RULES.md
2. **每次工具调用前**：确认该调用不违反任何禁止行为
3. **每次汇报时**：附上自查清单的结果
4. **不确定时**：先问，不要猜

---

## 8. 版本控制规则

### 8.1 每次任务完成后的强制流程

每完成一个开发任务（一个子任务或一个 Phase 验收通过），AI 开发者必须**按顺序**执行：

```
1. 更新 CHANGELOG.md
2. 创建 Snapshot（snapshots/日期_名称/snapshot.md + metadata.json）
3. Git Commit
4. 输出时间线记录
5. 等待用户确认
```

**此流程不可跳过、不可合并、不可省略。**

未经人工确认，不得进入下一任务。

### 8.2 CHANGELOG 更新规范

- 每次更新 CHANGELOG 追加到文件顶部（最新记录在最上面）
- 格式：日期时间 → 阶段 → 内容 → 文件 → 状态 → 快照链接
- 状态标记：⏳ 等待确认 / ✅ 已确认 / ❌ 已回滚

### 8.3 Snapshot 创建规范

- 目录命名：`snapshots/YYYY-MM-DD_短名称/`
- 每个 snapshot 目录必须包含：
  - `snapshot.md`：时间、阶段、完成内容、修改文件、备注（回答"做了什么"）
  - `metadata.json`：timestamp、phase、description、files[]、status、parent_snapshot、roadmap_phase、mvp_version、confirmed、commit、recoverable（回答"何时/何阶段/可恢复吗"）
  - `conversation.md`：背景、决策、原因、影响（回答"为什么这么做"）
- 快照是**不可变**的：创建后不应修改（除非修正笔误）
- **一快照一 Commit**：每个 Snapshot 必须对应一个独立的 Git Commit。多个 Snapshot 共用同一个 Commit 视为违规。
- Commit message 中必须包含快照名称，例如：`[Version System] 2026-05-31_version-system-complete`

### 8.4 Git Commit 规范

- Commit message 格式：`[Phase X.Y] 简短描述`
- 例如：`[Phase 0.1] 项目初始化：Next.js + TypeScript + Prisma`
- 每个任务一个 Commit，不累积多个任务
- Commit 后记录 hash 到 CHANGELOG 和 snapshot metadata

### 8.5 时间线同步

每次任务完成后，检查 [Timeline.md](Timeline.md) 是否需要更新：
- 如果完成了某个 Phase：更新里程碑状态
- 如果有新的重要节点：追加到时间线

---

> **这些规则的存在，不是为了限制创造力，而是为了确保创造力的方向正确。**
>
---

## 9. 时间系统规则（Git SSOT）

### 9.1 核心原则

**Git 是整个项目唯一的合法时间来源。**

- ✅ 合法时间来源：`git log --format="%aI"`（commit timestamp）
- ✅ 辅助来源：`Date.now()`（运行时时间）、文件系统 timestamp（仅供引用）
- ❌ 禁止来源：AI 生成时间、推测时间、手写时间、"合理看起来的时间"

### 9.2 CHANGELOG 时间约束

- 所有条目的时间字段必须来自它引用的 Git commit timestamp
- 条目顺序必须与 git log 顺序一致（oldest → newest，单调递增）
- 禁止出现未来时间
- 禁止出现倒序时间

### 9.3 Snapshot 时间约束

- `metadata.json` 的 `timestamp` 必须等于对应 commit 的 timestamp
- `timestamp_source` 字段必须为 `"git"`
- 如果 timestamp 不匹配，审计引擎（`scripts/audit-engine.mjs`）将标记为 WARN
- 运行 `node scripts/audit-engine.mjs --fix` 可自动修复

### 9.4 审计要求

每次提交前建议运行：

```bash
node scripts/audit-engine.mjs
```

确保 0 errors。Warnings 应在下次提交时批量修复。

### 9.5 禁止行为

- ❌ AI 生成时间写入任何文档
- ❌ 推测时间补历史日志
- ❌ 人工调整时间顺序
- ❌ 补"看起来应该是 X 点"的记录
- ❌ 在没有对应 Git commit 的情况下创建 Recoverable Snapshot

---

> Digital Garden 不是一次写完的，是慢慢生长的。
>
> 规则保护的不是代码，而是时间——确保一年后，这个项目不会变成一座屎山。
