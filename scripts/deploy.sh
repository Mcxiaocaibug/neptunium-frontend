#!/bin/bash

# Neptunium 生产环境部署脚本
# 用于自动化部署到 Netlify

set -e

echo "🚀 开始部署 Neptunium Web 到生产环境..."

# 检查必要的环境变量
check_env_var() {
    if [ -z "${!1}" ]; then
        echo "❌ 错误: 环境变量 $1 未设置"
        exit 1
    fi
}

echo "📋 检查环境变量..."
check_env_var "NEXT_PUBLIC_SUPABASE_URL"
check_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY"
check_env_var "SUPABASE_SERVICE_ROLE_KEY"
check_env_var "UPSTASH_REDIS_REST_URL"
check_env_var "UPSTASH_REDIS_REST_TOKEN"
check_env_var "CLOUDFLARE_R2_ACCOUNT_ID"
check_env_var "CLOUDFLARE_R2_ACCESS_KEY_ID"
check_env_var "CLOUDFLARE_R2_SECRET_ACCESS_KEY"
check_env_var "RESEND_API_KEY"
check_env_var "JWT_SECRET"

echo "✅ 环境变量检查通过"

# 清理旧的构建文件
echo "🧹 清理构建缓存..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf rust-backend/target

# 安装依赖
echo "📦 安装依赖..."
npm ci --legacy-peer-deps

# 构建 Rust 后端 (如果不在 Netlify 环境)
if [ "$NETLIFY" != "true" ]; then
    echo "🦀 构建 Rust 后端..."
    cd rust-backend
    chmod +x build.sh
    ./build.sh
    cd ..
else
    echo "⚠️  跳过 Rust 构建 (Netlify 环境)"
fi

# 运行 ESLint 检查
echo "🔍 运行代码检查..."
npm run lint

# 构建项目
echo "🏗️  构建项目..."
npm run build

# 检查构建结果
if [ ! -d ".next" ]; then
    echo "❌ 构建失败: .next 目录不存在"
    exit 1
fi

echo "✅ 构建成功"

# 如果在 CI 环境中，运行额外的检查
if [ "$CI" = "true" ]; then
    echo "🧪 运行生产环境测试..."
    
    # 检查关键文件是否存在
    required_files=(
        ".next/server/app/layout.html"
        ".next/server/app/page.html"
        "netlify/functions"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -e "$file" ]; then
            echo "❌ 关键文件缺失: $file"
            exit 1
        fi
    done
    
    echo "✅ 生产环境测试通过"
fi

# 显示部署信息
echo ""
echo "🎉 部署准备完成!"
echo ""
echo "📊 构建统计:"
echo "   - Next.js 版本: $(npm list next --depth=0 2>/dev/null | grep next@ | cut -d'@' -f2)"
echo "   - 构建时间: $(date)"
echo "   - 构建大小: $(du -sh .next 2>/dev/null | cut -f1)"
echo ""
echo "🔧 下一步:"
echo "   1. 确保所有环境变量已在 Netlify 中配置"
echo "   2. 推送代码到 Git 仓库"
echo "   3. Netlify 将自动触发部署"
echo ""
echo "🌐 部署后检查清单:"
echo "   □ 访问网站首页"
echo "   □ 测试用户注册/登录"
echo "   □ 测试文件上传功能"
echo "   □ 测试 API 密钥生成"
echo "   □ 检查数据库连接"
echo "   □ 检查 Redis 缓存"
echo "   □ 检查文件存储"
echo "   □ 检查邮件发送"
echo ""

exit 0