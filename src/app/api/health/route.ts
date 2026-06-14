// ============================================================
// Digital Garden — Health Check Endpoint
// ============================================================
// Cloud Migration Phase 4: Vercel 预览部署健康检查。
//
// GET /api/health — 返回部署版本、数据库状态、构建时间。
// 用途: Vercel 部署后快速验证、Uptime 监控、CI/CD 冒烟测试。
// ============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface HealthResponse {
  status: "ok" | "degraded" | "down";
  version: string;
  buildTime: string;
  database: "connected" | "disconnected";
  environment: string;
  uptime: number;
}

// 构建时间戳（在构建时固化）
const BUILD_TIMESTAMP = new Date().toISOString();
const START_TIME = Date.now();

export async function GET() {
  const health: HealthResponse = {
    status: "ok",
    version: "3.0-cloud",
    buildTime: BUILD_TIMESTAMP,
    database: "disconnected",
    environment: process.env.NODE_ENV || "development",
    uptime: Math.floor((Date.now() - START_TIME) / 1000),
  };

  // Database connectivity check
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = "connected";
  } catch {
    health.status = "degraded";
  }

  return NextResponse.json(health);
}
