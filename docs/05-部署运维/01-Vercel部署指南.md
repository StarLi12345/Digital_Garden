# Vercel 部署指南 — Star's Digital Garden 3.0

## 前提条件

- [ ] GitHub 仓库已推送 `release/3.0-cloud` 分支
- [ ] Neon PostgreSQL 项目已创建（DATABASE_URL 就绪）
- [ ] （可选）Cloudflare R2 bucket 已创建

## 1. 连接 Vercel

1. 访问 [vercel.com](https://vercel.com) → 登录 → **Add New Project**
2. 导入 GitHub 仓库 → 选择 `Star-s-Digital-Garden`
3. 配置:

```
Framework Preset:    Next.js (auto-detected)
Root Directory:      ./
Build Command:       npx prisma generate && next build  (auto from vercel.json)
Output Directory:    .next
Install Command:     npm install
```

## 2. 环境变量

在 Vercel Dashboard → Settings → Environment Variables 中配置:

### 必填
| Key | Value | Environment |
|-----|-------|-------------|
| `DATABASE_URL` | `postgresql://...` (Neon 连接串) | Production, Preview |

### 推荐
| Key | Value | Environment |
|-----|-------|-------------|
| `SESSION_SECRET` | `openssl rand -hex 32` | Production, Preview |

### 可选
| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_CDN_URL` | CDN 前缀 URL | Production |
| `NEXT_PUBLIC_APP_URL` | 自定义域名 | Production |

## 3. Preview 部署验证

每次推送到 `release/3.0-cloud` 分支，Vercel 自动创建预览部署。

### 验证清单

- [ ] `/api/health` 返回 `{"status":"ok","database":"connected"}`
- [ ] `/login` 页面正常渲染，登录表单可用
- [ ] 注册/登录 → 创建 Entry → 保存成功
- [ ] Chat 页面可访问（需在 Settings 中输入 DeepSeek Key）
- [ ] 主题切换、背景切换正常
- [ ] 音频播放正常（如音频已上传到 CDN）

## 4. Production 部署

合并到 `master` 后自动触发 Production 部署:

```bash
git checkout master
git merge release/3.0-cloud
git push origin master
```

## 5. 回滚

### Vercel Dashboard 回滚（最快）
1. Deployments 列表 → 选择上一个成功部署
2. 点击 "…" → **Promote to Production**
3. 10 秒内完成回滚

### Git 回滚
```bash
# 回退到 Phase 0 基线
git checkout master
git revert <failing-commit>
git push origin master
```

## 6. 监控

- `/api/health` 接入 UptimeRobot（免费 5 分钟间隔）
- Vercel Analytics（自动，Pro 计划）
- Neon Dashboard 查看数据库连接数/慢查询
