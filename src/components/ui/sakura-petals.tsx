"use client";

// ============================================================
// Digital Garden — Sakura Petal Canvas Animation（樱花飘落）
// ============================================================
// 改编自 [樱花飘落]路人女主 wallpaper (832396888)
// 原版用 WebGL + GLSL 粒子系统，这里改为 Canvas 2D
// 轻量级，适合作为花园环境特效
// ============================================================

import { useEffect, useRef } from "react";

interface Petal {
  x: number;
  y: number;
  z: number;       // depth (for parallax scale)
  vx: number;
  vy: number;
  vz: number;
  rotation: number;
  rotSpeed: number;
  size: number;
  opacity: number;
  color: string;
  swayPhase: number;
}

const PETAL_COLORS = [
  "rgba(255,183,197,0.85)", // light pink
  "rgba(255,160,180,0.80)",
  "rgba(255,140,165,0.75)",
  "rgba(255,200,210,0.80)",
  "rgba(255,175,190,0.70)",
];

const PETAL_COUNT = 80;

function createPetal(canvasW: number, canvasH: number): Petal {
  return {
    x: Math.random() * canvasW,
    y: -Math.random() * canvasH - 20,
    z: 0.3 + Math.random() * 0.7, // depth
    vx: (Math.random() - 0.5) * 0.8,
    vy: 0.5 + Math.random() * 1.5,
    vz: 0,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.03,
    size: 4 + Math.random() * 10,
    opacity: 0.4 + Math.random() * 0.5,
    color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    swayPhase: Math.random() * Math.PI * 2,
  };
}

function drawPetal(ctx: CanvasRenderingContext2D, p: Petal) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.scale(p.z, p.z); // parallax depth
  ctx.globalAlpha = p.opacity;

  // Draw a stylized sakura petal (heart-like shape)
  const s = p.size;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  // Simple petal shape: two arcs forming a point
  ctx.moveTo(0, -s * 0.3);
  ctx.bezierCurveTo(s * 0.5, -s * 0.8, s * 0.8, -s * 0.1, 0, s * 0.6);
  ctx.bezierCurveTo(-s * 0.8, -s * 0.1, -s * 0.5, -s * 0.8, 0, -s * 0.3);
  ctx.fill();

  ctx.restore();
}

interface SakuraPetalsProps {
  enabled?: boolean;
  density?: number; // 0-1, mapped to petal count
}

export function SakuraPetals({ enabled = true, density = 0.6 }: SakuraPetalsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const petalsRef = useRef<Petal[]>([]);
  const animRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      cancelAnimationFrame(animRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Init
    const count = Math.round(PETAL_COUNT * density);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (petalsRef.current.length === 0) {
      petalsRef.current = Array.from({ length: count }, () =>
        createPetal(canvas.width, canvas.height)
      );
    }

    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 16.67, 3); // cap at 3x speed
      lastTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const petals = petalsRef.current;

      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];

        // Sway left-right (sinusoidal)
        p.swayPhase += 0.02 * dt;
        p.x += p.vx * dt + Math.sin(p.swayPhase) * 0.3;
        p.y += p.vy * dt;
        p.rotation += p.rotSpeed * dt;

        // Reset if out of bounds
        if (p.y > canvas.height + 50) {
          Object.assign(p, createPetal(canvas.width, canvas.height));
          p.y = -30 - Math.random() * 50;
        }
        if (p.x < -50) p.x = canvas.width + 30;
        if (p.x > canvas.width + 50) p.x = -30;

        drawPetal(ctx, p);
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [enabled, density]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 5, width: "100%", height: "100%" }}
    />
  );
}
