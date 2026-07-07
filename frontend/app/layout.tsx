import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "SellerPulse Agent | 跨境电商运营晨报",
  description: "每日自动分析店铺数据，生成运营晨报与待办事项",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-app text-fg">
        <Sidebar />
        <main className="ml-60 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
