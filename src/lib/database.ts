/**
 * 完整的数据库访问层
 * 基于新的数据库 Schema 设计
 */

import { createClient } from '@supabase/supabase-js';
import { config } from './config';

// 服务端 Supabase 实例
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
  password_hash: string;
  is_verified: boolean;
  is_admin: boolean;
  profile_data: Record<string, any>;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectionFile {
  id: string;
  file_id: string; // 6位数ID
  user_id?: string;
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  storage_path: string;
  storage_url?: string;
  checksum?: string;
  upload_ip: string;
  download_count: number;
  metadata: Record<string, any>;
  is_public: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  description?: string;
  permissions: string[];
  is_active: boolean;
  usage_count: number;
  rate_limit: number;
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface VerificationCode {
  id: string;
  email: string;
  code: string;
  type: string;
  attempts: number;
  max_attempts: number;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  refresh_token?: string;
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
  created_at: string;
}

export interface SystemLog {
  id: string;
  level: string;
  message: string;
  context: Record<string, any>;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  created_at: string;
}

export interface FileAccessLog {
  id: string;
  file_id: string;
  projection_file_id: string;
  access_type: string;
  user_id?: string;
  api_key_id?: string;
  ip_address: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  created_at: string;
}

export interface SystemStats {
  id: string;
  stat_date: string;
  total_users: number;
  verified_users: number;
  total_files: number;
  total_file_size: number;
  total_downloads: number;
  api_requests: number;
  anonymous_uploads: number;
  stats_data: Record<string, any>;
  created_at: string;
}

// 数据库操作类
export class Database {
  private client = supabaseAdmin;

  // 用户操作
  users = {
    create: async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> => {
      const { data, error } = await this.client
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    findByEmail: async (email: string): Promise<User | null> => {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    findById: async (id: string): Promise<User | null> => {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    verify: async (id: string): Promise<User> => {
      const { data, error } = await this.client
        .from('users')
        .update({
          is_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    updateLastLogin: async (id: string): Promise<User> => {
      const { data, error } = await this.client
        .from('users')
        .update({
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getAll: async (limit = 50, offset = 0): Promise<User[]> => {
      const { data, error } = await this.client
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    },

    getStats: async () => {
      const { data, error } = await this.client
        .from('users')
        .select('id, is_verified, created_at');

      if (error) throw error;

      const total = data?.length || 0;
      const verified = data?.filter(u => u.is_verified).length || 0;
      const today = new Date().toDateString();
      const todayRegistrations = data?.filter(u =>
        new Date(u.created_at).toDateString() === today
      ).length || 0;

      return { total, verified, todayRegistrations };
    }
  };

  // 投影文件操作
  projectionFiles = {
    create: async (fileData: Omit<ProjectionFile, 'id' | 'created_at' | 'updated_at'>): Promise<ProjectionFile> => {
      const { data, error } = await this.client
        .from('projection_files')
        .insert([fileData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    findByFileId: async (fileId: string): Promise<ProjectionFile | null> => {
      const { data, error } = await this.client
        .from('projection_files')
        .select('*')
        .eq('file_id', fileId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    findByUserId: async (userId: string, limit = 50, offset = 0): Promise<ProjectionFile[]> => {
      const { data, error } = await this.client
        .from('projection_files')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    },

    getAll: async (limit = 50, offset = 0): Promise<ProjectionFile[]> => {
      const { data, error } = await this.client
        .from('projection_files')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    },

    incrementDownloadCount: async (fileId: string): Promise<void> => {
      // 读取当前 download_count 后再 +1 更新（简化实现，避免类型不兼容）
      const { data: countRow, error: selErr } = await this.client
        .from('projection_files')
        .select('download_count')
        .eq('file_id', fileId)
        .single();
      if (selErr) throw selErr;
      const newCount = ((countRow?.download_count as number) || 0) + 1;

      const { error: updErr } = await this.client
        .from('projection_files')
        .update({
          download_count: newCount,
          updated_at: new Date().toISOString()
        })
        .eq('file_id', fileId);

      if (updErr) throw updErr;
    },

    getStats: async () => {
      const { data, error } = await this.client
        .from('projection_files')
        .select('id, file_size, download_count, created_at, user_id');

      if (error) throw error;

      const total = data?.length || 0;
      const totalSize = data?.reduce((sum, f) => sum + (f.file_size || 0), 0) || 0;
      const totalDownloads = data?.reduce((sum, f) => sum + (f.download_count || 0), 0) || 0;
      const today = new Date().toDateString();
      const todayUploads = data?.filter(f =>
        new Date(f.created_at).toDateString() === today
      ).length || 0;
      const anonymous = data?.filter(f => !f.user_id).length || 0;

      return { total, totalSize, totalDownloads, todayUploads, anonymous };
    }
  };

  // API 密钥操作
  apiKeys = {
    create: async (keyData: Omit<ApiKey, 'id' | 'created_at'>): Promise<ApiKey> => {
      const { data, error } = await this.client
        .from('api_keys')
        .insert([keyData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    findByHash: async (keyHash: string): Promise<ApiKey | null> => {
      const { data, error } = await this.client
        .from('api_keys')
        .select('*')
        .eq('key_hash', keyHash)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    findByUserId: async (userId: string): Promise<ApiKey[]> => {
      const { data, error } = await this.client
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },

    updateUsage: async (id: string): Promise<void> => {
      // 读取当前 usage_count 后再 +1 更新
      const { data: usageRow, error: selErr } = await this.client
        .from('api_keys')
        .select('usage_count')
        .eq('id', id)
        .single();
      if (selErr) throw selErr;
      const newUsage = ((usageRow?.usage_count as number) || 0) + 1;

      const { error: updErr } = await this.client
        .from('api_keys')
        .update({
          usage_count: newUsage,
          last_used_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updErr) throw updErr;
    },

    deactivate: async (id: string): Promise<ApiKey> => {
      const { data, error } = await this.client
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  };

  // 验证码操作
  verificationCodes = {
    create: async (codeData: Omit<VerificationCode, 'id' | 'created_at'>): Promise<VerificationCode> => {
      const { data, error } = await this.client
        .from('verification_codes')
        .insert([codeData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    findByEmailAndCode: async (email: string, code: string): Promise<VerificationCode | null> => {
      const { data, error } = await this.client
        .from('verification_codes')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .is('used_at', null)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    markAsUsed: async (id: string): Promise<VerificationCode> => {
      const { data, error } = await this.client
        .from('verification_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    incrementAttempts: async (id: string): Promise<VerificationCode> => {
      // 读取当前 attempts 后再 +1 更新
      const { data: attRow, error: selErr } = await this.client
        .from('verification_codes')
        .select('attempts')
        .eq('id', id)
        .single();
      if (selErr) throw selErr;
      const newAttempts = ((attRow?.attempts as number) || 0) + 1;

      const { data, error: updErr } = await this.client
        .from('verification_codes')
        .update({ attempts: newAttempts })
        .eq('id', id)
        .select()
        .single();

      if (updErr) throw updErr;
      return data;
    },

    cleanup: async (): Promise<void> => {
      const { error } = await this.client
        .from('verification_codes')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) throw error;
    }
  };

  // 系统日志操作
  systemLogs = {
    create: async (logData: Omit<SystemLog, 'id' | 'created_at'>): Promise<SystemLog> => {
      const { data, error } = await this.client
        .from('system_logs')
        .insert([logData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getRecent: async (limit = 100): Promise<SystemLog[]> => {
      const { data, error } = await this.client
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },

    getByLevel: async (level: string, limit = 100): Promise<SystemLog[]> => {
      const { data, error } = await this.client
        .from('system_logs')
        .select('*')
        .eq('level', level)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    }
  };

  // 文件访问日志操作
  fileAccessLogs = {
    create: async (logData: Omit<FileAccessLog, 'id' | 'created_at'>): Promise<FileAccessLog> => {
      const { data, error } = await this.client
        .from('file_access_logs')
        .insert([logData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getByFileId: async (fileId: string, limit = 50): Promise<FileAccessLog[]> => {
      const { data, error } = await this.client
        .from('file_access_logs')
        .select('*')
        .eq('file_id', fileId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    }
  };

  // 系统统计操作
  systemStats = {
    upsertDaily: async (statsData: Omit<SystemStats, 'id' | 'created_at'>): Promise<SystemStats> => {
      const { data, error } = await this.client
        .from('system_stats')
        .upsert([statsData], { onConflict: 'stat_date' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getRecent: async (days = 30): Promise<SystemStats[]> => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await this.client
        .from('system_stats')
        .select('*')
        .gte('stat_date', startDate.toISOString().split('T')[0])
        .order('stat_date', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  };
}

// 导出数据库实例
export const db = new Database();
