/**
 * 邮箱验证 API
 * 验证邮箱验证码并完成用户注册
 */

import { Handler } from '@netlify/functions';
import { db } from '../../src/lib/database';
import { cache } from '../../src/lib/redis';
import { createApiResponse, createApiError, getClientIPFromEvent } from '../../src/lib/utils';
import { logger } from '../../src/lib/logger';
import {
  initRustCore,
  createTokenPayload,
  logInfo,
  logError
} from '../../src/lib/rust-core';
import jwt from 'jsonwebtoken';

interface VerifyEmailRequest {
  email: string;
  code: string;
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
    logInfo('Processing email verification request');

    // 解析请求体
    const body: VerifyEmailRequest = JSON.parse(event.body || '{}');
    const { email: userEmail, code } = body;
    email = userEmail;

    // 验证输入
    if (!email || !code) {
      return createApiError('邮箱和验证码不能为空', 400, undefined, headers);
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return createApiError('验证码格式错误', 400, headers);
    }

    logger.info('Processing email verification', { email, requestId });

    // 查找验证码记录
    const verificationRecord = await db.verificationCodes.findByEmailAndCode(email, code);
    if (!verificationRecord) {
      logger.warn('Invalid verification code', { email, code, requestId });
      return createApiError('验证码无效或已过期', 400, undefined, headers);
    }

    // 检查尝试次数
    if (verificationRecord.attempts >= verificationRecord.max_attempts) {
      logger.warn('Verification code max attempts exceeded', { email, requestId });
      return createApiError('验证码尝试次数过多，请重新获取', 400, undefined, headers);
    }

    // 获取临时注册数据
    const tempDataKey = `temp_register:${email}`;
    const tempDataStr = await cache.get(tempDataKey);
    if (!tempDataStr) {
      logger.warn('Temporary registration data not found', { email, requestId });
      return createApiError('注册会话已过期，请重新注册', 400, undefined, headers);
    }

    const tempData = JSON.parse(tempDataStr);

    // 创建用户
    const user = await db.users.create({
      email: tempData.email,
      password_hash: tempData.passwordHash,
      is_verified: true,
      is_admin: false,
      profile_data: {
        registeredAt: new Date().toISOString(),
        registrationIP: tempData.ip
      }
    });

    // 标记验证码为已使用
    await db.verificationCodes.markAsUsed(verificationRecord.id);

    // 清理临时数据
    await cache.del(tempDataKey);

    // 生成 JWT Token
    const jwtSecret = process.env.JWT_SECRET || 'default-secret';
    const tokenPayload = JSON.parse(createTokenPayload(user.id, user.email, 86400)); // 24小时
    const token = jwt.sign(tokenPayload, jwtSecret);

    // 记录登录
    await db.users.updateLastLogin(user.id);

    // 记录系统日志
    await db.systemLogs.create({
      level: 'info',
      message: 'User registration completed',
      context: {
        userId: user.id,
        email: user.email,
        ip: clientIP
      },
      user_id: user.id,
      ip_address: clientIP,
      request_id: requestId
    });

    logger.info('User registration completed', {
      userId: user.id,
      email: user.email,
      requestId
    });
    logInfo(`User registration completed for ${email}`);

    return createApiResponse({
      message: '邮箱验证成功，注册完成',
      user: {
        id: user.id,
        email: user.email,
        is_verified: user.is_verified,
        created_at: user.created_at
      },
      token,
      expiresIn: 86400
    }, 200, headers);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Email verification failed', { email, error: errorMessage, requestId });
    logError(`Email verification failed for ${email}: ${errorMessage}`);

    // 如果是验证码相关错误，增加尝试次数
    if (email) {
      try {
        const verificationRecord = await db.verificationCodes.findByEmailAndCode(email, '');
        if (verificationRecord) {
          await db.verificationCodes.incrementAttempts(verificationRecord.id);
        }
      } catch (updateError) {
        logger.error('Failed to update verification attempts', { email, error: updateError });
      }
    }

    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return createApiError('该邮箱已被注册', 409, undefined, headers);
      }
      if (error.message.includes('expired')) {
        return createApiError('验证码已过期，请重新获取', 400, undefined, headers);
      }
    }

    return createApiError('邮箱验证失败，请稍后重试', 500, undefined, headers);
  }
};
