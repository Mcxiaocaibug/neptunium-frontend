import { Redis } from '@upstash/redis';
import { config } from './config';

// Redis 客户端实例
export const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});

// Redis 操作辅助函数
export const cache = {
  // 验证码相关操作
  verification: {
    // 存储验证码
    async setCode(email: string, code: string): Promise<void> {
      const key = `verification:${email}`;
      await redis.setex(key, config.business.verificationCodeExpiry / 1000, code);
    },

    // 获取验证码
    async getCode(email: string): Promise<string | null> {
      const key = `verification:${email}`;
      return await redis.get(key);
    },

    // 删除验证码
    async deleteCode(email: string): Promise<void> {
      const key = `verification:${email}`;
      await redis.del(key);
    },

    // 检查验证码发送频率限制 (1分钟内只能发送一次)
    async checkRateLimit(email: string): Promise<boolean> {
      const key = `rate_limit:${email}`;
      const exists = await redis.exists(key);
      
      if (exists) {
        return false; // 已存在，说明在限制时间内
      }
      
      // 设置1分钟的限制
      await redis.setex(key, 60, '1');
      return true;
    },
  },

  // API 密钥缓存
  apiKey: {
    // 缓存用户API密钥信息
    async setUserInfo(apiKey: string, userInfo: { id: string; email: string }): Promise<void> {
      const key = `api_key:${apiKey}`;
      await redis.setex(key, 3600, JSON.stringify(userInfo)); // 缓存1小时
    },

    // 获取API密钥对应的用户信息
    async getUserInfo(apiKey: string): Promise<{ id: string; email: string } | null> {
      const key = `api_key:${apiKey}`;
      const data = await redis.get(key);
      
      if (!data) return null;
      
      try {
        return JSON.parse(data as string);
      } catch {
        return null;
      }
    },

    // 删除API密钥缓存
    async deleteUserInfo(apiKey: string): Promise<void> {
      const key = `api_key:${apiKey}`;
      await redis.del(key);
    },
  },

  // 投影文件缓存
  projection: {
    // 缓存投影文件信息
    async setFileInfo(projectionId: string, fileInfo: any): Promise<void> {
      const key = `projection:${projectionId}`;
      await redis.setex(key, 1800, JSON.stringify(fileInfo)); // 缓存30分钟
    },

    // 获取投影文件信息
    async getFileInfo(projectionId: string): Promise<any | null> {
      const key = `projection:${projectionId}`;
      const data = await redis.get(key);
      
      if (!data) return null;
      
      try {
        return JSON.parse(data as string);
      } catch {
        return null;
      }
    },

    // 删除投影文件缓存
    async deleteFileInfo(projectionId: string): Promise<void> {
      const key = `projection:${projectionId}`;
      await redis.del(key);
    },
  },

  // 通用缓存操作
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (ttl) {
      await redis.setex(key, ttl, JSON.stringify(value));
    } else {
      await redis.set(key, JSON.stringify(value));
    }
  },

  async get(key: string): Promise<any | null> {
    const data = await redis.get(key);
    if (!data) return null;
    
    try {
      return JSON.parse(data as string);
    } catch {
      return data;
    }
  },

  async delete(key: string): Promise<void> {
    await redis.del(key);
  },
};
