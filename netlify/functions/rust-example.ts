/**
 * 示例 Netlify Function - 展示如何使用 Rust WASM 核心
 */

import { Handler } from '@netlify/functions';
import { 
  initRustCore, 
  validateEmail,
  validatePassword,
  hashPassword,
  generateFileId,
  generateApiKey,
  prepareFileUpload,
  logInfo,
  logError,
  RustCoreError
} from '../../src/lib/rust-core';

interface ExampleRequest {
  action: 'validate_email' | 'validate_password' | 'hash_password' | 'generate_file_id' | 'generate_api_key' | 'prepare_upload';
  data: any;
}

export const handler: Handler = async (event, context) => {
  // 设置 CORS 头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // 处理 OPTIONS 请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // 只允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // 初始化 Rust WASM 模块
    await initRustCore();
    logInfo('Rust WASM module initialized for request');

    // 解析请求体
    const body: ExampleRequest = JSON.parse(event.body || '{}');
    const { action, data } = body;

    let result: any;

    switch (action) {
      case 'validate_email':
        if (!data.email) {
          throw new RustCoreError('Email is required', 'MISSING_EMAIL');
        }
        result = validateEmail(data.email);
        logInfo(`Email validation result: ${result.is_valid}`);
        break;

      case 'validate_password':
        if (!data.password) {
          throw new RustCoreError('Password is required', 'MISSING_PASSWORD');
        }
        result = validatePassword(data.password);
        logInfo(`Password validation result: ${result.is_valid}`);
        break;

      case 'hash_password':
        if (!data.password) {
          throw new RustCoreError('Password is required', 'MISSING_PASSWORD');
        }
        result = {
          hash: hashPassword(data.password),
          message: 'Password hashed successfully'
        };
        logInfo('Password hashed successfully');
        break;

      case 'generate_file_id':
        result = {
          file_id: generateFileId(),
          message: 'File ID generated successfully'
        };
        logInfo(`Generated file ID: ${result.file_id}`);
        break;

      case 'generate_api_key':
        result = {
          api_key: generateApiKey(),
          message: 'API key generated successfully'
        };
        logInfo('API key generated successfully');
        break;

      case 'prepare_upload':
        const { filename, fileSize, fileType, uploadIp, userId } = data;
        if (!filename || !fileSize || !fileType || !uploadIp) {
          throw new RustCoreError('Missing required upload parameters', 'MISSING_UPLOAD_PARAMS');
        }
        
        result = prepareFileUpload(filename, fileSize, fileType, uploadIp, userId);
        logInfo(`File upload prepared: ${result.success ? 'success' : 'failed'}`);
        break;

      default:
        throw new RustCoreError(`Unknown action: ${action}`, 'UNKNOWN_ACTION');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        action,
        result,
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error) {
    logError(`Error in rust-example function: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'Internal server error';

    if (error instanceof RustCoreError) {
      statusCode = 400;
      errorCode = error.code;
      message = error.message;
    } else if (error instanceof SyntaxError) {
      statusCode = 400;
      errorCode = 'INVALID_JSON';
      message = 'Invalid JSON in request body';
    }

    return {
      statusCode,
      headers,
      body: JSON.stringify({
        success: false,
        error: {
          code: errorCode,
          message,
        },
        timestamp: new Date().toISOString(),
      }),
    };
  }
};

// 导出处理器
export { handler as default };
