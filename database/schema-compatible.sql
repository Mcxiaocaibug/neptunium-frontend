-- Neptunium 数据库表结构 (兼容原版)
-- 创建时间: 2025-01-17
-- 在原有基础上扩展，保持向后兼容

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 用户表 (扩展原版)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    api_key VARCHAR(64) UNIQUE,
    -- 新增字段
    password_hash VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    profile_data JSONB DEFAULT '{}',
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为现有用户添加默认密码哈希 (如果字段为空)
UPDATE users SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
WHERE password_hash IS NULL;

-- 投影文件表 (扩展原版)
CREATE TABLE IF NOT EXISTS projection_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    projection_id VARCHAR(6) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    ip_address INET,
    metadata JSONB DEFAULT '{}',
    -- 新增字段
    original_filename VARCHAR(255),
    mime_type VARCHAR(100) DEFAULT 'application/octet-stream',
    storage_path VARCHAR(500),
    checksum VARCHAR(255),
    download_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为现有文件添加默认值
UPDATE projection_files SET 
    original_filename = filename WHERE original_filename IS NULL;
UPDATE projection_files SET 
    storage_path = 'projections/' || SUBSTRING(projection_id, 1, 2) || '/' || projection_id || '.litematic'
    WHERE storage_path IS NULL;

-- API 密钥表 (新增)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '["read"]',
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    rate_limit INTEGER DEFAULT 1000,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 验证码表 (扩展原版)
CREATE TABLE IF NOT EXISTS verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    -- 新增字段
    type VARCHAR(20) DEFAULT 'email_verification',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 系统日志表 (新增)
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(10) NOT NULL,
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 文件访问日志表 (新增)
CREATE TABLE IF NOT EXISTS file_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id VARCHAR(6) NOT NULL,
    projection_file_id UUID REFERENCES projection_files(id) ON DELETE CASCADE,
    access_type VARCHAR(20) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 系统统计表 (新增)
CREATE TABLE IF NOT EXISTS system_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stat_date DATE NOT NULL,
    total_users INTEGER DEFAULT 0,
    verified_users INTEGER DEFAULT 0,
    total_files INTEGER DEFAULT 0,
    total_file_size BIGINT DEFAULT 0,
    total_downloads INTEGER DEFAULT 0,
    api_requests INTEGER DEFAULT 0,
    anonymous_uploads INTEGER DEFAULT 0,
    stats_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(stat_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_projection_files_projection_id ON projection_files(projection_id);
CREATE INDEX IF NOT EXISTS idx_projection_files_user_id ON projection_files(user_id);
CREATE INDEX IF NOT EXISTS idx_projection_files_created_at ON projection_files(created_at);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_file_id ON file_access_logs(file_id);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projection_files_updated_at ON projection_files;
CREATE TRIGGER update_projection_files_updated_at 
    BEFORE UPDATE ON projection_files 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 创建函数：生成唯一的投影ID (兼容原版)
CREATE OR REPLACE FUNCTION generate_unique_projection_id()
RETURNS VARCHAR(6) AS $$
DECLARE
    new_id VARCHAR(6);
    id_exists BOOLEAN;
BEGIN
    LOOP
        new_id := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM projection_files WHERE projection_id = new_id) INTO id_exists;
        IF NOT id_exists THEN
            EXIT;
        END IF;
    END LOOP;
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：清理过期的验证码
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM verification_codes 
    WHERE expires_at < NOW() OR used = TRUE OR used_at IS NOT NULL;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：增加下载计数
CREATE OR REPLACE FUNCTION increment_download_count(projection_id_param VARCHAR(6))
RETURNS VOID AS $$
BEGIN
    UPDATE projection_files 
    SET download_count = download_count + 1,
        updated_at = NOW()
    WHERE projection_id = projection_id_param;
END;
$$ LANGUAGE plpgsql;

-- 创建视图：用户文件统计
CREATE OR REPLACE VIEW user_file_stats AS
SELECT 
    u.id,
    u.email,
    COUNT(pf.id) as file_count,
    COALESCE(SUM(pf.file_size), 0) as total_size,
    COALESCE(SUM(pf.download_count), 0) as total_downloads,
    MAX(pf.created_at) as last_upload
FROM users u
LEFT JOIN projection_files pf ON u.id = pf.user_id
GROUP BY u.id, u.email;

-- 插入默认管理员用户 (如果不存在)
INSERT INTO users (email, email_verified, password_hash, is_admin) 
VALUES ('admin@neptunium.app', TRUE, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE)
ON CONFLICT (email) DO NOTHING;

-- 插入今日统计数据 (如果不存在)
INSERT INTO system_stats (stat_date, total_users, verified_users, total_files, total_file_size, total_downloads, api_requests, anonymous_uploads)
SELECT 
    CURRENT_DATE,
    (SELECT COUNT(*) FROM users),
    (SELECT COUNT(*) FROM users WHERE email_verified = TRUE),
    (SELECT COUNT(*) FROM projection_files),
    (SELECT COALESCE(SUM(file_size), 0) FROM projection_files),
    (SELECT COALESCE(SUM(download_count), 0) FROM projection_files),
    0,
    (SELECT COUNT(*) FROM projection_files WHERE user_id IS NULL)
ON CONFLICT (stat_date) DO NOTHING;
