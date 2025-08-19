import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // 测试基本的 JavaScript 功能
    const testData = {
      message: 'Netlify Functions 工作正常',
      timestamp: new Date().toISOString(),
      method: event.httpMethod,
      path: event.path,
      query: event.queryStringParameters,
      headers: Object.keys(event.headers || {}),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        netlify: process.env.NETLIFY,
        nodeEnv: process.env.NODE_ENV,
      },
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(testData, null, 2),
    };
  } catch (error) {
    console.error('Simple test error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      }),
    };
  }
};
