#!/bin/bash

# Neptunium 生产环境测试脚本
# 用于验证部署后的系统功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 默认配置
APP_URL="${APP_URL:-http://localhost:3000}"
TEST_EMAIL="${TEST_EMAIL:-test@example.com}"
TIMEOUT=10

echo -e "${BLUE}🧪 Neptunium 生产环境测试${NC}"
echo "================================"
echo "测试目标: $APP_URL"
echo "测试邮箱: $TEST_EMAIL"
echo ""

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -n "测试 $test_name ... "
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command" &>/dev/null; then
        echo -e "${GREEN}✅ 通过${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ 失败${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# HTTP 测试函数
test_http() {
    local url="$1"
    local expected_status="${2:-200}"
    local method="${3:-GET}"
    local data="${4:-}"
    
    if [ -n "$data" ]; then
        curl -s -w "%{http_code}" -X "$method" \
             -H "Content-Type: application/json" \
             -d "$data" \
             "$url" -o /dev/null --max-time $TIMEOUT | grep -q "$expected_status"
    else
        curl -s -w "%{http_code}" -X "$method" \
             "$url" -o /dev/null --max-time $TIMEOUT | grep -q "$expected_status"
    fi
}

# 开始测试
echo "🌐 基础连接测试"
echo "----------------"

run_test "主页访问" "test_http '$APP_URL'"
run_test "健康检查" "test_http '$APP_URL/api/health'"

echo ""
echo "🔐 认证系统测试"
echo "----------------"

# 测试注册 API
run_test "注册接口" "test_http '$APP_URL/api/auth-register' 200 POST '{\"email\":\"$TEST_EMAIL\"}'"

# 测试登录 API
run_test "登录接口" "test_http '$APP_URL/api/auth-login' 200 POST '{\"email\":\"$TEST_EMAIL\"}'"

echo ""
echo "📁 文件管理测试"
echo "----------------"

# 测试文件上传 API（匿名）
test_file_data='{"filename":"test.litematic","fileData":"dGVzdA==","userId":null}'
run_test "匿名文件上传" "test_http '$APP_URL/api/upload-file' 201 POST '$test_file_data'"

# 测试投影查询 API
run_test "投影查询接口" "test_http '$APP_URL/api/projection?id=123456' 404 GET"

echo ""
echo "🔑 API 密钥测试"
echo "----------------"

# 测试 API 密钥生成
api_key_data='{"email":"'$TEST_EMAIL'","name":"Test Key"}'
run_test "API密钥生成" "test_http '$APP_URL/api/api-key' 200 POST '$api_key_data'"

# 测试用户文件列表
run_test "用户文件列表" "test_http '$APP_URL/api/user-files' 401 GET"

echo ""
echo "🎨 前端页面测试"
echo "----------------"

run_test "登录页面" "test_http '$APP_URL/login'"
run_test "注册页面" "test_http '$APP_URL/register'"
run_test "上传页面" "test_http '$APP_URL/upload'"
run_test "API文档页面" "test_http '$APP_URL/api-docs'"

echo ""
echo "⚡ 性能测试"
echo "----------"

# 测试响应时间
echo -n "首页响应时间 ... "
response_time=$(curl -w "%{time_total}" -s -o /dev/null "$APP_URL" --max-time $TIMEOUT)
if (( $(echo "$response_time < 3.0" | bc -l) )); then
    echo -e "${GREEN}✅ ${response_time}s${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  ${response_time}s (较慢)${NC}"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# 测试静态资源
echo -n "静态资源加载 ... "
if curl -s "$APP_URL/_next/static/css/app.css" --max-time $TIMEOUT | head -1 | grep -q "html\|body\|@"; then
    echo -e "${GREEN}✅ 正常${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  可能有问题${NC}"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "🔍 安全性测试"
echo "-------------"

# 测试 HTTPS 重定向（如果是生产环境）
if [[ "$APP_URL" == https://* ]]; then
    http_url=$(echo "$APP_URL" | sed 's/https:/http:/')
    run_test "HTTP重定向到HTTPS" "curl -s -I '$http_url' --max-time $TIMEOUT | grep -i 'location.*https'"
fi

# 测试安全头
echo -n "安全响应头 ... "
headers=$(curl -s -I "$APP_URL" --max-time $TIMEOUT)
security_score=0

if echo "$headers" | grep -i "x-frame-options" &>/dev/null; then
    security_score=$((security_score + 1))
fi

if echo "$headers" | grep -i "x-content-type-options" &>/dev/null; then
    security_score=$((security_score + 1))
fi

if echo "$headers" | grep -i "x-xss-protection" &>/dev/null; then
    security_score=$((security_score + 1))
fi

if [ $security_score -ge 2 ]; then
    echo -e "${GREEN}✅ $security_score/3 安全头存在${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  $security_score/3 安全头存在${NC}"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "📊 测试结果汇总"
echo "================"
echo "总测试数: $TOTAL_TESTS"
echo -e "通过: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失败: ${RED}$FAILED_TESTS${NC}"

# 计算通过率
pass_rate=$(echo "scale=1; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
echo "通过率: $pass_rate%"

echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！系统运行正常。${NC}"
    exit 0
elif [ $FAILED_TESTS -le 2 ]; then
    echo -e "${YELLOW}⚠️  有少量测试失败，请检查相关功能。${NC}"
    exit 1
else
    echo -e "${RED}❌ 多个测试失败，系统可能存在问题。${NC}"
    echo ""
    echo "建议检查:"
    echo "1. 网络连接是否正常"
    echo "2. 环境变量是否正确配置"
    echo "3. 数据库和缓存服务是否可用"
    echo "4. 查看应用日志获取详细错误信息"
    exit 2
fi
