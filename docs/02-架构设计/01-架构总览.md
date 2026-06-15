# ARCHITECTURE.md

# Digital Garden 架构设计文档

Version: 1.0

---

# 1. 架构目标

Digital Garden 是一个私人数字花园。

它的架构目标不是追求复杂，而是追求：

- 长期可维护
- 内容可迁移
- 记录体验流畅
- 页面结构清晰
- 功能逐步扩展
- 不被单一编辑器或平台锁死

系统的核心不是“网页”，而是“内容”。

---

# 2. 架构原则

## 2.1 内容优先

所有能力都应服务于内容记录、保存、回顾与成长。

## 2.2 单人优先

当前阶段只面向单用户，不考虑多租户、多协作、权限系统复杂化。

## 2.3 渐进增强

先做基础体验，再逐步增加富媒体、时光机、AI、关联网络。

## 2.4 可迁移

核心内容必须保留 Markdown 兼容输出能力，避免绑定私有格式。

## 2.5 低耦合

编辑器、首页、图片、AI、历史版本彼此分层，不互相绑死。

---

# 3. 系统分层

推荐采用以下分层方式：

## 3.1 展示层（UI Layer）

负责：

- 首页
- 花园浏览页
- 编辑页
- 时光机页
- 设置页

特点：

- 负责交互和视觉
- 不直接操作数据库
- 通过动作层调用数据能力

## 3.2 组件层（Component Layer）

负责：

- 花园卡片
- 编辑器
- 图片上传按钮
- Slash Menu
- 时间问候
- 回忆卡片
- 封面图展示

特点：

- 可复用
- 与具体页面解耦
- 由 props 驱动

## 3.3 业务层（Action / Service Layer）

负责：

- 创建 Entry
- 更新 Entry
- 删除 Entry
- 查询 Entry
- 处理图片上传
- 生成摘要
- 生成导出内容
- 处理历史版本

特点：

- 集中管理业务逻辑
- 页面不直接写数据库逻辑
- 便于后续切换实现方式

## 3.4 数据层（Data Layer）

负责：

- Prisma Schema
- 数据库模型
- 内容存储
- 关系存储
- 历史版本存储
- 附件存储

特点：

- 结构明确
- 可迁移
- 可扩展

---

# 4. 核心技术栈

## 前端

- Next.js
- React
- TypeScript
- TailwindCSS
- Framer Motion

## 编辑器

- TipTap

## 数据库

- PostgreSQL 或 SQLite（开发期）
- Prisma ORM

## AI

- DeepSeek API

## 文件存储

- 本地开发存储
- 未来可切换对象存储

---

# 5. 核心业务对象

## 5.1 Entry

Entry 是整个系统最重要的内容实体。

它代表一条记录，可以是：

- Memory
- Thought
- Emotion
- Dream
- Story
- Learning

### 关键字段

- id
- title
- slug
- type
- content
- contentMd
- excerpt
- coverImage
- galleryImages
- tags
- isPrivate
- createdAt
- updatedAt
- tendedAt
- deletedAt（如需要软删除）

### 说明

Entry 是数字花园中的一棵植物。

---

## 5.2 Asset

Asset 是附件实体。

用于存放：

- 图片
- 音频
- 视频
- 文件
- 外部资源引用

### 关键字段

- id
- url
- type
- mimeType
- fileName
- fileSize
- width
- height
- duration
- createdAt

### 说明

Asset 与 Entry 解耦，方便未来相册、附件和嵌入扩展。

---

## 5.3 Link

Link 是内容之间的关系实体。

用于支持：

- 内容引用
- 双向链接
- 后续知识关联

### 关键字段

- id
- sourceEntryId
- targetEntryId
- relationType
- createdAt

### relationType 示例

- reference
- mention
- related
- parent
- child

### 说明

当前不强制依赖 Link，但需要为未来 Backlinks 和关联网络预留。

---

## 5.4 Tag

Tag 用于轻量分类。

### 说明

Tag 不承担复杂结构，只负责帮助检索和整理。

---

# 6. 页面架构

## 6.1 首页 Home

目标：

进入花园的第一眼。

内容：

- 时间问候
- 今日种子
- 花园状态
- 最近记录
- 回忆绽放

## 6.2 花园页 Garden

目标：

浏览和筛选内容。

内容：

- 类型筛选
- 标签筛选
- 搜索
- 卡片流
- 时间排序

## 6.3 编辑页 Editor

目标：

记录内容。

内容：

- TipTap 编辑器
- Slash Menu
- 图片插入
- 自动保存
- 历史版本入口
- 元数据栏

## 6.4 详情页 Entry Detail

目标：

阅读和回顾。

内容：

- 内容正文
- 封面图
- 标签
- 创建时间
- 关联内容预留区

## 6.5 时光机 Timeline

目标：

回看过去。

内容：

- 去年今日
- 历史同日
- 月度回顾
- 年度回顾

## 6.6 设置页 Settings

目标：

个性化与系统管理。

内容：

- 主题
- 外观
- 数据导出
- 备份
- AI 配置

---

# 7. 路由建议

建议路由结构：

- /                首页
- /garden          花园页
- /entry/[slug]    内容详情页
- /entry/[slug]/edit  编辑页
- /plant           新建内容页
- /timeline        时光机
- /settings        设置页
- /archive         归档页（可后置）

---

# 8. 数据流

## 8.1 创建内容

1. 用户进入编辑页
2. 输入标题与正文
3. 编辑器自动生成 TipTap JSON
4. 同步生成 Markdown
5. 提取摘要和封面图
6. 保存到数据库

## 8.2 浏览内容

1. 首页或花园页加载列表
2. 请求摘要、封面、类型、标签、时间
3. 点击后进入详情页
4. 详情页渲染 content 或 contentMd

## 8.3 图片流程

1. 用户拖拽 / 粘贴 / 点击上传
2. 文件上传到存储
3. 返回 URL
4. 插入编辑器光标位置
5. 保存后写入 Asset 或 content 中引用

## 8.4 历史版本流程

1. 每次保存生成快照
2. 记录版本号和时间
3. 用户可查看历史版本
4. 支持恢复到指定版本

---

# 9. 内容存储策略

## 双存储方案

- content：TipTap JSON
- contentMd：Markdown

### 原因

- content 保证编辑器精确还原
- contentMd 保证导出、迁移、检索方便
- 两者互为备份

## 摘要字段

excerpt 单独存储。

### 用途

- 首页卡片
- 搜索结果
- 推荐列表
- 回忆绽放

---

# 10. 版本系统

历史版本是这个项目的重要能力。

## 设计建议

每次保存 Entry 时：

- 记录当前内容快照
- 记录时间
- 记录是否手动保存
- 记录是否自动保存

## 版本能力目标

- 自动保存不丢失
- 可查看历史版本
- 可回滚
- 可比较变化

---

# 11. AI 边界

AI 不是核心内容生产者。

AI 只做辅助：

- 摘要
- 标签建议
- 分类建议
- 回忆整理
- 关系提示
- 成长分析

AI 不应主导内容结构。

---

# 12. 性能与体验要求

## 编辑体验

- 输入不卡顿
- 中文输入法兼容
- 粘贴稳定
- 撤销重做正常
- 自动保存及时

## 页面体验

- 动画轻柔
- 过渡自然
- 主题统一
- 避免信息过载

## 数据体验

- 旧数据可迁移
- 版本可恢复
- 附件可扩展
- 导出可读

---

# 13. 不做什么

以下内容不属于当前架构目标：

- 团队协作
- 多人编辑
- 企业权限系统
- 工作流引擎
- 复杂知识图谱优先化
- Notion 全量复刻
- 飞书全量复刻
- Obsidian 全量复刻

---

# 14. 架构结论

Digital Garden 的架构核心是：

- 一个内容实体：Entry
- 一个附件实体：Asset
- 一个关联实体：Link
- 一个轻量分类实体：Tag
- 一个强编辑器：TipTap
- 一个时间维度：Time / History
- 一个温柔的入口：首页

只要这些地基稳住，这个项目就能持续成长，而不会轻易变成屎山。

