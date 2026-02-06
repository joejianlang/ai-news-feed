'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { NewsItem, Category } from '@/types';
import Navbar from '@/components/Navbar';
import FollowButton from '@/components/FollowButton';
import CommentSection from '@/components/comments/CommentSection';

interface NewsBatch {
  batchTime: string;
  items: NewsItem[];
}

// 分类映射（中文名称 -> 显示名称）
const CATEGORY_DISPLAY = {
  '全部': '全部',
  '本地': '本地',
  '热点': '热点',
  '政治': '政治',
  '科技': '科技',
  '财经': '财经',
  '文化娱乐': '文化娱乐',
  '体育': '体育',
  '深度': '深度',
};

export default function Home() {
  const [newsBatches, setNewsBatches] = useState<NewsBatch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [expandedCommentary, setExpandedCommentary] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // null = 全部

  // 加载分类列表
  useEffect(() => {
    loadCategories();
  }, []);

  // 加载新闻（当分类改变时重新加载）
  useEffect(() => {
    loadNews();

    // 自动刷新（每30秒）
    if (autoRefresh) {
      const interval = setInterval(loadNews, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadNews = async () => {
    try {
      const url = selectedCategory
        ? `/api/news?categoryId=${selectedCategory}`
        : '/api/news';
      const response = await fetch(url);
      const data = await response.json();
      // Ensure data is an array before setting state
      if (Array.isArray(data)) {
        setNewsBatches(data);
      } else {
        console.error('API returned non-array:', data);
        setNewsBatches([]);
      }
    } catch (error) {
      console.error('Failed to load news:', error);
      setNewsBatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadNews();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  };

  const formatBatchTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalNewsCount = () => {
    return newsBatches.reduce((total, batch) => total + batch.items.length, 0);
  };

  const extractYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
      /youtube\.com\/embed\/([^?&\s]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const toggleCommentary = (itemId: string) => {
    setExpandedCommentary(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <Navbar />

      {/* 分类标签栏 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex overflow-x-auto scrollbar-hide">
            {/* 全部 选项 */}
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${selectedCategory === null
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                }`}
            >
              全部
            </button>
            {/* 动态分类 */}
            {categories.map((category: Category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${selectedCategory === category.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                  }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 副导航栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-2 flex justify-end items-center gap-4">
          <button
            onClick={handleRefresh}
            className="text-blue-500 hover:text-blue-600 font-medium text-sm"
            disabled={isLoading}
          >
            {isLoading ? '刷新中...' : '🔄 刷新'}
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            自动刷新
          </label>
        </div>
      </div>

      {/* 时间线 */}
      <main className="max-w-2xl mx-auto">
        {isLoading && newsBatches.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : newsBatches.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-20 text-center">
            <div className="text-gray-500 mb-4">暂无新闻</div>
            <Link
              href="/sources"
              className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600"
            >
              添加新闻源
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {newsBatches.map((batch, batchIndex) => (
              <div key={batch.batchTime} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* 批次标题 */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <span className="text-lg font-bold">📰</span>
                      <span className="font-semibold">更新时间: {formatBatchTime(batch.batchTime)}</span>
                    </div>
                    <span className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {batch.items.length} 条新闻
                    </span>
                  </div>
                </div>

                {/* 批次内的新闻列表 */}
                <div className="divide-y divide-gray-200">
                  {batch.items.map(item => (
                    <article key={item.id} className="bg-white p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                      {/* 头部信息 */}
                      <div className="flex items-center gap-2 sm:gap-3 mb-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                          {item.source?.name.charAt(0) || 'N'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 text-sm sm:text-base truncate">{item.source?.name || '未知来源'}</span>
                            <span className="text-gray-500 text-xs sm:text-sm">·</span>
                            <span className="text-gray-500 text-xs sm:text-sm">{formatTime(item.created_at)}</span>
                          </div>
                          {item.source?.commentary_style && (
                            <span className="text-xs text-gray-500">{item.source.commentary_style}风格</span>
                          )}
                        </div>
                        {item.source && (
                          <FollowButton
                            sourceId={item.source_id}
                            sourceName={item.source.name}
                          />
                        )}
                      </div>

                      {/* 标题 */}
                      <h2 className="text-lg sm:text-xl font-bold mb-3 text-gray-900 leading-tight">{item.title}</h2>

                      {/* 文章配图 */}
                      {item.content_type === 'article' && item.image_url && (
                        <div className="mb-4 rounded-lg overflow-hidden">
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-auto object-cover"
                            onError={(e) => {
                              // 如果图片加载失败，隐藏图片
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      {/* YouTube 视频播放器 */}
                      {item.content_type === 'video' && (() => {
                        // 优先使用数据库中的 video_id，如果没有则从 URL 提取
                        const videoId = item.video_id || extractYouTubeVideoId(item.original_url);
                        if (!videoId) return null;

                        const isPlaying = playingVideoId === videoId;

                        return (
                          <div className="mb-4 rounded-lg overflow-hidden shadow-lg">
                            <div className="relative" style={{ paddingBottom: '56.25%' }}>
                              {isPlaying ? (
                                <iframe
                                  className="absolute top-0 left-0 w-full h-full"
                                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
                                  title={item.title}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              ) : (
                                <div
                                  className="absolute top-0 left-0 w-full h-full cursor-pointer group"
                                  onClick={() => setPlayingVideoId(videoId)}
                                >
                                  {/* 缩略图 - 底层 */}
                                  <img
                                    src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // 如果最高清缩略图失败，尝试高清缩略图
                                      const target = e.currentTarget;
                                      if (target.src.includes('maxresdefault')) {
                                        target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                      } else if (target.src.includes('hqdefault')) {
                                        // 如果高清也失败，尝试标准缩略图
                                        target.src = `https://img.youtube.com/vi/${videoId}/sddefault.jpg`;
                                      }
                                    }}
                                  />
                                  {/* 播放按钮覆盖层 - 上层 */}
                                  <div className="absolute inset-0 flex items-center justify-center group-hover:bg-black group-hover:bg-opacity-30 transition-all">
                                    <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                                      <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* 内容摘要（视频不显示） */}
                      {item.ai_summary && item.content_type === 'article' && (
                        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                          <div className="text-sm font-bold text-blue-700 mb-2">📝 内容摘要</div>
                          <p className="text-gray-800 text-base leading-normal">{item.ai_summary}</p>
                        </div>
                      )}

                      {/* 专业解读 */}
                      {item.ai_commentary && (
                        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                          <div className="text-sm font-bold text-purple-700 mb-2">💬 专业解读</div>
                          {(() => {
                            const isExpanded = expandedCommentary.has(item.id);
                            const shouldTruncate = item.ai_commentary.length > 100;
                            const displayText = isExpanded || !shouldTruncate
                              ? item.ai_commentary
                              : item.ai_commentary.substring(0, 100) + '...';

                            return (
                              <>
                                <p className="text-gray-800 text-base leading-normal whitespace-pre-wrap">
                                  {displayText}
                                </p>
                                {shouldTruncate && (
                                  <button
                                    onClick={() => toggleCommentary(item.id)}
                                    className="mt-2 text-purple-600 hover:text-purple-800 text-xs font-medium transition-colors"
                                  >
                                    {isExpanded ? '收起 ▲' : '展开 ▼'}
                                  </button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {/* 底部链接 */}
                      <div className="flex gap-3 sm:gap-4 text-gray-500 text-xs sm:text-sm">
                        <a
                          href={item.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-500 transition-colors"
                        >
                          🔗 查看原文
                        </a>
                        <span>
                          {item.content_type === 'video' ? '🎥 视频' : '📄 文章'}
                        </span>
                      </div>

                      {/* 评论区 */}
                      <CommentSection
                        newsItemId={item.id}
                        initialCommentCount={item.comment_count || 0}
                      />
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 底部提示 */}
      {newsBatches.length > 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          共 {newsBatches.length} 批更新，累计 {getTotalNewsCount()} 条新闻
        </div>
      )}
    </div>
  );
}
