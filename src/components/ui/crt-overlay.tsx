"use client";

// ============================================================
// Digital Garden — CRT Scanline Overlay（CRT 显示器特效）
// ============================================================
// 来自 ZZZ TV wallpaper (3333357727) 的 CRT effect 思路
// 纯 CSS + Canvas 实现：扫描线 + 波纹扭曲 + 微弱闪烁
// 可在设置中开关。整合为 AmbientProvider 的可选效果。
// ============================================================

import { useEffect, useRef } from "react";

interface CrtOverlayProps {
  enabled?: boolean;
  scanlineOpacity?: number; // 0-1, default 0.08
  flickerIntensity?: number; // 0-1, default 0.02
  curvature?: boolean; // screen curvature vignette
}

export function CrtOverlay({
  enabled = true,
  scanlineOpacity = 0.08,
  flickerIntensity = 0.02,
  curvature = true,
}: CrtOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // WebGL distortion shader (adapted from ZZZ TV crt-effect.js)
  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId = 0;
    let gl: WebGLRenderingContext | null = null;

    try {
      gl = canvas.getContext("webgl", { alpha: true });
      if (!gl) return;
    } catch {
      return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);

    // GLSL shaders (simplified from ZZZ TV crt-effect.js)
    const vertSrc = `
      attribute vec4 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
      }
    `;

    const fragSrc = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform float u_intensity;

      void main() {
        vec2 uv = v_texCoord;

        // Subtle horizontal wave distortion
        float wave = sin((uv.y + u_time * 0.5) * 80.0) * 0.001 * u_intensity;
        uv.x += wave;

        // Scanline pattern
        float scanline = sin(uv.y * 800.0) * 0.5 + 0.5;
        float alpha = mix(0.03, 0.12, scanline) * u_intensity;

        // Vignette (curvature)
        float vignette = 1.0 - smoothstep(0.4, 1.4, length((uv - 0.5) * 1.3));
        alpha *= mix(1.0, 0.6 + vignette * 0.4, u_intensity);

        gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
      }
    `;

    function compileShader(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const vs = compileShader(gl.VERTEX_SHADER, vertSrc);
    const fs = compileShader(gl.FRAGMENT_SHADER, fragSrc);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    const posAttr = gl.getAttribLocation(prog, "a_position");
    const texAttr = gl.getAttribLocation(prog, "a_texCoord");
    const timeUni = gl.getUniformLocation(prog, "u_time");
    const intensityUni = gl.getUniformLocation(prog, "u_intensity");

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const texBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);

    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuf);
    gl.enableVertexAttribArray(texAttr);
    gl.vertexAttribPointer(texAttr, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const render = () => {
      animId = requestAnimationFrame(render);
      gl!.uniform1f(timeUni, performance.now() * 0.001);
      gl!.uniform1f(intensityUni, flickerIntensity * (0.85 + Math.random() * 0.3));
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
    };
    animId = requestAnimationFrame(render);

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl!.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      gl?.deleteProgram(prog);
      gl?.deleteShader(vs);
      gl?.deleteShader(fs);
    };
  }, [enabled, flickerIntensity]);

  if (!enabled) return null;

  return (
    <>
      {/* CSS scanlines overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 9999,
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,${scanlineOpacity}) 2px,
            rgba(0,0,0,${scanlineOpacity}) 4px
          )`,
          opacity: flickerIntensity,
        }}
      />
      {/* WebGL distortion canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 9998, width: "100%", height: "100%" }}
      />
      {/* Vignette overlay */}
      {curvature && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 9997,
            background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.35) 100%)",
          }}
        />
      )}
    </>
  );
}
