# Star's Digital Garden 3.0 项目归档文档

> 项目负责人阶段验收报告  
> 日期：2026-06-13  
> 归档范围：1.0 → 2.0 → 3.0  
> 当前版本：3.0（0.1.0 in package.json）  
> 总 Commit：59 个  
> 开发周期：2026-05-31 ~ 2026-06-13（14 天）

---

## 目录

1. [项目概述](#1-项目概述)
2. [功能完成情况](#2-功能完成情况)
3. [本次版本中踩过的大坑](#3-本次版本中踩过的大坑)
4. [当前项目架构](#4-当前项目架构)
5. [已暂停或放弃的功能](#5-已暂停或放弃的功能)
6. [当前遗留问题](#6-当前遗留问题)
7. [4.0 版本候选路线](#7-40-版本候选路线)
8. [最终评价](#8-最终评价)

---

## 1. 项目概述

### 1.1 3.0 定位

3.0 是在 2.0（多用户 + 视觉系统）基础上的 **体验精修与未完成功能收敛版本**。它的核心命题不是"做更多"，而是"把已有的做好并关闭不稳定模块"。

**一句话定位**：一个拥有博客写作能力、AI 对话能力、Live2D 看板娘、可动态切换视觉主题的个人数字花园。当前已可以长期使用，但语音朗读、知识图谱等功能尚在储备中。

### 1.2 与之前版本相比的主要变化

| 维度 | 1.0 | 2.0 | 3.0 |
|------|-----|-----|-----|
| 用户系统 | 单人硬编码 | 多用户注册/登录/切换 | 同 2.0 |
| 编辑器 | 基础 TipTap | + Callout/Divider/数学公式/流程图 | + Block 菜单/大纲/源码模式 |
| 视觉系统 | 静态 CSS | 4 主题 + 背景 + 音乐 + 氛围特效 | + 运行时主题引擎（天气/时间驱动） |
| UI 个性化 | 无 | 字体/字号/间距/颜色/布局 | + 模块排序/显隐控制 |
| Chat AI | 无 | Companion Widget + 聊天面板 | + DeepSeek 流式 + 花园知识库 + 状态面板 |
| Live2D | 无 | 4 预设模型 + 自定义 | + 模型扫描 API + 本地模型注册表 |
| TTS 语音 | 无 | Fish Audio（云） | **已暂停**（Fish Audio 下线，MeloTTS 实验未完成） |
| 入口类型 | 博客 | 花园/博客双入口 | 同 2.0 + 草稿箱 |
| 搜索 | 无 | SQLite LIKE | 前后端联合搜索 + 筛选 |

### 1.3 核心价值

1. **写作体验完整**：Notion 风格块编辑器，支持 Markdown/数学/流程图/便签/任务列表
2. **花园多维度浏览**：时间线、类型聚合、标签筛选、全文搜索、随机回忆
3. **AI 花园精灵**：右下角浮动伴聊 + 全页 Chat，已接入 DeepSeek API，支持流式输出和花园知识库上下文
4. **Live2D 看板娘**：4 种预设模型 + 本地模型注册表，支持缩放、换装、拖拽
5. **高度可定制**：4 种花园主题 + 天气/时间驱动的动态切换 + 字体/间距/颜色个性化

---

## 2. 功能完成情况

### 2.1 博客系统

**已完成**

- TipTap 富文本编辑器，支持：标题 H1-H5、加粗、斜体、下划线、删除线、高亮、文字颜色、链接、图片、任务列表、数学公式（KaTeX）、Mermaid 流程图、代码块、引用、分割线、Callout（花园便签）、Wiki 链接
- Block 菜单（选中块后浮出的操作菜单）
- 大纲侧边栏（TOC，点击跳转 + 高亮滚动同步）
- 源码模式（JSON 源码 ↔ 可视化编辑切换）
- 拖拽手柄（DragHandle 扩展）
- 封面图上传与裁剪
- 标签系统（TagInput 自动补全）
- 入口类型选择（Memory / Thought / Emotion / Dream / Story / Learning）
- 草稿自动保存（800ms debounce → localStorage）
- 草稿箱页面（/drafts）

**技术实现**

| 文件 | 行数 | 职责 |
|------|------|------|
| `src/components/editor/tiptap-editor.tsx` | 784 | 编辑器主组件，扩展注册中心 |
| `src/components/editor/block-menu.tsx` | 276 | 浮动块菜单 |
| `src/components/editor/editor-wrapper.tsx` | 30 | 编辑页面布局容器 |
| `src/components/editor/entry-renderer.tsx` | 207 | 只读渲染器 |
| `src/components/editor/toc-highlighter.tsx` | — | 大纲滚动同步 |
| `src/components/editor/callout-extension.ts` | — | Callout 自定义 Node |
| `src/components/editor/wikilink-extension.ts` | — | `[[wikilink]]` 支持 |
| `src/components/editor/math-extension.ts` | — | KaTeX 数学公式 |
| `src/components/editor/mermaid-extension.ts` | — | Mermaid 流程图 |
| `src/components/editor/shortcuts-extension.ts` | — | Markdown 快捷键映射 |
| `src/components/editor/drag-handle-extension.ts` | — | 拖拽排序 |
| `src/actions/entry-actions.ts` | 681 | 所有 CRUD 的 Server Actions |
| `src/app/entry/[slug]/page.tsx` | 496 | 条目详情页 |
| `src/app/plant/page.tsx` | 491 | 写作页 |
| `src/app/drafts/page.tsx` | — | 草稿箱 |
| `prisma/schema.prisma` | — | Entry + Tag + EntryTag + Asset 模型 |

**当前状态**：✅ **完成，可长期使用。**

### 2.2 数字花园系统

**已完成**

- 花园总览页（/garden）：时间线视图 + 卡片 + 搜索 + 类型/标签筛选
- 首页（/）：时间问候 + 花园统计 + 随机回忆卡片（getGardenMemory）+ 最近记录
- 类型聚合：本月花园类型分布 + 温和文案
- 按月份分组的时间视图
- 全文搜索（前后端联合）
- 统计数据（入口数量/Tag 数量/本月记录/Top Tags）
- Breadcrumb 导航
- 花园轮播组件
- 迷你日历（MiniCalendar）
- Tag 云

**技术实现**

| 文件 | 职责 |
|------|------|
| `src/app/garden/page.tsx` | 花园总览页 |
| `src/app/page.tsx` | 首页（时间问候 + 统计 + 回忆 + 最近） |
| `src/app/graph/page.tsx` | 知识图谱页（StarNet / WorldTree） |
| `src/lib/garden-knowledge.ts` | AI 花园知识库（system prompt + 本地 fallback） |
| `src/lib/carousel-data.ts` | 首页轮播数据 |
| `src/lib/datetime.ts` | 时间工具函数 |
| `src/lib/export-utils.ts` | 导出工具（PDF 等） |
| `src/components/ui/garden-carousel.tsx` | 轮播组件 |
| `src/components/ui/mini-calendar.tsx` | 迷你日历 |
| `src/components/ui/tag-cloud.tsx` | 标签云 |
| `src/components/ui/breadcrumb.tsx` | 面包屑导航 |

**当前状态**：✅ **完成，可长期使用。**

### 2.3 Chat AI 助手

**已完成**

- 右下角浮动伴聊组件（CompanionWidget）— 可最小化、拖拽、缩放
- 聊天面板（/chat）：流式对话 + 会话历史 + localStorage 持久化
- DeepSeek API 接入：SSE 流式 + 非流式 fallback
- 花园知识库系统：System Prompt 注入花园统计数据 + 相关笔记搜索
- 本地 fallback：无 API 配置时生成基于花园统计的拟人回复
- AI 服务状态面板：Provider 识别 / 余额查询 / 模型列表 / 连接检测
- 用户名高亮检测（mention），@用户名触发

**DeepSeek API 接入详情**

```
用户输入
  ↓
Chat 页面 (src/app/chat/page.tsx)
  ↓ POST /api/chat { message, history }
API Route (src/app/api/chat/route.ts)
  ├─ 未配置 API → generateLocalResponse() —— 本地 fallback
  ├─ 已配置 API → fetch(apiUrl, { stream: true })
  │   ├─ 成功 → ReadableStream → SSE 逐 token 返回
  │   └─ 失败 → 非流式 fallback → 再失败 → 本地 fallback
  └─ mode 标记: "api" | "local"
```

**Prompt 系统**

- System Prompt：花园精灵角色设定（"你是 Star's Digital Garden 的花园精灵…"）
- 注入花园统计（入口数、Tag 数、本月记录、Top Tags）
- 搜索用户消息中提到的笔记标题，附加上下文

**当前限制**

- 花园知识库 RAG 尚未实现（当前仅为简单的标题前缀匹配）
- 没有对话记忆持久化（刷新后仅恢复历史消息，无长期记忆）
- deepseek-v4-flash 模型（速度快但推理质量不如 v4-pro）
- 本地 fallback 回复只有 5-6 种模板，重复率高

**当前状态**：✅ **可用，有明确的后续增强空间。**

### 2.4 Live2D 系统

**当前保留方案**

- 4 种预设模型：小春（koharu）、静久（shizuku）、小春校服（haru）、千岁（chitose）
- 本地模型注册表（`/api/models` 自动扫描 `/public/resources/live2d/models/`）
- 模型切换 API（`window.dispatchEvent('live2d-config-changed')`）
- 鼠标滚轮缩放（CSS zoom 方式，不冲突库内部）
- 自定义模型支持（URL / 本地上传）
- Settings 中的 Live2D 预览组件

**技术栈**

| 文件 | 职责 |
|------|------|
| `src/lib/live2d-engine.ts` | Live2D 核心引擎初始化（PixiJS + Cubism SDK） |
| `src/lib/live2d-config.ts` | 模型预设 + localStorage 持久化 |
| `src/lib/model-registry.ts` | 客户端模型注册表（fetch API） |
| `src/app/api/models/route.ts` | 服务端模型扫描 API |
| `src/components/ui/companion.tsx` | Companion Widget（右下角浮动） |
| `src/components/ui/live2d-preview.tsx` | Settings 中的预览组件 |

**已知问题**

1. 模型 JSON 文件较大（~2-5MB），首次加载延迟明显
2. Cubism 2 与 Cubism 3+ 格式兼容性问题，部分本地模型可能需要转格式
3. 移动端性能开销高（WebGL 渲染 + 物理引擎）
4. PixiJS + Cubism SDK 依赖较重

**为什么后续版本不要轻易改动**

Live2D 系统涉及 PixiJS + Cubism SDK + WebGL + Physics 的多层栈，任何改动都可能引发连锁问题：
- 模型格式兼容性（Cubism 2 vs 3 vs 5）
- 浏览器 WebGL 上下文限制
- CSS zoom 与画布坐标的冲突
- MOC3 物理引擎的状态管理

**当前状态**：✅ **稳定可用，不建议轻易改动。**

### 2.5 主题系统

**已完成**

- 4 种花园主题：花园（garden）、星空（starry）、樱庭（sakura）、雨（rain）
- 每主题绑定：背景图、推荐音乐、氛围特效、明暗模式、主题色
- 背景系统：本地图片选择器 + URL 输入 + 透明度/模糊度滑块 + 视频背景
- 音乐系统：11 首 BGM + 三种循环模式（one/all/shuffle）+ 音量控制 + localStorage 持久化
- 氛围特效：粒子（dust）、花瓣（petal）、雨（rain）、几何（geo）
- 动态主题运行时引擎：根据系统时间自动切换明暗 + 根据天气动态调整
- 光标拖尾特效
- CRT 滤镜叠加
- Sakura 花瓣独立组件
- 场景主题组件（scene-themes.tsx）
- 页脚名言组件
- 花园装饰组件
- 页面过渡动画（framer-motion）

**技术实现**

| 文件 | 职责 |
|------|------|
| `src/lib/themes.ts` | 4 主题定义 + localStorage 持久化 |
| `src/lib/theme-runtime.ts` | 时间/天气驱动的动态主题引擎 |
| `src/lib/backgrounds.ts` | 背景预设列表 |
| `src/lib/audio.ts` | BGM 音轨列表 + 持久化 |
| `src/lib/ambient-config.ts` | 氛围/Cursor 特效配置 |
| `src/lib/layout-config.ts` | 顶栏/侧边栏布局配置 |
| `src/components/ui/theme-provider.tsx` | 主题 Provider |
| `src/components/ui/theme-runtime-provider.tsx` | 运行时动态 Provider |
| `src/components/ui/background-provider.tsx` | 背景切换 Provider |
| `src/components/ui/audio-provider.tsx` | 音乐播放器逻辑（442 行） |
| `src/components/ui/ambient-provider.tsx` | 氛围特效 Provider |
| `src/components/ui/ambient-effects.tsx` | 粒子/雨/几何渲染 |
| `src/components/ui/sakura-petals.tsx` | 樱花花瓣独立组件 |
| `src/components/ui/scene-themes.tsx` | 场景主题映射 |
| `src/components/ui/crt-overlay.tsx` | CRT 效果 |
| `src/components/ui/page-transition.tsx` | 页面过渡 |
| `src/components/ui/daytime-theme.tsx` | 时间主题 |
| `src/components/ui/digital-clock.tsx` | 数字时钟 |
| `src/components/ui/garden-background.tsx` | 花园背景 |
| `src/components/ui/garden-decorations.tsx` | 花园装饰 |
| `src/components/ui/music-player.tsx` | 音乐播放器 UI |
| `src/components/ui/footer-quote.tsx` | 页脚名言 |
| `src/components/ui/rightside-toolbar.tsx` | 右侧工具栏 |

**当前状态**：✅ **完成度高，是目前项目中最成熟的子系统。**

### 2.6 设置页面

**已完成**

- 主题选择器（4 主题一键切换）
- 背景图片管理（预设 + 自定义URL + 本地上传 + 视频背景）
- BGM 管理（曲目选择 + 循环模式 + 音量 + 本地上传）
- 顶栏模式（fixed / auto-hide）
- 侧边栏展开/收起
- 氛围特效选择（无 / 粒子 / 花瓣 / 雨 / 几何）
- 光标特效选择
- UI 个性化面板：字体/字号/字重/行高/字间距/段落间距/块间距/主题色
- 模块显隐（首页 4 模块独立开关）
- 模块拖拽排序
- Live2D 模型选择 + 预览
- AI 对话 API 配置
- AI 服务状态面板（Provider 识别/余额查询/模型列表/连接检测）
- 语音音色（已暂停）

**当前状态**：✅ **功能完整，AI 配置区已有实用状态面板。**

---

## 3. 本次版本中踩过的大坑

### 3.1 MeloTTS 部署尝试（耗时约 4 小时）

**为什么选择 MeloTTS**

- 原 Chat 页面依赖 Fish Audio 云 API（需要第三方 API Key + 外网访问 + 免费额度限制）
- MeloTTS 是 MIT 协议、CPU 优先、~68MB 模型、中文原生支持的 TTS 引擎
- 理论上一行 `pip install melotts` 就能跑

**实际部署过程**

1. 在 `melotts-server/` 创建 Python venv，安装 PyTorch CPU 版 + FastAPI + uvicorn + melotts
2. 编写 `test_melo.py` 验证脚本
3. 遇到第一个问题：日语 MeCab 字典缺失 → `melo/text/japanese.py` 模块级 `MeCab.Tagger()` 崩溃
4. 修复为懒加载
5. 遇到第二个问题：日语 BERT tokenizer 模块级 `AutoTokenizer.from_pretrained()` → 需访问 HuggingFace
6. 修复为懒加载（同样的问题出现在 chinese_mix / english / korean / spanish / french 等 5 个文件中）
7. 遇到第三个问题：S3 模型下载 403（`myshell-public-repo-hosting.s3.amazonaws.com` 桶已禁止公开访问）
8. URL 改为 `hf-mirror.com`（HuggingFace 国内镜像）→ 模型成功下载（207MB，耗时 2 分 56 秒）
9. 模型加载成功（`TTS(language="ZH", device="cpu")` → ✅）
10. 遇到第四个问题：合成时 `chinese_mix.py` 的 `_g2p_v2` 调用 `english_bert` → 需要从 HuggingFace 下载 `bert-base-multilingual-uncased`（~700MB）
11. **HuggingFace 直连超时，hf-mirror.com 对大模型文件不稳定。**

**最终暂停原因**

| 问题 | 难度 | 收益 |
|------|------|------|
| 安装依赖链 | 中 | — |
| 8 个文件的模块级联网初始化修复 | 中 | — |
| S3 模型源失效 | 低（切 HF 镜像即可） | — |
| **HuggingFace BERT 模型无法下载** | **高**（网络不可控） | — |
| NLTK 数据包下载 | 低（但同样需要稳定网络） | — |

**结论**：MeloTTS 本身是优秀项目，但国内 Windows + CPU + 不稳定网络的环境下部署成本过高。核心瓶颈不是代码，而是 `bert-base-multilingual-uncased`（~700MB）无法稳定下载。

**保留内容**

- `melotts-server/venv/`：已安装的完整 Python 环境
- `melotts-server/test_melo.py`：验证脚本（8 步测试流程）
- 模型文件（`checkpoint.pth` + `config.json`）：已缓存
- NLTK 数据（`averaged_perceptron_tagger` + `cmudict`）：已下载
- 5 个文件的懒加载 Patch：已应用

**未来恢复方式**

1. 代理/VPN 环境下运行 `python -c "from transformers import AutoTokenizer; AutoTokenizer.from_pretrained('bert-base-multilingual-uncased')"` 预下载 BERT
2. 或将 BERT 模型文件手动放入 `~/.cache/huggingface/hub/`
3. 然后执行 `melotts-server/test_melo.py` 即可完成端到端验证
4. 验证通过后，修改 `src/lib/tts-voices.ts` 中的 `playTTS()` 和 `src/app/api/tts/route.ts` 指向本地 MeloTTS 服务

### 3.2 AI API 接入问题

**local fallback 的触发条件**

当以下任一条件满足时，Chat 进入 local fallback 模式：

1. 用户未在 Settings 配置 API URL 或 API Key → `generateLocalResponse()`
2. API 请求失败（网络错误）→ `generateLocalResponse()`
3. API 返回非 200（非流式 fallback 也失败）→ `generateLocalResponse()`

**local fallback 模板**

位置：`src/lib/garden-knowledge.ts` — `generateLocalResponse()`

触发特征回复：
- "嗯…这个问题我还在学习中~ 你可以去 /settings 配置一个 AI API，我就能更聪明地回答你啦！"
- "我是花园守护精灵，目前还没有接入云端智慧…"
- "最近花园里很热闹呢！你已经记录了 X 条想法…"

**真实 LLM 回复的识别标志**

- 语气自然多变
- 提及具体花园数据
- 回复内容与用户问题高度相关

**DeepSeek 配置问题**

- 默认模型已从 `deepseek-chat` 更新为 `deepseek-v4-flash`
- API Key 通过浏览器 localStorage 传递（不落服务端磁盘）
- 流式模式有时因网络波动中断，自动 fallback 到非流式

### 3.3 Live2D 历史问题

**以前出现过的问题**

1. `customJsonPath undefined` 导致 `.startsWith()` 崩溃 → 已修复（增加 `|| ""` 默认值）
2. 多个 Live2D 实例冲突 → 已修复（全局单例 + `resetEngineState()` 清理）
3. Canvas 缩放与画布坐标不匹配 → 已修复（CSS zoom 方式替代 matrix 变换）
4. MOC3 物理引擎在窗口 resize 时崩溃 → 已缓解（debounce resize 事件）

**本次如何避免**

- 保持 Live2D 栈不变（PixiJS + Cubism SDK 版本锁定）
- 不添加新模型格式支持（不再折腾格式迁移）
- 鼠标滚轮缩放使用 CSS zoom（不碰 Canvas 变换矩阵）

---

## 4. 当前项目架构

### 4.1 目录结构

```
Star's Digital_Garden/
├── .env.local               # 环境变量（DATABASE_URL + 账号密码）
├── .env.example             # 环境变量模板
├── package.json             # Next.js 16.2.6 + React 19 + TipTap + Prisma
├── next.config.ts           # Turbopack + webpack watch 优化
├── tsconfig.json            # strict 模式
├── prisma/
│   ├── schema.prisma        # User + Entry + Tag + EntryTag + Asset
│   ├── dev.db               # SQLite 开发数据库
│   └── migrations/          # 迁移记录
├── src/
│   ├── middleware.ts         # 路由守卫（/api/tts 等公开路径 + session cookie）
│   ├── actions/
│   │   └── entry-actions.ts # Server Actions：CRUD + 搜索 + 统计 (681 行)
│   ├── app/
│   │   ├── layout.tsx       # 根布局：Providers 组合
│   │   ├── page.tsx         # 首页：时间问候 + 统计 + 回忆 + 最近
│   │   ├── globals.css      # 2000+ 行 Tailwind + CSS 变量
│   │   ├── login/           # 登录/注册页
│   │   ├── plant/           # 写作页（Notion 风格编辑器）
│   │   ├── garden/          # 花园总览（时间线 + 搜索 + 筛选）
│   │   ├── graph/           # 知识图谱（StarNet / WorldTree）
│   │   ├── entry/[slug]/    # 条目详情页
│   │   ├── chat/            # AI 聊天页
│   │   ├── drafts/          # 草稿箱
│   │   ├── settings/        # 设置页（综合配置面板）
│   │   └── api/
│   │       ├── auth/        # 7 个认证 API
│   │       ├── chat/        # DeepSeek 流式代理
│   │       ├── tts/         # TTS 代理（已暂停）
│   │       ├── ai-status/   # AI 服务状态检测
│   │       └── models/      # Live2D 模型自动扫描
│   ├── components/
│   │   ├── editor/          # 12 个编辑器组件 + 扩展
│   │   ├── ui/              # 28 个 UI 组件
│   │   ├── form/            # 表单输入组件
│   │   └── graph/           # 图谱可视化组件
│   └── lib/
│       ├── prisma.ts        # Prisma Client 单例
│       ├── auth.ts          # bcrypt + session cookie
│       ├── garden-knowledge.ts # AI System Prompt + local fallback
│       ├── themes.ts        # 4 主题定义
│       ├── theme-runtime.ts # 时间/天气动态引擎
│       ├── backgrounds.ts   # 背景预设
│       ├── audio.ts         # 音乐轨道定义
│       ├── ambient-config.ts # 氛围/Cursor 配置
│       ├── layout-config.ts # 布局模式配置
│       ├── live2d-config.ts # Live2D 模型配置
│       ├── live2d-engine.ts # Live2D 渲染引擎
│       ├── model-registry.ts # 模型注册表
│       ├── markdown.ts      # Markdown ↔ TipTap 转换
│       ├── tts-voices.ts    # TTS 语音配置（已暂停）
│       ├── ui-preferences.ts # UI 个性化配置
│       ├── animations.ts    # framer-motion 动画预设
│       ├── carousel-data.ts # 轮播内容数据
│       ├── file-storage.ts  # 文件存储 (IndexedDB)
│       ├── datetime.ts      # 时间工具
│       └── export-utils.ts  # 导出工具 (PDF)
├── public/
│   ├── audio/               # 11 首 BGM (MP3)
│   ├── backgrounds/         # 背景图库
│   ├── carousel/            # 轮播图片
│   ├── themes/              # 主题资源
│   ├── music-player/        # 音乐播放器资源
│   └── resources/
│       └── live2d/models/   # 4 个预设模型 + 自定义模型
├── docs/                    # 27 篇设计文档
├── scripts/                 # 9 个种子/测试脚本
├── snapshots/               # 截图存档
├── memory/                  # 项目记忆文件
└── melotts-server/          # MeloTTS 实验目录（独立，未接入主项目）
```

### 4.2 核心模块关系

```
┌──────────────────────────────────────────────────────┐
│                    浏览器（用户）                       │
├────────┬──────────┬──────────┬──────────┬────────────┤
│  首页   │  花园   │  /plant  │  Chat   │  Settings  │
│  page  │  garden │  写作    │  聊天   │   设置     │
└───┬────┴────┬────┴────┬─────┴─────┬────┴──────┬─────┘
    │         │         │           │           │
    ▼         ▼         ▼           ▼           ▼
┌──────────────────────────────────────────────────────┐
│                  Server Actions / API Routes           │
│  entry-actions.ts  /api/chat  /api/ai-status          │
│  /api/auth/*       /api/tts   /api/models             │
└──────────────┬───────────────────┬───────────────────┘
               │                   │
               ▼                   ▼
┌──────────────────────┐  ┌─────────────────────────┐
│   Prisma + SQLite     │  │   DeepSeek API (外部)    │
│   User/Entry/Tag/     │  │   api.deepseek.com/v1   │
│   Asset               │  │   /chat/completions     │
└──────────────────────┘  └─────────────────────────┘
```

### 4.3 数据流 — Chat 对话

```
用户输入 "我今天写了一篇关于机器学习的笔记"
    │
    ▼
Chat 页面 (src/app/chat/page.tsx)
    │ POST /api/chat { message, history }
    ▼
API Route (src/app/api/chat/route.ts)
    │
    ├─ 1. getGardenStats() → 花园统计（入口数、Tag数、本月记录）
    ├─ 2. getContextEntries() → 标题匹配搜索相关笔记
    ├─ 3. buildSystemPrompt(stats) → 花园精灵 System Prompt
    ├─ 4. 组装 messages = [system, ...history, user]
    │
    ├─ API Key 未配置?
    │   └─→ generateLocalResponse() → JSON { reply, mode: "local" }
    │
    ├─ API Key 已配置?
    │   ├─→ fetch(apiUrl, { stream: true })
    │   │   ├─ 成功 → ReadableStream → SSE text/event-stream
    │   │   └─ 失败 → fetch(apiUrl, { stream: false })
    │   │       ├─ 成功 → JSON { reply, mode: "api" }
    │   │       └─ 失败 → generateLocalResponse() → JSON { reply, mode: "local" }
    │
    ▼
浏览器接收 SSE 流或 JSON → 逐字渲染 / 一次性渲染
```

### 4.4 数据流 — 数字花园

```
用户访问首页 (/)
    │
    ├─ Server Component 渲染
    │   ├─ getEntryStats() → 入口/标签/本月统计
    │   ├─ getGardenMemory() → 随机回忆卡片
    │   └─ getRecentEntries() → 最近 10 条记录
    │
    ▼
HTML 渲染 (SSR) → 客户端水合 → 模块显隐/排序由 UI Preferences 控制

用户访问花园 (/garden)
    │
    ├─ 客户端加载所有 Entry（title/slug/type/tags/excerpt/createdAt）
    ├─ 前端过滤：搜索框 + 类型下拉 + 标签多选
    ├─ 视图切换：时间线 / 卡片
    └─ 按月分组渲染
```

---

## 5. 已暂停或放弃的功能

### 5.1 MeloTTS 本地语音

**状态**：⏸️ **暂停**

**原因**：
- 收益远低于投入：Chat 语音朗读是锦上添花功能，非核心体验
- 部署复杂度过高：国内网络环境下，HuggingFace + S3 双重阻断，需要代理 + 手动预下载
- 不影响核心体验：Chat 文字回复已能满足使用需求

**保留内容**：
- `melotts-server/venv/`：完整 Python 虚拟环境
- `melotts-server/test_melo.py`：8 步验证脚本（模型加载已通过，合成步骤被 BERT tokenizer 阻断）
- 已下载模型：`checkpoint.pth`（~208MB）+ `config.json`
- 5 处懒加载 Patch：japanese.py + 5 个 `_bert` 文件
- download_utils.py URL 重定向到 `hf-mirror.com`

**未来恢复方式**：
1. 在稳定网络下预下载 `bert-base-multilingual-uncased`
2. 运行 `test_melo.py` 验证端到端流程
3. 编写 FastAPI 服务包装器（~50 行）
4. 修改 `src/lib/tts-voices.ts` 的 `playTTS()` 指向本地服务
5. 修改 `src/app/api/tts/route.ts` 代理到本地服务

### 5.2 Fish Audio 云端 TTS

**状态**：❌ **已移除**

**原因**：
- 依赖外网第三方 API（`api.fish.audio`）
- 需要用户单独申请 API Key
- 免费额度有限（8000 积分/月）
- 与"本地优先、不依赖外网"的 3.0 定位矛盾

**移除内容**：
- `src/app/api/tts/route.ts`：Fish Audio 代理 → 503 "paused" 响应
- `src/lib/tts-voices.ts`：`playTTS()` 的 Fish Audio 分支 → 单行 paused 返回
- `src/app/settings/page.tsx`：Fish Audio API Key 输入 → "语音功能暂缓" 提示

### 5.3 知识图谱可视化

**状态**：⏸️ **原型阶段**

现有的 `/graph` 页面有两个视图（StarNet / WorldTree），但图谱数据为 mock 数据，未接入真实的 Entry 关联关系。Wiki 链接（`[[wikilink]]`）扩展已在编辑器中实现，但链接解析和图谱构建管线尚未完成。

---

## 6. 当前遗留问题

### P1 — 影响使用体验

| # | 问题 | 影响 | 修复方向 |
|---|------|------|---------|
| 1 | **local fallback 回复模板只有 ~6 种** | 未配 API 时回复高度重复 | 扩展 fallback 模板库，增加花园数据驱动的动态变化 |
| 2 | **花园知识库标题匹配过于粗糙** | `getContextEntries()` 仅匹配前 3 个字符，命中率低 | 实现简单的 TF-IDF 或嵌入匹配 |
| 3 | **Live2D 模型首次加载慢** | ~2-5MB 模型文件，无加载进度提示 | 添加骨架屏 + 加载进度条 |

### P2 — 影响功能完整性

| # | 问题 | 影响 | 修复方向 |
|---|------|------|---------|
| 4 | **Chat 对话无长期记忆** | 刷新后丢失对话上下文 | localStorage 持久化对话向量摘要 |
| 5 | **Wiki 链接 `[[link]]` 仅编辑器支持** | 渲染时不生成可点击链接 | 扩展 entry-renderer 的 wiki 链接处理 |
| 6 | **知识图谱无真实数据** | `/graph` 页面为 demo 状态 | 实现 Entry-Tag-Entry 关联解析管线 |
| 7 | **搜索无后端正则/全文索引** | 大量条目时性能下降 | SQLite FTS5 全文索引 |

### P3 — 锦上添花

| # | 问题 | 影响 | 修复方向 |
|---|------|------|---------|
| 8 | **TTS 语音已暂停** | 无朗读功能 | 网络环境改善后恢复 MeloTTS 部署 |
| 9 | **移动端体验未优化** | 部分布局在小屏幕上拥挤 | 响应式布局调整 |
| 10 | **无导出为静态 HTML** | 笔记迁移不便 | 基于 Markdown → HTML 静态导出 |

---

## 7. 4.0 版本候选路线

> ⚠️ 仅规划，不开发。

### 7.1 云端部署

| 维度 | 评价 |
|------|------|
| 价值 | 高 — 真正"随时随地访问自己的花园" |
| 复杂度 | 中 — Next.js + SQLite → 需改为 PostgreSQL + Vercel/Railway/Droplet |
| 优先级 | P1 |
| 风险 | 云端 SQLite 不可靠，必须迁移 PostgreSQL；静态资源 500MB+ 需 CDN |

### 7.2 RAG 知识库

| 维度 | 评价 |
|------|------|
| 价值 | 高 — Chat 能真正"读懂"你的所有笔记 |
| 复杂度 | 中高 — 需要嵌入模型 + 向量数据库 + 检索管线 |
| 优先级 | P2 |
| 方案 | 轻量：local embedding（如 all-MiniLM-L6-v2，~80MB）+ LanceDB/Chroma；或使用 DeepSeek Embedding API |

### 7.3 AI 记忆系统

| 维度 | 评价 |
|------|------|
| 价值 | 中 — 长期对话更连贯 |
| 复杂度 | 中 — 对话摘要 + 向量检索历史上下文 |
| 优先级 | P2 |
| 备注 | 做好 RAG 后，记忆系统是水到渠成的扩展 |

### 7.4 语音系统重启

| 维度 | 评价 |
|------|------|
| 价值 | 低 — 非核心功能 |
| 复杂度 | 取决于网络条件 |
| 优先级 | P3 |
| 建议 | MeloTTS 部署路线已有完整文档，网络条件改善后半天可恢复 |

### 7.5 搜索增强

| 维度 | 评价 |
|------|------|
| 价值 | 中 — 笔记越多越需要 |
| 复杂度 | 低 — SQLite FTS5 + 前端优化 |
| 优先级 | P2 |

---

## 8. 最终评价

### 8.1 完成度

| 子系统 | 完成度 | 评价 |
|--------|:---:|------|
| 博客写作 | 95% | 编辑器能力已接近 Notion 级别，仅差协同编辑和版本历史 |
| 数字花园 | 85% | 多维度浏览 + 统计 + 搜索，缺知识图谱真实关联 |
| Chat AI | 70% | Stream + 知识库可用，缺 RAG 和长期记忆 |
| Live2D | 80% | 4 模型稳定，自定义支持完善，缺加载优化 |
| 主题系统 | 95% | 4 主题 + 动态运行时 + 高度可定制 |
| Settings | 90% | 配置项全面，AI 状态面板实用 |
| TTS 语音 | 15% | 已暂停，保留完整研究资料 |

**综合完成度**：~80%

### 8.2 实用性

3.0 在以下场景中已经实用：

- 每日写作记录（/plant 编辑器体验优秀）
- 花园浏览回顾（时间线 + 搜索 + 随机回忆）
- 与 AI 对话（配置 DeepSeek API Key 后）
- 个性化写作环境（主题 + 背景 + 音乐随心情切换）

**当前最实用的使用方式**：在 Settings 配置 DeepSeek API Key → 日常在 /plant 写作 → 在 / 首页回顾 → 偶尔在 /chat 与花园精灵聊天。

### 8.3 可维护性

**优点**：
- 模块化清晰的组件树
- Prisma 类型安全的数据访问层
- 所有持久化方案通过 localStorage 库函数统一管理
- 文档丰富（27 篇设计文档 + 本次归档文档）

**缺点**：
- `globals.css` 超过 2000 行，未做 CSS Module 拆分
- 部分组件过大（tiptap-editor 784 行、settings/page 1700+ 行、audio-provider 442 行）
- 无自动化测试
- `entry-actions.ts` 681 行臃肿

### 8.4 技术债务

| 债务 | 严重程度 | 建议 |
|------|:---:|------|
| 无测试覆盖 | 高 | 至少为核心 Server Actions 加集成测试 |
| 巨型组件 | 中 | settings page 拆分为独立 Section 组件 |
| globals.css 过大 | 中 | 按组件拆分 CSS Module |
| Wiki Link 单向 | 低 | 补充反向链接 |
| 无 CI/CD | 低 | 配置 GitHub Actions 构建检查 |

### 8.5 是否适合进入长期使用阶段

**适合。**

3.0 的核心体验回路——写作、浏览、回顾、AI 对话——已经完整且稳定。Live2D 和主题系统是锦上添花但同样稳定。TTS 语音暂停不影响核心使用体验。

---

## 《Star's Digital Garden 3.0 项目状态结论》

### 已达到"可以长期使用"标准的部分

✅ 博客写作系统（TipTap 编辑器 + 草稿 + Markdown）  
✅ 数字花园浏览（时间线 + 搜索 + 统计）  
✅ 多用户认证系统  
✅ Live2D 看板娘  
✅ 主题系统（4 主题 + 动态运行时 + 背景/BGM/氛围）  
✅ UI 个性化配置  
✅ DeepSeek API 接入（流式 + 知识库 + 状态面板）  

### 应留到 4.0 再做的部分

⏭ RAG 知识库（真正的笔记语义搜索）  
⏭ AI 长期记忆系统  
⏭ 知识图谱真实关联  
⏭ 语音朗读恢复  
⏭ 云端部署  
⏭ 移动端优化  
⏭ 自动化测试  
⏭ 静态站点导出  

### 一句话

> 3.0 是一个**功能完整、体验稳定、可日常使用**的个人数字花园。它的核心价值在于写作、回顾、与 AI 对话——这三件事已经做好了。剩下的都是加分项。

---

*文档由 Claude (DeepSeek-v4-pro) 于 2026-06-13 根据项目代码库、Git 历史、设计文档和开发会话记录综合生成。*
