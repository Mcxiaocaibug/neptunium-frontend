// 应用配置文件
export const config = {
  // Supabase 配置
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // Upstash Redis 配置
  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  },

  // Cloudflare R2 配置
  r2: {
    accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID || '',
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
    bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'neptunium-files',
    publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL || '',
  },

  // Resend 配置
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@neptunium.com',
  },

  // NextAuth 配置
  auth: {
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    secret: process.env.NEXTAUTH_SECRET || '',
  },

  // 应用配置
  app: {
    url: process.env.APP_URL || 'http://localhost:3000',
    name: process.env.APP_NAME || 'Neptunium',
  },

  // 业务配置
  business: {
    // 投影ID长度
    projectionIdLength: 6,
    // 文件上传限制 (50MB)
    maxFileSize: 50 * 1024 * 1024,
    // 支持的文件类型
    allowedFileTypes: ['.litematic', '.schem', '.schematic', '.nbt'],
    // 验证码过期时间 (10分钟)
    verificationCodeExpiry: 10 * 60 * 1000,
    // API密钥长度
    apiKeyLength: 32,
  },
} as const;

// 验证必需的环境变量
export function validateConfig() {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'CLOUDFLARE_R2_ACCOUNT_ID',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_PUBLIC_URL',
    'RESEND_API_KEY',
    'NEXTAUTH_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
}
