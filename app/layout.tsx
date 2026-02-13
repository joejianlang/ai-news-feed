import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/lib/contexts/UserContext";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { LocationProvider } from "@/lib/contexts/LocationContext";
import BottomNav from "@/components/BottomNav";
import BookmarkTip from "@/components/BookmarkTip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "数位 Buffet - 智能资讯，随心而阅",
    template: "%s | 数位 Buffet"
  },
  description: "数位 Buffet 是一家专注于 AI 智能分析、深度原创内容的资讯平台。通过 AI 总结与专业解读，为您提供最高质量的科技、财经与文化热点。",
  keywords: ["AI新闻", "深度解读", "数位Buffet", "科技资讯", "智能摘要"],
  authors: [{ name: "数位 Buffet 团队" }],
  creator: "数位 Buffet",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://ai-news-feed-rose.vercel.app",
    siteName: "数位 Buffet",
    title: "数位 Buffet - 智能资讯，随心而阅",
    description: "发现更有深度的资讯。AI 智能总结，专家深度点评，助你快速洞察世界。",
    images: [
      {
        url: "/og-image.jpg", // 建议用户上传一张默认的分享图
        width: 1200,
        height: 630,
        alt: "数位 Buffet",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "数位 Buffet - 智能资讯，随心而阅",
    description: "发现更有深度的资讯。AI 智能总结，专家深度点评。",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.ts",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "数位 Buffet",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pb-16 md:pb-0`}
      >
        <UserProvider>
          <ThemeProvider>
            <LocationProvider>
              {children}
              <BottomNav />
              <BookmarkTip />
            </LocationProvider>
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
