#!/bin/bash
# ============================================================
# Digital Garden — 一键部署脚本
# ============================================================
# 使用方式:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# 或指定服务器:
#   ./deploy.sh root@8.163.52.33
# ============================================================
set -e

# ── 配置 ─────────────────────────────────────────────
SERVER="${1:-root@8.163.52.33}"
REMOTE_DIR="/www/wwwroot/garden"
PACKAGE="garden-deploy-$(date +%Y%m%d-%H%M%S).tar.gz"
EXCLUDES=(
  --exclude='node_modules'
  --exclude='.next'
  --exclude='.git'
  --exclude='*.tar.gz'
  --exclude='*.zip'
  --exclude='resource'
  --exclude='melotts-server'
  --exclude='.tmp-live2d'
  --exclude='.tmp-models'
  --exclude='memory'
  --exclude='snapshots'
  --exclude='docs'
  --exclude='.vscode'
  --exclude='*.bak'
  --exclude='prisma/dev.db'          # 保护服务器数据库！
  --exclude='.env'                    # 保护服务器 .env！
  --exclude='.env.local'
  --exclude='.DS_Store'
)

# ── 颜色 ─────────────────────────────────────────────
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  🌱 Digital Garden — 一键部署${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ── Step 1: 打包 ────────────────────────────────────
echo -e "${YELLOW}📦 [1/4] 打包项目...${NC}"
tar --warning=no-file-changed -czf "$PACKAGE" "${EXCLUDES[@]}" .
SIZE=$(du -h "$PACKAGE" | cut -f1)
echo -e "      → ${GREEN}${PACKAGE} (${SIZE})${NC}"

# ── Step 2: 上传 ────────────────────────────────────
echo -e "${YELLOW}📤 [2/4] 上传到服务器...${NC}"
scp "$PACKAGE" "${SERVER}:${REMOTE_DIR}/" && echo -e "      → ${GREEN}上传完成${NC}" || {
  echo -e "      → ${YELLOW}⚠️  SCP 失败——请用宝塔上传 ${PACKAGE} 到 ${REMOTE_DIR}/${NC}"
  echo -e "      → 上传后执行: ssh ${SERVER} 'cd ${REMOTE_DIR} && ./deploy-remote.sh ${PACKAGE}'"
  exit 1
}

# ── Step 3: 远程部署 ─────────────────────────────────
echo -e "${YELLOW}🚀 [3/4] 远程部署...${NC}"
ssh "$SERVER" "cd ${REMOTE_DIR} && \
  tar -xzf ${PACKAGE} && \
  echo '  解压完成' && \
  npm run build 2>&1 | tail -5 && \
  echo '  构建完成' && \
  pm2 restart garden --update-env && \
  echo '  应用已重启'"

# ── Step 4: 清理 ────────────────────────────────────
echo -e "${YELLOW}🧹 [4/4] 清理...${NC}"
rm -f "$PACKAGE"
ssh "$SERVER" "cd ${REMOTE_DIR} && rm -f ${PACKAGE} garden-deploy-*.tar.gz garden-*.tar.gz 2>/dev/null; ls *.tar.gz 2>/dev/null || echo '  无残留压缩包'"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  ✅ 部署完成！${NC}"
echo -e "${GREEN}  🌐 https://starli-digital-garden.cn/${NC}"
echo -e "${GREEN}============================================${NC}"
