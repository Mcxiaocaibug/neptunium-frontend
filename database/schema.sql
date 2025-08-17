-- Neptunium Complete Database Schema
-- PostgreSQL schema for Supabase
-- 完整的生产环境数据库结构
-- 创建时间: 2025-01-17
-- 更新时间: 2025-01-17

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS file_access_logs CASCADE;
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS system_stats CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS verification_codes CASCADE;
DROP TABLE IF EXISTS projection_files CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    profile_data JSONB DEFAULT '{}',
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projection files table
CREATE TABLE projection_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id VARCHAR(6) UNIQUE NOT NULL, -- 6-digit ID
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous uploads
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    storage_url VARCHAR(1000),
    checksum VARCHAR(255),
    upload_ip INET NOT NULL,
    download_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(10) NOT NULL, -- First 10 chars for display
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '["read"]',
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    rate_limit INTEGER DEFAULT 1000, -- requests per hour
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification codes table (for email verification)
CREATE TABLE verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    type VARCHAR(20) DEFAULT 'email_verification', -- email_verification, password_reset
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL,
    refresh_token VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System logs table
CREATE TABLE system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(10) NOT NULL, -- info, warn, error
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File access logs table
CREATE TABLE file_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id VARCHAR(6) NOT NULL,
    projection_file_id UUID REFERENCES projection_files(id) ON DELETE CASCADE,
    access_type VARCHAR(20) NOT NULL, -- download, view, api_access
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System statistics table
CREATE TABLE system_stats (
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

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projection_files_updated_at
    BEFORE UPDATE ON projection_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_verified ON users(is_verified);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_projection_files_file_id ON projection_files(file_id);
CREATE INDEX idx_projection_files_user_id ON projection_files(user_id);
CREATE INDEX idx_projection_files_created_at ON projection_files(created_at);
CREATE INDEX idx_projection_files_file_type ON projection_files(file_type);
CREATE INDEX idx_projection_files_is_public ON projection_files(is_public);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

CREATE INDEX idx_verification_codes_email ON verification_codes(email);
CREATE INDEX idx_verification_codes_code ON verification_codes(code);
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);

CREATE INDEX idx_file_access_logs_file_id ON file_access_logs(file_id);
CREATE INDEX idx_file_access_logs_created_at ON file_access_logs(created_at);
CREATE INDEX idx_file_access_logs_access_type ON file_access_logs(access_type);

CREATE INDEX idx_system_stats_stat_date ON system_stats(stat_date);

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, is_verified, is_admin)
VALUES ('admin@neptunium.app', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', true, true)
ON CONFLICT (email) DO NOTHING;

-- Insert sample data for development
INSERT INTO system_stats (stat_date, total_users, verified_users, total_files, total_file_size, total_downloads, api_requests, anonymous_uploads)
VALUES (CURRENT_DATE, 1, 1, 0, 0, 0, 0, 0)
ON CONFLICT (stat_date) DO NOTHING;

-- 创建RLS (Row Level Security) 策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projection_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- 用户表RLS策略
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- 投影文件表RLS策略
CREATE POLICY "Users can view own files" ON projection_files
    FOR SELECT USING (
        user_id IS NULL OR
        auth.uid()::text = user_id::text OR
        is_public = true
    );

CREATE POLICY "Users can insert own files" ON projection_files
    FOR INSERT WITH CHECK (
        user_id IS NULL OR
        auth.uid()::text = user_id::text
    );

CREATE POLICY "Users can update own files" ON projection_files
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- API密钥表RLS策略
CREATE POLICY "Users can view own API keys" ON api_keys
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own API keys" ON api_keys
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own API keys" ON api_keys
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own API keys" ON api_keys
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- 验证码表RLS策略 (仅服务端访问)
CREATE POLICY "Service role can manage verification codes" ON verification_codes
    FOR ALL USING (auth.role() = 'service_role');

-- 创建函数：生成唯一的文件ID
CREATE OR REPLACE FUNCTION generate_unique_file_id()
RETURNS VARCHAR(6) AS $$
DECLARE
    new_id VARCHAR(6);
    id_exists BOOLEAN;
BEGIN
    LOOP
        -- 生成6位随机数字
        new_id := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

        -- 检查是否已存在
        SELECT EXISTS(SELECT 1 FROM projection_files WHERE file_id = new_id) INTO id_exists;

        -- 如果不存在则退出循环
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
    WHERE expires_at < NOW() OR used_at IS NOT NULL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 创建函数：增加下载计数
CREATE OR REPLACE FUNCTION increment_download_count(file_id_param VARCHAR(6))
RETURNS VOID AS $$
BEGIN
    UPDATE projection_files
    SET download_count = download_count + 1,
        updated_at = NOW()
    WHERE file_id = file_id_param;
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

-- 创建视图：系统概览统计
CREATE OR REPLACE VIEW system_overview AS
SELECT
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE is_verified = true) as verified_users,
    (SELECT COUNT(*) FROM projection_files) as total_files,
    (SELECT COALESCE(SUM(file_size), 0) FROM projection_files) as total_file_size,
    (SELECT COALESCE(SUM(download_count), 0) FROM projection_files) as total_downloads,
    (SELECT COUNT(*) FROM projection_files WHERE user_id IS NULL) as anonymous_uploads,
    (SELECT COUNT(*) FROM api_keys WHERE is_active = true) as active_api_keys;
