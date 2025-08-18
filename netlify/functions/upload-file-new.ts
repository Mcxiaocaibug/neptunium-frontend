/**
 * 文件上传 API
 * 支持投影文件上传到 Cloudflare R2，生成6位数ID
 */

import { Handler } from '@netlify/functions';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db } from '../../src/lib/database';
import { createApiResponse, createApiError, getClientIPFromEvent, verifyJWT } from '../../src/lib/utils';
import { logger } from '../../src/lib/logger';
import { 
  initRustCore, 
  prepareFileUpload,
  generateFileId,
  sanitizeFilename,
  validateFileType,
  validateFileSize,
  getMimeType,
  calculateFileChecksum,
  logInfo,
  logError 
} from '../../src/lib/rust-core';

interface UploadRequest {
  filename: string;
  fileSize: number;
  fileType?: string;
  checksum?: string;
}

// 配置 Cloudflare R2 客户端
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

export const handler: Handler = async (event, context) => {
  // 设置 CORS 头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // 处理 OPTIONS 请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return createApiError('Method not allowed', 405, headers);
  }

  const clientIP = getClientIPFromEvent(event);
  const requestId = context.awsRequestId || 'unknown';
  let userId: string | undefined;

  try {
    // 初始化 Rust 核心
    await initRustCore();
    logInfo('Processing file upload request');

    // 检查用户身份（可选，支持匿名上传）
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await verifyJWT(token);
      if (user) {
        userId = user.id;
        logInfo(`Authenticated upload request from user ${userId}`);
      }
    }

    // 解析请求体
    const body: UploadRequest = JSON.parse(event.body || '{}');
    const { filename, fileSize, fileType, checksum } = body;

    // 验证输入
    if (!filename || !fileSize) {
      return createApiError('文件名和文件大小不能为空', 400, headers);
    }

    // 清理文件名
    const sanitizedFilename = sanitizeFilename(filename);

    // 验证文件类型
    const typeValidation = validateFileType(sanitizedFilename);
    if (!typeValidation.is_valid) {
      return createApiError(typeValidation.message, 400, headers);
    }

    // 验证文件大小
    const sizeValidation = validateFileSize(fileSize);
    if (!sizeValidation.is_valid) {
      return createApiError(sizeValidation.message, 400, headers);
    }

    // 检查上传频率限制
    const rateLimitKey = `upload_rate:${clientIP}`;
    // 这里可以添加频率限制逻辑

    // 使用 Rust 准备文件上传
    const uploadResult = prepareFileUpload(
      sanitizedFilename,
      fileSize,
      fileType || getMimeType(sanitizedFilename),
      clientIP,
      userId
    );

    if (!uploadResult.success) {
      return createApiError(uploadResult.message, 400, headers);
    }

    const fileId = uploadResult.file_id!;
    const storagePath = uploadResult.storage_path!;

    // 生成 R2 上传 URL
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
    const putObjectCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: storagePath,
      ContentType: getMimeType(sanitizedFilename),
      ContentLength: fileSize,
      Metadata: {
        'original-filename': filename,
        'file-id': fileId,
        'upload-ip': clientIP,
        'user-id': userId || 'anonymous',
        'upload-timestamp': new Date().toISOString()
      }
    });

    // 生成预签名上传 URL（15分钟有效）
    const uploadUrl = await getSignedUrl(r2Client, putObjectCommand, { 
      expiresIn: 900 // 15分钟
    });

    // 创建文件记录
    const projectionFile = await db.projectionFiles.create({
      file_id: fileId,
      user_id: userId,
      filename: sanitizedFilename,
      original_filename: filename,
      file_size: fileSize,
      file_type: fileType || getMimeType(sanitizedFilename),
      mime_type: getMimeType(sanitizedFilename),
      storage_path: storagePath,
      storage_url: `https://${bucketName}.r2.cloudflarestorage.com/${storagePath}`,
      checksum: checksum,
      upload_ip: clientIP,
      download_count: 0,
      metadata: {
        userAgent: event.headers['user-agent'] || 'unknown',
        uploadMethod: 'web',
        requestId
      },
      is_public: true
    });

    // 记录文件访问日志
    await db.fileAccessLogs.create({
      file_id: fileId,
      projection_file_id: projectionFile.id,
      access_type: 'upload',
      user_id: userId,
      ip_address: clientIP,
      user_agent: event.headers['user-agent'],
      success: true
    });

    // 记录系统日志
    await db.systemLogs.create({
      level: 'info',
      message: 'File upload initiated',
      context: {
        fileId,
        filename: sanitizedFilename,
        fileSize,
        userId: userId || 'anonymous',
        ip: clientIP
      },
      user_id: userId,
      ip_address: clientIP,
      user_agent: event.headers['user-agent'],
      request_id: requestId
    });

    logger.info('File upload prepared', { 
      fileId, 
      filename: sanitizedFilename, 
      fileSize, 
      userId: userId || 'anonymous',
      requestId 
    });
    logInfo(`File upload prepared: ${fileId} - ${sanitizedFilename}`);

    return createApiResponse({
      message: '文件上传准备完成',
      fileId,
      uploadUrl,
      expiresIn: 900, // 15分钟
      file: {
        id: projectionFile.id,
        file_id: fileId,
        filename: sanitizedFilename,
        original_filename: filename,
        file_size: fileSize,
        file_type: projectionFile.file_type,
        storage_path: storagePath,
        created_at: projectionFile.created_at
      }
    }, 200, headers);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('File upload preparation failed', { error: errorMessage, requestId });
    logError(`File upload preparation failed: ${errorMessage}`);
    
    // 记录错误日志
    try {
      await db.systemLogs.create({
        level: 'error',
        message: 'File upload preparation failed',
        context: {
          error: errorMessage,
          ip: clientIP,
          userId: userId || 'anonymous'
        },
        user_id: userId,
        ip_address: clientIP,
        request_id: requestId
      });
    } catch (logError) {
      logger.error('Failed to log upload error', { error: logError });
    }
    
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return createApiError('上传过于频繁，请稍后重试', 429, headers);
      }
      if (error.message.includes('storage')) {
        return createApiError('存储服务暂时不可用，请稍后重试', 503, headers);
      }
    }
    
    return createApiError('文件上传准备失败，请稍后重试', 500, headers);
  }
};
