import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "StockAI 管理后台",
  description: "管理员控制台",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
