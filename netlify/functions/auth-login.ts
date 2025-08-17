import { Handler } from '@netlify/functions';
import { validateConfig } from '../../src/lib/config';
import { db } from '../../src/lib/supabase';
import { cache } from '../../src/lib/redis';
import { isValidEmail, createApiResponse, createApiError } from '../../src/lib/utils';

// 验证环境配置
try {
  validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error);
}

export const handler: Handler = async (event, context) => {
  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return createApiError('Method not allowed', 405);
  }

  try {
    // 解析请求体
    const body = JSON.parse(event.body || '{}');
    const { email } = body;

    // 验证输入
    if (!email || !isValidEmail(email)) {
      return createApiError('请提供有效的邮箱地址', 400);
    }

    // 查找用户
    const user = await db.users.findByEmail(email);
    if (!user) {
      return createApiError('用户不存在', 404);
    }

    if (!user.email_verified) {
      return createApiError('邮箱未验证，请先完成邮箱验证', 400);
    }

    // 更新API密钥缓存
    if (user.api_key) {
      await cache.apiKey.setUserInfo(user.api_key, {
        id: user.id,
        email: user.email,
      });
    }

    return createApiResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          api_key: user.api_key,
          created_at: user.created_at,
        },
      },
      '登录成功',
      200
    );

  } catch (error) {
    console.error('Login error:', error);
    return createApiError('服务器内部错误', 500);
  }
};
