import { Handler } from '@netlify/functions';
import { Resend } from 'resend';

// 生成验证码
function generateVerificationCode(): string {
  return Math.random().toString().slice(2, 8).padStart(6, '0');
}

// 验证码邮件模板
function createVerificationEmailTemplate(code: string, appName: string = 'Neptunium') {
  return {
    subject: `${appName} 邮箱验证码`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #d4af37; margin: 0;">${appName}</h1>
          <p style="color: #666; margin: 5px 0;">Minecraft 投影系统</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
          <h2 style="color: #333; margin-bottom: 20px;">邮箱验证码</h2>
          <p style="color: #666; margin-bottom: 30px;">您的验证码是：</p>
          
          <div style="background: #000; color: #d4af37; padding: 20px; border-radius: 6px; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${code}
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            验证码有效期为 10 分钟，请及时使用。<br>
            如果您没有请求此验证码，请忽略此邮件。
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            此邮件由 ${appName} 系统自动发送，请勿回复。
          </p>
        </div>
      </div>
    `,
    text: `${appName} 邮箱验证码：${code}。验证码有效期为 10 分钟，请及时使用。如果您没有请求此验证码，请忽略此邮件。`,
  };
}

export const handler: Handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // 解析请求体
    const body = event.body ? JSON.parse(event.body) : {};
    const { email } = body;

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '邮箱地址不能为空' }),
      };
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '邮箱格式不正确' }),
      };
    }

    // 检查环境变量
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@neptunium.com';
    const appName = process.env.APP_NAME || 'Neptunium';

    if (!resendApiKey) {
      console.error('RESEND_API_KEY environment variable is missing');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: '邮件服务配置错误' }),
      };
    }

    // 生成验证码
    const verificationCode = generateVerificationCode();
    
    // 创建邮件模板
    const template = createVerificationEmailTemplate(verificationCode, appName);

    // 发送邮件
    const resend = new Resend(resendApiKey);
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: '发送验证码失败',
          details: error.message || 'Unknown error'
        }),
      };
    }

    console.log('Verification email sent successfully:', { email, emailId: data?.id });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: '验证码已发送到您的邮箱',
        code: verificationCode, // 仅用于测试，生产环境应该移除
        emailId: data?.id,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Send verification code error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '服务器内部错误',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
