import { Handler } from '@netlify/functions';
import { validateConfig } from '../../src/lib/config';
import { db } from '../../src/lib/supabase';
import { cache } from '../../src/lib/redis';
import { createApiResponse, createApiError, generateApiKey, isValidEmail } from '../../src/lib/utils';

// 验证环境配置
try {
  validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error);
}

export const handler: Handler = async (event, context) => {
  try {
    const method = event.httpMethod;

    if (method === 'POST') {
      // 生成新的API密钥
      return await generateNewApiKey(event);
    } else if (method === 'GET') {
      // 获取当前API密钥信息
      return await getCurrentApiKey(event);
    } else {
      return createApiError('Method not allowed', 405);
    }

  } catch (error) {
    console.error('API key operation error:', error);
    return createApiError('服务器内部错误', 500);
  }
};

// 生成新的API密钥
async function generateNewApiKey(event: any) {
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
    return createApiError('邮箱未验证', 400);
  }

  // 如果用户已有API密钥，先删除旧的缓存
  if (user.api_key) {
    await cache.apiKey.deleteUserInfo(user.api_key);
  }

  // 生成新的API密钥
  const newApiKey = generateApiKey();

  // 更新数据库
  await db.users.updateApiKey(user.id, newApiKey);

  // 更新缓存
  await cache.apiKey.setUserInfo(newApiKey, {
    id: user.id,
    email: user.email,
  });

  return createApiResponse(
    {
      api_key: newApiKey,
      created_at: new Date().toISOString(),
    },
    'API密钥生成成功',
    200
  );
}

// 获取当前API密钥信息
async function getCurrentApiKey(event: any) {
  const email = event.queryStringParameters?.email;

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
    return createApiError('邮箱未验证', 400);
  }

  if (!user.api_key) {
    return createApiResponse(
      { has_api_key: false },
      '用户尚未生成API密钥',
      200
    );
  }

  return createApiResponse(
    {
      has_api_key: true,
      api_key: user.api_key,
      created_at: user.updated_at,
    },
    '获取API密钥成功',
    200
  );
}
