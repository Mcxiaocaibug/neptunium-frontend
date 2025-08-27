import { createClient } from '@supabase/supabase-js';
import { config } from './config';

// 客户端 Supabase 实例 (用于前端)
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// 服务端 Supabase 实例 (用于 API 路由)
export const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// 数据库表类型定义
export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  api_key?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectionFile {
  id: string;
  file_id: string; // 与数据库保持一致，使用 file_id 而不是 projection_id
  user_id?: string;
  filename: string;
  original_filename: string; // 添加原始文件名字段
  file_size: number;
  file_type: string;
  mime_type: string; // 添加 MIME 类型字段
  storage_path: string; // 添加存储路径字段
  storage_url?: string; // 重命名为 storage_url
  checksum?: string; // 添加校验和字段
  upload_ip?: string; // 重命名为 upload_ip
  download_count: number; // 添加下载计数
  metadata?: Record<string, any>;
  is_public: boolean; // 添加公开状态字段
  expires_at?: string; // 添加过期时间字段
  created_at: string;
  updated_at: string;
}

export interface VerificationCode {
  id: string;
  email: string;
  code: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

// 数据库操作辅助函数
export const db = {
  // 用户操作
  users: {
    async findByEmail(email: string): Promise<User | null> {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) return null;
      return data;
    },

    async findByApiKey(apiKey: string): Promise<User | null> {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('api_key', apiKey)
        .single();

      if (error) return null;
      return data;
    },

    async create(userData: Partial<User>): Promise<User | null> {
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async updateApiKey(userId: string, apiKey: string): Promise<void> {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ api_key: apiKey, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
    },
  },

  // 投影文件操作
  projectionFiles: {
    async create(fileData: Partial<ProjectionFile>): Promise<ProjectionFile> {
      const { data, error } = await supabaseAdmin
        .from('projection_files')
        .insert(fileData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async findByFileId(fileId: string): Promise<ProjectionFile | null> {
      const { data, error } = await supabaseAdmin
        .from('projection_files')
        .select('*')
        .eq('file_id', fileId)
        .single();

      if (error) return null;
      return data;
    },

    async findByUserId(userId: string): Promise<ProjectionFile[]> {
      const { data, error } = await supabaseAdmin
        .from('projection_files')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) return [];
      return data;
    },
  },
};
