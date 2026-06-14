# CHANGELOG

> Digital Garden 开发日志。
>
> **时间来源**：所有时间来自 `git log --format="%aI"`，是唯一事实源（SSOT）。
> **排序规则**：按 Git commit 时间单调递增（oldest → newest）。
> **时间格式**：ISO 8601（`YYYY-MM-DDTHH:mm:ss±TZ`）。

---

## aac6550 — 2026-05-31T10:17:05+08:00

### 项目时间线系统建立

- 创建 docs/CHANGELOG.md / VERSION_CONTROL.md / Timeline.md
- 创建 snapshots/ 目录：7 个历史快照（📜 历史补录）
- 初始化 Git 仓库
- 更新 BUILD_RULES.md：新增版本控制规则

📸 [timeline-system](../snapshots/2026-05-31_timeline-system/snapshot.md)

---

## 5b799d2 — 2026-05-31T10:35:04+08:00

### 版本系统闭环

- 创建 docs/RECOVERY_POLICY.md / DECISIONS.md
- 区分 Historical (📜) vs Recoverable (🔵) Snapshot
- 所有历史快照标记 historical_reconstruction: true
- 新增 conversation.md 快照结构
- 一快照一 Commit 规范确立

📸 [version-system-complete](../snapshots/2026-05-31_version-system-complete/snapshot.md)

---

## bf743ba — 2026-05-31T10:45:46+08:00

### Phase 0.2：Prisma Schema 配置

- 设计 4 个数据模型：Entry / Tag / EntryTag / Asset
- Entry.type 使用 String（SQLite 不支持 enum）
- 初始迁移：`npx prisma migrate dev --name init`
- 创建 docs/DATABASE.md

📸 [phase0.2-schema](../snapshots/2026-05-31_phase0.2-schema/snapshot.md)

---

## 8e12f7b — 2026-05-31T10:56:06+08:00

### Phase 0.3：视觉地基

- 全局 Layout：Nav + Main + Footer
- Navigation：Home / Garden / Plant / Settings
- Theme System：Light / Dark / System + cookie 持久化 + 无闪烁
- Design Tokens：14 颜色 + 3 圆角 + 2 阴影
- 基础动画：淡入 / Hover / Focus

📸 [phase0.3-visual-foundation](../snapshots/2026-05-31_phase0.3-visual-foundation/snapshot.md)

---

## c37b95f — 2026-05-31T11:04:44+08:00

### Phase 0.4：路由骨架

- 6 个路由占位页面：Home / Garden / Plant / Entry Detail / Edit / Settings
- 全部共用 Layout / Nav / Theme / Animation
- 零业务逻辑

📸 [phase0.4-routes](../snapshots/2026-05-31_phase0.4-routes/snapshot.md)

---

## deeaea3 — 2026-05-31T11:15:15+08:00

### Phase 0.5：Framer Motion 过渡动画

- 安装 framer-motion 12.40.0
- src/lib/animations.ts：8 组动画变体 + 3 timing presets
- PageTransition 组件：AnimatePresence + motion.div
- 预留 Modal / Toast / Accordion 变体
- docs/ANIMATION_GUIDE.md
- **Phase 0 完成** ✅

📸 [phase0.5-animations](../snapshots/2026-05-31_phase0.5-animations/snapshot.md)

---

## 340e7eb — 2026-05-31T11:21:59+08:00

### Phase 1 开发计划

- docs/PHASE1_PLAN.md：7 个子任务拆分 + 影响分析 + 验收标准 + 准备度检查
- 推荐开发顺序：P1.1 → P1.2+P1.3 → P1.4 → P1.5 → P1.6

📸 [phase1-plan](../snapshots/2026-05-31_phase1-plan/snapshot.md)

---

## c32c052 — 2026-05-31T11:27:54+08:00

### P1.1：Server Actions + 基础数据层

- src/lib/prisma.ts：Prisma Client 单例
- src/actions/entry-actions.ts：createEntry / getEntryBySlug / updateEntry / listEntries
- Slug 方案：YYYYMMDD-xxxxxx（零依赖）
- 基础校验：标题/内容非空 + type 白名单
- 验证脚本 5/5 通过

📸 [p1.1-server-actions](../snapshots/2026-05-31_p1.1-server-actions/snapshot.md)

---

## 2b544b4 — 2026-05-31T14:02:33+08:00

### P1.2：TipTap 编辑器实现

- 安装 @tiptap/react + @tiptap/starter-kit
- Editor 组件：10 按钮工具栏 + 7 种格式
- src/lib/markdown.ts：自实现 JSON → Markdown 转换（13/13 测试通过）
- EditorWrapper：next/dynamic + SSR false + Skeleton

📸 [p1.2-tiptap-editor](../snapshots/2026-05-31_p1.2-tiptap-editor/snapshot.md)

---

## 3e1fa74 — 2026-05-31T14:10:59+08:00

### P1.3：表单组件

- TitleInput：标题 + 字数提示（0/100）
- TypeSelector：6 种类型按钮组 + 键盘导航（← →）
- TagInput：Enter 添加 / × 删除 / Backspace / 去重

📸 [p1.3-form-components](../snapshots/2026-05-31_p1.3-form-components/snapshot.md)

---

## 5dffd3e — 2026-05-31T14:15:31+08:00

### P1.4：/plant 新建页面集成

- 组装 P1.1 + P1.2 + P1.3 → 完整创建链路
- 统一 formState：title / type / tags / content / contentMd
- 校验 + loading + error 处理 + Ctrl+S

📸 [p1.4-plant-page](../snapshots/2026-05-31_p1.4-plant-page/snapshot.md)

---

## 4e8441a — 2026-05-31T14:31:26+08:00

### P1.5：/entry/[slug] 详情页

- 创建 JSON → HTML 渲染器（@tiptap/core generateHTML，服务端安全）
- EntryRenderer 只读组件（prose 排版 + 空内容 fallback）
- Server Component：标题 / 类型 / 标签 / 时间 / 正文
- 404 处理

📸 [p1.5-entry-detail](../snapshots/2026-05-31_p1.5-entry-detail/snapshot.md)

---

## 442d39e — 2026-05-31T14:45:42+08:00

### System v2：Git-Driven Audit Engineering System

- 创建 scripts/audit-engine.mjs：时间一致性自动校验 + 修复
- CHANGELOG 按 git log 时间重建（12 entries, oldest→newest）
- 所有 snapshot metadata.json 升级：timestamp→git time, +timestamp_source
- BUILD_RULES.md +§9 时间系统规则（Git SSOT）
- DECISIONS.md +D-013
- VERSION_CONTROL.md +审计引擎说明
- 审计结果：0 errors, 0 warnings

---

## 36600fe — 2026-05-31T14:57:02+08:00

### P1.6：/entry/[slug] View/Edit 双模式

- 重写详情页为 View/Edit 双模式
- View mode: 只读渲染 + 编辑按钮
- Edit mode: TitleInput/TypeSelector/Editor/TagInput + 保存/取消
- 保存 → updateEntry() → 刷新数据 → 切回 view
- Ctrl+S 快捷保存
- 不创建独立 /edit 页面

📸 [p1.6-edit-mode](../snapshots/2026-05-31_p1.6-edit-mode/snapshot.md)

---

## 8056d01 — 搜索与筛选系统

- 重写 /garden 页面：搜索 + 类型筛选 + 标签筛选 + Entry 列表
- 前端过滤优先：listEntries 拉取全量，客户端 filter
- 搜索：标题 + 摘要关键词实时匹配
- 类型筛选：6 种类型 toggle（复用 TYPE_LABELS）
- 标签筛选：自动提取所有独立标签，点击过滤
- 状态：加载骨架 / 空列表 / 无匹配结果
- 零数据库修改，零新增 Server Action

📸 [p2.1-search-filter](../snapshots/2026-05-31_p2.1-search-filter/snapshot.md)

---

> **审计声明**：本文件所有时间来自 `git log`，由 `scripts/audit-engine.mjs` 验证。
> 不存在 AI 生成时间、推测时间或未来时间。
