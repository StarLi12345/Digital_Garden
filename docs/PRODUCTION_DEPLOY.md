# 生产部署执行手册 — Star's Digital Garden 3.0

## 部署前确认清单

在推送到生产环境前，逐项确认：

### 数据库
- [ ] Neon PostgreSQL 项目已创建，`DATABASE_URL` 已配置到 Vercel Production 环境变量
- [ ] `prisma migrate deploy` 已在 Neon 上成功执行
- [ ] Seed 数据已导入（如需要）
- [ ] 数据库备份已创建（Neon → Branches → Create Branch）

### 静态资源
- [ ] CDN 资源已上传到 Cloudflare R2（如使用）
- [ ] `NEXT_PUBLIC_CDN_URL` 已配置（如使用 CDN）
- [ ] 未配置 CDN 时，确认 `public/` 下大文件已处理

### 环境变量（Vercel → Settings → Environment Variables → Production）
- [ ] `DATABASE_URL` — Neon PostgreSQL 连接串
- [ ] `SESSION_SECRET` — 64 字符随机 hex
- [ ] `NEXT_PUBLIC_APP_URL` — 生产域名

### GitHub
- [ ] `release/3.0-cloud` 分支已推送到 GitHub
- [ ] 所有 5 个 Phase commits 已推送
- [ ] Vercel 已连接到此 GitHub 仓库

## 上线步骤

### Step 1: 预览验证
```bash
# 推送 release 分支 → Vercel 自动创建 Preview
git push origin release/3.0-cloud
```
在 Preview URL 中验证：
- [ ] `/api/health` → `{"status":"ok","database":"connected"}`
- [ ] 登录/注册正常
- [ ] 文章 CRUD 正常
- [ ] 关键页面可访问

### Step 2: 合并到 master
```bash
git checkout master
git merge release/3.0-cloud --no-ff
git tag -a v3.0.0-cloud -m "Digital Garden 3.0 — Cloud Release"
git push origin master --tags
```

### Step 3: Vercel 自动部署
- Vercel 检测到 `master` 推送 → 自动启动 Production 构建
- 构建命令: `npx prisma generate && next build`
- 构建完成后自动切换生产流量

### Step 4: 生产验证
- [ ] 自定义域名 HTTPS 正常
- [ ] `/api/health` 在生产域名下返回正常
- [ ] 登录 → 写作 → 保存 → 重新加载（完整流程）
- [ ] Chat 功能正常
- [ ] 静态资源加载正常

### Step 5: 监控接入
- [ ] UptimeRobot 监控 `/api/health`
- [ ] Vercel Analytics Dashboard 可访问
- [ ] Neon Dashboard 连接监控
