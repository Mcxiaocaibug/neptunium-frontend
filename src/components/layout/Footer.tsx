import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">N</span>
              </div>
              <span className="text-xl font-bold text-foreground">Neptunium</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-md">
              专为 Minecraft 基岩版玩家设计的投影文件管理系统，支持 Litematica、WorldEdit 等多种格式。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">快速链接</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/upload" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  上传文件
                </Link>
              </li>
              <li>
                <Link href="/files" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  我的文件
                </Link>
              </li>
              <li>
                <Link href="/api-key" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  API 密钥
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">支持</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/docs" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  使用文档
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  API 文档
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/neptunium-project"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center">
          <div className="flex flex-col items-center sm:items-start space-y-2">
            <p className="text-sm text-muted-foreground">
              © 2025 Neptunium. All rights reserved.
            </p>
            <a
              href="https://www.netlify.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              This site is powered by Netlify
            </a>
          </div>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              隐私政策
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              服务条款
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
