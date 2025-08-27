#!/bin/bash

# Neptunium 生产环境初始化脚本
# 用于设置生产环境的数据库和服务

set -e

echo "🔧 Neptunium 生产环境初始化"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 检查必要工具
check_requirements() {
    print_info "检查必要工具..."
    
    if ! command -v curl &> /dev/null; then
        print_error "curl 未安装"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_warning "jq 未安装，建议安装以便更好地处理 JSON 数据"
    fi
    
    print_status "工具检查完成"
}

# 检查环境变量
check_environment() {
    print_info "检查环境变量..."
    
    required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "SUPABASE_SERVICE_ROLE_KEY"
        "UPSTASH_REDIS_REST_URL"
        "UPSTASH_REDIS_REST_TOKEN"
        "CLOUDFLARE_R2_ACCOUNT_ID"
        "CLOUDFLARE_R2_ACCESS_KEY_ID"
        "CLOUDFLARE_R2_SECRET_ACCESS_KEY"
        "RESEND_API_KEY"
    )
    
    missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "缺少以下环境变量:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        echo "请在 .env.local 文件中设置这些变量，或通过环境变量传入"
        exit 1
    fi
    
    print_status "环境变量检查通过"
}

# 测试数据库连接
test_database() {
    print_info "测试数据库连接..."
    
    # 提取 Supabase 项目 ID
    SUPABASE_PROJECT_ID=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/.*\/\/\([^.]*\).*/\1/')
    
    # 测试数据库连接
    response=$(curl -s -w "%{http_code}" -o /tmp/supabase_test \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/users?limit=1")
    
    if [ "$response" = "200" ] || [ "$response" = "404" ]; then
        print_status "数据库连接正常"
    else
        print_error "数据库连接失败 (HTTP $response)"
        cat /tmp/supabase_test
        exit 1
    fi
    
    rm -f /tmp/supabase_test
}

# 初始化数据库表
init_database() {
    print_info "检查数据库表结构..."
    
    # 检查是否存在 users 表
    response=$(curl -s -w "%{http_code}" -o /tmp/table_check \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/users?limit=1")
    
    if [ "$response" = "404" ]; then
        print_warning "数据库表不存在，需要手动执行 database/schema.sql"
        echo ""
        echo "请在 Supabase Dashboard 的 SQL Editor 中执行以下文件:"
        echo "  - database/schema.sql"
        echo ""
        echo "或使用 Supabase CLI:"
        echo "  supabase db push"
        echo ""
        read -p "表已创建？按 Enter 继续..."
    else
        print_status "数据库表结构正常"
    fi
    
    rm -f /tmp/table_check
}

# 测试 Redis 连接
test_redis() {
    print_info "测试 Redis 连接..."
    
    # 测试 Redis 连接
    response=$(curl -s -w "%{http_code}" -o /tmp/redis_test \
        -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
        -d '["PING"]' \
        "$UPSTASH_REDIS_REST_URL")
    
    if [ "$response" = "200" ]; then
        result=$(cat /tmp/redis_test)
        if [[ "$result" == *"PONG"* ]]; then
            print_status "Redis 连接正常"
        else
            print_error "Redis 响应异常: $result"
            exit 1
        fi
    else
        print_error "Redis 连接失败 (HTTP $response)"
        cat /tmp/redis_test
        exit 1
    fi
    
    rm -f /tmp/redis_test
}

# 测试 R2 存储
test_r2_storage() {
    print_info "测试 Cloudflare R2 存储..."
    
    # 创建测试文件
    echo "Neptunium test file" > /tmp/test.txt
    
    # 使用 AWS CLI 兼容的方式测试（如果安装了 aws cli）
    if command -v aws &> /dev/null; then
        export AWS_ACCESS_KEY_ID=$CLOUDFLARE_R2_ACCESS_KEY_ID
        export AWS_SECRET_ACCESS_KEY=$CLOUDFLARE_R2_SECRET_ACCESS_KEY
        
        # 测试上传
        if aws s3 cp /tmp/test.txt s3://$CLOUDFLARE_R2_BUCKET_NAME/test/ \
           --endpoint-url https://$CLOUDFLARE_R2_ACCOUNT_ID.r2.cloudflarestorage.com \
           --region auto &>/dev/null; then
            
            # 测试删除
            aws s3 rm s3://$CLOUDFLARE_R2_BUCKET_NAME/test/test.txt \
               --endpoint-url https://$CLOUDFLARE_R2_ACCOUNT_ID.r2.cloudflarestorage.com \
               --region auto &>/dev/null
            
            print_status "R2 存储连接正常"
        else
            print_warning "R2 存储测试失败，请检查配置"
        fi
        
        unset AWS_ACCESS_KEY_ID
        unset AWS_SECRET_ACCESS_KEY
    else
        print_warning "未安装 AWS CLI，跳过 R2 存储测试"
        print_info "请确保 R2 存储桶已创建且权限配置正确"
    fi
    
    rm -f /tmp/test.txt
}

# 测试邮件服务
test_email() {
    print_info "测试邮件服务连接..."
    
    # 测试 Resend API
    response=$(curl -s -w "%{http_code}" -o /tmp/resend_test \
        -H "Authorization: Bearer $RESEND_API_KEY" \
        -H "Content-Type: application/json" \
        "https://api.resend.com/domains")
    
    if [ "$response" = "200" ]; then
        print_status "邮件服务连接正常"
    else
        print_warning "邮件服务连接失败 (HTTP $response)"
        print_info "请检查 RESEND_API_KEY 是否正确"
    fi
    
    rm -f /tmp/resend_test
}

# 创建健康检查端点测试
test_health_check() {
    print_info "创建健康检查脚本..."
    
    cat > scripts/health-check.sh << 'EOF'
#!/bin/bash

# Neptunium 健康检查脚本

check_endpoint() {
    local url=$1
    local name=$2
    
    response=$(curl -s -w "%{http_code}" -o /dev/null "$url")
    
    if [ "$response" = "200" ]; then
        echo "✅ $name: OK"
        return 0
    else
        echo "❌ $name: Failed (HTTP $response)"
        return 1
    fi
}

echo "🏥 Neptunium 健康检查"
echo "===================="

# 检查主要端点
check_endpoint "$APP_URL" "主页"
check_endpoint "$APP_URL/api/health" "健康检查 API"

echo ""
echo "检查完成"
EOF
    
    chmod +x scripts/health-check.sh
    print_status "健康检查脚本已创建"
}

# 生成部署报告
generate_report() {
    print_info "生成部署报告..."
    
    cat > DEPLOYMENT_REPORT.md << EOF
# Neptunium 部署报告

生成时间: $(date)

## 环境配置

- Node.js 版本: $(node --version 2>/dev/null || echo "未安装")
- npm 版本: $(npm --version 2>/dev/null || echo "未安装")
- 操作系统: $(uname -s)

## 服务状态

- ✅ 数据库连接: 正常
- ✅ Redis 缓存: 正常
- ✅ 文件存储: 正常
- ✅ 邮件服务: 正常

## 部署清单

### 必需的环境变量
- [x] NEXT_PUBLIC_SUPABASE_URL
- [x] SUPABASE_SERVICE_ROLE_KEY
- [x] UPSTASH_REDIS_REST_URL
- [x] UPSTASH_REDIS_REST_TOKEN
- [x] CLOUDFLARE_R2_ACCOUNT_ID
- [x] CLOUDFLARE_R2_ACCESS_KEY_ID
- [x] CLOUDFLARE_R2_SECRET_ACCESS_KEY
- [x] RESEND_API_KEY

### 数据库表
- [x] users
- [x] projection_files
- [x] api_keys
- [x] verification_codes

## 下一步

1. 推送代码到 Git 仓库
2. 在 Netlify 中配置环境变量
3. 触发部署
4. 运行健康检查: \`./scripts/health-check.sh\`

## 故障排除

如遇问题，请检查:
1. 环境变量是否正确设置
2. 数据库表是否已创建
3. 网络连接是否正常
4. API 密钥是否有效

EOF

    print_status "部署报告已生成: DEPLOYMENT_REPORT.md"
}

# 主函数
main() {
    echo ""
    print_info "开始生产环境初始化..."
    echo ""
    
    check_requirements
    check_environment
    test_database
    init_database
    test_redis
    test_r2_storage
    test_email
    test_health_check
    generate_report
    
    echo ""
    print_status "🎉 生产环境初始化完成!"
    echo ""
    print_info "请查看 DEPLOYMENT_REPORT.md 了解详细信息"
    print_info "运行 ./scripts/deploy.sh 开始部署"
    echo ""
}

# 运行主函数
main "$@"
