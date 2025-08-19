import { Handler } from '@netlify/functions';
import { Resend } from 'resend';

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
    // 检查环境变量
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@neptunium.com';
    
    if (!resendApiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'RESEND_API_KEY environment variable is missing',
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // 测试邮件配置
    const testResult = {
      status: 'testing',
      timestamp: new Date().toISOString(),
      config: {
        hasApiKey: !!resendApiKey,
        apiKeyLength: resendApiKey ? resendApiKey.length : 0,
        fromEmail: fromEmail,
      },
    };

    // 如果是 POST 请求，尝试发送测试邮件
    if (event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      const testEmail = body.email || 'test@example.com';

      try {
        const resend = new Resend(resendApiKey);
        
        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: testEmail,
          subject: 'Neptunium 邮件服务测试',
          html: `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
              <h2 style="color: #d4af37;">邮件服务测试成功！</h2>
              <p>这是一封来自 Neptunium 系统的测试邮件。</p>
              <p>时间: ${new Date().toLocaleString('zh-CN')}</p>
              <p>如果您收到这封邮件，说明邮件服务配置正确。</p>
            </div>
          `,
          text: `Neptunium 邮件服务测试成功！时间: ${new Date().toLocaleString('zh-CN')}`,
        });

        if (error) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              ...testResult,
              status: 'failed',
              error: error,
              message: '邮件发送失败',
            }),
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            ...testResult,
            status: 'success',
            message: '测试邮件发送成功',
            emailId: data?.id,
            sentTo: testEmail,
          }),
        };
      } catch (emailError) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            ...testResult,
            status: 'error',
            error: emailError instanceof Error ? emailError.message : 'Unknown error',
            stack: emailError instanceof Error ? emailError.stack : undefined,
          }),
        };
      }
    }

    // GET 请求只返回配置信息
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...testResult,
        message: '邮件服务配置检查完成。发送 POST 请求到此端点可测试邮件发送。',
        usage: {
          get: '检查邮件服务配置',
          post: '发送测试邮件 (可选参数: {"email": "test@example.com"})',
        },
      }),
    };
  } catch (error) {
    console.error('Email test error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Email test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
