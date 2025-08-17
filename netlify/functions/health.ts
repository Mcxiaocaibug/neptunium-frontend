import { withMiddleware, RequestContext } from '../../src/lib/middleware';
import { createApiResponse, createApiError } from '../../src/lib/utils';
import { logger } from '../../src/lib/logger';
import { supabaseAdmin } from '../../src/lib/supabase';
import { redis } from '../../src/lib/redis';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: 'healthy' | 'unhealthy';
    redis: 'healthy' | 'unhealthy';
    storage: 'healthy' | 'unhealthy';
    email: 'healthy' | 'unhealthy';
  };
  uptime: number;
}

const startTime = Date.now();

const handleHealth = async (event: any, context: any, requestContext: RequestContext) => {
  if (event.httpMethod !== 'GET') {
    return createApiError('Method not allowed', 405);
  }

  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'healthy',
      redis: 'healthy',
      storage: 'healthy',
      email: 'healthy',
    },
    uptime: Date.now() - startTime,
  };

  // 检查数据库连接
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      healthStatus.services.database = 'unhealthy';
      logger.warn('Database health check failed', { error: error.message }, undefined, undefined, requestContext.requestId);
    }
  } catch (error) {
    healthStatus.services.database = 'unhealthy';
    logger.error('Database health check error', undefined, error as Error, undefined, requestContext.requestId);
  }

  // 检查Redis连接
  try {
    await redis.set('health_check', Date.now().toString(), { ex: 10 });
    const result = await redis.get('health_check');
    if (!result) {
      healthStatus.services.redis = 'unhealthy';
    }
  } catch (error) {
    healthStatus.services.redis = 'unhealthy';
    logger.error('Redis health check error', undefined, error as Error, undefined, requestContext.requestId);
  }

  // 检查存储服务（简单检查环境变量）
  if (!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
    healthStatus.services.storage = 'unhealthy';
  }

  // 检查邮件服务（简单检查环境变量）
  if (!process.env.RESEND_API_KEY) {
    healthStatus.services.email = 'unhealthy';
  }

  // 确定整体状态
  const unhealthyServices = Object.values(healthStatus.services).filter(status => status === 'unhealthy').length;

  if (unhealthyServices === 0) {
    healthStatus.status = 'healthy';
  } else if (unhealthyServices <= 1) {
    healthStatus.status = 'degraded';
  } else {
    healthStatus.status = 'unhealthy';
  }

  const statusCode = healthStatus.status === 'healthy' ? 200 :
    healthStatus.status === 'degraded' ? 200 : 503;

  logger.info('Health check completed', {
    status: healthStatus.status,
    unhealthyServices
  }, undefined, requestContext.requestId);

  return createApiResponse(
    healthStatus,
    `Service is ${healthStatus.status}`,
    statusCode
  );
};

export const handler = withMiddleware(handleHealth);
