-- Neptunium Database Migration Script
-- 从旧版本迁移到新版本的数据库结构
-- 执行时间: 2025-01-17

-- 开始事务
BEGIN;

-- 1. 备份现有数据（如果存在）
DO $$
BEGIN
    -- 检查是否存在旧的 users 表
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        -- 创建备份表
        CREATE TABLE users_backup AS SELECT * FROM users;
        RAISE NOTICE 'Created backup of users table';
    END IF;
    
    -- 检查是否存在旧的 projection_files 表
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'projection_files') THEN
        CREATE TABLE projection_files_backup AS SELECT * FROM projection_files;
        RAISE NOTICE 'Created backup of projection_files table';
    END IF;
END $$;

-- 2. 删除旧的列（如果存在）
DO $$
BEGIN
    -- 删除 users 表中的 api_key 列（如果存在）
    IF EXISTS (SELECT FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'api_key') THEN
        ALTER TABLE users DROP COLUMN api_key;
        RAISE NOTICE 'Dropped api_key column from users table';
    END IF;
    
    -- 删除 users 表中的 email_verified 列（如果存在）
    IF EXISTS (SELECT FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'email_verified') THEN
        ALTER TABLE users DROP COLUMN email_verified;
        RAISE NOTICE 'Dropped email_verified column from users table';
    END IF;
END $$;

-- 3. 添加新的列（如果不存在）
DO $$
BEGIN
    -- 为 users 表添加新列
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'password_hash') THEN
        ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
        RAISE NOTICE 'Added password_hash column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'is_verified') THEN
        ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_verified column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'is_admin') THEN
        ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_admin column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'profile_data') THEN
        ALTER TABLE users ADD COLUMN profile_data JSONB DEFAULT '{}';
        RAISE NOTICE 'Added profile_data column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'last_login_at') THEN
        ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_login_at column to users table';
    END IF;
END $$;

-- 4. 更新 projection_files 表结构
DO $$
BEGIN
    -- 重命名 projection_id 为 file_id（如果需要）
    IF EXISTS (SELECT FROM information_schema.columns 
               WHERE table_name = 'projection_files' AND column_name = 'projection_id') THEN
        ALTER TABLE projection_files RENAME COLUMN projection_id TO file_id;
        RAISE NOTICE 'Renamed projection_id to file_id in projection_files table';
    END IF;
    
    -- 添加新列
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'projection_files' AND column_name = 'original_filename') THEN
        ALTER TABLE projection_files ADD COLUMN original_filename VARCHAR(255);
        -- 复制 filename 到 original_filename
        UPDATE projection_files SET original_filename = filename WHERE original_filename IS NULL;
        RAISE NOTICE 'Added original_filename column to projection_files table';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'projection_files' AND column_name = 'mime_type') THEN
        ALTER TABLE projection_files ADD COLUMN mime_type VARCHAR(100) DEFAULT 'application/octet-stream';
        RAISE NOTICE 'Added mime_type column to projection_files table';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'projection_files' AND column_name = 'storage_path') THEN
        ALTER TABLE projection_files ADD COLUMN storage_path VARCHAR(500);
        RAISE NOTICE 'Added storage_path column to projection_files table';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'projection_files' AND column_name = 'storage_url') THEN
        ALTER TABLE projection_files ADD COLUMN storage_url VARCHAR(1000);
        RAISE NOTICE 'Added storage_url column to projection_files table';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'projection_files' AND column_name = 'checksum') THEN
        ALTER TABLE projection_files ADD COLUMN checksum VARCHAR(255);
        RAISE NOTICE 'Added checksum column to projection_files table';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'projection_files' AND column_name = 'upload_ip') THEN
        ALTER TABLE projection_files ADD COLUMN upload_ip INET;
        RAISE NOTICE 'Added upload_ip column to projection_files table';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'projection_files' AND column_name = 'download_count') THEN
        ALTER TABLE projection_files ADD COLUMN download_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added download_count column to projection_files table';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'projection_files' AND column_name = 'is_public') THEN
        ALTER TABLE projection_files ADD COLUMN is_public BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added is_public column to projection_files table';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'projection_files' AND column_name = 'expires_at') THEN
        ALTER TABLE projection_files ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added expires_at column to projection_files table';
    END IF;
END $$;

-- 5. 更新 verification_codes 表结构
DO $$
BEGIN
    -- 重命名 used 为 used_at（如果需要）
    IF EXISTS (SELECT FROM information_schema.columns 
               WHERE table_name = 'verification_codes' AND column_name = 'used') THEN
        ALTER TABLE verification_codes DROP COLUMN used;
        ALTER TABLE verification_codes ADD COLUMN used_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Updated verification_codes table structure';
    END IF;
    
    -- 添加新列
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'verification_codes' AND column_name = 'type') THEN
        ALTER TABLE verification_codes ADD COLUMN type VARCHAR(20) DEFAULT 'email_verification';
        RAISE NOTICE 'Added type column to verification_codes table';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'verification_codes' AND column_name = 'attempts') THEN
        ALTER TABLE verification_codes ADD COLUMN attempts INTEGER DEFAULT 0;
        RAISE NOTICE 'Added attempts column to verification_codes table';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'verification_codes' AND column_name = 'max_attempts') THEN
        ALTER TABLE verification_codes ADD COLUMN max_attempts INTEGER DEFAULT 3;
        RAISE NOTICE 'Added max_attempts column to verification_codes table';
    END IF;
END $$;

-- 6. 数据迁移和清理
DO $$
BEGIN
    -- 迁移旧数据到新结构
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users_backup') THEN
        -- 为没有密码哈希的用户设置默认密码
        UPDATE users SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
        WHERE password_hash IS NULL;
        
        -- 迁移邮箱验证状态
        UPDATE users SET is_verified = true 
        WHERE email IN (SELECT email FROM users_backup WHERE email_verified = true);
        
        RAISE NOTICE 'Migrated user data from backup';
    END IF;
    
    -- 更新文件存储路径
    UPDATE projection_files 
    SET storage_path = 'projections/' || SUBSTRING(file_id, 1, 2) || '/' || file_id || 
                      CASE 
                          WHEN file_type LIKE '.%' THEN file_type
                          ELSE '.litematic'
                      END
    WHERE storage_path IS NULL;
    
    -- 更新上传IP（如果为空）
    UPDATE projection_files 
    SET upload_ip = '127.0.0.1'::inet
    WHERE upload_ip IS NULL;
    
    RAISE NOTICE 'Updated projection_files data';
END $$;

-- 7. 创建必要的约束
DO $$
BEGIN
    -- 确保 password_hash 不为空
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints 
                   WHERE table_name = 'users' AND constraint_name = 'users_password_hash_not_null') THEN
        ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
        RAISE NOTICE 'Added NOT NULL constraint to password_hash';
    END IF;
    
    -- 确保 upload_ip 不为空
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints 
                   WHERE table_name = 'projection_files' AND constraint_name = 'projection_files_upload_ip_not_null') THEN
        ALTER TABLE projection_files ALTER COLUMN upload_ip SET NOT NULL;
        RAISE NOTICE 'Added NOT NULL constraint to upload_ip';
    END IF;
END $$;

-- 提交事务
COMMIT;

-- 输出迁移完成信息
DO $$
BEGIN
    RAISE NOTICE 'Database migration completed successfully!';
    RAISE NOTICE 'Please verify your data and remove backup tables if everything looks correct.';
    RAISE NOTICE 'Backup tables: users_backup, projection_files_backup (if they exist)';
END $$;
