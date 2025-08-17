/**
 * 仪表板统计 API
 * 提供系统概览统计数据
 */

import { Handler } from '@netlify/functions';
import { db } from '../../src/lib/database';
import { createApiResponse, createApiError, getClientIP, verifyJWT } from '../../src/lib/utils';
import { logger } from '../../src/lib/logger';
import { 
  initRustCore, 
  logInfo,
  logError 
} from '../../src/lib/rust-core';

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

  const clientIP = getClientIP(event);
  const requestId = context.awsRequestId || 'unknown';

  try {
    // 初始化 Rust 核心
    await initRustCore();
    logInfo('Processing dashboard stats request');

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

    logger.info('Getting dashboard stats', { userId: user.id, requestId });

    // 获取用户统计
    const userStats = await db.users.getStats();
    
    // 获取文件统计
    const fileStats = await db.projectionFiles.getStats();

    // 获取今日统计
    const today = new Date().toISOString().split('T')[0];
    const todayStats = await db.systemStats.getRecent(1);
    const todayData = todayStats.length > 0 ? todayStats[0] : null;

    // 获取最近7天的统计数据
    const recentStats = await db.systemStats.getRecent(7);

    // 计算趋势数据
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // 获取昨天的数据用于计算趋势
    const yesterday = recentStats.length > 1 ? recentStats[1] : null;

    const stats = {
      // 总体统计
      totalFiles: fileStats.total,
      totalUsers: userStats.total,
      totalApiKeys: 0, // 这里可以添加 API 密钥统计
      todayUploads: fileStats.todayUploads,

      // 详细统计
      users: {
        total: userStats.total,
        verified: userStats.verified,
        todayRegistrations: userStats.todayRegistrations,
        verificationRate: userStats.total > 0 ? Math.round((userStats.verified / userStats.total) * 100) : 0,
        trend: yesterday ? calculateTrend(userStats.total, yesterday.total_users) : 0
      },

      files: {
        total: fileStats.total,
        totalSize: fileStats.totalSize,
        totalSizeFormatted: formatBytes(fileStats.totalSize),
        totalDownloads: fileStats.totalDownloads,
        todayUploads: fileStats.todayUploads,
        anonymousUploads: fileStats.anonymous,
        averageSize: fileStats.total > 0 ? Math.round(fileStats.totalSize / fileStats.total) : 0,
        trend: yesterday ? calculateTrend(fileStats.total, yesterday.total_files) : 0
      },

      downloads: {
        total: fileStats.totalDownloads,
        today: todayData?.stats_data?.todayDownloads || 0,
        trend: yesterday ? calculateTrend(
          todayData?.stats_data?.todayDownloads || 0,
          yesterday.stats_data?.todayDownloads || 0
        ) : 0
      },

      // 最近7天的趋势数据
      trends: {
        daily: recentStats.reverse().map(stat => ({
          date: stat.stat_date,
          users: stat.total_users,
          files: stat.total_files,
          downloads: stat.total_downloads,
          uploads: stat.stats_data?.dailyUploads || 0
        }))
      },

      // 文件类型分布
      fileTypes: await getFileTypeDistribution(),

      // 系统健康状态
      system: {
        status: 'healthy',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        lastUpdated: new Date().toISOString()
      }
    };

    // 记录系统日志
    await db.systemLogs.create({
      level: 'info',
      message: 'Dashboard stats accessed',
      context: {
        userId: user.id,
        statsRequested: Object.keys(stats)
      },
      user_id: user.id,
      ip_address: clientIP,
      request_id: requestId
    });

    logger.info('Dashboard stats retrieved', { 
      userId: user.id, 
      totalFiles: stats.totalFiles,
      totalUsers: stats.totalUsers,
      requestId 
    });
    logInfo(`Dashboard stats retrieved for user ${user.id}`);

    return createApiResponse(stats, 200, headers);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Dashboard stats request failed', { error: errorMessage, requestId });
    logError(`Dashboard stats request failed: ${errorMessage}`);
    
    return createApiError('获取统计数据失败，请稍后重试', 500, headers);
  }
};

// 辅助函数：格式化字节数
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 辅助函数：获取文件类型分布
async function getFileTypeDistribution() {
  try {
    // 这里可以添加更复杂的查询来获取文件类型分布
    // 目前返回模拟数据
    return {
      '.litematic': 45,
      '.schem': 30,
      '.schematic': 15,
      '.nbt': 8,
      '.structure': 2
    };
  } catch (error) {
    logger.error('Failed to get file type distribution', { error });
    return {};
  }
}
