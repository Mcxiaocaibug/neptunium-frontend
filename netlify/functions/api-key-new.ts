/**
 * API 密钥管理 API
 * 支持创建、查看、删除 API 密钥
 */

import { Handler } from '@netlify/functions';
import { db } from '../../src/lib/database';
import { createApiResponse, createApiError, getClientIPFromEvent, verifyJWT } from '../../src/lib/utils';
import { logger } from '../../src/lib/logger';
import {
  initRustCore,
  generateApiKey,
  hashString,
  logInfo,
  logError
} from '../../src/lib/rust-core';

interface CreateApiKeyRequest {
  name: string;
  description?: string;
  permissions?: string[];
  rateLimit?: number;
  expiresIn?: number; // 天数
}

export const handler: Handler = async (event, context) => {
  // 设置 CORS 头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // 处理 OPTIONS 请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const clientIP = getClientIPFromEvent(event);
  const requestId = context.awsRequestId || 'unknown';

  try {
    // 初始化 Rust 核心
    await initRustCore();

    // 验证用户身份
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createApiError('未提供有效的认证令牌', 401, undefined, headers);
    }

    const token = authHeader.substring(7);
    const user = await verifyJWT(token);
    if (!user) {
      return createApiError('认证令牌无效', 401, undefined, headers);
    }

    logInfo(`API key operation request from user ${user.id}`);

    switch (event.httpMethod) {
      case 'GET':
        return await handleGetApiKeys(user.id, headers, requestId);

      case 'POST':
        const createBody: CreateApiKeyRequest = JSON.parse(event.body || '{}');
        return await handleCreateApiKey(user.id, createBody, clientIP, headers, requestId);

      case 'DELETE':
        const keyId = event.queryStringParameters?.id;
        if (!keyId) {
          return createApiError('缺少 API 密钥 ID', 400, undefined, headers);
        }
        return await handleDeleteApiKey(user.id, keyId, headers, requestId);

      default:
        return createApiError('不支持的请求方法', 405, undefined, headers);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('API key operation failed', { error: errorMessage, requestId });
    logError(`API key operation failed: ${errorMessage}`);

    return createApiError('操作失败，请稍后重试', 500, undefined, headers);
  }
};

// 获取用户的 API 密钥列表
async function handleGetApiKeys(userId: string, headers: any, requestId: string) {
  try {
    const apiKeys = await db.apiKeys.findByUserId(userId);

    // 隐藏敏感信息
    const safeApiKeys = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      description: key.description,
      key_prefix: key.key_prefix,
      permissions: key.permissions,
      is_active: key.is_active,
      usage_count: key.usage_count,
      rate_limit: key.rate_limit,
      last_used_at: key.last_used_at,
      expires_at: key.expires_at,
      created_at: key.created_at
    }));

    logger.info('API keys retrieved', { userId, count: apiKeys.length, requestId });

    return createApiResponse({
      apiKeys: safeApiKeys,
      total: apiKeys.length
    }, 200, headers);

  } catch (error) {
    logger.error('Failed to get API keys', { userId, error, requestId });
    throw error;
  }
}

// 创建新的 API 密钥
async function handleCreateApiKey(
  userId: string,
  requestData: CreateApiKeyRequest,
  clientIP: string,
  headers: any,
  requestId: string
) {
  try {
    const { name, description, permissions = ['read'], rateLimit = 1000, expiresIn } = requestData;

    // 验证输入
    if (!name || name.trim().length === 0) {
      return createApiError('API 密钥名称不能为空', 400, undefined, headers);
    }

    if (name.length > 100) {
      return createApiError('API 密钥名称不能超过 100 个字符', 400, undefined, headers);
    }

    // 检查用户的 API 密钥数量限制
    const existingKeys = await db.apiKeys.findByUserId(userId);
    if (existingKeys.length >= 10) {
      return createApiError('每个用户最多只能创建 10 个 API 密钥', 400, undefined, headers);
    }

    // 生成 API 密钥
    const rawApiKey = generateApiKey();
    const keyHash = hashString(rawApiKey);
    const keyPrefix = rawApiKey.substring(0, 10);

    // 计算过期时间
    let expiresAt: string | undefined;
    if (expiresIn && expiresIn > 0) {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + expiresIn);
      expiresAt = expireDate.toISOString();
    }

    // 创建 API 密钥记录
    const apiKey = await db.apiKeys.create({
      user_id: userId,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      name: name.trim(),
      description: description?.trim(),
      permissions,
      is_active: true,
      usage_count: 0,
      rate_limit: rateLimit,
      expires_at: expiresAt
    });

    // 记录系统日志
    await db.systemLogs.create({
      level: 'info',
      message: 'API key created',
      context: {
        userId,
        apiKeyId: apiKey.id,
        apiKeyName: name,
        permissions,
        rateLimit,
        expiresIn
      },
      user_id: userId,
      ip_address: clientIP,
      request_id: requestId
    });

    logger.info('API key created', {
      userId,
      apiKeyId: apiKey.id,
      name,
      requestId
    });
    logInfo(`API key created for user ${userId}: ${name}`);

    return createApiResponse({
      message: 'API 密钥创建成功',
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        description: apiKey.description,
        key: rawApiKey, // 只在创建时返回完整密钥
        key_prefix: apiKey.key_prefix,
        permissions: apiKey.permissions,
        rate_limit: apiKey.rate_limit,
        expires_at: apiKey.expires_at,
        created_at: apiKey.created_at
      }
    }, 201, headers);

  } catch (error) {
    logger.error('Failed to create API key', { userId, error, requestId });
    throw error;
  }
}

// 删除 API 密钥
async function handleDeleteApiKey(userId: string, keyId: string, headers: any, requestId: string) {
  try {
    // 查找 API 密钥
    const apiKeys = await db.apiKeys.findByUserId(userId);
    const apiKey = apiKeys.find(key => key.id === keyId);

    if (!apiKey) {
      return createApiError('API 密钥不存在', 404, undefined, headers);
    }

    // 停用 API 密钥
    await db.apiKeys.deactivate(keyId);

    // 记录系统日志
    await db.systemLogs.create({
      level: 'info',
      message: 'API key deactivated',
      context: {
        userId,
        apiKeyId: keyId,
        apiKeyName: apiKey.name
      },
      user_id: userId,
      request_id: requestId
    });

    logger.info('API key deactivated', {
      userId,
      apiKeyId: keyId,
      requestId
    });
    logInfo(`API key deactivated for user ${userId}: ${keyId}`);

    return createApiResponse({
      message: 'API 密钥已删除'
    }, 200, headers);

  } catch (error) {
    logger.error('Failed to delete API key', { userId, keyId, error, requestId });
    throw error;
  }
}
