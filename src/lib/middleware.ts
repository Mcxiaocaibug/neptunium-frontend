import { Handler } from '@netlify/functions';
import { logger, generateRequestId } from './logger';
import { validateConfig } from './config';
import { createApiError } from './utils';

// 请求上下文
export interface RequestContext {
  requestId: string;
  startTime: number;
  userId?: string;
  userEmail?: string;
}

// 中间件类型
export type MiddlewareHandler = (
  event: any,
  context: any,
  requestContext: RequestContext
) => Promise<Response | void>;

// 环境验证中间件
export const withEnvironmentValidation = (handler: MiddlewareHandler): Handler => {
  return async (event, context) => {
    try {
      validateConfig();
    } catch (error) {
      logger.error('Environment validation failed', { error: error instanceof Error ? error.message : error });
      return createApiError('服务配置错误', 500, 'CONFIG_ERROR');
    }

    const requestContext: RequestContext = {
      requestId: generateRequestId(),
      startTime: Date.now(),
    };

    return handler(event, context, requestContext);
  };
};

// 请求日志中间件
export const withRequestLogging = (handler: MiddlewareHandler): MiddlewareHandler => {
  return async (event, context, requestContext) => {
    const { httpMethod, path } = event;

    logger.apiRequest(httpMethod, path, requestContext.userId, requestContext.requestId);

    try {
      const result = await handler(event, context, requestContext);

      const duration = Date.now() - requestContext.startTime;
      const statusCode = result instanceof Response ? result.status : 200;

      logger.apiResponse(httpMethod, path, statusCode, duration, requestContext.userId, requestContext.requestId);

      return result;
    } catch (error) {
      const duration = Date.now() - requestContext.startTime;
      logger.apiResponse(httpMethod, path, 500, duration, requestContext.userId, requestContext.requestId);
      throw error;
    }
  };
};

// 错误处理中间件
export const withErrorHandling = (handler: MiddlewareHandler): MiddlewareHandler => {
  return async (event, context, requestContext) => {
    try {
      return await handler(event, context, requestContext);
    } catch (error) {
      logger.error(
        'Unhandled error in API handler',
        {
          path: event.path,
          method: event.httpMethod,
          error: error instanceof Error ? error.message : error,
        },
        error instanceof Error ? error : undefined,
        requestContext.userId,
        requestContext.requestId
      );

      // 生产环境不暴露详细错误信息
      const isDevelopment = process.env.NODE_ENV === 'development';
      const message = isDevelopment
        ? (error instanceof Error ? error.message : '未知错误')
        : '服务器内部错误';

      return createApiError(message, 500, 'INTERNAL_ERROR');
    }
  };
};

// CORS 中间件
export const withCORS = (handler: MiddlewareHandler): MiddlewareHandler => {
  return async (event, context, requestContext) => {
    // 处理预检请求
    if (event.httpMethod === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const result = await handler(event, context, requestContext);

    if (result instanceof Response) {
      // 添加 CORS 头部
      result.headers.set('Access-Control-Allow-Origin', '*');
      result.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization');
      result.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    }

    return result;
  };
};

// 速率限制中间件
export const withRateLimit = (
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15分钟
) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (handler: MiddlewareHandler): MiddlewareHandler => {
    return async (event, context, requestContext) => {
      const clientIP = event.headers['x-forwarded-for'] ||
        event.headers['x-real-ip'] ||
        'unknown';

      const now = Date.now();
      const key = `rate_limit:${clientIP}`;

      const current = requests.get(key);

      if (!current || now > current.resetTime) {
        // 重置或初始化计数器
        requests.set(key, { count: 1, resetTime: now + windowMs });
      } else if (current.count >= maxRequests) {
        // 超出限制
        logger.warn(
          'Rate limit exceeded',
          { clientIP, count: current.count, maxRequests },
          undefined,
          requestContext.userId,
          requestContext.requestId
        );

        return createApiError('请求过于频繁，请稍后再试', 429, 'RATE_LIMIT_EXCEEDED');
      } else {
        // 增加计数
        current.count++;
      }

      return handler(event, context, requestContext);
    };
  };
};

// 组合中间件
export const withMiddleware = (
  handler: MiddlewareHandler,
  options: {
    enableRateLimit?: boolean;
    maxRequests?: number;
    windowMs?: number;
  } = {}
): Handler => {
  let wrappedHandler = handler;

  // 按顺序应用中间件
  wrappedHandler = withErrorHandling(wrappedHandler);
  wrappedHandler = withRequestLogging(wrappedHandler);
  wrappedHandler = withCORS(wrappedHandler);

  if (options.enableRateLimit) {
    wrappedHandler = withRateLimit(options.maxRequests, options.windowMs)(wrappedHandler);
  }

  return withEnvironmentValidation(wrappedHandler);
};

// 用户认证中间件
export const withAuth = (handler: MiddlewareHandler): MiddlewareHandler => {
  return async (event, context, requestContext) => {
    const apiKey = event.headers['x-api-key'] || event.queryStringParameters?.api_key;

    if (!apiKey) {
      return createApiError('缺少API密钥', 401, 'MISSING_API_KEY');
    }

    // 这里可以添加API密钥验证逻辑
    // const user = await validateApiKey(apiKey);
    // if (!user) {
    //   return createApiError('无效的API密钥', 401, 'INVALID_API_KEY');
    // }

    // requestContext.userId = user.id;
    // requestContext.userEmail = user.email;

    return handler(event, context, requestContext);
  };
};
