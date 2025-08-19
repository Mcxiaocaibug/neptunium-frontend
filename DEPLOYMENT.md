# Neptunium 部署指南

## 🚀 快速部署

### 前置要求

- Node.js 18+ 
- Rust 工具链
- wasm-pack
- Git

### 1. 克隆项目

```bash
git clone https://github.com/Mcxiaocaibug/neptunium-web.git
cd neptunium-web
```

### 2. 安装依赖

```bash
# 安装 Node.js 依赖
npm install

# 安装 Rust 工具链（如果未安装）
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装 wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# 添加 WASM 目标
rustup target add wasm32-unknown-unknown
```

### 3. 构建 Rust WASM 模块

```bash
# 构建 WASM 模块
npm run build:rust

# 或者手动构建
cd rust-backend
chmod +x build.sh
./build.sh
cd ..
```

## 🔧 环境配置

### 环境变量设置

创建 `.env.local` 文件：

```env
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudflare R2 配置
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET_NAME=neptunium-files
CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# Redis 配置 (Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# 邮件服务配置 (Resend)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@your-domain.com
RESEND_FROM_NAME=Neptunium

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=86400

# 应用配置
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Netlify 环境变量

在 Netlify 控制台中设置以下环境变量：

1. **Site settings** → **Environment variables**
2. 添加上述所有环境变量
3. 确保 `NODE_VERSION` 设置为 `18` 或更高

## 🗄️ 数据库设置

### 1. Supabase 设置

1. 创建新的 Supabase 项目
2. 在 SQL 编辑器中执行 `database/schema.sql`
3. 如果从旧版本升级，先执行 `database/migration.sql`

### 2. 数据库表结构

主要表：
- `users` - 用户信息
- `projection_files` - 投影文件
- `api_keys` - API 密钥
- `verification_codes` - 验证码
- `system_logs` - 系统日志
- `file_access_logs` - 文件访问日志
- `system_stats` - 系统统计

### 3. RLS 策略

数据库已配置行级安全策略（RLS），确保数据安全。

## ☁️ 存储配置

### Cloudflare R2 设置

1. 创建 Cloudflare R2 存储桶
2. 生成 API 令牌
3. 配置 CORS 策略：

```json
[
  {
    "AllowedOrigins": ["https://your-domain.com"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## 📧 邮件服务配置

### Resend 设置

1. 注册 Resend 账户
2. 验证发送域名
3. 生成 API 密钥
4. 配置环境变量

## 🚀 部署到 Netlify

### 自动部署

1. 连接 GitHub 仓库到 Netlify
2. 设置构建命令：`npm run build`
3. 设置发布目录：`.next`
4. 配置环境变量
5. 启用自动部署

### 手动部署

```bash
# 构建项目
npm run build

# 部署到 Netlify
npx netlify deploy --prod --dir=.next
```

### 构建配置

`netlify.toml` 配置：

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🔍 验证部署

### 1. 健康检查

访问以下端点验证部署：

- `https://your-domain.com` - 主页
- `https://your-domain.com/api/health` - API 健康检查
- `https://your-domain.com/dashboard` - 管理面板

### 2. 功能测试

1. **用户注册** - 测试邮箱验证流程
2. **文件上传** - 测试匿名和认证上传
3. **API 密钥** - 测试 API 密钥创建和使用
4. **文件下载** - 测试文件访问和下载

### 3. 性能监控

- 检查 Netlify Functions 日志
- 监控 Supabase 数据库性能
- 验证 Cloudflare R2 存储访问

## 🛠️ 故障排除

### 常见问题

1. **WASM 模块加载失败**
   ```bash
   # 重新构建 WASM 模块
   npm run build:rust
   ```

2. **数据库连接错误**
   - 检查 Supabase 环境变量
   - 验证 RLS 策略配置

3. **文件上传失败**
   - 检查 Cloudflare R2 配置
   - 验证 CORS 策略

4. **邮件发送失败**
   - 检查 Resend API 密钥
   - 验证发送域名

### 日志查看

```bash
# Netlify Functions 日志
netlify logs

# 本地开发日志
npm run dev
```

## 📊 监控和维护

### 1. 系统监控

- 使用 Netlify Analytics 监控访问量
- 监控 Supabase 数据库使用情况
- 检查 Cloudflare R2 存储使用量

### 2. 定期维护

- 清理过期的验证码
- 备份重要数据
- 更新依赖包

### 3. 安全检查

- 定期轮换 API 密钥
- 检查访问日志
- 更新安全策略

## 🔄 更新部署

### 代码更新

```bash
# 拉取最新代码
git pull origin main

# 重新构建和部署
npm run build
netlify deploy --prod
```

### 数据库更新

如有数据库结构变更，执行相应的迁移脚本。

## 📞 支持

如遇到部署问题，请：

1. 检查环境变量配置
2. 查看构建日志
3. 参考故障排除指南
4. 提交 GitHub Issue

---

**部署完成后，您将拥有一个功能完整的 Minecraft 投影管理系统！** 🎉
