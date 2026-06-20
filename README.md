# 🌱 Digital Garden

> 一个属于自己的二次元数字花园 — 记录、陪伴、成长。

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2d3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003b57?logo=sqlite)](https://sqlite.org/)

---

## 这是什么？

Digital Garden 不是博客，不是知识库，也不是办公软件。它是一个**私人空间**，用来存放回忆、想法、情绪、梦境、故事和学习记录。

打开首页时，应当像推开自己的房门 — 温暖、安静、属于你。

---

## 功能

### 📝 编辑器
- **TipTap 富文本编辑器** — 所见即所得，支持 Markdown 快捷输入
- **内容块类型**：段落、标题、列表、任务清单、引用、代码块（语法高亮）、图片、Callout
- **KaTeX 数学公式** — 行内 & 块级 LaTeX 渲染
- **Mermaid 图表** — 流程图、时序图、甘特图等
- **`/` 斜杠命令** — 快速插入任意内容块
- **`[[` 内部引用** — Wiki 风格的双向链接
- **图片粘贴** — Ctrl+V 直接粘贴剪贴板图片
- **封面图** — 每篇笔记可设题图
- **自动草稿** — 1 秒防抖自动保存，多草稿管理
- **源码模式** — 一键查看/编辑 TipTap JSON
- **字数统计 & 阅读时间**

### 🏡 花园浏览
- **首页仪表盘** — 问候语、花园统计、随机记忆、最近记录、轮播图
- **时间轴浏览** — 搜索、类型筛选、排序
- **知识图谱** — StarNet（力导向图）+ WorldTree（层级树）两种视图
- **全局搜索** — Cmd+K / Ctrl+K 快速检索
- **标签云** — 标签分布可视化
- **RSS 2.0 Feed** — `/api/feed`

### 🎨 主题 & 视觉
- **4 套主题**：花园 🌿 / 星夜 ✨ / 樱庭 🌸 / 雨 🌧
- **8 张内置全屏背景**，支持自定义上传（图片 & 视频）
- **16 首内置背景音乐**，支持本地上传，三种播放模式（单曲/列表/随机）
- **环境动效**：樱飘、光尘、飘雪、落雨
- **鼠标拖尾特效**
- **CRT 扫描线**（可选）
- **桌面小组件**：月历、天气、数字时钟
- **页面过渡动画**（Framer Motion）
- **日夜模式自动切换**，随时间段调整亮度和色温
- **简繁中文一键转换**

### 🎀 Live2D 看板娘
- 4 个内置预设模型（小春、静久、千岁等）
- 自动扫描本地模型目录，**17+ 模型**一键切换
- 支持自定义模型 URL 或本地上传
- 鼠标滚轮缩放
- 点击互动

### 🤖 AI 花园伙伴
- **多会话对话**，历史持久化
- **SSE 流式响应**，Markdown 渲染
- **花园上下文注入** — AI 知道你的笔记数量、标签、本月记录类型等
- 支持 DeepSeek 及任何 OpenAI 兼容 API
- API 余额查询 & 模型列表检测
- 离线时自动降级为本地规则应答（30+ 预设回复）

### 👤 多用户 & 认证
- bcrypt 密码哈希，设备级 Session 管理
- 访客自动登录（无需注册即可体验）
- 头像编辑器、密码修改、账号删除
- 公开/私密可见性控制
- 多账号切换

### 📊 数据
- **页面访问统计** — 总访问、今日、本周、热门笔记
- **写作统计** — 总字数、最长连续记录天数、最常写类型
- **Bot 过滤 & IP 匿名化**

### 📤 导出
- **Markdown** (.md)
- **Word** (.doc) — 自包含，图片 & Mermaid & KaTeX 内嵌
- **PDF** (.pdf)

### 🔧 排版自定义
- 8 种字体、字号 10–48px、行间距、字间距、段落间距
- 12 种主题色预设 + 自定义取色
- 自定义文字颜色
- 首页模块显隐 & 拖拽排序
- 导航栏常驻/滚动隐藏

---

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript 5 |
| UI | React 19 + Tailwind CSS 4 + Framer Motion |
| 编辑器 | TipTap 3 |
| 数据库 | SQLite (Prisma ORM) |
| 图表 | Mermaid + KaTeX |
| 知识图谱 | react-force-graph-2d + D3 |
| 看板娘 | Live2D Cubism SDK |
| 认证 | bcryptjs + 设备级 Session |
| 部署 | PM2 + 宝塔面板 / 任何 Node.js 环境 |

---

## 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/StarLi12345/Digital_Garden.git
cd Digital_Garden

# 2. 安装依赖
npm install

# 3. 初始化数据库
npx prisma db push

# 4. 启动开发服务器
npm run dev
```

访问 `http://localhost:3000`，访客自动登录即可体验。

如需创建账号，访问 `/login` 注册，或通过 `/account` 管理。

---

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面 & API
│   ├── page.tsx            # 首页
│   ├── garden/             # 时间轴浏览
│   ├── plant/              # 编辑器
│   ├── entry/[slug]/       # 笔记详情
│   ├── graph/              # 知识图谱
│   ├── chat/               # AI 花园伙伴
│   ├── settings/           # 设置面板
│   ├── login/              # 登录/注册
│   ├── account/            # 账号管理
│   └── api/                # 19 个 API 端点
├── components/
│   ├── editor/             # TipTap 编辑器 & 扩展
│   ├── graph/              # 知识图谱视图
│   └── ui/                 # UI 组件
├── lib/                    # 工具库（27 个模块）
├── actions/                # Server Actions
├── ecosystem/              # 花园生态系统引擎
└── middleware.ts            # 访客自动登录 & 认证中间件
prisma/
└── schema.prisma           # 数据模型（6 个表）
```

---

## 部署

标准部署流程（宝塔面板 + PM2）：

```bash
# 本地打包
tar -czf garden-deploy.tar.gz \
  --exclude='node_modules' --exclude='.next' --exclude='.git' \
  --exclude='*.tar.gz' --exclude='resource' --exclude='melotts-server' \
  --exclude='prisma/dev.db' --exclude='.env' .

# 上传到服务器后
cd /www/wwwroot/garden
tar -xzf garden-deploy.tar.gz
npx prisma db push
npm run build
pm2 restart garden --update-env
```

详见 `部署指南-宝塔面板.md`。

---

## 设计哲学

> 不是生产力工具。重点是陪伴、记忆与成长。

- **记录优先** — 任何功能应服务于记录本身
- **私人空间** — 不是后台管理系统，是自己的房间
- **温暖而非效率** — 不追求 Notion/Obsidian 式的全能
- **长期主义** — 所有内容应能被保存多年，不绑定特定平台

---

## License

MIT
