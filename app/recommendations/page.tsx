'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { RecommendedSource } from '@/types';
import { useUser } from '@/lib/contexts/UserContext';
import Navbar from '@/components/Navbar';

export default function RecommendationsPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const [recommendations, setRecommendations] = useState<RecommendedSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 权限检查
  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push('/login?redirect=/recommendations');
      } else if (user.role !== 'admin') {
        alert('此页面仅管理员可访问');
        router.push('/');
      }
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    try {
      const response = await fetch('/api/recommendations');
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        alert('已批准并添加到新闻源列表');
        loadRecommendations();
      } else {
        alert('操作失败');
      }
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('操作失败');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('确定要拒绝这个推荐吗？')) return;

    try {
      const response = await fetch(`/api/recommendations?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('已拒绝');
        loadRecommendations();
      } else {
        alert('操作失败');
      }
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('操作失败');
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) {
      alert('请至少选择一个推荐源');
      return;
    }

    if (!confirm(`确定要批准选中的 ${selectedIds.size} 个推荐源吗？`)) {
      return;
    }

    try {
      for (const id of selectedIds) {
        await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
      }
      alert(`成功批准 ${selectedIds.size} 个推荐源`);
      setSelectedIds(new Set());
      loadRecommendations();
    } catch (error) {
      console.error('Failed to batch approve:', error);
      alert('批量操作失败');
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === recommendations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(recommendations.map(r => r.id)));
    }
  };

  if (userLoading || isLoading) {
    return <div className="p-8">加载中...</div>;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">🔍 AI推荐新闻源</h1>
          <p className="text-gray-600 mt-2">审核并添加AI发现的热门媒体源</p>
        </div>
        {recommendations.length > 0 && (
          <button
            onClick={handleBatchApprove}
            disabled={selectedIds.size === 0}
            className={`px-6 py-2 rounded-lg font-semibold ${
              selectedIds.size > 0
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            批量批准 ({selectedIds.size})
          </button>
        )}
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">暂无待审核的推荐源</p>
          <p className="text-gray-400 mt-2 text-sm">运行 `node scripts/discover-hot-sources.js` 生成推荐</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === recommendations.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4"
                  />
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">名称</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">类型</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">分类</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">热度</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">推荐理由</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((rec) => (
                <tr key={rec.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(rec.id)}
                      onChange={() => toggleSelection(rec.id)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{rec.name}</div>
                    <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">{rec.url}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded ${
                      rec.source_type === 'youtube_channel'
                        ? 'bg-red-100 text-red-700'
                        : rec.source_type === 'rss'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {rec.source_type === 'youtube_channel' ? 'YouTube' : rec.source_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {rec.category?.name || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="text-2xl">🔥</div>
                      <div>
                        <div className="text-sm font-semibold text-orange-600">
                          {rec.popularity_score || 0}
                        </div>
                        {rec.subscriber_count && (
                          <div className="text-xs text-gray-500">
                            {(rec.subscriber_count / 10000).toFixed(0)}万订阅
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-md">
                      {rec.recommended_reason}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleApprove(rec.id)}
                        className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                      >
                        ✓ 批准
                      </button>
                      <button
                        onClick={() => handleReject(rec.id)}
                        className="px-4 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        ✗ 拒绝
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}
