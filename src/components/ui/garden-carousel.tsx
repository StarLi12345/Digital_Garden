"use client";

// ============================================================
// Digital Garden — Garden Carousel v3（花园轮播 · 滑动全屏）
// ============================================================
// · Swiper.js · 单实例，CSS transition 平滑展开/收起
// · 滚轮上滑展开全屏 → 滚轮下滑收起 → ESC 关闭
// ============================================================

import { useEffect, useRef, useState, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { useTheme } from "./theme-provider";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

export interface CarouselSlide {
  image?: string;
  title: string;
  description?: string;
  tag?: string;
}

interface GardenCarouselProps {
  slides: CarouselSlide[];
  height?: string;
  autoplayDelay?: number;
  className?: string;
}

export function GardenCarousel({
  slides,
  height = "360px",
  autoplayDelay = 5000,
  className = "",
}: GardenCarouselProps) {
  const [mounted, setMounted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastWheelRef = useRef(0);

  useEffect(() => { setMounted(true); }, []);

  const updateNavState = useCallback((s: SwiperType) => {
    setIsBeginning(s.isBeginning);
    setIsEnd(s.isEnd);
  }, []);

  // ── Wheel: up at top → expand; down in fullscreen → collapse ──
  const onWheel = useCallback((e: WheelEvent) => {
    if (animating) return;
    const now = Date.now();
    if (now - lastWheelRef.current < 600) return; // debounce

    if (!fullscreen && window.scrollY <= 2 && e.deltaY < -20) {
      lastWheelRef.current = now;
      setAnimating(true);
      setFullscreen(true);
      document.body.style.overflow = "hidden";
      setTimeout(() => setAnimating(false), 600);
    } else if (fullscreen && e.deltaY > 20) {
      lastWheelRef.current = now;
      setAnimating(true);
      setFullscreen(false);
      document.body.style.overflow = "";
      setTimeout(() => setAnimating(false), 600);
    }
  }, [fullscreen, animating]);

  useEffect(() => {
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  // ── ESC ──────────────────────────────────────────────
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setFullscreen(false); document.body.style.overflow = ""; } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const exitFs = () => { setFullscreen(false); document.body.style.overflow = ""; };

  if (!mounted || slides.length === 0) return null;

  return (
    <>
      {/* ── Hero / Fullscreen container (same element, CSS transition) ── */}
      <div
        ref={containerRef}
        className={`garden-carousel overflow-hidden ${className}`}
        style={{
          height: fullscreen ? "100vh" : height,
          width: fullscreen ? "100vw" : "100%",
          position: fullscreen ? "fixed" : "relative",
          top: fullscreen ? 0 : "auto",
          left: fullscreen ? 0 : "auto",
          zIndex: fullscreen ? 70 : "auto",
          borderRadius: fullscreen ? 0 : "var(--radius-lg, 16px)",
          transition: "height 0.6s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.6s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <Swiper
          modules={[Autoplay, EffectFade, Pagination]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          autoplay={{ delay: autoplayDelay, disableOnInteraction: false, pauseOnMouseEnter: true }}
          pagination={{ clickable: true, dynamicBullets: !fullscreen }}
          loop={slides.length > 1}
          speed={800}
          onSwiper={(s) => { setSwiper(s); updateNavState(s); }}
          onSlideChange={(s) => updateNavState(s)}
          style={{ height: "100%" }}
        >
          {slides.map((slide, i) => (
            <SwiperSlide key={i}>
              <SlideContent slide={slide} fullscreen={fullscreen} />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* ── Edge Curtains + Navigation ──────────────────────── */}
        {slides.length > 1 && swiper && (
          <>
            {/* Left edge zone */}
            {!fullscreen && <div className="carousel-edge carousel-edge-left" />}
            <button
              onClick={() => swiper.slidePrev()}
              className={`carousel-nav carousel-nav-prev ${fullscreen ? "carousel-nav-fs" : ""}`}
              aria-label="上一张"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 4L7 12l8 8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Right edge zone */}
            {!fullscreen && <div className="carousel-edge carousel-edge-right" />}
            <button
              onClick={() => swiper.slideNext()}
              className={`carousel-nav carousel-nav-next ${fullscreen ? "carousel-nav-fs" : ""}`}
              aria-label="下一张"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M9 4l8 8-8 8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}

        {/* Hints */}
        {!fullscreen && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none">
            <span className="text-white/60 text-[0.5rem] uppercase tracking-widest">上滑展开</span>
            <svg width="16" height="8" viewBox="0 0 16 8"><path d="M1 7l7-5 7 5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
        )}
        {fullscreen && (
          <>
            <button onClick={exitFs}
              className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white/70 hover:text-white hover:bg-white/20 interactive flex items-center justify-center text-lg">
              ✕
            </button>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-0.5 opacity-40 pointer-events-none">
              <span className="text-white/60 text-[0.5rem] uppercase tracking-widest">下滑退出</span>
              <svg width="16" height="8" viewBox="0 0 16 8"><path d="M1 1l7 5 7-5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        /* ── Swiper Pagination ───────────────────────── */
        .garden-carousel .swiper-pagination-bullet{width:8px;height:8px;background:var(--color-foreground,#fff);opacity:.35;transition:all .3s ease}
        .garden-carousel .swiper-pagination-bullet-active{opacity:.9;width:24px;border-radius:4px;background:var(--color-primary,#6b8c5c)}

        /* ── Hide default Swiper nav arrows ──────────── */
        .garden-carousel .swiper-button-prev,.garden-carousel .swiper-button-next{display:none!important}

        /* ── Edge Curtains (non-fullscreen only) ────── */
        .carousel-edge {
          position: absolute; top: 0; bottom: 0; z-index: 10;
          width: 72px;
          pointer-events: none;
          transition: opacity .5s ease;
          opacity: .55;
        }
        .carousel-edge-left {
          left: 0; border-radius: var(--radius-lg,16px) 0 0 var(--radius-lg,16px);
          background: linear-gradient(to right, rgba(255,255,255,.10) 0%, rgba(255,255,255,.04) 40%, transparent 100%);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          mask-image: linear-gradient(to right, black 20%, transparent 90%);
          -webkit-mask-image: linear-gradient(to right, black 20%, transparent 90%);
        }
        .carousel-edge-right {
          right: 0; border-radius: 0 var(--radius-lg,16px) var(--radius-lg,16px) 0;
          background: linear-gradient(to left, rgba(255,255,255,.10) 0%, rgba(255,255,255,.04) 40%, transparent 100%);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          mask-image: linear-gradient(to left, black 20%, transparent 90%);
          -webkit-mask-image: linear-gradient(to left, black 20%, transparent 90%);
        }
        /* Curtains brighten when nav is hovered */
        .carousel-container:hover .carousel-edge,
        .garden-carousel:hover .carousel-edge { opacity: .78 }

        /* ── Nav Arrows ─────────────────────────────── */
        .carousel-nav {
          position: absolute; top: 50%; z-index: 15;
          padding: 10px 6px;
          display: flex; align-items: center; justify-content: center;
          background: none; border: none;
          color: rgba(255,255,255,.35);
          cursor: pointer; outline: none;
          transform: translateY(-50%);
          transition: all .5s cubic-bezier(.32,.72,0,1);
          filter: drop-shadow(0 1px 2px rgba(0,0,0,.15));
        }
        .carousel-nav svg {
          width: 28px; height: 28px;
          transition: all .5s cubic-bezier(.32,.72,0,1);
        }
        .carousel-nav svg path { stroke: currentColor }

        .carousel-nav-prev { left: 2px }
        .carousel-nav-next { right: 2px }

        /* Default: arrows blend into image */
        /* Hover: arrows emerge — scale + brighten */
        .carousel-nav:hover {
          color: rgba(255,255,255,.92);
          filter: drop-shadow(0 1px 4px rgba(0,0,0,.35)) drop-shadow(0 0 8px rgba(255,255,255,.2));
        }
        .carousel-nav:hover svg { transform: scale(1.18) }
        .carousel-nav-prev:hover svg { transform: scale(1.18) translateX(-2px) }
        .carousel-nav-next:hover svg { transform: scale(1.18) translateX(2px) }

        /* Active press */
        .carousel-nav:active svg { transform: scale(.9) }

        /* Arrow emerges slightly when the whole carousel is hovered */
        .garden-carousel:hover .carousel-nav:not(:hover) {
          color: rgba(255,255,255,.45);
        }

        /* ── Fullscreen overrides ───────────────────── */
        .carousel-nav-fs {
          color: rgba(255,255,255,.45);
          padding: 12px 8px;
        }
        .carousel-nav-fs svg { width: 40px; height: 40px }
        .carousel-nav-fs.carousel-nav-prev { left: 10px }
        .carousel-nav-fs.carousel-nav-next { right: 10px }
        .carousel-nav-fs:hover {
          color: rgba(255,255,255,.95);
          filter: drop-shadow(0 1px 6px rgba(0,0,0,.4)) drop-shadow(0 0 14px rgba(255,255,255,.15));
        }
        .carousel-nav-fs:hover svg { transform: scale(1.2) }
        .carousel-nav-fs.carousel-nav-prev:hover svg { transform: scale(1.2) translateX(-3px) }
        .carousel-nav-fs.carousel-nav-next:hover svg { transform: scale(1.2) translateX(3px) }

        /* ── Slide Overlay ────────────────────────────── */
        .garden-carousel .slide-overlay{background:linear-gradient(0deg,rgba(0,0,0,.4) 0%,rgba(0,0,0,.1) 40%,transparent 70%);position:absolute;inset:0;border-radius:inherit;pointer-events:none}

        /* ── Animations ─────────────────────────────────── */
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .animate-fadeIn{animation:fadeIn .4s ease-out}
      `}</style>
    </>
  );
}

function SlideContent({ slide, fullscreen }: { slide: CarouselSlide; fullscreen?: boolean }) {
  const { resolved } = useTheme();
  const isDark = resolved === "dark";

  return (
    <div className="garden-carousel relative w-full h-full overflow-hidden" style={{ borderRadius: fullscreen ? 0 : "var(--radius-lg, 16px)" }}>
      {slide.image ? (
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[3s] ease-out"
          style={{ backgroundImage: `url(${slide.image})`, transform: fullscreen ? "scale(1.03)" : "scale(1)" }} />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-amber-50/50 to-green-100 dark:from-emerald-950 dark:via-amber-950/30 dark:to-green-950" />
      )}
      <div className="slide-overlay" />
      {/* 深色模式下额外暗化 — 避免图片过亮刺眼；浅色模式不叠加 */}
      {isDark && (
        <div className="absolute inset-0 pointer-events-none bg-black/30" />
      )}
      <div className={`absolute bottom-0 left-0 right-0 ${fullscreen ? "p-12 md:p-16" : "p-8"} z-10`}>
        {slide.tag && (
          <span className="inline-block rounded-full bg-white/20 backdrop-blur-sm text-white text-[0.688rem] px-2.5 py-0.5 mb-2 border border-white/10">
            {slide.tag}
          </span>
        )}
        <h3 className={`font-semibold text-white tracking-tight drop-shadow-md transition-all duration-500 ${fullscreen ? "text-3xl md:text-4xl" : "text-xl"} mb-2`}>
          {slide.title}
        </h3>
        {slide.description && (
          <p className={`text-white/80 drop-shadow-sm transition-all duration-500 ${fullscreen ? "text-base md:text-lg max-w-2xl" : "text-sm max-w-lg line-clamp-2"}`}>
            {slide.description}
          </p>
        )}
      </div>
    </div>
  );
}
