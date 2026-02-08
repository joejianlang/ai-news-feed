'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { NewsSource, Category, SourceType } from '@/types';
import { useUser } from '@/lib/contexts/UserContext';
import Navbar from '@/components/Navbar';

interface FetchStatus {
  is_running: boolean;
  current_source?: string;
  progress?: number;
  total?: number;
  last_completed_at?: string;
  error?: string;
}

export default function SourcesPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testingIds, setTestingIds] = useState<Set<string>>(new Set());
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>({ is_running: false });
  const [isStartingCron, setIsStartingCron] = useState(false);
  const [aiHealth, setAiHealth] = useState<any>(null);
  const [formData, setFormData] = useState<{
    name: string;
    url: string;
    source_type: SourceType;
    fetch_interval: number;
    commentary_style: string;
    is_active: boolean;
    youtube_channel_id: string;
    category_id: string | undefined;
  }>({
    name: '',
    url: '',
    source_type: 'rss',
    fetch_interval: 3600,
    commentary_style: '专业分析',
    is_active: true,
    youtube_channel_id: '',
    category_id: undefined,
  });

  // 权限检查
  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        // 未登录，跳转到登录页
        router.push('/login?redirect=/sources');
      } else if (user.role !== 'admin') {
        // 不是管理员，跳转到首页
        alert('此页面仅管理员可访问');
        router.push('/');
      }
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadSources();
      loadCategories();
      loadFetchStatus();
      loadAIHealth();
    }
  }, [user]);

  // 定时刷新抓取状态
  useEffect(() => {
    if (user?.role === 'admin' && fetchStatus.is_running) {
      const interval = setInterval(loadFetchStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [user, fetchStatus.is_running]);

  const loadSources = async () => {
    try {
      const response = await fetch('/api/sources');
      const data = await response.json();
      setSources(data);
    } catch (error) {
      console.error('Failed to load sources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadFetchStatus = async () => {
    try {
      console.log('📡 请求抓取状态...');
      const response = await fetch('/api/cron/status');
      console.log('📡 状态API响应:', response.status);
      const data = await response.json();
      console.log('📊 收到状态数据:', data);
      setFetchStatus(data);
    } catch (error) {
      console.error('Failed to load fetch status:', error);
    }
  };

  const loadAIHealth = async () => {
    try {
      const response = await fetch('/api/admin/ai-health');
      if (response.ok) {
        const data = await response.json();
        setAiHealth(data);
      }
    } catch (error) {
      console.error('Failed to load AI health:', error);
    }
  };

  const handleStartCronFetch = async () => {
    if (fetchStatus.is_running) {
      alert('已有抓取任务正在运行中');
      return;
    }

    if (!confirm('确定要开始顺序抓取所有新闻源吗？这可能需要较长时间。')) {
      return;
    }

    setIsStartingCron(true);
    try {
      // 触发抓取（不等待完成）
      fetch('/api/cron/fetch').catch(() => { });

      // 等待一下让状态更新
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadFetchStatus();

    } catch (error) {
      console.error('Failed to start cron fetch:', error);
      alert('启动抓取失败');
    } finally {
      setIsStartingCron(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEditing = editingId !== null;
      console.log('Submitting form:', { isEditing, editingId, formData });

      const response = await fetch('/api/sources', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? { id: editingId, ...formData } : formData),
      });

      if (response.ok) {
        await loadSources();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          name: '',
          url: '',
          source_type: 'rss',
          fetch_interval: 3600,
          commentary_style: '专业分析',
          is_active: true,
          youtube_channel_id: '',
          category_id: undefined,
        });
        alert(isEditing ? '✅ 更新成功！' : '✅ 创建成功！');
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        alert(`❌ 保存失败: ${errorData.detail || errorData.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Failed to save source:', error);
      alert('❌ 保存失败，请检查网络连接');
    }
  };

  const handleEdit = (source: NewsSource) => {
    setFormData({
      name: source.name,
      url: source.url,
      source_type: source.source_type,
      fetch_interval: source.fetch_interval,
      commentary_style: source.commentary_style,
      is_active: source.is_active,
      youtube_channel_id: source.youtube_channel_id || '',
      category_id: source.category_id || undefined,
    });
    setEditingId(source.id);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      url: '',
      source_type: 'rss',
      fetch_interval: 3600,
      commentary_style: '专业分析',
      is_active: true,
      youtube_channel_id: '',
      category_id: undefined,
    });
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    // 如果是第一次点击，进入确认状态
    if (deletingId !== id) {
      setDeletingId(id);
      // 3秒后自动取消
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }

    // 第二次点击，执行删除
    try {
      await fetch(`/api/sources?id=${id}`, { method: 'DELETE' });
      await loadSources();
      setDeletingId(null);
    } catch (error) {
      console.error('Failed to delete source:', error);
      alert('删除失败');
    }
  };

  const handleToggle = async (source: NewsSource) => {
    try {
      await fetch('/api/sources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: source.id,
          is_active: !source.is_active,
        }),
      });
      await loadSources();
    } catch (error) {
      console.error('Failed to toggle source:', error);
    }
  };

  const handleFetchNow = async (sourceId: string) => {
    try {
      const response = await fetch('/api/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId }),
      });

      const result = await response.json();
      alert(`成功抓取 ${result.count} 条新闻`);
      loadSources(); // 刷新列表
    } catch (error) {
      console.error('Failed to fetch news:', error);
      alert('抓取失败');
    }
  };

  const handleResetStatus = async () => {
    if (!confirm('确定要重置抓取状态吗？如果有任务卡住了，可以使用此功能重置。')) {
      return;
    }

    try {
      const response = await fetch('/api/cron/reset', { method: 'GET' });
      if (response.ok) {
        alert('✅ 抓取状态已重置');
        await loadFetchStatus();
      } else {
        alert('❌ 重置失败');
      }
    } catch (error) {
      console.error('Reset failed:', error);
      alert('❌ 重置失败');
    }
  };

  // ... inside component ...
  const [confirmFetchAll, setConfirmFetchAll] = useState(false);

  // ...
  const handleFetchAll = async () => {
    // 第一次点击，进入确认状态
    if (!confirmFetchAll) {
      setConfirmFetchAll(true);
      // 3秒后如果没有确认，自动恢复
      setTimeout(() => setConfirmFetchAll(false), 3000);
      return;
    }


    // 第二次点击，执行抓取
    setConfirmFetchAll(false);

    if (fetchStatus.is_running) {
      alert('已有抓取任务正在运行中');
      return;
    }

    setIsStartingCron(true);
    try {
      console.log('🚀 开始触发抓取...');
      console.log('📍 发送请求到: POST /api/fetch');

      // 触发抓取（POST 方法使用管理员认证）
      const fetchResponse = await fetch('/api/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      console.log('✅ 抓取API响应状态:', fetchResponse.status);

      if (!fetchResponse.ok) {
        const errorText = await fetchResponse.text();
        console.error('❌ 抓取API返回错误:', errorText);
        alert(`启动抓取失败: ${errorText}`);
        return;
      }

      // 立即检查状态（不等待抓取完成）
      console.log('🔄 立即加载抓取状态...');
      await loadFetchStatus();

      // 再等待一下再次检查
      console.log('⏳ 等待2秒后再次检查...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await loadFetchStatus();

    } catch (error) {
      console.error('❌ 触发抓取异常:', error);
      alert(`启动抓取失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsStartingCron(false);
    }
  };

  const handleTest = async (source: NewsSource) => {
    setTestingIds(prev => new Set(prev).add(source.id));

    try {
      const response = await fetch('/api/sources/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: source.id,
          url: source.url,
          source_type: source.source_type,
          youtube_channel_id: source.youtube_channel_id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ 测试通过！\n抓取到 ${result.itemCount} 条内容\n耗时: ${result.duration}ms\n\n示例标题:\n${result.sampleTitles?.join('\n') || '无'}`);
      } else {
        alert(`❌ 测试未通过\n错误: ${result.error}`);
      }

      await loadSources(); // 刷新列表以显示新状态
    } catch (error) {
      console.error('Test failed:', error);
      alert('测试请求失败');
    } finally {
      setTestingIds(prev => {
        const next = new Set(prev);
        next.delete(source.id);
        return next;
      });
    }
  };

  const handleTestAll = async () => {
    if (!confirm('确定要测试所有新闻源吗？这可能需要几分钟时间。')) {
      return;
    }

    for (const source of sources) {
      await handleTest(source);
    }

    alert('所有新闻源测试完成！');
  };

  // 加载中或权限检查中
  if (userLoading || isLoading) {
    return <div className="p-8">加载中...</div>;
  }

  // 未登录或非管理员（显示空白，因为会自动跳转）
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto p-4 sm:p-8">

        {/* 页面标题 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">新闻源管理</h1>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {/* Toggle Switch for 定时抓取 */}
            <div className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-gray-200">
              <span className="text-sm font-medium text-gray-700">🕐 定时抓取</span>
              <button
                type="button"
                role="switch"
                aria-checked={fetchStatus.is_running}
                onClick={handleStartCronFetch}
                disabled={isStartingCron}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${fetchStatus.is_running
                  ? 'bg-indigo-600'
                  : isStartingCron
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gray-200 hover:bg-gray-300'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${fetchStatus.is_running ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
              {fetchStatus.is_running && (
                <span className="text-xs text-indigo-600 font-medium">运行中</span>
              )}
            </div>
            <button
              onClick={handleTestAll}
              className="bg-purple-500 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-purple-600 font-semibold text-sm sm:text-base"
            >
              🧪 全部测试
            </button>
            <button
              onClick={handleFetchAll}
              disabled={fetchStatus.is_running || isStartingCron}
              className={`px-4 sm:px-6 py-2 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 ${fetchStatus.is_running || isStartingCron
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : confirmFetchAll
                  ? 'bg-orange-500 text-white hover:bg-orange-600 animate-pulse'
                  : 'bg-green-500 text-white hover:bg-green-600'
                }`}
            >
              {fetchStatus.is_running ? '⏳ 抓取中...' :
                isStartingCron ? '🚀 启动中...' :
                  confirmFetchAll ? '⚠️ 确认开始？' : '🔄 全部抓取'}
            </button>
            <button
              onClick={() => showForm ? handleCancelEdit() : setShowForm(true)}
              className="bg-blue-500 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-600 text-sm sm:text-base"
            >
              {showForm ? '取消' : '添加新闻源'}
            </button>
            <button
              onClick={() => router.push('/publish')}
              className="bg-indigo-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-indigo-700 text-sm sm:text-base font-semibold"
            >
              📝 发布文章
            </button>
          </div>
        </div>

        {/* AI 健康状态 */}
        {aiHealth && (
          <div className="mb-4 p-3 rounded-lg bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">🤖 AI 服务状态</span>
              <div className="flex gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Gemini:</span>
                  <span className={`text-xs px-2 py-1 rounded ${aiHealth.services?.gemini?.status === 'healthy'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                    }`}>
                    {aiHealth.services?.gemini?.status === 'healthy' ? '✅ 正常' : '❌ 异常'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Claude:</span>
                  <span className={`text-xs px-2 py-1 rounded ${aiHealth.services?.claude?.status === 'healthy'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                    }`}>
                    {aiHealth.services?.claude?.status === 'healthy' ? '✅ 正常' : '❌ 异常'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 抓取进度条 - 始终显示 */}
        <div className="mb-6 p-4 rounded-lg bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-700">抓取状态</span>
              {fetchStatus.is_running && (
                <button
                  onClick={handleResetStatus}
                  className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  title="如果抓取卡住，可以点击重置"
                >
                  🔄 重置
                </button>
              )}
            </div>
            {fetchStatus.is_running ? (
              <span className="text-sm text-blue-600 font-medium">
                {fetchStatus.progress || 0} / {fetchStatus.total || 0} ({fetchStatus.total ? Math.round((fetchStatus.progress || 0) / fetchStatus.total * 100) : 0}%)
              </span>
            ) : fetchStatus.last_completed_at ? (
              <span className="text-sm text-green-600">
                ✅ 上次完成: {new Date(fetchStatus.last_completed_at).toLocaleString('zh-CN')}
              </span>
            ) : (
              <span className="text-sm text-gray-500">未开始</span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${fetchStatus.is_running ? 'bg-blue-500' : fetchStatus.last_completed_at ? 'bg-green-500' : 'bg-gray-300'
                }`}
              style={{ width: `${fetchStatus.is_running && fetchStatus.total ? (fetchStatus.progress || 0) / fetchStatus.total * 100 : fetchStatus.last_completed_at ? 100 : 0}%` }}
            ></div>
          </div>
          {fetchStatus.is_running && fetchStatus.current_source && (
            <p className="mt-2 text-sm text-blue-600 flex items-center gap-2">
              <span className="animate-pulse">●</span>
              正在抓取: {fetchStatus.current_source}
            </p>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg shadow-lg mb-8 border border-blue-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {editingId ? '✏️ 编辑新闻源' : '➕ 添加新闻源'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-medium placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={e => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-medium placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">类型</label>
                <select
                  value={formData.source_type}
                  onChange={e => setFormData({ ...formData, source_type: e.target.value as any })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                >
                  <option value="rss">RSS</option>
                  <option value="youtube">YouTube 单个视频</option>
                  <option value="youtube_channel">YouTube 频道</option>
                  <option value="web">网页</option>
                </select>
              </div>

              {/* 分类选择已移除 - 由 AI 自动分类 */}

              {formData.source_type === 'youtube_channel' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2 text-gray-700">频道 URL</label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-medium placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    placeholder="https://www.youtube.com/@channelname 或 https://www.youtube.com/channel/UC..."
                    required
                  />
                  <p className="text-xs text-gray-600 mt-1 bg-blue-100 px-2 py-1 rounded">
                    💡 支持格式：@频道名、/channel/频道ID、/c/自定义名
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">抓取间隔（秒）</label>
                <input
                  type="number"
                  value={formData.fetch_interval}
                  onChange={e => setFormData({ ...formData, fetch_interval: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-medium placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  min="60"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700">评论风格</label>
                <input
                  type="text"
                  value={formData.commentary_style}
                  onChange={e => setFormData({ ...formData, commentary_style: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-medium placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  placeholder="例如：专业分析、幽默讽刺、简洁犀利等"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <button
                type="submit"
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
              >
                {editingId ? '保存' : '创建'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                >
                  取消
                </button>
              )}
            </div>
          </form>
        )}

        <div className="space-y-4">
          {sources.map(source => (
            <div key={source.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{source.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{source.url}</p>
                  <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
                    <span>
                      类型: {
                        source.source_type === 'youtube_channel' ? 'YouTube 频道' :
                          source.source_type === 'youtube' ? 'YouTube 视频' :
                            source.source_type === 'rss' ? 'RSS' : '网页'
                      }
                    </span>
                    {source.category_id && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {categories.find(c => c.id === source.category_id)?.name || '未知分类'}
                      </span>
                    )}
                    <span>风格: {source.commentary_style}</span>
                    <span>间隔: {source.fetch_interval}秒</span>
                    {/* 测试状态标签 */}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${source.test_status === 'passed'
                      ? 'bg-green-100 text-green-700'
                      : source.test_status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600'
                      }`}>
                      {source.test_status === 'passed' ? '✅ 已通过' :
                        source.test_status === 'failed' ? '❌ 测试未通过' :
                          '⏳ 待测试'}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-400 mt-2">
                    {source.last_fetched_at && (
                      <span>最后抓取: {new Date(source.last_fetched_at).toLocaleString('zh-CN')}</span>
                    )}
                    {source.tested_at && (
                      <span>最后测试: {new Date(source.tested_at).toLocaleString('zh-CN')}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleTest(source)}
                    disabled={testingIds.has(source.id)}
                    className={`px-4 py-2 rounded text-sm ${testingIds.has(source.id)
                      ? 'bg-purple-300 text-white cursor-not-allowed'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                      }`}
                  >
                    {testingIds.has(source.id) ? '测试中...' : '🧪 测试'}
                  </button>
                  <button
                    onClick={() => handleEdit(source)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 text-sm"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleFetchNow(source.id)}
                    disabled={source.test_status === 'failed'}
                    className={`px-4 py-2 rounded text-sm ${source.test_status === 'failed'
                      ? 'bg-blue-300 text-white cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    title={source.test_status === 'failed' ? '测试未通过，无法抓取' : '立即抓取'}
                  >
                    立即抓取
                  </button>
                  <button
                    onClick={() => handleToggle(source)}
                    className={`px-4 py-2 rounded text-sm ${source.test_status === 'failed'
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : source.is_active
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                      }`}
                  >
                    {source.test_status === 'failed' ? '⚠️ 待修复' :
                      source.is_active ? '✅ 已启用' : '已禁用'}
                  </button>
                  <button
                    onClick={() => handleDelete(source.id)}
                    className={`px-4 py-2 rounded text-sm text-white transition-all duration-200 ${deletingId === source.id
                      ? 'bg-red-700 hover:bg-red-800 font-bold animate-pulse'
                      : 'bg-red-500 hover:bg-red-600'
                      }`}
                  >
                    {deletingId === source.id ? '⚠️ 确认删除？' : '删除'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {sources.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              暂无新闻源，点击上方按钮添加
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
