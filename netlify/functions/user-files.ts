import { Handler } from '@netlify/functions';
import { validateConfig } from '../../src/lib/config';
import { db } from '../../src/lib/supabase';
import { cache } from '../../src/lib/redis';
import { createApiResponse, createApiError } from '../../src/lib/utils';

// 验证环境配置
try {
  validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error);
}

// 验证API密钥中间件
async function validateApiKey(apiKey: string): Promise<{ id: string; email: string } | null> {
  if (!apiKey) return null;

  // 先从缓存获取
  const cachedUser = await cache.apiKey.getUserInfo(apiKey);
  if (cachedUser) return cachedUser;

  // 缓存未命中，从数据库查询
  const user = await db.users.findByApiKey(apiKey);
  if (!user) return null;

  // 更新缓存
  const userInfo = { id: user.id, email: user.email };
  await cache.apiKey.setUserInfo(apiKey, userInfo);

  return userInfo;
}

export const handler: Handler = async (event, context) => {
  // 只允许GET请求
  if (event.httpMethod !== 'GET') {
    return createApiError('Method not allowed', 405);
  }

  try {
    // 获取API密钥
    const apiKey = event.headers['x-api-key'] || event.queryStringParameters?.api_key;

    if (!apiKey) {
      return createApiError('请提供API密钥', 401);
    }

    // 验证API密钥
    const user = await validateApiKey(apiKey);
    if (!user) {
      return createApiError('无效的API密钥', 401);
    }

    // 获取查询参数
    const page = parseInt(event.queryStringParameters?.page || '1');
    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '20'), 100);
    const offset = (page - 1) * limit;

    // 获取用户的投影文件
    const files = await db.projectionFiles.findByUserId(user.id);

    // 简单的分页处理
    const totalFiles = files.length;
    const paginatedFiles = files.slice(offset, offset + limit);

    // 格式化返回数据
    const formattedFiles = paginatedFiles.map(file => ({
      projection_id: file.projection_id,
      filename: file.filename,
      file_size: file.file_size,
      file_type: file.file_type,
      created_at: file.created_at,
      metadata: file.metadata,
    }));

    return createApiResponse(
      {
        files: formattedFiles,
        pagination: {
          page,
          limit,
          total: totalFiles,
          total_pages: Math.ceil(totalFiles / limit),
        },
      },
      '获取文件列表成功',
      200
    );

  } catch (error) {
    console.error('Get user files error:', error);
    return createApiError('服务器内部错误', 500);
  }
};
