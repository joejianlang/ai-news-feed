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
    default: "优服佳 AI News - 智能资讯，随心而阅",
    template: "%s | 优服佳 AI News"
  },
  description: "优服佳是一家专注于 AI 智能分析、深度原创内容的资讯平台。通过 AI 总结与专业解读，为您提供最高质量的科技、财经与文化热点。",
  keywords: ["AI新闻", "深度解读", "优服佳", "科技资讯", "智能摘要", "PWA"],
  authors: [{ name: "优服佳团队" }],
  creator: "优服佳",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://ai-news-feed-rose.vercel.app",
    siteName: "优服佳",
    title: "优服佳 AI News - 智能资讯，随心而阅",
    description: "发现更有深度的资讯。AI 智能总结，专家深度点评，助你快速洞察世界。",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "优服佳",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "优服佳 AI News - 智能资讯，随心而阅",
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "优服佳",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
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
