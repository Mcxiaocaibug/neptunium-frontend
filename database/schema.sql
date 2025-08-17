-- Neptunium 数据库表结构
-- 创建时间: 2025-01-17

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    api_key VARCHAR(64) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 投影文件表
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 验证码表 (可选，也可以只用Redis)
CREATE TABLE IF NOT EXISTS verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
CREATE INDEX IF NOT EXISTS idx_projection_files_projection_id ON projection_files(projection_id);
CREATE INDEX IF NOT EXISTS idx_projection_files_user_id ON projection_files(user_id);
CREATE INDEX IF NOT EXISTS idx_projection_files_created_at ON projection_files(created_at);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projection_files_updated_at 
    BEFORE UPDATE ON projection_files 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 创建RLS (Row Level Security) 策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projection_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- 用户表RLS策略
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- 投影文件表RLS策略
CREATE POLICY "Users can view own files" ON projection_files
    FOR SELECT USING (
        user_id IS NULL OR 
        auth.uid()::text = user_id::text
    );

CREATE POLICY "Users can insert own files" ON projection_files
    FOR INSERT WITH CHECK (
        user_id IS NULL OR 
        auth.uid()::text = user_id::text
    );

CREATE POLICY "Users can update own files" ON projection_files
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 验证码表RLS策略 (仅服务端访问)
CREATE POLICY "Service role can manage verification codes" ON verification_codes
    FOR ALL USING (auth.role() = 'service_role');

-- 创建函数：生成唯一的投影ID
CREATE OR REPLACE FUNCTION generate_unique_projection_id()
RETURNS VARCHAR(6) AS $$
DECLARE
    new_id VARCHAR(6);
    id_exists BOOLEAN;
BEGIN
    LOOP
        -- 生成6位随机数字
        new_id := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        
        -- 检查是否已存在
        SELECT EXISTS(SELECT 1 FROM projection_files WHERE projection_id = new_id) INTO id_exists;
        
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
    WHERE expires_at < NOW() OR used = TRUE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 创建定时任务清理过期验证码 (需要pg_cron扩展)
-- SELECT cron.schedule('cleanup-verification-codes', '0 * * * *', 'SELECT cleanup_expired_verification_codes();');

-- 插入一些示例数据 (开发环境)
-- INSERT INTO users (email, email_verified) VALUES 
-- ('test@example.com', TRUE),
-- ('admin@neptunium.com', TRUE);

-- 创建视图：用户文件统计
CREATE OR REPLACE VIEW user_file_stats AS
SELECT 
    u.id,
    u.email,
    COUNT(pf.id) as file_count,
    COALESCE(SUM(pf.file_size), 0) as total_size,
    MAX(pf.created_at) as last_upload
FROM users u
LEFT JOIN projection_files pf ON u.id = pf.user_id
GROUP BY u.id, u.email;
