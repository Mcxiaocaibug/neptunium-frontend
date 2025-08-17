import { Resend } from 'resend';
import { config } from './config';

// Resend 客户端实例
const resend = new Resend(config.resend.apiKey);

// 邮件模板
const emailTemplates = {
  // 验证码邮件模板
  verificationCode: (code: string, appName: string) => ({
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
  }),

  // 欢迎邮件模板
  welcome: (email: string, appName: string) => ({
    subject: `欢迎使用 ${appName}！`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #d4af37; margin: 0;">${appName}</h1>
          <p style="color: #666; margin: 5px 0;">Minecraft 投影系统</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 8px;">
          <h2 style="color: #333; margin-bottom: 20px;">欢迎加入 ${appName}！</h2>
          <p style="color: #666; line-height: 1.6;">
            您好！<br><br>
            感谢您注册 ${appName} 账户。现在您可以：
          </p>
          
          <ul style="color: #666; line-height: 1.8; margin: 20px 0;">
            <li>上传 Minecraft 投影文件</li>
            <li>生成投影ID供基岩版玩家使用</li>
            <li>管理您的投影文件历史</li>
            <li>获取API密钥进行插件集成</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${config.app.url}" style="background: #d4af37; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              开始使用
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            此邮件由 ${appName} 系统自动发送，请勿回复。
          </p>
        </div>
      </div>
    `,
    text: `欢迎使用 ${appName}！您现在可以上传投影文件、生成投影ID、管理文件历史和获取API密钥。访问 ${config.app.url} 开始使用。`,
  }),
};

// 邮件服务
export const emailService = {
  // 发送验证码邮件
  async sendVerificationCode(email: string, code: string): Promise<void> {
    const template = emailTemplates.verificationCode(code, config.app.name);
    
    const { error } = await resend.emails.send({
      from: config.resend.fromEmail,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      throw new Error('发送验证码邮件失败');
    }
  },

  // 发送欢迎邮件
  async sendWelcomeEmail(email: string): Promise<void> {
    const template = emailTemplates.welcome(email, config.app.name);
    
    const { error } = await resend.emails.send({
      from: config.resend.fromEmail,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      // 欢迎邮件发送失败不应该阻止注册流程
    }
  },
};

// 生成验证码
export function generateVerificationCode(): string {
  return Math.random().toString().slice(2, 8).padStart(6, '0');
}
