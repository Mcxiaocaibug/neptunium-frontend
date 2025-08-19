#!/usr/bin/env node

/**
 * Neptunium Web 基础功能测试脚本
 * 用于验证应用的基本功能是否正常工作
 */

const http = require('http');
const https = require('https');

// 测试配置
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP 请求工具
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, TEST_CONFIG.timeout);

    const req = client.request(url, {
      method: 'GET',
      timeout: TEST_CONFIG.timeout,
      ...options,
    }, (res) => {
      clearTimeout(timeout);
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// 测试用例
const tests = [
  {
    name: '首页加载测试',
    url: '/',
    expectedStatus: 200,
    expectedContent: ['Neptunium', 'Minecraft'],
  },
  {
    name: '静态资源测试',
    url: '/favicon.ico',
    expectedStatus: 200,
  },
  {
    name: 'API 路由测试 - 健康检查',
    url: '/.netlify/functions/health',
    expectedStatus: [200, 404], // 404 是正常的，因为我们还没有创建这个函数
  },
];

// 运行单个测试
async function runTest(test) {
  try {
    log('blue', `\n🧪 运行测试: ${test.name}`);
    
    const url = `${TEST_CONFIG.baseUrl}${test.url}`;
    log('cyan', `   请求: ${url}`);
    
    const response = await makeRequest(url);
    
    // 检查状态码
    const expectedStatuses = Array.isArray(test.expectedStatus) 
      ? test.expectedStatus 
      : [test.expectedStatus];
    
    if (!expectedStatuses.includes(response.statusCode)) {
      throw new Error(`状态码不匹配: 期望 ${expectedStatuses.join(' 或 ')}, 实际 ${response.statusCode}`);
    }
    
    // 检查内容
    if (test.expectedContent) {
      for (const content of test.expectedContent) {
        if (!response.body.includes(content)) {
          throw new Error(`响应内容不包含: ${content}`);
        }
      }
    }
    
    log('green', `   ✅ 测试通过 (状态码: ${response.statusCode})`);
    return { success: true, test: test.name };
    
  } catch (error) {
    log('red', `   ❌ 测试失败: ${error.message}`);
    return { success: false, test: test.name, error: error.message };
  }
}

// 运行所有测试
async function runAllTests() {
  log('magenta', '🚀 开始运行 Neptunium Web 基础功能测试\n');
  log('cyan', `测试目标: ${TEST_CONFIG.baseUrl}`);
  log('cyan', `超时时间: ${TEST_CONFIG.timeout}ms`);
  
  const results = [];
  
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
  }
  
  // 统计结果
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  log('blue', '\n📊 测试结果统计:');
  log('green', `   ✅ 通过: ${passed}`);
  log('red', `   ❌ 失败: ${failed}`);
  log('cyan', `   📝 总计: ${results.length}`);
  
  if (failed > 0) {
    log('red', '\n❌ 失败的测试:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        log('red', `   - ${r.test}: ${r.error}`);
      });
  }
  
  // 返回退出码
  const exitCode = failed > 0 ? 1 : 0;
  
  if (exitCode === 0) {
    log('green', '\n🎉 所有测试通过！');
  } else {
    log('red', '\n💥 部分测试失败，请检查上述错误信息');
  }
  
  return exitCode;
}

// 主函数
async function main() {
  try {
    const exitCode = await runAllTests();
    process.exit(exitCode);
  } catch (error) {
    log('red', `\n💥 测试运行出错: ${error.message}`);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  runAllTests,
  runTest,
  makeRequest,
};
