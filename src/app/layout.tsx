import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Neptunium - Minecraft 投影文件管理系统",
  description: "专为 Minecraft 基岩版玩家设计的投影文件管理系统，支持 Litematica、WorldEdit 等多种格式。",
  keywords: "Minecraft, 投影, Litematica, WorldEdit, 基岩版, Geyser",
  authors: [{ name: "Neptunium Team" }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#d4af37',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-secondary/20">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
