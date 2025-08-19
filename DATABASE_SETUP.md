# Neptunium 数据库设置指南

## 🗄️ 数据库选择

根据您的情况选择合适的数据库 schema：

### 1. 全新安装 (推荐)
使用 `database/schema.sql` - 完整的现代化数据库结构

```sql
-- 在 Supabase SQL 编辑器中执行
\i database/schema.sql
```

**特点：**
- ✅ 最新的表结构设计
- ✅ 完整的安全策略 (RLS)
- ✅ 优化的索引和性能
- ✅ 现代化的字段命名

### 2. 现有系统升级 (兼容模式)
使用 `database/schema-compatible.sql` - 向后兼容的升级方案

```sql
-- 在 Supabase SQL 编辑器中执行
\i database/schema-compatible.sql
```

**特点：**
- ✅ 保持原有数据不变
- ✅ 安全的增量升级
- ✅ 兼容现有 API 调用
- ✅ 保留 `api_key` 和 `email_verified` 字段

## 🔧 执行步骤

### 步骤 1: 登录 Supabase
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目
3. 进入 **SQL Editor**

### 步骤 2: 执行 Schema
1. 复制对应的 SQL 文件内容
2. 粘贴到 SQL 编辑器
3. 点击 **Run** 执行

### 步骤 3: 验证安装
执行以下查询验证表是否创建成功：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'projection_files', 'api_keys', 'verification_codes');

-- 检查默认管理员用户
SELECT email, is_admin FROM users WHERE email = 'admin@neptunium.app';
```

## 📊 表结构说明

### 核心表

| 表名 | 用途 | 重要字段 |
|------|------|----------|
| `users` | 用户信息 | email, password_hash, is_verified |
| `projection_files` | 投影文件 | file_id/projection_id, filename, file_size |
| `api_keys` | API 密钥 | user_id, key_hash, permissions |
| `verification_codes` | 验证码 | email, code, expires_at |

### 日志表

| 表名 | 用途 |
|------|------|
| `system_logs` | 系统操作日志 |
| `file_access_logs` | 文件访问日志 |
| `system_stats` | 系统统计数据 |

## 🔐 默认账户

安装完成后会创建默认管理员账户：

- **邮箱**: `admin@neptunium.app`
- **密码**: `admin123`
- **权限**: 管理员

**⚠️ 重要：请在生产环境中立即修改默认密码！**

## 🛠️ 故障排除

### 常见错误

1. **权限错误**
   ```
   ERROR: permission denied for schema public
   ```
   **解决方案**: 确保使用 Service Role Key 而不是 Anon Key

2. **表已存在**
   ```
   ERROR: relation "users" already exists
   ```
   **解决方案**: 使用兼容模式 schema 或先备份现有数据

3. **外键约束错误**
   ```
   ERROR: foreign key constraint fails
   ```
   **解决方案**: 按顺序执行 SQL，确保依赖表先创建

### 数据迁移

如果需要从旧版本迁移数据：

```sql
-- 备份现有数据
CREATE TABLE users_backup AS SELECT * FROM users;
CREATE TABLE projection_files_backup AS SELECT * FROM projection_files;

-- 执行兼容模式 schema
\i database/schema-compatible.sql

-- 验证数据完整性
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM projection_files;
```

## 📝 环境变量

确保在 `.env.local` 中配置正确的数据库连接：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## ✅ 验证清单

安装完成后，请验证以下功能：

- [ ] 用户注册和登录
- [ ] 邮箱验证码发送
- [ ] 文件上传和下载
- [ ] API 密钥创建
- [ ] 管理面板访问

## 🆘 获取帮助

如果遇到问题：

1. 检查 Supabase 项目日志
2. 验证环境变量配置
3. 查看浏览器控制台错误
4. 参考 `DEPLOYMENT.md` 完整部署指南

---

**数据库设置完成后，您就可以开始使用 Neptunium 系统了！** 🎉
