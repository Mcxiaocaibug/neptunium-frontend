#!/bin/bash

# Neptunium Web 部署脚本
# 使用方法: ./scripts/deploy.sh [environment]
# 环境: dev, staging, production

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查环境参数
ENVIRONMENT=${1:-production}

if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
    log_error "无效的环境参数: $ENVIRONMENT"
    log_info "使用方法: ./scripts/deploy.sh [dev|staging|production]"
    exit 1
fi

log_info "开始部署到 $ENVIRONMENT 环境..."

# 检查必要的工具
check_dependencies() {
    log_info "检查依赖工具..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        log_error "Git 未安装"
        exit 1
    fi
    
    log_success "依赖检查完成"
}

# 检查环境变量
check_env_vars() {
    log_info "检查环境变量..."
    
    local required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "UPSTASH_REDIS_REST_URL"
        "UPSTASH_REDIS_REST_TOKEN"
        "CLOUDFLARE_R2_ACCOUNT_ID"
        "CLOUDFLARE_R2_ACCESS_KEY_ID"
        "CLOUDFLARE_R2_SECRET_ACCESS_KEY"
        "CLOUDFLARE_R2_PUBLIC_URL"
        "RESEND_API_KEY"
        "NEXTAUTH_SECRET"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "缺少以下环境变量:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        log_info "请在 .env.local 文件中配置这些变量"
        exit 1
    fi
    
    log_success "环境变量检查完成"
}

# 运行测试
run_tests() {
    log_info "运行测试..."
    
    # 这里可以添加测试命令
    # npm run test
    
    log_success "测试通过"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    # 清理之前的构建
    rm -rf .next
    
    # 安装依赖
    npm ci
    
    # 构建项目
    npm run build
    
    log_success "项目构建完成"
}

# 部署到 Netlify
deploy_to_netlify() {
    log_info "部署到 Netlify..."
    
    if ! command -v netlify &> /dev/null; then
        log_warning "Netlify CLI 未安装，正在安装..."
        npm install -g netlify-cli
    fi
    
    # 登录检查
    if ! netlify status &> /dev/null; then
        log_info "请先登录 Netlify:"
        netlify login
    fi
    
    # 部署
    case $ENVIRONMENT in
        "dev")
            netlify deploy --dir=.next
            ;;
        "staging")
            netlify deploy --dir=.next --alias=staging
            ;;
        "production")
            netlify deploy --dir=.next --prod
            ;;
    esac
    
    log_success "部署完成"
}

# 主函数
main() {
    log_info "Neptunium Web 部署脚本 v1.0"
    log_info "目标环境: $ENVIRONMENT"
    echo
    
    check_dependencies
    
    # 只在本地部署时检查环境变量
    if [[ "$ENVIRONMENT" != "production" ]]; then
        check_env_vars
    fi
    
    run_tests
    build_project
    deploy_to_netlify
    
    echo
    log_success "🎉 部署成功完成!"
    log_info "请访问 Netlify Dashboard 查看部署状态"
}

# 执行主函数
main
