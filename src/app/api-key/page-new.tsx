'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { 
  KeyIcon, 
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ClipboardIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface ApiKey {
  id: string;
  name: string;
  description?: string;
  key_prefix: string;
  permissions: string[];
  is_active: boolean;
  usage_count: number;
  rate_limit: number;
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
}

interface CreateApiKeyData {
  name: string;
  description: string;
  permissions: string[];
  rateLimit: number;
  expiresIn?: number;
}

export default function ApiKeyPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [createData, setCreateData] = useState<CreateApiKeyData>({
    name: '',
    description: '',
    permissions: ['read'],
    rateLimit: 1000,
    expiresIn: undefined
  });

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await fetch('/api/api-key', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.apiKeys || []);
      } else {
        console.error('Failed to fetch API keys');
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/api-key', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createData),
      });

      if (response.ok) {
        const data = await response.json();
        setNewApiKey(data.apiKey.key);
        setShowCreateModal(false);
        setCreateData({
          name: '',
          description: '',
          permissions: ['read'],
          rateLimit: 1000,
          expiresIn: undefined
        });
        fetchApiKeys();
      } else {
        const error = await response.json();
        alert(error.error || '创建 API 密钥失败');
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('创建 API 密钥失败');
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('确定要删除这个 API 密钥吗？此操作不可撤销。')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/api-key?id=${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchApiKeys();
      } else {
        const error = await response.json();
        alert(error.error || '删除 API 密钥失败');
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      alert('删除 API 密钥失败');
    }
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getPermissionColor = (permission: string) => {
    const colors: Record<string, string> = {
      'read': 'bg-green-100 text-green-800',
      'write': 'bg-blue-100 text-blue-800',
      'delete': 'bg-red-100 text-red-800',
      'admin': 'bg-purple-100 text-purple-800',
    };
    return colors[permission] || 'bg-gray-100 text-gray-800';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">API 密钥管理</h1>
            <p className="text-gray-400 mt-1">管理您的 API 访问密钥</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>创建 API 密钥</span>
          </button>
        </div>

        {/* 新创建的 API 密钥显示 */}
        {newApiKey && (
          <div className="bg-green-800 border border-green-600 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <CheckIcon className="w-6 h-6 text-green-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">API 密钥创建成功</h3>
            </div>
            <p className="text-green-200 mb-4">
              请立即复制并保存您的 API 密钥，出于安全考虑，我们不会再次显示完整密钥。
            </p>
            <div className="bg-gray-900 rounded-lg p-4 flex items-center justify-between">
              <code className="text-yellow-400 font-mono text-sm break-all">{newApiKey}</code>
              <button
                onClick={() => copyToClipboard(newApiKey, 'new')}
                className="ml-4 text-gray-400 hover:text-white"
              >
                {copiedKey === 'new' ? (
                  <CheckIcon className="w-5 h-5 text-green-400" />
                ) : (
                  <ClipboardIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            <button
              onClick={() => setNewApiKey(null)}
              className="mt-4 text-green-400 hover:text-green-300 text-sm"
            >
              我已保存，关闭此提示
            </button>
          </div>
        )}

        {/* API 密钥列表 */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">您的 API 密钥</h2>
          </div>

          {loading ? (
            <div className="px-6 py-8 text-center text-gray-400">
              加载中...
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <KeyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">暂无 API 密钥</h3>
              <p className="text-gray-400 mb-4">创建您的第一个 API 密钥来开始使用 API</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium"
              >
                创建 API 密钥
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-white">{apiKey.name}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          apiKey.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {apiKey.is_active ? '活跃' : '已停用'}
                        </span>
                      </div>
                      {apiKey.description && (
                        <p className="text-gray-400 text-sm mt-1">{apiKey.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                        <span>密钥前缀: <code className="text-yellow-400">{apiKey.key_prefix}...</code></span>
                        <span>使用次数: {apiKey.usage_count}</span>
                        <span>速率限制: {apiKey.rate_limit}/小时</span>
                        {apiKey.last_used_at && (
                          <span>最后使用: {formatDate(apiKey.last_used_at)}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        {apiKey.permissions.map((permission) => (
                          <span
                            key={permission}
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPermissionColor(permission)}`}
                          >
                            {permission}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        创建时间: {formatDate(apiKey.created_at)}
                        {apiKey.expires_at && (
                          <span className="ml-4">过期时间: {formatDate(apiKey.expires_at)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(apiKey.key_prefix, apiKey.id)}
                        className="text-gray-400 hover:text-white"
                        title="复制密钥前缀"
                      >
                        {copiedKey === apiKey.id ? (
                          <CheckIcon className="w-5 h-5 text-green-400" />
                        ) : (
                          <ClipboardIcon className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteApiKey(apiKey.id)}
                        className="text-red-400 hover:text-red-300"
                        title="删除密钥"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 创建 API 密钥模态框 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">创建新的 API 密钥</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    密钥名称 *
                  </label>
                  <input
                    type="text"
                    value={createData.name}
                    onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="例如：我的应用 API"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    描述
                  </label>
                  <textarea
                    value={createData.description}
                    onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="描述这个 API 密钥的用途"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    权限
                  </label>
                  <div className="space-y-2">
                    {['read', 'write', 'delete'].map((permission) => (
                      <label key={permission} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={createData.permissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateData({
                                ...createData,
                                permissions: [...createData.permissions, permission]
                              });
                            } else {
                              setCreateData({
                                ...createData,
                                permissions: createData.permissions.filter(p => p !== permission)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-gray-300 capitalize">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    速率限制 (请求/小时)
                  </label>
                  <input
                    type="number"
                    value={createData.rateLimit}
                    onChange={(e) => setCreateData({ ...createData, rateLimit: parseInt(e.target.value) || 1000 })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    min="1"
                    max="10000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    过期时间 (天数，留空表示永不过期)
                  </label>
                  <input
                    type="number"
                    value={createData.expiresIn || ''}
                    onChange={(e) => setCreateData({ ...createData, expiresIn: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    min="1"
                    max="365"
                    placeholder="例如：30"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateApiKey}
                  disabled={!createData.name.trim()}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  创建密钥
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
