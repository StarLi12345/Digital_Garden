"use client";

// ============================================================
// Digital Garden — Ambient Effects Provider
// ============================================================
// Canvas-based: particles / rain / snow / dust / geometry
// Cursor effects. Single requestAnimationFrame loop.
// ============================================================

import { useEffect, useRef } from "react";
import { getAmbientEffect, getCursorEffect, type AmbientEffect, type CursorEffect } from "@/lib/ambient-config";

// ── Particle types ────────────────────────────────────

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; opacity: number; rotation: number; rotSpeed: number;
  color: string; life: number;
}

// ── Effect runners ─────────────────────────────────────

function petalParticles(count: number, w: number, h: number): Particle[] {
  const colors = ["#f4c2c2", "#f0d5d5", "#e8c8d0", "#fcd5ce", "#f8edeb"];
  return Array.from({ length: count }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.6, vy: 0.3 + Math.random() * 0.8,
    size: 4 + Math.random() * 6, opacity: 0.3 + Math.random() * 0.4,
    rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.02,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: Infinity,
  }));
}

function dustParticles(count: number, w: number, h: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.2,
    size: 1 + Math.random() * 2, opacity: 0.15 + Math.random() * 0.25,
    rotation: 0, rotSpeed: 0,
    color: `rgba(180,170,150,${0.15 + Math.random() * 0.2})`,
    life: Infinity,
  }));
}

function snowParticles(count: number, w: number, h: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.5, vy: 0.3 + Math.random() * 1.2,
    size: 2 + Math.random() * 4, opacity: 0.4 + Math.random() * 0.5,
    rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.01,
    color: "rgba(255,255,255,",
    life: Infinity,
  }));
}

function rainDrops(count: number, w: number, h: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: -0.3, vy: 4 + Math.random() * 6,
    size: 1, opacity: 0.2 + Math.random() * 0.3,
    rotation: 0, rotSpeed: 0,
    color: `rgba(150,170,200,${0.15 + Math.random() * 0.25})`,
    life: Infinity,
  }));
}

function geometryShapes(count: number, w: number, h: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.3,
    size: 6 + Math.random() * 14, opacity: 0.08 + Math.random() * 0.12,
    rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.015,
    color: "rgba(150,140,130,",
    life: Infinity,
  }));
}

// ── Cursor trail ───────────────────────────────────────

interface TrailParticle {
  x: number; y: number; size: number; opacity: number; life: number;
  color: string; vx: number; vy: number;
}

const cursorTrails: TrailParticle[] = [];
let mouseX = -100, mouseY = -100;

function spawnCursorParticle(effect: CursorEffect) {
  const colors: Record<string, string[]> = {
    petal: ["#f4c2c2", "#fcd5ce", "#e8c8d0"],
    dust: ["rgba(180,170,150,", "rgba(160,150,130,"],
    snow: ["rgba(255,255,255,", "rgba(240,245,255,"],
  };
  const c = colors[effect] || colors.petal;
  const base = c[Math.floor(Math.random() * c.length)];

  cursorTrails.push({
    x: mouseX + (Math.random() - 0.5) * 10,
    y: mouseY + (Math.random() - 0.5) * 10,
    size: 3 + Math.random() * 5,
    opacity: 0.6 + Math.random() * 0.4,
    life: 40 + Math.random() * 30,
    color: base,
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 1.5 - 1,
  });
}

// ── Provider ──────────────────────────────────────────

export function AmbientProvider() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const effectRef = useRef<AmbientEffect>("none");
  const cursorRef = useRef<CursorEffect>("none");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = 0, h = 0;
    let frameCount = 0;

    const resize = () => {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w; canvas.height = h;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouse = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY; };
    window.addEventListener("mousemove", onMouse);

    const storageHandler = () => {
      effectRef.current = getAmbientEffect();
      cursorRef.current = getCursorEffect();
      initParticles();
    };
    window.addEventListener("storage", storageHandler);

    const initParticles = () => {
      const ambient = effectRef.current;
      const isMobile = w < 768;
      const baseCount = isMobile ? 15 : 40;
      switch (ambient) {
        case "petal": particlesRef.current = petalParticles(baseCount, w, h); break;
        case "dust": particlesRef.current = dustParticles(baseCount * 1.5, w, h); break;
        case "snow": particlesRef.current = snowParticles(baseCount, w, h); break;
        case "rain": particlesRef.current = rainDrops(baseCount * 2, w, h); break;
        case "geometry": particlesRef.current = geometryShapes(baseCount / 2, w, h); break;
        default: particlesRef.current = []; break;
      }
    };

    // Initial setup
    effectRef.current = getAmbientEffect();
    cursorRef.current = getCursorEffect();
    initParticles();

    const drawParticle = (p: Particle) => {
      const ambient = effectRef.current;
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (ambient === "rain") {
        ctx.strokeStyle = p.color.replace(/[\d.]+\)$/, p.opacity + ")");
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-p.vx * 3, -p.vy * 3);
        ctx.stroke();
      } else if (ambient === "geometry") {
        ctx.fillStyle = p.color + p.opacity + ")";
        ctx.beginPath();
        const s = p.size / 2;
        // Random shape per particle based on index
        const shapeIdx = Math.floor(p.x) % 3;
        if (shapeIdx === 0) ctx.arc(0, 0, s, 0, Math.PI * 2); // circle
        else if (shapeIdx === 1) { // triangle
          ctx.moveTo(0, -s); ctx.lineTo(s * 0.87, s * 0.5); ctx.lineTo(-s * 0.87, s * 0.5);
        } else { // square
          ctx.rect(-s, -s, s * 2, s * 2);
        }
        ctx.fill();
      } else if (ambient === "dust") {
        ctx.fillStyle = p.color + p.opacity + ")";
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (ambient === "snow") {
        ctx.fillStyle = p.color + p.opacity + ")";
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // petal
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawCursor = () => {
      for (let i = cursorTrails.length - 1; i >= 0; i--) {
        const t = cursorTrails[i];
        t.x += t.vx; t.y += t.vy; t.life--; t.opacity *= 0.97; t.size *= 0.99;
        if (t.life <= 0) { cursorTrails.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = t.opacity;
        ctx.fillStyle = typeof t.color === "string" && t.color.startsWith("rgba") ? t.color + t.opacity + ")" : t.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      const ambient = effectRef.current;
      const particles = particlesRef.current;

      // Update + draw ambient
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.rotation += p.rotSpeed;
        // Wrap around screen edges
        if (ambient === "rain") {
          if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }
          if (p.x < -10) p.x = w + 10;
        } else {
          if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
          if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
        }
        drawParticle(p);
      }

      // Cursor trail
      if (cursorRef.current !== "none" && frameCount % 2 === 0) {
        spawnCursorParticle(cursorRef.current);
      }
      drawCursor();

      frameCount++;
      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", inset: 0, zIndex: 0,
        pointerEvents: "none", width: "100%", height: "100%",
      }}
      aria-hidden="true"
    />
  );
}
