import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Nav } from "@/components/ui/nav";
import { PageTransition } from "@/components/ui/page-transition";
import { BackgroundProvider } from "@/components/ui/background-provider";
import { AudioProvider } from "@/components/ui/audio-provider";
import { TopBarContainer } from "@/components/ui/topbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AmbientProvider } from "@/components/ui/ambient-provider";
import { CursorTrail } from "@/components/ui/cursor-trail";
// (theme runtime removed)
import { UIPrefsProvider } from "@/components/ui/ui-prefs-provider";
import { ErrorBoundary } from "@/components/ui/error-fallback";
import { ViewTracker } from "@/components/ui/view-tracker";
import { CompanionWidget } from "@/components/ui/companion";
import { RightsideToolbar } from "@/components/ui/rightside-toolbar";
import { AmbientEffects } from "@/components/ui/ambient-effects";
import { FooterQuote } from "@/components/ui/footer-quote";
import { FooterConditional } from "@/components/ui/footer-conditional";
import { PageBanner } from "@/components/ui/page-banner";
import { MusicPlayer } from "@/components/ui/music-player";
import { ToastProvider } from "@/components/ui/toast";
import "katex/dist/katex.min.css";
import "./globals.css";

// ── Dynamic imports for heavy non-critical components ──
import { SceneThemeRenderer, WidgetPanel } from "@/components/ui/dynamic-wrappers";

// ───────────────────────────────────────────
// Fonts
// ───────────────────────────────────────────
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ───────────────────────────────────────────
// Metadata
// ───────────────────────────────────────────
export const metadata: Metadata = {
  title: "Digital Garden — Star's Digital Garden",
  description: "一个属于自己的二次元数字花园 · 记录回忆、想法、梦境与故事",
  authors: [{ name: "Star.Li曦曜", url: "https://starli-digital-garden.cn" }],
  openGraph: {
    title: "Star's Digital Garden",
    description: "一个属于自己的二次元数字花园 · 记录回忆、想法、梦境与故事",
    siteName: "Star's Digital Garden",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary",
    title: "Star's Digital Garden",
    description: "一个属于自己的二次元数字花园",
    creator: "@Star",
  },
};

// ───────────────────────────────────────────
// Root Layout
// ───────────────────────────────────────────
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read theme cookie for server-side class application (prevents flash)
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value ?? "system";
  const gardenTheme = cookieStore.get("garden-theme")?.value ?? "garden";
  const isDark = theme === "dark";

  return (
    <html
      lang="zh-CN"
      data-theme={gardenTheme}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased ${
        isDark ? "dark" : ""
      }`}
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-full flex flex-col">
        <ThemeProvider initialTheme={(theme as "light" | "dark" | "system") || "system"}>
          <ViewTracker />
          <ToastProvider>
          <AudioProvider>
          <UIPrefsProvider />
          <AmbientProvider />
          <CursorTrail />
          <BackgroundProvider />
          <TopBarContainer>
            <Nav />
          </TopBarContainer>
          <PageBanner />
          <SidebarProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </SidebarProvider>
          <FooterConditional>
            <footer className="garden-footer mt-auto py-8">
              <div className="reading-container text-center">
                <FooterQuote />
                <div className="flex items-center justify-center gap-4 text-[0.625rem] text-muted-foreground mt-3">
                  <span>由 <a href="https://nextjs.org" target="_blank" className="hover:text-primary interactive">Next.js</a> 驱动</span>
                  <span className="text-border">|</span>
                  <span>Digital Garden 4.0</span>
                </div>
                <p className="mt-2 text-[0.625rem] text-muted-foreground/50">
                  © {new Date().getFullYear()} Star.Li曦曜 · Star&apos;s Digital Garden. All Rights Reserved.
                </p>
              </div>
            </footer>
          </FooterConditional>
          <CompanionWidget />
          <MusicPlayer />
          <RightsideToolbar />
          <AmbientEffects />
          <WidgetPanel />
          <SceneThemeRenderer />
          </AudioProvider>
          </ToastProvider>
        </ThemeProvider>
        {/* JS error reporter — filters known harmless Live2D/Cubism SDK errors */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.onerror = function(msg, url, line, col, err) {
            // Cubism SDK internals — non-critical, happens during async model init
            if (msg && msg.indexOf('hitTest') !== -1) return true;
            // React hydration mismatches — non-critical in production
            if (msg && msg.indexOf('#418') !== -1) return true;
            // Waifu library — non-critical race during model re-init
            if (msg && msg.indexOf('innerHTML') !== -1) return true;
            var el = document.createElement('div');
            el.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#c22;color:#fff;padding:12px;font:12px monospace;max-height:40vh;overflow:auto;';
            el.textContent = 'JS ERROR: ' + msg + ' (line ' + line + ')';
            document.body.appendChild(el);
          };
        `}} />
        {/* Console easter egg — authorship mark */}
        <script dangerouslySetInnerHTML={{ __html: `
          console.log(
            "\\n%c🌸 Star's Digital Garden %c4.0\\n%cBy Star.Li\\u66e6\\u66dc %c| Since 2026-06-13 %c| Updated 2026-06-18\\n%c\\u0068ttps://starli-digital-garden.cn",
            "font-size:18px;color:#7a9668;font-weight:bold;",
            "font-size:14px;color:#b8a080;",
            "font-size:11px;color:#999;",
            "font-size:11px;color:#999;",
            "font-size:10px;color:#aab;"
          );
        `}} />
      </body>
    </html>
  );
}
