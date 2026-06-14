# 项目时间线

> Digital Garden 的成长轨迹。
>
> 从第一份文档到最终愿景，每一步都记录在这里。

---

## 图例

| 标记 | 含义 |
|------|------|
| 📜 | 历史快照（根据文档补录，可阅读，不可恢复） |
| 🔵 | 可恢复快照（有独立 Git Commit，可一键恢复） |

---

## 2026-05-31

```
09:15 ── 🌱 项目诞生 📜
  │     创建 README.md + PRODUCT.md
  │     定义了"这个项目是什么、不是什么"
  │     📸 snapshots/2026-05-31_project-birth/
  │
09:21 ── 🗺️ 路线图设计 📜
  │     创建 ROADMAP.md
  │     规划 Phase 0 ~ Phase 8 共 9 个阶段
  │     📸 snapshots/2026-05-31_roadmap-design/
  │
09:22 ── 🏗️ 架构设计 📜
  │     创建 ARCHITECTURE.md
  │     确定技术选型、系统分层、核心实体
  │     📸 snapshots/2026-05-31_architecture-design/
  │
09:33 ── 📋 MVP 设计 📜
  │     创建 MVP_v0.1.md
  │     定义第一个可用版本的范围与任务
  │     📸 snapshots/2026-05-31_mvp-design/
  │
09:50 ── 📐 开发规范 📜
  │     创建 BUILD_RULES.md
  │     建立 AI 开发约束与验收机制
  │     📸 snapshots/2026-05-31_build-rules/
  │
10:02 ── ⚙️ Phase 0.1 项目初始化 📜
  │     Next.js + TypeScript + TailwindCSS + Prisma
  │     项目从文档进入代码
  │     📸 snapshots/2026-05-31_phase0.1-init/
  │
10:15 ── 🕰️ 时间线系统建立 📜
  │     创建 CHANGELOG / Snapshot / Timeline / VERSION_CONTROL
  │     项目拥有了历史记录能力
  │     📸 snapshots/2026-05-31_timeline-system/
  │
11:00 ── 📜 治理文档完善 📜
  │     创建 DECISIONS.md（12 条决策）
  │     升级 metadata.json 结构
  │     新增 Rescue Snapshot 机制
  │     📸 待独立快照
  │
11:15 ── 🔒 版本系统闭环 🔵
  │     创建 RECOVERY_POLICY.md
  │     区分 Historical vs Recoverable Snapshot
  │     首个真正可恢复的快照
  │     📸 snapshots/2026-05-31_version-system-complete/  ← 第一个 🔵
  │
  ▼
  现在
```

> 📜 以上带 📜 的快照为历史补录，共用 Commit `aac6550`，可阅读但不可独立恢复。
>
> 🔵 从 `version-system-complete` 开始，每个快照拥有独立 Commit，可精确恢复。

---

## 下一站

```
  ▼
  现在
  │
  ├── 🔵 版本系统已闭环（一快照一 Commit）
  │
  ├── ⏳ Phase 0.2: Prisma Schema 配置
  ├── ⏳ Phase 0.3: 全局布局与主题
  ├── ⏳ Phase 0.4: 路由骨架
  ├── ⏳ Phase 0.5: 页面过渡动画
  │
  ▼
  Phase 0 完成
  │
  ▼
  Phase 1: 核心记录体验
```

---

## 里程碑

| 里程碑 | 状态 | 时间 | 含义 |
|--------|------|------|------|
| 📄 文档体系完成 | ✅ | 2026-05-31 | 5 份核心文档就绪 |
| 🔒 版本系统闭环 | ⏳ | 本次完成 | 一快照一 Commit，真实可恢复 |
| 🏗️ Phase 0 完成 | ⏳ | 待定 | 项目骨架搭建完毕，所有路由可访问 |
| ✍️ Phase 1 完成 | ⏳ | 待定 | 可以创建、编辑、保存、查看内容 |
| 🏠 MVP v0.1 完成 | ⏳ | 待定 | 第一个真正可用的版本，愿意每天打开 |
