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
  createUser,
  logInfo,
  logError
} from '../../src/lib/rust-core';

const handleRegister = async (event: any, context: any, requestContext: RequestContext) => {
  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return createApiError('Method not allowed', 405);
  }

  let email = '';

  try {
    // 解析请求体
    const body = JSON.parse(event.body || '{}');
    email = body.email;

    // 验证输入
    if (!email || !isValidEmail(email)) {
      logger.warn('Invalid email provided', { email }, undefined, undefined, requestContext.requestId);
      return createApiError('请提供有效的邮箱地址', 400);
    }

    logger.info('Processing registration request', { email }, undefined, requestContext.requestId);

    // 检查邮箱是否已注册
    const existingUser = await db.users.findByEmail(email);
    if (existingUser) {
      logger.warn('Email already registered', { email }, undefined, undefined, requestContext.requestId);
      return createApiError('该邮箱已注册', 409);
    }

    // 检查发送频率限制
    const canSend = await cache.verification.checkRateLimit(email);
    if (!canSend) {
      logger.warn('Rate limit exceeded for verification code', { email }, undefined, undefined, requestContext.requestId);
      return createApiError('验证码发送过于频繁，请稍后再试', 429);
    }

    // 生成验证码
    const verificationCode = generateVerificationCode();

    // 存储验证码到Redis
    await cache.verification.setCode(email, verificationCode);

    // 发送验证码邮件
    await emailService.sendVerificationCode(email, verificationCode);

    logger.info('Verification code sent successfully', { email }, undefined, requestContext.requestId);

    return createApiResponse(
      { email },
      '验证码已发送到您的邮箱，请查收',
      200
    );

  } catch (error) {
    logger.error('Registration error', { email }, error as Error, undefined, requestContext.requestId);
    return createApiError('服务器内部错误', 500);
  }
};

export const handler = withMiddleware(handleRegister, {
  enableRateLimit: true,
  maxRequests: 10, // 每15分钟最多10次请求
});
