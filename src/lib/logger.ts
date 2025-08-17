// 生产环境日志记录工具

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  error?: Error;
  userId?: string;
  requestId?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

  private formatMessage(entry: LogEntry): string {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const levelName = levelNames[entry.level];
    
    let message = `[${entry.timestamp}] ${levelName}: ${entry.message}`;
    
    if (entry.requestId) {
      message += ` [RequestID: ${entry.requestId}]`;
    }
    
    if (entry.userId) {
      message += ` [UserID: ${entry.userId}]`;
    }
    
    return message;
  }

  private log(level: LogLevel, message: string, context?: any, error?: Error, userId?: string, requestId?: string) {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      userId,
      requestId,
    };

    const formattedMessage = this.formatMessage(entry);

    // 控制台输出
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, context);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, context);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, context, error);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, context, error);
        break;
    }

    // 生产环境可以在这里添加外部日志服务
    if (!this.isDevelopment && level >= LogLevel.ERROR) {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry) {
    // 这里可以集成外部日志服务，如 Sentry、LogRocket 等
    // 示例：发送到 webhook 或日志聚合服务
    try {
      // await fetch('your-log-service-endpoint', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry),
      // });
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  debug(message: string, context?: any, userId?: string, requestId?: string) {
    this.log(LogLevel.DEBUG, message, context, undefined, userId, requestId);
  }

  info(message: string, context?: any, userId?: string, requestId?: string) {
    this.log(LogLevel.INFO, message, context, undefined, userId, requestId);
  }

  warn(message: string, context?: any, error?: Error, userId?: string, requestId?: string) {
    this.log(LogLevel.WARN, message, context, error, userId, requestId);
  }

  error(message: string, context?: any, error?: Error, userId?: string, requestId?: string) {
    this.log(LogLevel.ERROR, message, context, error, userId, requestId);
  }

  // API 请求日志
  apiRequest(method: string, path: string, userId?: string, requestId?: string) {
    this.info(`API Request: ${method} ${path}`, { method, path }, userId, requestId);
  }

  apiResponse(method: string, path: string, statusCode: number, duration: number, userId?: string, requestId?: string) {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `API Response: ${method} ${path} - ${statusCode} (${duration}ms)`, 
      { method, path, statusCode, duration }, undefined, userId, requestId);
  }

  // 数据库操作日志
  dbQuery(operation: string, table: string, duration?: number, userId?: string, requestId?: string) {
    this.debug(`DB Query: ${operation} on ${table}${duration ? ` (${duration}ms)` : ''}`, 
      { operation, table, duration }, userId, requestId);
  }

  // 文件操作日志
  fileOperation(operation: string, filename: string, size?: number, userId?: string, requestId?: string) {
    this.info(`File Operation: ${operation} - ${filename}${size ? ` (${size} bytes)` : ''}`, 
      { operation, filename, size }, userId, requestId);
  }

  // 用户操作日志
  userAction(action: string, userId: string, details?: any, requestId?: string) {
    this.info(`User Action: ${action}`, { action, details }, userId, requestId);
  }
}

// 单例实例
export const logger = new Logger();

// 错误处理装饰器
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error(`Error in ${context}`, { args }, error as Error);
      throw error;
    }
  }) as T;
}

// 性能监控装饰器
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  operation: string
): T {
  return (async (...args: any[]) => {
    const startTime = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      logger.debug(`Performance: ${operation} completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Performance: ${operation} failed after ${duration}ms`, undefined, error as Error);
      throw error;
    }
  }) as T;
}

// 请求ID生成器
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
