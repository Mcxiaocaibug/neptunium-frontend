'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  DocumentIcon,
  UserIcon,
  KeyIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalFiles: number;
  totalUsers: number;
  totalApiKeys: number;
  todayUploads: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalFiles: 0,
    totalUsers: 0,
    totalApiKeys: 0,
    todayUploads: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: '总文件数',
      value: stats.totalFiles,
      icon: DocumentIcon,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: '注册用户',
      value: stats.totalUsers,
      icon: UserIcon,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'API 密钥',
      value: stats.totalApiKeys,
      icon: KeyIcon,
      color: 'bg-yellow-500',
      change: '+5%'
    },
    {
      title: '今日上传',
      value: stats.todayUploads,
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      change: '+23%'
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-2xl font-bold text-white">仪表板</h1>
          <p className="text-gray-400 mt-1">Minecraft 投影管理系统概览</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <div key={index} className="neptunium-card neptunium-glow-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">{card.title}</p>
                  <p className="text-2xl font-bold neptunium-gradient-text mt-1">
                    {loading ? '...' : card.value.toLocaleString()}
                  </p>
                  <p className="text-green-400 text-sm mt-1">{card.change}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg neptunium-glow`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 快速操作 */}
        <div className="neptunium-card">
          <h2 className="text-lg font-semibold neptunium-gradient-text mb-4">快速操作</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="neptunium-button neptunium-button-primary">
              上传新文件
            </button>
            <button className="neptunium-button neptunium-button-secondary">
              生成 API 密钥
            </button>
            <button className="neptunium-button neptunium-button-secondary">
              查看系统日志
            </button>
          </div>
        </div>

        {/* 最近活动 */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">最近活动</h2>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-300">用户上传了新的投影文件</span>
                </div>
                <span className="text-gray-500 text-sm">2 分钟前</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
