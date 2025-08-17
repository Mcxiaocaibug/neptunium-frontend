# Neptunium Web - Minecraft 投影文件管理系统

专为 Minecraft 基岩版玩家设计的投影文件管理系统，支持 Litematica、WorldEdit 等多种格式。

## 🚀 技术栈

- **前端**: Next.js 15 + React 19 + TypeScript + TailwindCSS v4
- **后端**: Netlify Functions (Node.js/TypeScript)
- **数据库**: Supabase PostgreSQL (500MB)
- **缓存**: Upstash Redis (256MB)
- **文件存储**: Cloudflare R2 (10GB)
- **邮件服务**: Resend API
- **部署**: Netlify

## 📋 功能特性

- ✅ 用户注册/登录（邮箱验证）
- ✅ 文件上传（支持匿名和登录用户）
- ✅ 6位数投影ID生成
- ✅ 文件历史记录管理
- ✅ API密钥生成与管理
- ✅ 插件端API接口
- ✅ 黑金主题UI设计
- ✅ 响应式设计

## 🛠️ 快速开始

### 1. 环境要求

- Node.js 18+
- npm 或 yarn
- Git

### 2. 克隆项目

```bash
git clone <your-repo-url>
cd neptunium-web
```

### 3. 安装依赖

```bash
npm install
```

### 4. 环境配置

复制环境变量模板：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，配置以下服务：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Upstash Redis 配置
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token

# Cloudflare R2 配置
CLOUDFLARE_R2_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
CLOUDFLARE_R2_BUCKET_NAME=neptunium-files
CLOUDFLARE_R2_PUBLIC_URL=your_r2_public_url

# Resend 配置
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# NextAuth 配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# 应用配置
APP_URL=http://localhost:3000
APP_NAME=Neptunium
```

### 5. 数据库设置

在 Supabase 中执行 `database/schema.sql` 文件来创建数据库表结构。

### 6. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🔧 服务配置指南

### Supabase PostgreSQL 配置

1. 访问 [Supabase](https://supabase.com) 创建新项目
2. 在项目设置中获取：
   - Project URL
   - Anon Key
   - Service Role Key
3. 在 SQL Editor 中执行 `database/schema.sql`

### Upstash Redis 配置

1. 访问 [Upstash](https://upstash.com) 创建 Redis 数据库
2. 获取 REST URL 和 Token
3. 选择合适的区域（建议选择离用户最近的区域）

### Cloudflare R2 配置

1. 登录 Cloudflare Dashboard
2. 创建 R2 存储桶：
   ```bash
   # 存储桶名称建议：neptunium-files
   ```
3. 创建 API Token：
   - 权限：R2:Edit
   - 资源：包含所有账户和区域
4. 配置 CORS（可选）：
   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedHeaders": ["*"]
     }
   ]
   ```

### Resend 邮件配置

1. 访问 [Resend](https://resend.com) 注册账户
2. 验证发送域名：
   - 添加您的域名
   - 配置 DNS 记录
3. 创建 API Key
4. 配置发送邮箱地址

#### 邮箱配置详细步骤：

**步骤 1: 域名验证**
```bash
# 在您的 DNS 提供商处添加以下记录：
# TXT 记录
Name: @
Value: resend-verify=<verification-code>

# MX 记录
Name: @
Value: feedback-smtp.resend.com
Priority: 10
```

**步骤 2: DKIM 配置**
```bash
# 添加 CNAME 记录
Name: resend._domainkey
Value: resend._domainkey.resend.com
```

**步骤 3: SPF 配置**
```bash
# 添加或更新 TXT 记录
Name: @
Value: "v=spf1 include:_spf.resend.com ~all"
```

**步骤 4: DMARC 配置（可选但推荐）**
```bash
# 添加 TXT 记录
Name: _dmarc
Value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
```

## 🚀 部署到 Netlify

### 方法一：通过 Git 连接（推荐）

1. **推送代码到 Git 仓库**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **连接 Netlify**
   - 访问 [Netlify](https://netlify.com)
   - 点击 "New site from Git"
   - 选择您的 Git 提供商（GitHub/GitLab/Bitbucket）
   - 选择 neptunium-web 仓库

3. **配置构建设置**
   ```
   Build command: npm run build
   Publish directory: .next
   ```

4. **配置环境变量**
   在 Netlify Dashboard 中：
   - 进入 Site settings > Environment variables
   - 添加所有 `.env.local` 中的变量

5. **配置 Functions**
   Netlify 会自动检测 `netlify/functions` 目录中的函数。

### 方法二：手动部署

1. **构建项目**
   ```bash
   npm run build
   ```

2. **安装 Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

3. **登录并部署**
   ```bash
   netlify login
   netlify deploy --prod
   ```

### 部署后配置

1. **自定义域名**（可选）
   - 在 Netlify Dashboard 中配置自定义域名
   - 更新环境变量中的 `APP_URL` 和 `NEXTAUTH_URL`

2. **SSL 证书**
   - Netlify 会自动为您的域名配置 SSL 证书

3. **测试功能**
   - 测试用户注册/登录
   - 测试文件上传
   - 测试 API 接口

## 📁 项目结构

```
neptunium-web/
├── src/
│   ├── app/                 # Next.js App Router 页面
│   ├── components/          # React 组件
│   │   ├── ui/             # 基础 UI 组件
│   │   ├── layout/         # 布局组件
│   │   └── forms/          # 表单组件
│   └── lib/                # 工具库和配置
│       ├── config.ts       # 应用配置
│       ├── supabase.ts     # 数据库客户端
│       ├── redis.ts        # 缓存客户端
│       ├── storage.ts      # 文件存储客户端
│       ├── email.ts        # 邮件服务
│       └── utils.ts        # 工具函数
├── netlify/
│   └── functions/          # Serverless Functions
├── database/
│   └── schema.sql          # 数据库表结构
├── public/                 # 静态资源
└── .env.example           # 环境变量模板
```

## 🔌 API 接口文档

### 用户认证

**注册发送验证码**
```http
POST /api/auth-register
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**验证邮箱并完成注册**
```http
POST /api/auth-verify
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

**用户登录**
```http
POST /api/auth-login
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 文件管理

**上传文件**
```http
POST /api/upload-file
Content-Type: application/json

{
  "filename": "my-build.litematic",
  "fileData": "base64-encoded-file-data",
  "userId": "optional-user-id"
}
```

**获取用户文件列表**
```http
GET /api/user-files
X-API-Key: your-api-key
```

### 投影获取（插件端调用）

**通过投影ID获取文件信息**
```http
GET /api/projection?id=123456
```

**获取文件内容**
```http
GET /api/projection?id=123456&include_content=true
```

### API 密钥管理

**生成新的API密钥**
```http
POST /api/api-key
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**获取当前API密钥**
```http
GET /api/api-key?email=user@example.com
```

## 🐛 故障排除

### 常见问题

1. **构建失败**
   - 检查所有环境变量是否正确配置
   - 确保依赖项已正确安装

2. **邮件发送失败**
   - 验证 Resend API Key 是否有效
   - 检查域名 DNS 配置是否正确

3. **文件上传失败**
   - 检查 Cloudflare R2 配置
   - 验证存储桶权限设置

4. **数据库连接失败**
   - 检查 Supabase 连接信息
   - 确保数据库表已正确创建

### 日志查看

- **Netlify Functions 日志**: Netlify Dashboard > Functions > View logs
- **构建日志**: Netlify Dashboard > Deploys > Build log
- **浏览器控制台**: F12 > Console

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如有问题，请通过以下方式联系：

- GitHub Issues: [项目地址](https://github.com/your-username/neptunium-web)
- 邮箱: support@neptunium.com

---

**Neptunium** - 让 Minecraft 建筑创作更简单 ⚡
