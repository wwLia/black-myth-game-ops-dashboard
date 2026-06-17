import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game Ops Dashboard",
  description: "黑神话：悟空游戏运营数据大屏 Demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
