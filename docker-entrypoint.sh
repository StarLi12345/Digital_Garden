#!/bin/sh
# ============================================================
# Digital Garden — Docker Entrypoint
# ============================================================
# 1. 确保数据库表结构存在
# 2. 初始化种子数据（用户 + 52 条笔记）
# 3. 启动 Next.js
# ============================================================
set -e

echo "🌱 Digital Garden — Initializing..."

# ── Step 1: Push schema to create tables if needed ─────
echo "📦 [1/3] Ensuring database tables exist..."
npx prisma db push 2>&1 | tail -5

# ── Step 2: Seed default user + 52 entries ─────────────
echo "👤 [2/3] Seeding default user & content..."
node scripts/init-production.mjs 2>&1

# ── Step 3: Start the application ──────────────────────
echo "🚀 [3/3] Starting Digital Garden..."
exec npm run start
