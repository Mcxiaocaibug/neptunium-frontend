# Netlify 部署配置指南

## 🚀 部署步骤

### 1. 连接GitHub仓库
1. 登录 [Netlify Dashboard](https://app.netlify.com)
2. 点击 "New site from Git"
3. 选择 GitHub，授权访问
4. 选择 `Mcxiaocaibug/neptunium-web` 仓库
5. 配置构建设置：
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Functions directory**: `netlify/functions`

### 2. 环境变量配置

在 Netlify Dashboard → Site settings → Environment variables 中添加以下变量：

#### 🔐 应用基础配置
```
APP_NAME=Neptunium
APP_URL=https://your-site-name.netlify.app
NODE_ENV=production
```

#### 🗄️ Supabase PostgreSQL 数据库
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 🔄 Upstash Redis 缓存
```
UPSTASH_REDIS_REST_URL=https://us1-abc123.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXAAIncDEyMzQ1Njc4OWFiY2RlZg==
```

#### ☁️ Cloudflare R2 文件存储
```
CLOUDFLARE_R2_ACCOUNT_ID=1234567890abcdef1234567890abcdef
CLOUDFLARE_R2_ACCESS_KEY_ID=1234567890abcdef1234567890abcdef12345678
CLOUDFLARE_R2_SECRET_ACCESS_KEY=abcdef1234567890abcdef1234567890abcdef12
CLOUDFLARE_R2_BUCKET_NAME=neptunium-files
CLOUDFLARE_R2_PUBLIC_URL=https://pub-1234567890abcdef.r2.dev
```

#### 📧 Resend 邮件服务
```
RESEND_API_KEY=re_123456789_abcdefghijklmnopqrstuvwxyz
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

#### 🔑 NextAuth 认证
```
NEXTAUTH_URL=https://your-site-name.netlify.app
NEXTAUTH_SECRET=your_generated_secret_key_here
```

### 3. 生成 NextAuth Secret

在本地终端运行以下命令生成密钥：
```bash
openssl rand -base64 32
```
或访问：https://generate-secret.vercel.app/32

### 4. 部署触发

配置完环境变量后：
1. 点击 "Deploy site"
2. 或推送代码到GitHub自动触发部署

## 🔧 外部服务配置

### 📊 Supabase 设置
1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 在 SQL Editor 中执行 `database/schema.sql`
4. 在 Settings → API 中获取URL和密钥

### 🔄 Upstash Redis 设置
1. 访问 [Upstash](https://upstash.com)
2. 创建Redis数据库
3. 选择区域（建议选择离用户最近的）
4. 获取REST URL和Token

### ☁️ Cloudflare R2 设置
1. 登录 Cloudflare Dashboard
2. 进入 R2 Object Storage
3. 创建存储桶：`neptunium-files`
4. 创建API Token（权限：R2:Edit）
5. 配置公共访问域名

### 📧 Resend 邮件设置
1. 访问 [Resend](https://resend.com)
2. 添加并验证您的域名
3. 配置DNS记录（SPF、DKIM）
4. 创建API密钥

## 🔍 部署验证

部署成功后，访问以下端点验证：

- **首页**: `https://your-site.netlify.app/`
- **健康检查**: `https://your-site.netlify.app/.netlify/functions/health`
- **API测试**: `https://your-site.netlify.app/.netlify/functions/projection?id=000000`

## 🐛 常见问题

### 构建失败
- 检查环境变量是否正确配置
- 查看构建日志中的具体错误信息

### Functions 错误
- 确保所有依赖都在 package.json 中
- 检查环境变量名称是否正确

### 数据库连接失败
- 验证Supabase URL和密钥
- 确保数据库表已创建

### 邮件发送失败
- 检查Resend API密钥
- 验证发送域名配置

## 📞 支持

如遇问题，请检查：
1. Netlify 构建日志
2. Functions 执行日志
3. 浏览器开发者工具控制台

---

**重要提醒**: 
- 🚫 不要将 `.env.local` 文件推送到GitHub
- ✅ 所有生产环境变量都在Netlify Dashboard中配置
- 🔐 定期轮换API密钥和访问令牌
