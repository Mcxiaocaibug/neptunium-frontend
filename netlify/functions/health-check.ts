import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // 处理 OPTIONS 请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        netlify: process.env.NETLIFY === 'true',
        context: context.awsRequestId,
      },
      services: {
        supabase: {
          configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        },
        cloudflare: {
          configured: !!(process.env.CLOUDFLARE_R2_ACCESS_KEY_ID && process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY),
          accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID ? 'configured' : 'missing',
        },
        redis: {
          configured: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
          url: process.env.UPSTASH_REDIS_REST_URL ? 'configured' : 'missing',
        },
        resend: {
          configured: !!process.env.RESEND_API_KEY,
          fromEmail: process.env.RESEND_FROM_EMAIL ? 'configured' : 'missing',
        },
      },
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(healthStatus, null, 2),
    };
  } catch (error) {
    console.error('Health check error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
