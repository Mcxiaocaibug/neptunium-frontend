# 📧 Resend 邮箱服务配置完整指南

本指南将详细介绍如何配置 Resend 邮箱服务，用于 Neptunium 系统的邮件验证功能。

## 🎯 概述

Resend 是一个现代化的邮件发送服务，专为开发者设计。它提供简单的 API 和可靠的邮件投递服务。

## 📝 前置要求

- 拥有一个域名（如：yourdomain.com）
- 域名的 DNS 管理权限
- Resend 账户（免费计划每月可发送 3,000 封邮件）

## 🚀 步骤一：创建 Resend 账户

1. 访问 [Resend 官网](https://resend.com)
2. 点击 "Sign Up" 注册账户
3. 验证邮箱地址
4. 登录到 Resend Dashboard

## 🔧 步骤二：添加域名

### 2.1 在 Resend 中添加域名

1. 在 Resend Dashboard 中点击 "Domains"
2. 点击 "Add Domain" 按钮
3. 输入您的域名（如：neptunium.com）
4. 点击 "Add Domain"

### 2.2 选择验证方式

Resend 提供两种域名验证方式：
- **TXT 记录验证**（推荐，更简单）
- **HTML 文件验证**

建议选择 TXT 记录验证。

## 🌐 步骤三：配置 DNS 记录

### 3.1 基础验证记录

在您的 DNS 提供商（如 Cloudflare、阿里云、腾讯云等）添加以下记录：

#### TXT 记录（域名验证）
```
类型: TXT
名称: @ （或留空，表示根域名）
值: resend-verify=your_verification_code_here
TTL: 3600（或自动）
```

**注意**: `your_verification_code_here` 需要替换为 Resend 提供的实际验证码。

### 3.2 邮件发送记录

为了确保邮件能够正常发送和接收，还需要添加以下记录：

#### MX 记录（邮件路由）
```
类型: MX
名称: @ （或留空）
值: feedback-smtp.resend.com
优先级: 10
TTL: 3600
```

#### CNAME 记录（DKIM 签名）
```
类型: CNAME
名称: resend._domainkey
值: resend._domainkey.resend.com
TTL: 3600
```

#### TXT 记录（SPF 策略）
```
类型: TXT
名称: @ （或留空）
值: "v=spf1 include:_spf.resend.com ~all"
TTL: 3600
```

#### TXT 记录（DMARC 策略，可选但强烈推荐）
```
类型: TXT
名称: _dmarc
值: "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
TTL: 3600
```

### 3.3 不同 DNS 提供商配置示例

#### Cloudflare
1. 登录 Cloudflare Dashboard
2. 选择您的域名
3. 进入 "DNS" 选项卡
4. 点击 "Add record" 添加上述记录

#### 阿里云 DNS
1. 登录阿里云控制台
2. 进入 "域名与网站" > "云解析 DNS"
3. 选择域名，点击 "解析设置"
4. 添加上述 DNS 记录

#### 腾讯云 DNS
1. 登录腾讯云控制台
2. 进入 "域名注册" > "我的域名"
3. 点击 "解析"，进入 DNS 解析页面
4. 添加上述 DNS 记录

## ⏰ 步骤四：等待 DNS 生效

DNS 记录的生效时间因提供商而异：
- **通常**: 几分钟到 1 小时
- **最长**: 可能需要 24-48 小时

您可以使用以下工具检查 DNS 记录是否生效：
- [DNS Checker](https://dnschecker.org/)
- [MX Toolbox](https://mxtoolbox.com/)
- 命令行工具：`dig`, `nslookup`

### 检查命令示例
```bash
# 检查 TXT 记录
dig TXT yourdomain.com

# 检查 MX 记录
dig MX yourdomain.com

# 检查 DKIM 记录
dig TXT resend._domainkey.yourdomain.com
```

## ✅ 步骤五：验证域名

1. 返回 Resend Dashboard
2. 在 "Domains" 页面找到您的域名
3. 点击 "Verify" 按钮
4. 如果 DNS 记录正确，域名状态会变为 "Verified"

如果验证失败，请：
1. 检查 DNS 记录是否正确
2. 等待更长时间让 DNS 生效
3. 清除本地 DNS 缓存

## 🔑 步骤六：创建 API 密钥

1. 在 Resend Dashboard 中点击 "API Keys"
2. 点击 "Create API Key" 按钮
3. 输入密钥名称（如：Neptunium Production）
4. 选择权限：
   - **Full access**（推荐用于生产环境）
   - **Sending access**（仅发送邮件）
5. 复制生成的 API 密钥（以 `re_` 开头）

**⚠️ 重要**: API 密钥只会显示一次，请立即保存到安全的地方。

## 🧪 步骤七：测试邮件发送

### 7.1 使用 curl 测试
```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "noreply@yourdomain.com",
    "to": ["test@example.com"],
    "subject": "Neptunium 测试邮件",
    "html": "<p>这是一封测试邮件，用于验证 Resend 配置。</p>"
  }'
```

### 7.2 使用 Neptunium 健康检查脚本
```bash
# 设置环境变量
export RESEND_API_KEY="your_api_key_here"

# 运行健康检查
./scripts/health-check.sh
```

## 📊 步骤八：配置环境变量

在您的 `.env.local` 文件中添加：

```env
# Resend 配置
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=Neptunium
```

## 🛠️ 故障排除

### 常见问题及解决方案

#### 1. 域名验证失败
**症状**: 点击 "Verify" 后显示验证失败

**解决方案**:
- 检查 TXT 记录是否正确添加
- 确认记录名称是 `@` 或留空（不是 `www`）
- 等待更长时间让 DNS 生效
- 使用 DNS 检查工具验证记录

#### 2. 邮件发送失败 - 401 Unauthorized
**症状**: API 返回 401 错误

**解决方案**:
- 检查 API 密钥是否正确
- 确认 API 密钥有发送权限
- 检查 Authorization header 格式

#### 3. 邮件发送失败 - 403 Forbidden
**症状**: API 返回 403 错误

**解决方案**:
- 确认域名已验证
- 检查发送邮箱地址是否使用已验证的域名
- 确认 API 密钥有足够权限

#### 4. 邮件进入垃圾箱
**症状**: 邮件发送成功但收件人在垃圾箱中收到

**解决方案**:
- 确认所有 DNS 记录都已正确配置
- 添加 DMARC 策略
- 检查邮件内容，避免垃圾邮件特征
- 建立发送声誉（逐步增加发送量）

#### 5. DNS 记录冲突
**症状**: 无法添加 DNS 记录或记录不生效

**解决方案**:
- 检查是否有冲突的现有记录
- 如果已有 SPF 记录，需要合并而不是覆盖
- 联系 DNS 提供商技术支持

### SPF 记录合并示例

如果您已有 SPF 记录：
```
现有: "v=spf1 include:_spf.google.com ~all"
合并后: "v=spf1 include:_spf.google.com include:_spf.resend.com ~all"
```

## 📈 最佳实践

### 1. 邮件内容优化
- 使用清晰的发件人名称
- 编写有意义的邮件主题
- 提供明确的邮件内容
- 包含取消订阅链接（如适用）

### 2. 发送频率控制
- 避免短时间内大量发送
- 实施适当的发送限制
- 监控发送状态和错误率

### 3. 安全性
- 定期更换 API 密钥
- 使用环境变量存储敏感信息
- 限制 API 密钥权限范围

### 4. 监控和日志
- 记录邮件发送日志
- 监控发送成功率
- 设置错误告警

## 📞 获取帮助

如果您在配置过程中遇到问题：

1. **Resend 官方文档**: [https://resend.com/docs](https://resend.com/docs)
2. **Resend 支持**: support@resend.com
3. **Neptunium 项目**: 在 GitHub Issues 中提问
4. **社区支持**: 查看常见问题解答

## 🎉 配置完成

恭喜！您已成功配置 Resend 邮箱服务。现在 Neptunium 系统可以：

- ✅ 发送注册验证码
- ✅ 发送密码重置邮件
- ✅ 发送系统通知
- ✅ 发送 API 密钥信息

下一步请运行完整的系统测试，确保所有功能正常工作。
