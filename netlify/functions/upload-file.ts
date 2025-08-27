import { Handler } from '@netlify/functions';
import { validateConfig } from '../../src/lib/config';
import { db } from '../../src/lib/supabase';
import { cache } from '../../src/lib/redis';
import { storage } from '../../src/lib/storage';
import {
  createApiResponse,
  createApiError,
  generateProjectionId,
  getClientIPFromEvent,
  formatFileSize
} from '../../src/lib/utils';

// 验证环境配置
try {
  validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error);
}

export const handler: Handler = async (event, context) => {
  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return createApiError('Method not allowed', 405);
  }

  let filename = '';
  let fileData = '';
  let userId = '';

  try {
    // 解析请求体 (支持JSON格式的base64文件数据)
    const body = JSON.parse(event.body || '{}');
    filename = body.filename;
    fileData = body.fileData;
    userId = body.userId; // fileData 应该是base64编码的文件内容

    // 验证文件名
    if (!filename) {
      return createApiError('请提供文件名', 400);
    }

    // 验证文件类型
    if (!storage.isValidFileType(filename)) {
      return createApiError('不支持的文件类型，仅支持 .litematic, .schem, .schematic, .nbt 文件', 400);
    }

    // 解码文件数据
    if (!fileData) {
      return createApiError('请提供文件数据', 400);
    }

    let fileBuffer: Buffer;
    try {
      fileBuffer = Buffer.from(fileData, 'base64');
    } catch (error) {
      return createApiError('文件数据格式错误', 400);
    }

    // 验证文件大小
    if (!storage.isValidFileSize(fileBuffer.length)) {
      return createApiError(`文件大小超过限制 (最大 ${formatFileSize(50 * 1024 * 1024)})`, 400);
    }

    // 生成唯一的投影ID
    let projectionId: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      projectionId = generateProjectionId();
      const existing = await db.projectionFiles.findByFileId(projectionId);
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return createApiError('生成投影ID失败，请重试', 500);
    }

    // 生成存储路径
    const storageKey = storage.generateFilePath(projectionId, filename);

    // 上传文件到R2
    const fileUrl = await storage.uploadFile(
      storageKey,
      fileBuffer,
      'application/octet-stream',
      {
        'original-filename': filename,
        'projection-id': projectionId,
        'upload-timestamp': Date.now().toString(),
      }
    );

    // 获取客户端IP
    const clientIP = getClientIPFromEvent(event as any);

    // 计算文件校验和
    const checksum = require('crypto').createHash('md5').update(fileBuffer).digest('hex');

    // 保存文件信息到数据库
    const projectionFile = await db.projectionFiles.create({
      file_id: projectionId,
      user_id: userId || undefined,
      filename,
      original_filename: filename,
      file_size: fileBuffer.length,
      file_type: filename.split('.').pop()?.toLowerCase() || 'unknown',
      mime_type: 'application/octet-stream',
      storage_path: storageKey,
      storage_url: fileUrl,
      checksum,
      upload_ip: clientIP,
      download_count: 0,
      is_public: true,
      metadata: {
        upload_timestamp: Date.now(),
        user_agent: event.headers['user-agent'] || 'unknown',
      },
    });

    // 缓存投影文件信息
    await cache.projection.setFileInfo(projectionId, {
      id: projectionFile.id,
      filename: projectionFile.filename,
      file_size: projectionFile.file_size,
      file_type: projectionFile.file_type,
      file_url: projectionFile.file_url,
      created_at: projectionFile.created_at,
    });

    return createApiResponse(
      {
        file_id: projectionId,
        filename: projectionFile.filename,
        original_filename: projectionFile.original_filename,
        file_size: projectionFile.file_size,
        file_type: projectionFile.file_type,
        checksum: projectionFile.checksum,
        created_at: projectionFile.created_at,
      },
      '文件上传成功',
      201
    );

  } catch (error) {
    console.error('File upload error:', error);
    return createApiError('文件上传失败', 500);
  }
};
