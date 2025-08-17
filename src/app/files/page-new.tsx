'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { 
  DocumentIcon, 
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

interface ProjectionFile {
  id: string;
  file_id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  file_size_formatted: string;
  file_type: string;
  download_count: number;
  is_public: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

interface FileStats {
  totalFiles: number;
  totalSize: number;
  totalDownloads: number;
  fileTypes: Record<string, number>;
  averageFileSize: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function FilesPage() {
  const [files, setFiles] = useState<ProjectionFile[]>([]);
  const [stats, setStats] = useState<FileStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchFiles();
  }, [currentPage, searchTerm, fileTypeFilter, sortBy, sortOrder]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(fileTypeFilter && { fileType: fileTypeFilter }),
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/files-history?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
        setStats(data.stats);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch files');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleDownload = async (fileId: string) => {
    try {
      const response = await fetch(`/api/projection/${fileId}?action=download`);
      if (response.ok) {
        const data = await response.json();
        window.open(data.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getFileTypeColor = (fileType: string) => {
    const colors: Record<string, string> = {
      '.litematic': 'bg-blue-100 text-blue-800',
      '.schem': 'bg-green-100 text-green-800',
      '.schematic': 'bg-purple-100 text-purple-800',
      '.nbt': 'bg-orange-100 text-orange-800',
      '.structure': 'bg-red-100 text-red-800',
    };
    return colors[fileType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-white">文件管理</h1>
          <p className="text-gray-400 mt-1">管理您上传的投影文件</p>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center">
                <DocumentIcon className="w-8 h-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-gray-400 text-sm">总文件数</p>
                  <p className="text-2xl font-bold text-white">{stats.totalFiles}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>
                <div className="ml-4">
                  <p className="text-gray-400 text-sm">总大小</p>
                  <p className="text-2xl font-bold text-white">
                    {(stats.totalSize / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center">
                <ArrowDownTrayIcon className="w-8 h-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-gray-400 text-sm">总下载数</p>
                  <p className="text-2xl font-bold text-white">{stats.totalDownloads}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
                <div className="ml-4">
                  <p className="text-gray-400 text-sm">平均大小</p>
                  <p className="text-2xl font-bold text-white">
                    {(stats.averageFileSize / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 搜索和过滤 */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索文件名或文件ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={fileTypeFilter}
                onChange={(e) => setFileTypeFilter(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">所有类型</option>
                <option value=".litematic">Litematic</option>
                <option value=".schem">Schematic</option>
                <option value=".nbt">NBT</option>
                <option value=".structure">Structure</option>
              </select>
            </div>
          </div>
        </div>

        {/* 文件列表 */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('filename')}
                      className="flex items-center space-x-1 hover:text-white"
                    >
                      <span>文件名</span>
                      {sortBy === 'filename' && (
                        sortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    文件ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('file_size')}
                      className="flex items-center space-x-1 hover:text-white"
                    >
                      <span>大小</span>
                      {sortBy === 'file_size' && (
                        sortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('download_count')}
                      className="flex items-center space-x-1 hover:text-white"
                    >
                      <span>下载数</span>
                      {sortBy === 'download_count' && (
                        sortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('created_at')}
                      className="flex items-center space-x-1 hover:text-white"
                    >
                      <span>上传时间</span>
                      {sortBy === 'created_at' && (
                        sortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-400">
                      加载中...
                    </td>
                  </tr>
                ) : files.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-400">
                      暂无文件
                    </td>
                  </tr>
                ) : (
                  files.map((file) => (
                    <tr key={file.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <DocumentIcon className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-white font-medium">{file.filename}</p>
                            {file.filename !== file.original_filename && (
                              <p className="text-gray-400 text-sm">原名: {file.original_filename}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-yellow-400">{file.file_id}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {file.file_size_formatted}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFileTypeColor(file.file_type)}`}>
                          {file.file_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {file.download_count}
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {formatDate(file.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDownload(file.file_id)}
                            className="text-blue-400 hover:text-blue-300"
                            title="下载"
                          >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                          </button>
                          <button
                            className="text-green-400 hover:text-green-300"
                            title="查看详情"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-gray-700 px-6 py-3 flex items-center justify-between">
              <div className="text-gray-300 text-sm">
                显示 {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 
                条，共 {pagination.total} 条
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1 bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500"
                >
                  上一页
                </button>
                <span className="px-3 py-1 text-gray-300">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1 bg-gray-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
