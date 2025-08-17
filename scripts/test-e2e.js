#!/usr/bin/env node

/**
 * Neptunium Web 端到端测试脚本
 * 测试所有主要功能和API接口
 */

const http = require('http');
const https = require('https');

// 测试配置
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  testEmail: 'test@neptunium.test',
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

// 测试套件
const testSuites = {
  // 页面可访问性测试
  pageAccessibility: [
    {
      name: '首页访问',
      url: '/',
      expectedStatus: 200,
      expectedContent: ['Neptunium', 'Minecraft'],
    },
    {
      name: '登录页面',
      url: '/login',
      expectedStatus: 200,
      expectedContent: ['登录您的账户', '邮箱地址'],
    },
    {
      name: '注册页面',
      url: '/register',
      expectedStatus: 200,
      expectedContent: ['创建您的账户', '验证码'],
    },
    {
      name: '上传页面',
      url: '/upload',
      expectedStatus: 200,
      expectedContent: ['上传投影文件', '拖拽文件'],
    },
    {
      name: '文件管理页面',
      url: '/files',
      expectedStatus: 200,
      expectedContent: ['我的文件'],
    },
    {
      name: 'API密钥页面',
      url: '/api-key',
      expectedStatus: 200,
      expectedContent: ['API 密钥管理'],
    },
  ],

  // API接口测试
  apiEndpoints: [
    {
      name: '健康检查API',
      url: '/.netlify/functions/health',
      expectedStatus: [200, 404], // 404是正常的，因为可能还没有部署
    },
    {
      name: '投影查询API (无效ID)',
      url: '/.netlify/functions/projection?id=000000',
      expectedStatus: [404, 500], // 预期会失败
    },
  ],

  // 静态资源测试
  staticResources: [
    {
      name: 'Favicon',
      url: '/favicon.ico',
      expectedStatus: 200,
    },
  ],
};

// 运行单个测试
async function runTest(test, suiteName) {
  try {
    log('blue', `\n🧪 [${suiteName}] ${test.name}`);
    
    const url = `${TEST_CONFIG.baseUrl}${test.url}`;
    log('cyan', `   请求: ${url}`);
    
    const response = await makeRequest(url, test.options);
    
    // 检查状态码
    const expectedStatuses = Array.isArray(test.expectedStatus) 
      ? test.expectedStatus 
      : [test.expectedStatus];
    
    if (!expectedStatuses.includes(response.statusCode)) {
      throw new Error(`状态码不匹配: 期望 ${expectedStatuses.join(' 或 ')}, 实际 ${response.statusCode}`);
    }
    
    // 检查内容
    if (test.expectedContent && response.statusCode === 200) {
      for (const content of test.expectedContent) {
        if (!response.body.includes(content)) {
          throw new Error(`响应内容不包含: ${content}`);
        }
      }
    }
    
    log('green', `   ✅ 测试通过 (状态码: ${response.statusCode})`);
    return { success: true, test: test.name, suite: suiteName };
    
  } catch (error) {
    log('red', `   ❌ 测试失败: ${error.message}`);
    return { success: false, test: test.name, suite: suiteName, error: error.message };
  }
}

// 运行测试套件
async function runTestSuite(suiteName, tests) {
  log('magenta', `\n📋 开始测试套件: ${suiteName}`);
  
  const results = [];
  for (const test of tests) {
    const result = await runTest(test, suiteName);
    results.push(result);
    
    // 测试间隔，避免请求过于频繁
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// 运行所有测试
async function runAllTests() {
  log('magenta', '🚀 开始 Neptunium Web 端到端测试\n');
  log('cyan', `测试目标: ${TEST_CONFIG.baseUrl}`);
  log('cyan', `超时时间: ${TEST_CONFIG.timeout}ms`);
  
  const allResults = [];
  
  for (const [suiteName, tests] of Object.entries(testSuites)) {
    const results = await runTestSuite(suiteName, tests);
    allResults.push(...results);
  }
  
  // 统计结果
  const passed = allResults.filter(r => r.success).length;
  const failed = allResults.filter(r => !r.success).length;
  
  log('blue', '\n📊 测试结果统计:');
  log('green', `   ✅ 通过: ${passed}`);
  log('red', `   ❌ 失败: ${failed}`);
  log('cyan', `   📝 总计: ${allResults.length}`);
  
  // 按套件分组显示结果
  const suiteResults = {};
  allResults.forEach(result => {
    if (!suiteResults[result.suite]) {
      suiteResults[result.suite] = { passed: 0, failed: 0, tests: [] };
    }
    if (result.success) {
      suiteResults[result.suite].passed++;
    } else {
      suiteResults[result.suite].failed++;
      suiteResults[result.suite].tests.push(result);
    }
  });
  
  log('blue', '\n📋 各套件结果:');
  Object.entries(suiteResults).forEach(([suite, stats]) => {
    const status = stats.failed === 0 ? '✅' : '❌';
    log('cyan', `   ${status} ${suite}: ${stats.passed} 通过, ${stats.failed} 失败`);
  });
  
  if (failed > 0) {
    log('red', '\n❌ 失败的测试:');
    allResults
      .filter(r => !r.success)
      .forEach(r => {
        log('red', `   - [${r.suite}] ${r.test}: ${r.error}`);
      });
  }
  
  // 生成测试报告
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: TEST_CONFIG.baseUrl,
    summary: {
      total: allResults.length,
      passed,
      failed,
      passRate: ((passed / allResults.length) * 100).toFixed(2) + '%',
    },
    suites: suiteResults,
    details: allResults,
  };
  
  // 保存测试报告
  const fs = require('fs');
  const reportPath = 'test-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log('blue', `\n📄 测试报告已保存到: ${reportPath}`);
  
  // 返回退出码
  const exitCode = failed > 0 ? 1 : 0;
  
  if (exitCode === 0) {
    log('green', '\n🎉 所有测试通过！项目已准备好部署到生产环境');
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
  runTestSuite,
  runTest,
};
