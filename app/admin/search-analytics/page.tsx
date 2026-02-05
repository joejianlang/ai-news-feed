'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

interface SearchStat {
  keyword: string;
  total_searches: number;
  searches_with_results: number;
  searches_without_results: number;
  avg_results: number;
  last_searched: string;
}

interface AnalyticsData {
  topSearches: SearchStat[];
  hotNoResults: SearchStat[];
  totalUniqueKeywords: number;
  totalSearches: number;
}

export default function SearchAnalyticsPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'no-results'>('all');

  // 权限检查
  useEffect(() => {
    if (!userLoading && user?.role !== 'admin') {
      router.push('/');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/search-analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (userLoading || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">搜索统计</h1>
            <p className="text-gray-600 mt-1">了解用户搜索习惯，优化内容策略</p>
          </div>
          <Link
            href="/sources"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← 返回管理源
          </Link>
        </div>

        {/* 统计卡片 */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">总搜索次数</div>
              <div className="text-3xl font-bold text-gray-900">{analytics.totalSearches}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">唯一关键字</div>
              <div className="text-3xl font-bold text-gray-900">{analytics.totalUniqueKeywords}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-1">高频无结果</div>
              <div className="text-3xl font-bold text-red-600">{analytics.hotNoResults.length}</div>
              <div className="text-xs text-gray-500 mt-1">需要添加内容源</div>
            </div>
          </div>
        )}

        {/* 标签页 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8 px-6">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                所有搜索
              </button>
              <button
                onClick={() => setActiveTab('no-results')}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'no-results'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                高频无结果 ({analytics?.hotNoResults.length || 0})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-gray-500">加载中...</div>
              </div>
            ) : !analytics ? (
              <div className="text-center py-12">
                <div className="text-gray-500">加载失败</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">排名</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">搜索关键字</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">总搜索次数</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">有结果</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">无结果</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">平均结果数</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">最后搜索</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTab === 'all' ? analytics.topSearches : analytics.hotNoResults).map((stat, index) => (
                      <tr key={stat.keyword} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">#{index + 1}</td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/search?keyword=${encodeURIComponent(stat.keyword)}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {stat.keyword}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-center text-sm font-semibold text-gray-900">
                          {stat.total_searches}
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-green-600">
                          {stat.searches_with_results}
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-red-600">
                          {stat.searches_without_results}
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-gray-600">
                          {stat.avg_results.toFixed(1)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {formatDate(stat.last_searched)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {activeTab === 'no-results' && analytics.hotNoResults.length > 0 && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-semibold text-yellow-800 mb-2">💡 内容建议</h3>
                    <p className="text-sm text-yellow-700">
                      以上关键字搜索频率高但结果少，建议添加相关新闻源以提升用户体验。
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
