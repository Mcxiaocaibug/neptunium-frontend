/**
 * 文件历史查看 API
 * 支持查看用户上传的文件历史记录
 */

import { Handler } from '@netlify/functions';
import { db } from '../../src/lib/database';
import { createApiResponse, createApiError, getClientIPFromEvent, verifyJWT } from '../../src/lib/utils';
import { logger } from '../../src/lib/logger';
import { 
  initRustCore, 
  formatFileSize,
  logInfo,
  logError 
} from '../../src/lib/rust-core';

interface FileHistoryQuery {
  page?: number;
  limit?: number;
  fileType?: string;
  search?: string;
  sortBy?: 'created_at' | 'file_size' | 'download_count' | 'filename';
  sortOrder?: 'asc' | 'desc';
}

export const handler: Handler = async (event, context) => {
  // 设置 CORS 头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // 处理 OPTIONS 请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // 只允许GET请求
  if (event.httpMethod !== 'GET') {
    return createApiError('Method not allowed', 405, headers);
  }

  const clientIP = getClientIPFromEvent(event);
  const requestId = context.awsRequestId || 'unknown';

  try {
    // 初始化 Rust 核心
    await initRustCore();
    logInfo('Processing file history request');

    // 验证用户身份
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createApiError('未提供有效的认证令牌', 401, headers);
    }

    const token = authHeader.substring(7);
    const user = await verifyJWT(token);
    if (!user) {
      return createApiError('认证令牌无效', 401, headers);
    }

    // 解析查询参数
    const query: FileHistoryQuery = {
      page: parseInt(event.queryStringParameters?.page || '1'),
      limit: Math.min(parseInt(event.queryStringParameters?.limit || '20'), 100), // 最大100条
      fileType: event.queryStringParameters?.fileType,
      search: event.queryStringParameters?.search,
      sortBy: (event.queryStringParameters?.sortBy as any) || 'created_at',
      sortOrder: (event.queryStringParameters?.sortOrder as any) || 'desc'
    };

    const offset = (query.page! - 1) * query.limit!;

    logger.info('Getting file history', { 
      userId: user.id, 
      query, 
      requestId 
    });

    // 获取用户的文件列表
    let userFiles = await db.projectionFiles.findByUserId(user.id, query.limit! + 100, 0);

    // 应用过滤器
    if (query.fileType) {
      userFiles = userFiles.filter(file => 
        file.file_type.toLowerCase().includes(query.fileType!.toLowerCase())
      );
    }

    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      userFiles = userFiles.filter(file => 
        file.filename.toLowerCase().includes(searchTerm) ||
        file.original_filename.toLowerCase().includes(searchTerm) ||
        file.file_id.includes(searchTerm)
      );
    }

    // 排序
    userFiles.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (query.sortBy) {
        case 'file_size':
          aValue = a.file_size;
          bValue = b.file_size;
          break;
        case 'download_count':
          aValue = a.download_count;
          bValue = b.download_count;
          break;
        case 'filename':
          aValue = a.filename.toLowerCase();
          bValue = b.filename.toLowerCase();
          break;
        default: // created_at
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }

      if (query.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // 分页
    const totalFiles = userFiles.length;
    const paginatedFiles = userFiles.slice(offset, offset + query.limit!);

    // 格式化文件信息
    const formattedFiles = paginatedFiles.map(file => ({
      id: file.id,
      file_id: file.file_id,
      filename: file.filename,
      original_filename: file.original_filename,
      file_size: file.file_size,
      file_size_formatted: formatFileSize(file.file_size),
      file_type: file.file_type,
      mime_type: file.mime_type,
      download_count: file.download_count,
      is_public: file.is_public,
      expires_at: file.expires_at,
      created_at: file.created_at,
      updated_at: file.updated_at,
      metadata: {
        uploadMethod: file.metadata?.uploadMethod || 'unknown',
        userAgent: file.metadata?.userAgent || 'unknown'
      }
    }));

    // 计算统计信息
    const stats = {
      totalFiles,
      totalSize: userFiles.reduce((sum, file) => sum + file.file_size, 0),
      totalDownloads: userFiles.reduce((sum, file) => sum + file.download_count, 0),
      fileTypes: userFiles.reduce((acc: Record<string, number>, file) => {
        acc[file.file_type] = (acc[file.file_type] || 0) + 1;
        return acc;
      }, {}),
      averageFileSize: totalFiles > 0 ? Math.round(userFiles.reduce((sum, file) => sum + file.file_size, 0) / totalFiles) : 0
    };

    // 记录系统日志
    await db.systemLogs.create({
      level: 'info',
      message: 'File history accessed',
      context: {
        userId: user.id,
        totalFiles,
        query
      },
      user_id: user.id,
      ip_address: clientIP,
      request_id: requestId
    });

    logger.info('File history retrieved', { 
      userId: user.id, 
      totalFiles, 
      returnedFiles: formattedFiles.length,
      requestId 
    });
    logInfo(`File history retrieved for user ${user.id}: ${totalFiles} files`);

    return createApiResponse({
      message: '文件历史获取成功',
      files: formattedFiles,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: totalFiles,
        totalPages: Math.ceil(totalFiles / query.limit!),
        hasNext: offset + query.limit! < totalFiles,
        hasPrev: query.page! > 1
      },
      stats,
      filters: {
        fileType: query.fileType,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder
      }
    }, 200, headers);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('File history request failed', { error: errorMessage, requestId });
    logError(`File history request failed: ${errorMessage}`);
    
    return createApiError('获取文件历史失败，请稍后重试', 500, headers);
  }
};
