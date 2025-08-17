'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProtectedRoute, useAuth } from '@/contexts/AuthContext';
import { formatFileSize, getFileTypeDescription, formatDate } from '@/lib/utils';

interface ProjectionFile {
  projection_id: string;
  filename: string;
  file_size: number;
  file_type: string;
  created_at: string;
  metadata?: any;
}

interface FilesResponse {
  files: ProjectionFile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

function FilesPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [files, setFiles] = useState<ProjectionFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<FilesResponse['pagination'] | null>(null);

  // 用户已通过 ProtectedRoute 验证，无需额外检查

  // 获取文件列表
  const fetchFiles = async (pageNum: number = 1) => {
    if (!user?.api_key) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/.netlify/functions/user-files?page=${pageNum}&limit=10`, {
        headers: {
          'X-API-Key': user.api_key,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '获取文件列表失败');
      }

      setFiles(data.data.files);
      setPagination(data.data.pagination);

    } catch (error) {
      setError(error instanceof Error ? error.message : '获取文件列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFiles(page);
    }
  }, [user, page]);

  // 复制投影ID
  const copyProjectionId = (id: string) => {
    navigator.clipboard.writeText(id);
    alert('投影ID已复制到剪贴板');
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">我的文件</h1>
            <p className="text-muted-foreground mt-2">
              管理您上传的投影文件
            </p>
          </div>
          <Button onClick={() => router.push('/upload')}>
            上传新文件
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">加载中...</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-red-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">加载失败</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => fetchFiles(page)}>重试</Button>
            </CardContent>
          </Card>
        ) : files.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-muted-foreground mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">暂无文件</h3>
              <p className="text-muted-foreground mb-4">您还没有上传任何投影文件</p>
              <Button onClick={() => router.push('/upload')}>
                上传第一个文件
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {files.map((file) => (
                <Card key={file.projection_id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{file.filename}</h3>
                            <p className="text-sm text-muted-foreground">
                              {getFileTypeDescription(file.filename)} • {formatFileSize(file.file_size)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-muted-foreground">投影ID</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <code className="px-2 py-1 bg-secondary rounded font-mono text-primary">
                                {file.projection_id}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyProjectionId(file.projection_id)}
                                className="h-6 w-6 p-0"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">上传时间</p>
                            <p className="text-sm text-foreground mt-1">
                              {formatDate(file.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyProjectionId(file.projection_id)}
                        >
                          复制ID
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 分页 */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-8">
                <p className="text-sm text-muted-foreground">
                  显示第 {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 条，
                  共 {pagination.total} 条记录
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                  >
                    上一页
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    第 {pagination.page} / {pagination.total_pages} 页
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= pagination.total_pages}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function FilesPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <FilesPageContent />
    </ProtectedRoute>
  );
}
