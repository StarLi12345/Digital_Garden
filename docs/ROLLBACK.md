# 回滚手册 — Star's Digital Garden 3.0

## 回滚决策矩阵

| 严重度 | 场景 | 回滚方式 | 预计时间 |
|--------|------|---------|---------|
| 🔴 P0 | 生产完全不可用 | Vercel Instant Rollback | < 10 秒 |
| 🟡 P1 | 特定功能异常 | Git revert → 重新部署 | ~5 分钟 |
| 🟢 P2 | 样式/UI 问题 | 修复后 patch 提交 | 视情况 |

## 方案 A: Vercel Instant Rollback（最快）

**适用**: 任何 Vercel 部署问题，无需改动代码。

1. 打开 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 → **Deployments** 标签
3. 找到上一个成功的生产部署
4. 点击 `…` → **Promote to Production**
5. 10 秒内流量切回旧版本

**优点**: 无需 Git 操作，秒级回滚
**缺点**: 仅回滚前端/API，不涉及数据库

## 方案 B: Git Revert（需代码修改时）

```bash
# 1. 确定要回退到的 commit
git log --oneline master

# 示例 commit 链:
# 6bff73c feat: Phase 4 — Vercel preview deployment preparation
# 8992e94 feat: Phase 3 — environment variables audit + Vercel deployment config
# 6518a80 feat: Phase 2 — CDN asset resolution infrastructure
# 9b054d4 feat: Phase 1 — database migration SQLite to PostgreSQL
# 4eb7e2f chore: baseline stable 3.0 before cloud migration
# 90512e1 feat: Digital Garden 3.0

# 2. 回退到目标 commit
git checkout master
git revert <failing-commit>  # 保留历史
# 或
git reset --hard <stable-commit>  # 需要 force push

# 3. 推送 → Vercel 自动部署
git push origin master
```

## 方案 C: 数据库回滚（Neon）

**适用**: 数据迁移出现问题。

1. Neon Dashboard → **Branches**
2. 找到迁移前的分支 → **Restore**
3. 更新 Vercel 中 `DATABASE_URL` 指向恢复后的连接串
4. 重新部署

**注意**: Neon 默认保留 7 天时间点恢复。

## Phase 级别回滚表

| 想回退到 | Git 命令 | 数据库操作 |
|---------|---------|-----------|
| Phase 0 (基线) | `git reset --hard 4eb7e2f` | 切换回 SQLite (`prisma/migrations_sqlite_backup/`) |
| Phase 1 前 | `git reset --hard 4eb7e2f` | 原有 SQLite dev.db |
| Phase 2 前 | `git reset --hard 9b054d4` | PostgreSQL 保持不变 |
| Phase 3 前 | `git reset --hard 6518a80` | PostgreSQL 保持不变 |
| Phase 4 前 | `git reset --hard 8992e94` | PostgreSQL 保持不变 |

## 最易出错的步骤与预防

| 风险 | 预防措施 |
|------|---------|
| 环境变量遗漏 | 部署前对照 `.env.example` 逐项检查 |
| Prisma 迁移冲突 | 始终在 Neon Dev Branch 先跑 `prisma migrate dev` |
| CDN 路径断裂 | 不配置 `NEXT_PUBLIC_CDN_URL` 时自动回退本地路径 |
| 构建超时 | Vercel 构建限制 45 分钟，当前项目 < 2 分钟 |

## 紧急联系

- Vercel Status: https://vercel-status.com
- Neon Status: https://neonstatus.com
- GitHub Issues: 项目仓库 Issues 页面
