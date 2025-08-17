import { Handler } from '@netlify/functions';
import { validateConfig } from '../../src/lib/config';
import { db } from '../../src/lib/supabase';
import { cache } from '../../src/lib/redis';
import { emailService } from '../../src/lib/email';
import { isValidEmail, createApiResponse, createApiError, generateApiKey } from '../../src/lib/utils';

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
    const { email, code } = body;

    // 验证输入
    if (!email || !isValidEmail(email)) {
      return createApiError('请提供有效的邮箱地址', 400);
    }

    if (!code || code.length !== 6) {
      return createApiError('请提供6位验证码', 400);
    }

    // 从Redis获取验证码
    const storedCode = await cache.verification.getCode(email);
    if (!storedCode) {
      return createApiError('验证码已过期或不存在', 400);
    }

    // 验证码比对
    if (storedCode !== code) {
      return createApiError('验证码错误', 400);
    }

    // 删除已使用的验证码
    await cache.verification.deleteCode(email);

    // 创建用户
    const apiKey = generateApiKey();
    const user = await db.users.create({
      email,
      email_verified: true,
      api_key: apiKey,
    });

    if (!user) {
      return createApiError('用户创建失败', 500);
    }

    // 缓存API密钥信息
    await cache.apiKey.setUserInfo(apiKey, {
      id: user.id,
      email: user.email,
    });

    // 发送欢迎邮件 (异步，不阻塞响应)
    emailService.sendWelcomeEmail(email).catch(error => {
      console.error('Failed to send welcome email:', error);
    });

    return createApiResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          api_key: user.api_key,
          created_at: user.created_at,
        },
      },
      '注册成功！欢迎使用 Neptunium',
      201
    );

  } catch (error) {
    console.error('Verification error:', error);
    return createApiError('服务器内部错误', 500);
  }
};
