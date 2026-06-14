// ============================================================
// Digital Garden — Prisma Client 单例
// ============================================================
// Next.js App Router 最佳实践：
//   开发环境（HMR）中避免重复实例化 PrismaClient
//   使用 globalThis 缓存在模块热替换间保持引用
// ============================================================

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
