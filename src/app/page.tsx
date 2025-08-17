import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export default function Home() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <section className="text-center py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Neptunium
            </span>
            <br />
            Minecraft 投影管理系统
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            专为 Minecraft 基岩版玩家设计的投影文件管理系统，支持 Litematica、WorldEdit 等多种格式，
            让您的建筑创作更加便捷。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/upload">
              <Button size="lg" className="w-full sm:w-auto">
                开始上传文件
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                免费注册
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            为什么选择 Neptunium？
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            我们提供最专业的 Minecraft 投影文件管理解决方案
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <CardTitle>简单上传</CardTitle>
              <CardDescription>
                支持拖拽上传，一键生成6位投影ID，无需复杂操作
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle>多格式支持</CardTitle>
              <CardDescription>
                支持 .litematic、.schem、.schematic、.nbt 等主流投影格式
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <CardTitle>基岩版优化</CardTitle>
              <CardDescription>
                专为 Geyser 基岩版玩家优化，完美兼容 FormUI 界面
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <CardTitle>安全可靠</CardTitle>
              <CardDescription>
                企业级安全保障，文件加密存储，隐私数据完全保护
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <CardTitle>API 集成</CardTitle>
              <CardDescription>
                提供完整的 API 接口，支持插件端直接调用和集成
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:scale-105 transition-transform duration-300">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <CardTitle>高性能</CardTitle>
              <CardDescription>
                基于 Cloudflare 全球 CDN，文件传输速度快，访问延迟低
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            准备开始您的建筑之旅了吗？
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            立即注册 Neptunium，享受专业的投影文件管理服务
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                免费注册
              </Button>
            </Link>
            <Link href="/upload">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                匿名上传
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
