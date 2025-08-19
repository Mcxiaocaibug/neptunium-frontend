import { type ClassValue, clsx } from 'clsx';
import { config } from './config';

// Tailwind CSS 类名合并工具
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// 生成随机字符串
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 生成投影ID (6位数字)
export function generateProjectionId(): string {
  return Math.random().toString().slice(2, 2 + config.business.projectionIdLength).padStart(config.business.projectionIdLength, '0');
}

// 生成API密钥
export function generateApiKey(): string {
  return generateRandomString(config.business.apiKeyLength);
}

// 验证邮箱格式
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 验证投影ID格式
export function isValidProjectionId(id: string): boolean {
  return /^\d{6}$/.test(id);
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 格式化日期
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 获取文件扩展名
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// 获取文件类型描述
export function getFileTypeDescription(filename: string): string {
  const ext = getFileExtension(filename);
  const typeMap: Record<string, string> = {
    'litematic': 'Litematica 投影文件',
    'schem': 'WorldEdit 投影文件',
    'schematic': 'MCEdit 投影文件',
    'nbt': 'NBT 结构文件',
  };

  return typeMap[ext] || '未知文件类型';
}

// 安全的JSON解析
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

// 延迟函数
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 获取客户端IP地址
export function getClientIP(request: Request): string {
  // 尝试从各种头部获取真实IP
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip',
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for 可能包含多个IP，取第一个
      return value.split(',')[0].trim();
    }
  }

  return 'unknown';
}

// 获取客户端IP地址 (支持 Netlify HandlerEvent)
export function getClientIPFromEvent(event: any): string {
  return (
    event.headers['x-forwarded-for'] ||
    event.headers['x-real-ip'] ||
    event.headers['cf-connecting-ip'] ||
    event.connection?.remoteAddress ||
    '127.0.0.1'
  );
}

// 错误处理工具
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// API响应格式化 - Netlify Functions格式
export function createApiResponse<T>(
  data: T,
  arg2?: string | number,
  arg3?: number | Record<string, string>,
  arg4?: Record<string, string>
) {
  // 兼容两种调用方式：
  // 1) createApiResponse(data, message?: string, statusCode?: number, headers?)
  // 2) createApiResponse(data, statusCode?: number, headers?)
  let message = 'Success';
  let statusCode = 200;
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (typeof arg2 === 'string') {
    message = arg2;
  } else if (typeof arg2 === 'number') {
    statusCode = arg2;
  }

  if (typeof arg3 === 'number') {
    statusCode = arg3;
  } else if (arg3 && typeof arg3 === 'object') {
    headers = { ...headers, ...arg3 };
  }

  if (arg4) {
    headers = { ...headers, ...arg4 };
  }

  return {
    statusCode,
    headers,
    body: JSON.stringify({
      success: statusCode < 400,
      message,
      data,
      timestamp: new Date().toISOString(),
    }),
  };
}

// API错误响应 - Netlify Functions格式
export function createApiError(
  message: string,
  statusCode: number = 500,
  code?: string,
  headers?: Record<string, string>
) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...headers,
    },
    body: JSON.stringify({
      success: false,
      message,
      code,
      timestamp: new Date().toISOString(),
    }),
  };
}

// JWT 相关函数
export interface JWTPayload {
  id: string;
  email: string;
  iat: number;
  exp: number;
}

// 简单的 JWT 验证函数（用于开发环境）
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    // 在生产环境中，这里应该使用真正的 JWT 验证
    // 目前使用简化版本进行开发
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));

    // 检查过期时间
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload as JWTPayload;
  } catch {
    return null;
  }
}

// 创建简单的 JWT token（用于开发环境）
export function createJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: number = 86400): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };

  // 简化的 JWT 创建（生产环境应使用真正的 JWT 库）
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadStr = btoa(JSON.stringify(fullPayload));
  const signature = btoa('simple-signature'); // 生产环境需要真正的签名

  return `${header}.${payloadStr}.${signature}`;
}

// API 密钥验证函数
export async function verifyApiKey(apiKey: string): Promise<any | null> {
  try {
    // 这里应该从数据库验证 API 密钥
    // 目前返回简化版本用于开发
    if (!apiKey || !apiKey.startsWith('npt_')) {
      return null;
    }

    // 在生产环境中，这里应该查询数据库
    return {
      id: 'api-key-id',
      user_id: 'user-id',
      is_active: true,
      permissions: ['read', 'write']
    };
  } catch {
    return null;
  }
}


