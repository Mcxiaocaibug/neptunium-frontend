'use client';

import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { 
  DocumentTextIcon, 
  CodeBracketIcon,
  KeyIcon,
  ClipboardIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

export default function ApiDocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const apiEndpoints = [
    {
      method: 'GET',
      path: '/api/projection/{fileId}',
      description: '获取投影文件信息',
      params: [
        { name: 'fileId', type: 'string', description: '6位数文件ID' },
        { name: 'action', type: 'string', description: '操作类型：info（默认）或 download' }
      ],
      headers: [
        { name: 'X-API-Key', type: 'string', description: 'API 密钥（可选）' }
      ],
      example: `curl -X GET "https://your-domain.com/api/projection/123456?action=info" \\
  -H "X-API-Key: npt_your_api_key_here"`
    },
    {
      method: 'GET',
      path: '/api/projection/{fileId}?action=download',
      description: '获取投影文件下载链接',
      params: [
        { name: 'fileId', type: 'string', description: '6位数文件ID' }
      ],
      headers: [
        { name: 'X-API-Key', type: 'string', description: 'API 密钥（可选）' }
      ],
      example: `curl -X GET "https://your-domain.com/api/projection/123456?action=download" \\
  -H "X-API-Key: npt_your_api_key_here"`
    },
    {
      method: 'POST',
      path: '/api/upload-file',
      description: '上传投影文件',
      params: [
        { name: 'filename', type: 'string', description: '文件名' },
        { name: 'fileSize', type: 'number', description: '文件大小（字节）' },
        { name: 'fileType', type: 'string', description: '文件类型（可选）' },
        { name: 'checksum', type: 'string', description: '文件校验和（可选）' }
      ],
      headers: [
        { name: 'Authorization', type: 'string', description: 'Bearer token（可选，支持匿名上传）' },
        { name: 'Content-Type', type: 'string', description: 'application/json' }
      ],
      example: `curl -X POST "https://your-domain.com/api/upload-file" \\
  -H "Authorization: Bearer your_jwt_token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "filename": "my_build.litematic",
    "fileSize": 1024000,
    "fileType": ".litematic"
  }'`
    }
  ];

  const responseExamples = {
    fileInfo: `{
  "message": "文件信息获取成功",
  "file": {
    "file_id": "123456",
    "filename": "my_build.litematic",
    "original_filename": "我的建筑.litematic",
    "file_size": 1024000,
    "file_type": ".litematic",
    "mime_type": "application/octet-stream",
    "download_count": 42,
    "is_public": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}`,
    downloadLink: `{
  "message": "下载链接生成成功",
  "downloadUrl": "https://storage.example.com/signed-url",
  "expiresIn": 3600,
  "file": {
    "file_id": "123456",
    "filename": "my_build.litematic",
    "file_size": 1024000
  }
}`,
    uploadResponse: `{
  "message": "文件上传准备完成",
  "fileId": "789012",
  "uploadUrl": "https://storage.example.com/upload-url",
  "expiresIn": 900,
  "file": {
    "id": "uuid-here",
    "file_id": "789012",
    "filename": "my_build.litematic",
    "file_size": 1024000,
    "storage_path": "projections/78/789012.litematic"
  }
}`
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-white">API 文档</h1>
          <p className="text-gray-400 mt-1">Neptunium 投影管理系统 API 接口文档</p>
        </div>

        {/* 概述 */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <DocumentTextIcon className="w-6 h-6 mr-2" />
            API 概述
          </h2>
          <div className="space-y-4 text-gray-300">
            <p>
              Neptunium API 提供了完整的投影文件管理功能，支持文件上传、下载、查看等操作。
              API 采用 RESTful 设计，支持 JSON 格式的请求和响应。
            </p>
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-2">基础信息</h3>
              <ul className="space-y-2">
                <li><strong>Base URL:</strong> <code className="text-yellow-400">https://your-domain.com</code></li>
                <li><strong>认证方式:</strong> API Key 或 JWT Token</li>
                <li><strong>请求格式:</strong> JSON</li>
                <li><strong>响应格式:</strong> JSON</li>
                <li><strong>支持的文件格式:</strong> .litematic, .schem, .schematic, .nbt, .structure</li>
                <li><strong>最大文件大小:</strong> 50MB</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 认证 */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <KeyIcon className="w-6 h-6 mr-2" />
            认证方式
          </h2>
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">1. API 密钥认证</h3>
              <p className="mb-2">在请求头中添加 API 密钥：</p>
              <div className="bg-gray-900 rounded-lg p-4 relative">
                <code className="text-green-400">X-API-Key: npt_your_api_key_here</code>
                <button
                  onClick={() => copyToClipboard('X-API-Key: npt_your_api_key_here', 'api-key-header')}
                  className="absolute top-2 right-2 text-gray-400 hover:text-white"
                >
                  {copiedCode === 'api-key-header' ? (
                    <CheckIcon className="w-5 h-5 text-green-400" />
                  ) : (
                    <ClipboardIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">2. JWT Token 认证</h3>
              <p className="mb-2">在请求头中添加 Bearer Token：</p>
              <div className="bg-gray-900 rounded-lg p-4 relative">
                <code className="text-green-400">Authorization: Bearer your_jwt_token</code>
                <button
                  onClick={() => copyToClipboard('Authorization: Bearer your_jwt_token', 'jwt-header')}
                  className="absolute top-2 right-2 text-gray-400 hover:text-white"
                >
                  {copiedCode === 'jwt-header' ? (
                    <CheckIcon className="w-5 h-5 text-green-400" />
                  ) : (
                    <ClipboardIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="bg-blue-900 border border-blue-600 rounded-lg p-4">
              <p className="text-blue-200">
                <strong>注意：</strong> 部分接口支持匿名访问，但建议使用认证以获得更好的服务质量和访问统计。
              </p>
            </div>
          </div>
        </div>

        {/* API 端点 */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <CodeBracketIcon className="w-6 h-6 mr-2" />
            API 端点
          </h2>
          <div className="space-y-6">
            {apiEndpoints.map((endpoint, index) => (
              <div key={index} className="border border-gray-600 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium mr-3 ${
                    endpoint.method === 'GET' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="text-yellow-400 font-mono">{endpoint.path}</code>
                </div>
                <p className="text-gray-300 mb-4">{endpoint.description}</p>
                
                {/* 参数 */}
                {endpoint.params.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-white font-medium mb-2">参数：</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-600">
                            <th className="text-left py-2 text-gray-300">参数名</th>
                            <th className="text-left py-2 text-gray-300">类型</th>
                            <th className="text-left py-2 text-gray-300">说明</th>
                          </tr>
                        </thead>
                        <tbody>
                          {endpoint.params.map((param, i) => (
                            <tr key={i} className="border-b border-gray-700">
                              <td className="py-2 text-yellow-400 font-mono">{param.name}</td>
                              <td className="py-2 text-blue-400">{param.type}</td>
                              <td className="py-2 text-gray-300">{param.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 请求头 */}
                {endpoint.headers.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-white font-medium mb-2">请求头：</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-600">
                            <th className="text-left py-2 text-gray-300">头部名称</th>
                            <th className="text-left py-2 text-gray-300">类型</th>
                            <th className="text-left py-2 text-gray-300">说明</th>
                          </tr>
                        </thead>
                        <tbody>
                          {endpoint.headers.map((header, i) => (
                            <tr key={i} className="border-b border-gray-700">
                              <td className="py-2 text-yellow-400 font-mono">{header.name}</td>
                              <td className="py-2 text-blue-400">{header.type}</td>
                              <td className="py-2 text-gray-300">{header.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 示例 */}
                <div>
                  <h4 className="text-white font-medium mb-2">请求示例：</h4>
                  <div className="bg-gray-900 rounded-lg p-4 relative">
                    <pre className="text-green-400 text-sm overflow-x-auto">
                      <code>{endpoint.example}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(endpoint.example, `example-${index}`)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-white"
                    >
                      {copiedCode === `example-${index}` ? (
                        <CheckIcon className="w-5 h-5 text-green-400" />
                      ) : (
                        <ClipboardIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 响应示例 */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">响应示例</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">文件信息响应</h3>
              <div className="bg-gray-900 rounded-lg p-4 relative">
                <pre className="text-green-400 text-sm overflow-x-auto">
                  <code>{responseExamples.fileInfo}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(responseExamples.fileInfo, 'response-info')}
                  className="absolute top-2 right-2 text-gray-400 hover:text-white"
                >
                  {copiedCode === 'response-info' ? (
                    <CheckIcon className="w-5 h-5 text-green-400" />
                  ) : (
                    <ClipboardIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-2">下载链接响应</h3>
              <div className="bg-gray-900 rounded-lg p-4 relative">
                <pre className="text-green-400 text-sm overflow-x-auto">
                  <code>{responseExamples.downloadLink}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(responseExamples.downloadLink, 'response-download')}
                  className="absolute top-2 right-2 text-gray-400 hover:text-white"
                >
                  {copiedCode === 'response-download' ? (
                    <CheckIcon className="w-5 h-5 text-green-400" />
                  ) : (
                    <ClipboardIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-2">上传响应</h3>
              <div className="bg-gray-900 rounded-lg p-4 relative">
                <pre className="text-green-400 text-sm overflow-x-auto">
                  <code>{responseExamples.uploadResponse}</code>
                </pre>
                <button
                  onClick={() => copyToClipboard(responseExamples.uploadResponse, 'response-upload')}
                  className="absolute top-2 right-2 text-gray-400 hover:text-white"
                >
                  {copiedCode === 'response-upload' ? (
                    <CheckIcon className="w-5 h-5 text-green-400" />
                  ) : (
                    <ClipboardIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 错误代码 */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">错误代码</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-2 text-gray-300">状态码</th>
                  <th className="text-left py-2 text-gray-300">说明</th>
                  <th className="text-left py-2 text-gray-300">可能原因</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-700">
                  <td className="py-2 text-red-400 font-mono">400</td>
                  <td className="py-2">请求错误</td>
                  <td className="py-2">参数缺失或格式错误</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-2 text-red-400 font-mono">401</td>
                  <td className="py-2">未授权</td>
                  <td className="py-2">API 密钥无效或缺失</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-2 text-red-400 font-mono">403</td>
                  <td className="py-2">禁止访问</td>
                  <td className="py-2">权限不足</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-2 text-red-400 font-mono">404</td>
                  <td className="py-2">资源不存在</td>
                  <td className="py-2">文件ID不存在</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-2 text-red-400 font-mono">429</td>
                  <td className="py-2">请求过于频繁</td>
                  <td className="py-2">超出速率限制</td>
                </tr>
                <tr className="border-b border-gray-700">
                  <td className="py-2 text-red-400 font-mono">500</td>
                  <td className="py-2">服务器错误</td>
                  <td className="py-2">内部服务器错误</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 使用限制 */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">使用限制</h2>
          <div className="space-y-4 text-gray-300">
            <ul className="space-y-2">
              <li>• <strong>文件大小限制：</strong> 单个文件最大 50MB</li>
              <li>• <strong>文件格式限制：</strong> 仅支持 .litematic, .schem, .schematic, .nbt, .structure 格式</li>
              <li>• <strong>速率限制：</strong> 默认每小时 1000 次请求（可通过 API 密钥配置）</li>
              <li>• <strong>存储时间：</strong> 文件默认永久存储，可设置过期时间</li>
              <li>• <strong>匿名上传：</strong> 支持匿名上传，但建议注册用户以获得更好的管理体验</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
