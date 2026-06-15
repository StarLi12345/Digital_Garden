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
// (theme runtime removed)
import { UIPrefsProvider } from "@/components/ui/ui-prefs-provider";
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
  title: "Digital Garden",
  description: "一个属于自己的二次元数字花园",
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
          <ToastProvider>
          <AudioProvider>
          <UIPrefsProvider />
          <AmbientProvider />
          <BackgroundProvider />
          <TopBarContainer>
            <Nav />
          </TopBarContainer>
          <PageBanner />
          <SidebarProvider>
            <PageTransition>{children}</PageTransition>
          </SidebarProvider>
          <FooterConditional>
            <footer className="garden-footer mt-auto py-8">
              <div className="reading-container text-center">
                <FooterQuote />
                <div className="flex items-center justify-center gap-4 text-[0.625rem] text-muted-foreground mt-3">
                  <span>由 <a href="https://nextjs.org" target="_blank" className="hover:text-primary interactive">Next.js</a> 驱动</span>
                  <span className="text-border">|</span>
                  <span>Digital Garden 3.0</span>
                </div>
                <p className="mt-2 text-[0.625rem] text-muted-foreground/50">
                  © {new Date().getFullYear()} Star&apos;s Digital Garden. All Rights Reserved.
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
      </body>
    </html>
  );
}
