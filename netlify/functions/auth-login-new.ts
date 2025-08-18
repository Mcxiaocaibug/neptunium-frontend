/**
 * 用户登录 API
 * 支持邮箱密码登录和 JWT Token 生成
 */

import { Handler } from '@netlify/functions';
import { db } from '../../src/lib/database';
import { createApiResponse, createApiError, getClientIPFromEvent } from '../../src/lib/utils';
import { logger } from '../../src/lib/logger';
import {
  initRustCore,
  validateLoginCredentials,
  verifyPassword,
  createTokenPayload,
  logInfo,
  logError
} from '../../src/lib/rust-core';
import jwt from 'jsonwebtoken';

interface LoginRequest {
  email: string;
  password: string;
}

export const handler: Handler = async (event, context) => {
  // 设置 CORS 头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // 处理 OPTIONS 请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return createApiError('Method not allowed', 405, undefined, headers);
  }

  let email = '';
  const clientIP = getClientIPFromEvent(event);
  const requestId = context.awsRequestId || 'unknown';

  try {
    // 初始化 Rust 核心
    await initRustCore();
    logInfo('Processing login request');

    // 解析请求体
    const body: LoginRequest = JSON.parse(event.body || '{}');
    const { email: userEmail, password } = body;
    email = userEmail;

    // 使用 Rust 验证登录凭据
    const validation = validateLoginCredentials(email, password);
    if (!validation.is_valid) {
      logError(`Login validation failed: ${validation.message}`);
      return createApiError(validation.message, 400, undefined, headers);
    }

    logger.info('Processing login request', { email, ip: clientIP, requestId });

    // 查找用户
    const user = await db.users.findByEmail(email);
    if (!user) {
      logger.warn('User not found', { email, requestId });
      return createApiError('邮箱或密码错误', 401, undefined, headers);
    }

    // 验证密码
    const isPasswordValid = verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      logger.warn('Invalid password', { email, requestId });

      // 记录失败的登录尝试
      await db.systemLogs.create({
        level: 'warn',
        message: 'Failed login attempt - invalid password',
        context: {
          email,
          ip: clientIP,
          userAgent: event.headers['user-agent'] || 'unknown'
        },
        ip_address: clientIP,
        user_agent: event.headers['user-agent'],
        request_id: requestId
      });

      return createApiError('邮箱或密码错误', 401, undefined, headers);
    }

    // 检查用户是否已验证邮箱
    if (!user.is_verified) {
      logger.warn('User email not verified', { email, requestId });
      return createApiError('请先验证您的邮箱地址', 403, undefined, headers);
    }

    // 生成 JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'default-secret';
    const tokenPayload = JSON.parse(createTokenPayload(user.id, user.email, 86400)); // 24小时
    const token = jwt.sign(tokenPayload, jwtSecret);

    // 更新最后登录时间
    await db.users.updateLastLogin(user.id);

    // 记录成功的登录
    await db.systemLogs.create({
      level: 'info',
      message: 'User login successful',
      context: {
        userId: user.id,
        email: user.email,
        ip: clientIP,
        userAgent: event.headers['user-agent'] || 'unknown'
      },
      user_id: user.id,
      ip_address: clientIP,
      user_agent: event.headers['user-agent'],
      request_id: requestId
    });

    logger.info('User login successful', {
      userId: user.id,
      email: user.email,
      requestId
    });
    logInfo(`User login successful for ${email}`);

    return createApiResponse({
      message: '登录成功',
      user: {
        id: user.id,
        email: user.email,
        is_verified: user.is_verified,
        is_admin: user.is_admin,
        last_login_at: user.last_login_at,
        created_at: user.created_at
      },
      token,
      expiresIn: 86400
    }, 200, headers);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Login failed', { email, error: errorMessage, requestId });
    logError(`Login failed for ${email}: ${errorMessage}`);

    // 记录系统错误
    try {
      await db.systemLogs.create({
        level: 'error',
        message: 'Login system error',
        context: {
          email,
          error: errorMessage,
          ip: clientIP
        },
        ip_address: clientIP,
        request_id: requestId
      });
    } catch (logError) {
      logger.error('Failed to log system error', { error: logError });
    }

    return createApiError('登录失败，请稍后重试', 500, undefined, headers);
  }
};
