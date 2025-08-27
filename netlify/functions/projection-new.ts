/**
 * 投影文件查看和下载 API
 * 支持通过6位数ID获取文件信息和下载链接
 */

import { Handler } from '@netlify/functions';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db } from '../../src/lib/database';
import { createApiResponse, createApiError, getClientIPFromEvent } from '../../src/lib/utils';
import { ApiKeyService } from '../../src/lib/auth';
import { logger } from '../../src/lib/logger';
import {
  initRustCore,
  logInfo,
  logError,
  hashString
} from '../../src/lib/rust-core';

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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // 处理 OPTIONS 请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // 只允许GET请求
  if (event.httpMethod !== 'GET') {
    return createApiError('Method not allowed', 405, undefined, headers);
  }

  const clientIP = getClientIPFromEvent(event);
  const requestId = context.awsRequestId || 'unknown';
  let userId: string | undefined;
  let apiKeyId: string | undefined;

  try {
    // 初始化 Rust 核心
    await initRustCore();
    logInfo('Processing projection file request');

    // 获取文件ID
    const fileId = event.queryStringParameters?.id; // Netlify HandlerEvent 无 pathParameters
    if (!fileId) {
      return createApiError('缺少文件ID参数', 400, undefined, headers);
    }

    // 验证文件ID格式
    if (!/^\d{6}$/.test(fileId)) {
      return createApiError('文件ID格式错误', 400, undefined, headers);
    }

    // 检查API密钥或用户认证
    const apiKey = event.headers['x-api-key'] || event.headers['X-API-Key'];
    if (apiKey) {
      // 查找API密钥记录（需要先计算哈希）
      const keyHash = hashString(apiKey);
      const apiKeyRecord = await db.apiKeys.findByHash(keyHash);
      const apiKeyData = apiKeyRecord && apiKeyRecord.is_active ? apiKeyRecord : null;
      if (apiKeyData) {
        userId = apiKeyData.user_id;
        apiKeyId = apiKeyData.id;

        // 更新API密钥使用统计（确保 apiKeyId 存在）
        if (apiKeyId) {
          await db.apiKeys.updateUsage(apiKeyId);
          logInfo(`API key access: ${apiKeyId} for file ${fileId}`);
        }
      }
    }

    // 查找文件
    const projectionFile = await db.projectionFiles.findByFileId(fileId);
    if (!projectionFile) {
      logger.warn('File not found', { fileId, ip: clientIP, requestId });
      return createApiError('文件不存在', 404, undefined, headers);
    }

    // 检查文件是否过期
    if (projectionFile.expires_at && new Date(projectionFile.expires_at) < new Date()) {
      logger.warn('File expired', { fileId, expiresAt: projectionFile.expires_at, requestId });
      return createApiError('文件已过期', 410, undefined, headers);
    }

    // 检查文件访问权限
    if (!projectionFile.is_public && projectionFile.user_id !== userId) {
      logger.warn('Unauthorized file access', { fileId, userId, requestId });
      return createApiError('无权访问此文件', 403, undefined, headers);
    }

    // 获取操作类型
    const action = event.queryStringParameters?.action || 'info';

    if (action === 'download') {
      return await handleFileDownload(projectionFile, userId, apiKeyId, clientIP, headers, requestId);
    } else {
      return await handleFileInfo(projectionFile, userId, apiKeyId, clientIP, headers, requestId);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Projection file request failed', { error: errorMessage, requestId });
    logError(`Projection file request failed: ${errorMessage}`);

    return createApiError('请求失败，请稍后重试', 500, undefined, headers);
  }
};

// 处理文件信息查看
async function handleFileInfo(
  projectionFile: any,
  userId: string | undefined,
  apiKeyId: string | undefined,
  clientIP: string,
  headers: any,
  requestId: string
) {
  try {
    // 记录文件访问日志
    await db.fileAccessLogs.create({
      file_id: projectionFile.file_id,
      projection_file_id: projectionFile.id,
      access_type: 'view',
      user_id: userId,
      api_key_id: apiKeyId,
      ip_address: clientIP,
      success: true
    });

    logger.info('File info accessed', {
      fileId: projectionFile.file_id,
      userId: userId || 'anonymous',
      requestId
    });

    // 返回文件信息（隐藏敏感信息）
    const fileInfo = {
      file_id: projectionFile.file_id,
      filename: projectionFile.filename,
      original_filename: projectionFile.original_filename,
      file_size: projectionFile.file_size,
      file_type: projectionFile.file_type,
      mime_type: projectionFile.mime_type,
      download_count: projectionFile.download_count,
      is_public: projectionFile.is_public,
      expires_at: projectionFile.expires_at,
      created_at: projectionFile.created_at,
      metadata: {
        uploadMethod: projectionFile.metadata?.uploadMethod || 'unknown'
      }
    };

    // 如果是文件所有者，显示更多信息
    if (projectionFile.user_id === userId) {
      fileInfo.metadata = {
        ...fileInfo.metadata,
        ...projectionFile.metadata,
        storage_path: projectionFile.storage_path,
        checksum: projectionFile.checksum
      };
    }

    return createApiResponse({
      message: '文件信息获取成功',
      file: fileInfo
    }, 200, headers);

  } catch (error) {
    logger.error('Failed to get file info', { fileId: projectionFile.file_id, error, requestId });
    throw error;
  }
}

// 处理文件下载
async function handleFileDownload(
  projectionFile: any,
  userId: string | undefined,
  apiKeyId: string | undefined,
  clientIP: string,
  headers: any,
  requestId: string
) {
  try {
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME!;

    // 生成下载链接
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: projectionFile.storage_path,
      ResponseContentDisposition: `attachment; filename="${encodeURIComponent(projectionFile.original_filename)}"`,
      ResponseContentType: projectionFile.mime_type
    });

    // 生成预签名下载 URL（1小时有效）
    const downloadUrl = await getSignedUrl(r2Client, getObjectCommand, {
      expiresIn: 3600 // 1小时
    });

    // 增加下载计数
    await db.projectionFiles.incrementDownloadCount(projectionFile.file_id);

    // 记录文件访问日志
    await db.fileAccessLogs.create({
      file_id: projectionFile.file_id,
      projection_file_id: projectionFile.id,
      access_type: 'download',
      user_id: userId,
      api_key_id: apiKeyId,
      ip_address: clientIP,
      success: true
    });

    logger.info('File download initiated', {
      fileId: projectionFile.file_id,
      filename: projectionFile.filename,
      userId: userId || 'anonymous',
      requestId
    });
    logInfo(`File download: ${projectionFile.file_id} - ${projectionFile.filename}`);

    return createApiResponse({
      message: '下载链接生成成功',
      downloadUrl,
      expiresIn: 3600, // 1小时
      file: {
        file_id: projectionFile.file_id,
        filename: projectionFile.filename,
        original_filename: projectionFile.original_filename,
        file_size: projectionFile.file_size,
        file_type: projectionFile.file_type
      }
    }, 200, headers);

  } catch (error) {
    // 记录失败的下载尝试
    await db.fileAccessLogs.create({
      file_id: projectionFile.file_id,
      projection_file_id: projectionFile.id,
      access_type: 'download',
      user_id: userId,
      api_key_id: apiKeyId,
      ip_address: clientIP,
      success: false,
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });

    logger.error('Failed to generate download link', {
      fileId: projectionFile.file_id,
      error,
      requestId
    });
    throw error;
  }
}
