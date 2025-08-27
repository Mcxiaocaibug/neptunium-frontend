import { Handler } from '@netlify/functions';
import { validateConfig } from '../../src/lib/config';
import { db } from '../../src/lib/supabase';
import { cache } from '../../src/lib/redis';
import { storage } from '../../src/lib/storage';
import { createApiResponse, createApiError, isValidProjectionId } from '../../src/lib/utils';

// 验证环境配置
try {
  validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error);
}

export const handler: Handler = async (event, context) => {
  // 只允许GET请求
  if (event.httpMethod !== 'GET') {
    return createApiError('Method not allowed', 405);
  }

  try {
    // 获取投影ID
    const projectionId = event.queryStringParameters?.id;

    if (!projectionId) {
      return createApiError('请提供投影ID', 400);
    }

    // 验证投影ID格式
    if (!isValidProjectionId(projectionId)) {
      return createApiError('投影ID格式错误，应为6位数字', 400);
    }

    // 先从缓存获取
    let fileInfo = await cache.projection.getFileInfo(projectionId);

    if (!fileInfo) {
      // 缓存未命中，从数据库查询
      const projectionFile = await db.projectionFiles.findByFileId(projectionId);

      if (!projectionFile) {
        return createApiError('投影文件不存在', 404);
      }

      fileInfo = {
        id: projectionFile.id,
        filename: projectionFile.filename,
        original_filename: projectionFile.original_filename,
        file_size: projectionFile.file_size,
        file_type: projectionFile.file_type,
        storage_url: projectionFile.storage_url,
        storage_path: projectionFile.storage_path,
        checksum: projectionFile.checksum,
        created_at: projectionFile.created_at,
        metadata: projectionFile.metadata,
      };

      // 更新缓存
      await cache.projection.setFileInfo(projectionId, fileInfo);
    }

    // 检查是否需要返回文件内容
    const includeContent = event.queryStringParameters?.include_content === 'true';

    let responseData: any = {
      projection_id: projectionId,
      filename: fileInfo.filename,
      file_size: fileInfo.file_size,
      file_type: fileInfo.file_type,
      created_at: fileInfo.created_at,
      download_url: fileInfo.file_url,
    };

    if (includeContent) {
      // 从R2获取文件内容
      // 从URL中提取存储路径
      const urlParts = fileInfo.file_url.split('/');
      const storageKey = urlParts.slice(-2).join('/'); // 获取 projections/id/filename 格式
      const fileBuffer = await storage.getFile(storageKey);

      if (fileBuffer) {
        responseData.content = fileBuffer.toString('base64');
        responseData.content_encoding = 'base64';
      }
    } else {
      // 生成临时下载链接
      const urlParts = fileInfo.file_url.split('/');
      const storageKey = urlParts.slice(-2).join('/');
      const downloadUrl = await storage.getDownloadUrl(storageKey, 3600);
      responseData.download_url = downloadUrl;
    }

    return createApiResponse(
      responseData,
      '获取投影文件成功',
      200
    );

  } catch (error) {
    console.error('Get projection error:', error);
    return createApiError('服务器内部错误', 500);
  }
};
