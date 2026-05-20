import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "A股交易指导助手",
  description: "AI驱动的股票交易分析工具",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
