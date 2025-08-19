# Resend 邮箱服务配置指南

本指南将帮助您配置 Resend 邮箱服务，用于发送验证码和欢迎邮件。

## 📧 Resend 简介

Resend 是一个现代化的邮件发送服务，专为开发者设计，提供简单易用的 API 和优秀的送达率。

## 🚀 快速开始

### 1. 注册 Resend 账户

1. 访问 [Resend 官网](https://resend.com)
2. 点击 "Sign Up" 注册账户
3. 验证您的邮箱地址

### 2. 添加发送域名

#### 步骤 1: 添加域名
1. 登录 Resend Dashboard
2. 点击左侧菜单 "Domains"
3. 点击 "Add Domain" 按钮
4. 输入您的域名（例如：`yourdomain.com`）
5. 点击 "Add" 确认

#### 步骤 2: 验证域名所有权
添加域名后，您需要在 DNS 提供商处添加验证记录：

```dns
类型: TXT
名称: @
值: resend-verify=<verification-code>
TTL: 3600
```

> 💡 `<verification-code>` 会在 Resend Dashboard 中显示

#### 步骤 3: 配置 SPF 记录
SPF (Sender Policy Framework) 记录用于防止邮件被标记为垃圾邮件：

```dns
类型: TXT
名称: @
值: "v=spf1 include:_spf.resend.com ~all"
TTL: 3600
```

如果您已有 SPF 记录，请将 `include:_spf.resend.com` 添加到现有记录中：
```dns
"v=spf1 include:_spf.resend.com include:_spf.google.com ~all"
```

#### 步骤 4: 配置 DKIM 记录
DKIM (DomainKeys Identified Mail) 用于邮件签名验证：

```dns
类型: CNAME
名称: resend._domainkey
值: resend._domainkey.resend.com
TTL: 3600
```

#### 步骤 5: 配置 DMARC 记录（推荐）
DMARC (Domain-based Message Authentication, Reporting & Conformance) 提供额外的安全保护：

```dns
类型: TXT
名称: _dmarc
值: "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
TTL: 3600
```

DMARC 策略说明：
- `p=none`: 仅监控，不采取行动
- `p=quarantine`: 将可疑邮件放入垃圾邮件文件夹
- `p=reject`: 拒绝可疑邮件

### 3. 创建 API 密钥

1. 在 Resend Dashboard 中，点击左侧菜单 "API Keys"
2. 点击 "Create API Key" 按钮
3. 输入密钥名称（例如：`Neptunium Production`）
4. 选择权限：
   - **Domain**: 选择您刚才添加的域名
   - **Permission**: 选择 "Sending access"
5. 点击 "Add" 创建密钥
6. **重要**: 复制并保存 API 密钥，它只会显示一次

### 4. 测试邮件发送

您可以使用以下 curl 命令测试邮件发送：

```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "noreply@yourdomain.com",
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<p>This is a test email from Resend!</p>"
  }'
```

## 🔧 DNS 配置示例

以下是完整的 DNS 配置示例（以 Cloudflare 为例）：

### Cloudflare DNS 配置

| 类型 | 名称 | 内容 | TTL |
|------|------|------|-----|
| TXT | @ | `resend-verify=abc123def456` | 自动 |
| TXT | @ | `"v=spf1 include:_spf.resend.com ~all"` | 自动 |
| CNAME | resend._domainkey | `resend._domainkey.resend.com` | 自动 |
| TXT | _dmarc | `"v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"` | 自动 |

### 其他 DNS 提供商

#### 阿里云 DNS
1. 登录阿里云控制台
2. 进入 "域名与网站" > "云解析 DNS"
3. 选择您的域名，点击 "解析设置"
4. 添加上述记录

#### 腾讯云 DNS
1. 登录腾讯云控制台
2. 进入 "域名与网站" > "DNS 解析 DNSPod"
3. 选择您的域名，点击 "解析"
4. 添加上述记录

## 🛠️ 环境变量配置

在您的 `.env.local` 文件中添加以下配置：

```env
# Resend 配置
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

## 📊 监控和分析

### 查看发送统计
1. 在 Resend Dashboard 中，点击 "Analytics"
2. 查看邮件发送量、送达率、打开率等指标

### 查看邮件日志
1. 点击 "Logs" 查看详细的邮件发送日志
2. 可以按状态、时间等条件筛选

### 设置 Webhook（可选）
1. 点击 "Webhooks" 配置邮件事件回调
2. 可以监听邮件送达、打开、点击等事件

## 🚨 故障排除

### 常见问题

#### 1. 域名验证失败
- **原因**: DNS 记录未正确配置或未生效
- **解决**: 使用 `dig` 或在线 DNS 查询工具检查记录
```bash
dig TXT yourdomain.com
```

#### 2. 邮件进入垃圾邮件箱
- **原因**: SPF、DKIM、DMARC 配置不正确
- **解决**: 检查所有 DNS 记录是否正确配置

#### 3. API 调用失败
- **原因**: API 密钥错误或权限不足
- **解决**: 检查 API 密钥是否正确，权限是否足够

#### 4. 发送频率限制
- **原因**: 超出了发送频率限制
- **解决**: 查看 Resend 的发送限制，考虑升级套餐

### 调试工具

#### 检查 SPF 记录
```bash
dig TXT yourdomain.com | grep spf
```

#### 检查 DKIM 记录
```bash
dig CNAME resend._domainkey.yourdomain.com
```

#### 检查 DMARC 记录
```bash
dig TXT _dmarc.yourdomain.com
```

## 💰 定价信息

Resend 提供免费套餐和付费套餐：

### 免费套餐
- 每月 3,000 封邮件
- 每日 100 封邮件限制
- 基础支持

### 付费套餐
- Pro: $20/月，50,000 封邮件
- Business: $80/月，300,000 封邮件
- 企业版: 联系销售

## 📞 获取帮助

如果您在配置过程中遇到问题：

1. **Resend 文档**: https://resend.com/docs
2. **Resend 支持**: https://resend.com/support
3. **社区论坛**: https://github.com/resendlabs/resend/discussions

## ✅ 配置检查清单

- [ ] 注册 Resend 账户
- [ ] 添加并验证域名
- [ ] 配置 SPF 记录
- [ ] 配置 DKIM 记录
- [ ] 配置 DMARC 记录（推荐）
- [ ] 创建 API 密钥
- [ ] 配置环境变量
- [ ] 测试邮件发送
- [ ] 检查邮件送达率

完成以上步骤后，您的 Neptunium 应用就可以正常发送邮件了！
