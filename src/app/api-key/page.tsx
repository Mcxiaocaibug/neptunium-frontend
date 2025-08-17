'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProtectedRoute, useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';

function ApiKeyPageContent() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [apiKey, setApiKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showKey, setShowKey] = useState(false);

  // 初始化API密钥
  useEffect(() => {
    if (user?.api_key) {
      setApiKey(user.api_key);
      setLoading(false);
    } else {
      fetchApiKey();
    }
  }, [user]);

  // 获取当前API密钥
  const fetchApiKey = async () => {
    if (!user?.email) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/.netlify/functions/api-key?email=${encodeURIComponent(user.email)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '获取API密钥失败');
      }

      if (data.data.has_api_key) {
        setApiKey(data.data.api_key);
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : '获取API密钥失败');
    } finally {
      setLoading(false);
    }
  };

  // 生成新的API密钥
  const generateApiKey = async () => {
    if (!user?.email) return;

    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/.netlify/functions/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '生成API密钥失败');
      }

      setApiKey(data.data.api_key);
      setSuccess('API密钥生成成功！');

      // 更新用户信息
      updateUser({ api_key: data.data.api_key });

    } catch (error) {
      setError(error instanceof Error ? error.message : '生成API密钥失败');
    } finally {
      setGenerating(false);
    }
  };

  // 复制API密钥
  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    alert('API密钥已复制到剪贴板');
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            API 密钥管理
          </h1>
          <p className="text-lg text-muted-foreground">
            管理您的API密钥，用于插件端调用
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>您的 API 密钥</CardTitle>
            <CardDescription>
              API密钥用于插件端调用接口，请妥善保管，不要泄露给他人
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <p className="mt-2 text-muted-foreground">加载中...</p>
              </div>
            ) : apiKey ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    API 密钥
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 relative">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        readOnly
                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showKey ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <Button onClick={copyApiKey} size="sm">
                      复制
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h3 className="text-blue-400 font-medium mb-2">使用说明</h3>
                  <ul className="text-blue-300 text-sm space-y-1">
                    <li>• 在插件配置中设置此API密钥</li>
                    <li>• 插件将使用此密钥调用文件管理接口</li>
                    <li>• 请勿将API密钥分享给他人</li>
                    <li>• 如果密钥泄露，请立即重新生成</li>
                  </ul>
                </div>

                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={generateApiKey}
                    loading={generating}
                    disabled={generating}
                  >
                    {generating ? '生成中...' : '重新生成'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/files')}
                  >
                    查看我的文件
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  尚未生成API密钥
                </h3>
                <p className="text-muted-foreground mb-4">
                  生成API密钥后，您可以在插件中使用它来管理文件
                </p>
                <Button
                  onClick={generateApiKey}
                  loading={generating}
                  disabled={generating}
                >
                  {generating ? '生成中...' : '生成API密钥'}
                </Button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>API 文档</CardTitle>
            <CardDescription>
              插件端调用接口的说明
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">获取投影文件</h4>
                <div className="p-3 bg-secondary rounded-lg">
                  <code className="text-sm">
                    GET /.netlify/functions/projection?id=123456
                  </code>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  通过6位投影ID获取文件信息和下载链接
                </p>
              </div>

              <div>
                <h4 className="font-medium text-foreground mb-2">获取用户文件列表</h4>
                <div className="p-3 bg-secondary rounded-lg">
                  <code className="text-sm">
                    GET /.netlify/functions/user-files<br />
                    X-API-Key: your_api_key
                  </code>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  获取当前用户的所有文件列表
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ApiKeyPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <ApiKeyPageContent />
    </ProtectedRoute>
  );
}
