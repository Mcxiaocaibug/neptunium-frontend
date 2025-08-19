/**
 * 用户注册 API - 完整版本
 * 支持邮箱验证和 Rust 核心集成
 */

import { Handler } from '@netlify/functions';
import { db } from '../../src/lib/database';
import { cache } from '../../src/lib/redis';
import { emailService } from '../../src/lib/email';
import { createApiResponse, createApiError, getClientIPFromEvent } from '../../src/lib/utils';
import { logger } from '../../src/lib/logger';
import {
  initRustCore,
  validateRegistrationData,
  hashPassword,
  generateVerificationCode,
  logInfo,
  logError
} from '../../src/lib/rust-core';

interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
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
    logInfo('Processing registration request');

    // 解析请求体
    const body: RegisterRequest = JSON.parse(event.body || '{}');
    const { email: userEmail, password, confirmPassword } = body;
    email = userEmail;

    // 使用 Rust 验证注册数据
    const validation = validateRegistrationData(email, password, confirmPassword);
    if (!validation.is_valid) {
      logError(`Registration validation failed: ${validation.message}`);
      return createApiError(validation.message, 400, undefined, headers);
    }

    logger.info('Processing registration request', { email, ip: clientIP, requestId });

    // 检查邮箱是否已注册
    const existingUser = await db.users.findByEmail(email);
    if (existingUser) {
      logger.warn('Email already registered', { email, requestId });
      return createApiError('该邮箱已被注册', 409, undefined, headers);
    }

    // 检查发送频率限制
    const rateLimitKey = `rate_limit:register:${clientIP}`;
    const attempts = await cache.get(rateLimitKey);
    if (attempts && parseInt(attempts) >= 5) {
      logger.warn('Registration rate limit exceeded', { email, ip: clientIP, requestId });
      return createApiError('注册请求过于频繁，请稍后再试', 429, undefined, headers);
    }

    // 使用 Rust 哈希密码
    const passwordHash = hashPassword(password);

    // 生成验证码
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

    // 创建验证码记录
    await db.verificationCodes.create({
      email,
      code: verificationCode,
      type: 'email_verification',
      attempts: 0,
      max_attempts: 3,
      expires_at: expiresAt.toISOString()
    });

    // 存储临时注册数据到Redis
    const tempDataKey = `temp_register:${email}`;
    await cache.set(tempDataKey, JSON.stringify({
      email,
      passwordHash,
      ip: clientIP,
      createdAt: new Date().toISOString()
    }), 600); // 10分钟TTL

    // 发送验证邮件
    await emailService.sendVerificationEmail(email, verificationCode);

    // 更新频率限制
    await cache.set(rateLimitKey, (parseInt(attempts || '0') + 1).toString(), 3600); // 1小时TTL

    logger.info('Verification email sent', { email, requestId });
    logInfo(`Verification email sent to ${email}`);

    return createApiResponse({
      message: '验证码已发送到您的邮箱，请查收',
      email: email,
      expiresIn: 600 // 10分钟
    }, 200, headers);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Registration failed', { email, error: errorMessage, requestId });
    logError(`Registration failed for ${email}: ${errorMessage}`);

    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return createApiError('该邮箱已被注册', 409, undefined, headers);
      }
      if (error.message.includes('email') || error.message.includes('SMTP')) {
        return createApiError('邮件发送失败，请稍后重试', 500, undefined, headers);
      }
      if (error.message.includes('rate limit')) {
        return createApiError('请求过于频繁，请稍后重试', 429, undefined, headers);
      }
    }

    return createApiError('注册失败，请稍后重试', 500, undefined, headers);
  }
};
