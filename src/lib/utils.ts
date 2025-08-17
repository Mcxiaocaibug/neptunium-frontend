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

// API响应格式化
export function createApiResponse<T>(
  data: T,
  message: string = 'Success',
  statusCode: number = 200
) {
  return Response.json(
    {
      success: statusCode < 400,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

// API错误响应
export function createApiError(
  message: string,
  statusCode: number = 500,
  code?: string
) {
  return Response.json(
    {
      success: false,
      message,
      code,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}
