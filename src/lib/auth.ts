// 注意：这些依赖需要在 Netlify Functions 中使用，而不是在客户端
// import jwt from 'jsonwebtoken';
// import bcrypt from 'bcryptjs';
import { config } from './config';

// JWT 相关类型
export interface JWTPayload {
    id: string;
    email: string;
    iat: number;
    exp: number;
}

// 安全的 JWT 工具类
export class AuthService {
    private static readonly JWT_SECRET = config.auth.secret || 'fallback-secret-key';
    private static readonly JWT_EXPIRES_IN = '24h';

    // 创建 JWT token（在 Netlify Functions 中实现）
    static createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
        // 这个方法应该在 Netlify Functions 中使用 jsonwebtoken 库实现
        throw new Error('JWT creation should be done in Netlify Functions');
    }

    // 验证 JWT token（在 Netlify Functions 中实现）
    static verifyToken(token: string): JWTPayload | null {
        // 这个方法应该在 Netlify Functions 中使用 jsonwebtoken 库实现
        throw new Error('JWT verification should be done in Netlify Functions');
    }

    // 哈希密码（在 Netlify Functions 中实现）
    static async hashPassword(password: string): Promise<string> {
        // 这个方法应该在 Netlify Functions 中使用 bcryptjs 库实现
        throw new Error('Password hashing should be done in Netlify Functions');
    }

    // 验证密码（在 Netlify Functions 中实现）
    static async verifyPassword(password: string, hash: string): Promise<boolean> {
        // 这个方法应该在 Netlify Functions 中使用 bcryptjs 库实现
        throw new Error('Password verification should be done in Netlify Functions');
    }

    // 生成安全的随机字符串
    static generateSecureToken(length: number = 32): string {
        // 在生产环境中，这应该在 Netlify Functions 中使用 Node.js crypto 模块
        // 这里提供一个简单的浏览器兼容实现
        const chars = '0123456789abcdef';
        let result = '';
        for (let i = 0; i < length * 2; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
        return result;
    }

    // 验证邮箱格式
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 生成验证码
    static generateVerificationCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
}

// API 密钥管理
export class ApiKeyService {
    private static readonly API_KEY_PREFIX = 'npt_';

    // 生成 API 密钥
    static generateApiKey(): string {
        const randomPart = AuthService.generateSecureToken(24);
        return `${this.API_KEY_PREFIX}${randomPart}`;
    }

    // 验证 API 密钥格式
    static isValidApiKeyFormat(apiKey: string): boolean {
        return apiKey.startsWith(this.API_KEY_PREFIX) && apiKey.length === 52;
    }

    // 哈希 API 密钥用于存储
    static async hashApiKey(apiKey: string): Promise<string> {
        return await AuthService.hashPassword(apiKey);
    }

    // 验证 API 密钥
    static async verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
        return await AuthService.verifyPassword(apiKey, hash);
    }

    // 获取 API 密钥前缀用于显示
    static getDisplayPrefix(apiKey: string): string {
        return apiKey.substring(0, 10) + '...';
    }
}

// 权限管理
export enum Permission {
    READ = 'read',
    WRITE = 'write',
    DELETE = 'delete',
    ADMIN = 'admin',
}

export class PermissionService {
    // 检查用户权限
    static hasPermission(userPermissions: string[], requiredPermission: Permission): boolean {
        return userPermissions.includes(requiredPermission) || userPermissions.includes(Permission.ADMIN);
    }

    // 获取默认权限
    static getDefaultPermissions(): Permission[] {
        return [Permission.READ, Permission.WRITE];
    }

    // 获取管理员权限
    static getAdminPermissions(): Permission[] {
        return Object.values(Permission);
    }
}
