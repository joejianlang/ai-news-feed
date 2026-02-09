'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { NewsItem, Category } from '@/types';
import { useUser } from '@/lib/contexts/UserContext';
import { useLocation, POPULAR_CITIES } from '@/lib/contexts/LocationContext';
import Navbar from '@/components/Navbar';
import FollowButton from '@/components/FollowButton';
import CommentSection from '@/components/comments/CommentSection';
import Toast from '@/components/Toast';

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
  const { user } = useUser();
  const { city, cityTag, isLocating, error: locationError, detectLocation, setManualCity } = useLocation();
  const [newsBatches, setNewsBatches] = useState<NewsBatch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [expandedCommentary, setExpandedCommentary] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // null = 全部
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

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
  }, [autoRefresh, selectedCategory, cityTag]); // 添加 cityTag 依赖

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
      // 检查当前是否选中了"本地"分类
      const currentCategory = categories.find(c => c.id === selectedCategory);
      const isLocalCategory = currentCategory?.name === '本地' || currentCategory?.name === 'Local';

      // 构建 URL Params
      const params = new URLSearchParams();
      if (selectedCategory) params.append('categoryId', selectedCategory);
      // 只有在"本地"分类下，且有 cityTag 时才传 city
      if (isLocalCategory && cityTag) params.append('city', cityTag);

      const response = await fetch(`/api/news?${params.toString()}`);
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

  const handleShare = async (item: NewsItem) => {
    const shareData = {
      title: item.title,
      text: item.ai_summary || item.title,
      url: window.location.origin + `?item=${item.id}`, // 或者直接分享原文链接，看需求
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(`${shareData.title}\n${item.original_url}`);
        setToast({ message: 'Link copied to clipboard', type: 'success' });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback: Copy to clipboard if sharing fails
      try {
        await navigator.clipboard.writeText(`${item.title}\n${item.original_url}`);
        setToast({ message: 'Link copied to clipboard', type: 'success' });
      } catch (copyError) {
        console.error('Copy failed:', copyError);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* 顶部导航 */}
      <Navbar />

      {/* 分类标签栏 - 与 Navbar 一起固定 */}
      <div className="bg-card border-b border-card-border sticky top-[57px] z-10 transition-colors">
        <div className="max-w-2xl mx-auto">
          <div className="flex overflow-x-auto scrollbar-hide">
            {/* 全部 选项 */}
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-4 py-3 text-[17px] font-bold border-b-2 transition-colors ${selectedCategory === null
                ? 'text-teal-600 border-teal-600'
                : 'text-text-secondary border-transparent hover:text-foreground hover:border-card-border'
                }`}
            >
              全部
            </button>
            {/* 动态分类 - 过滤掉旧分类 */}
            {categories
              .filter((cat: Category) => !['传统新闻媒体', 'YouTube网红', '网络专业媒体'].includes(cat.name))
              .map((category: Category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 px-4 py-3 text-[17px] font-bold border-b-2 transition-colors ${selectedCategory === category.id
                    ? 'text-teal-600 border-teal-600'
                    : 'text-text-secondary border-transparent hover:text-foreground hover:border-card-border'
                    }`}
                >
                  {category.name}
                </button>
              ))}
          </div>
        </div>
      </div>



      {/* 地理位置栏 - 仅在"本地"分类显示 */}
      {categories.find(c => c.id === selectedCategory)?.name === '本地' && (
        <div className="bg-teal-50 dark:bg-teal-900/20 border-b border-teal-100 dark:border-teal-900/30">
          <div className="max-w-2xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-teal-800">
              <span>📍 Current Location:</span>
              {isLocating ? (
                <span className="animate-pulse">Locating...</span>
              ) : (
                <span className="font-bold text-lg">{city || 'All Local News'}</span>
              )}
              {locationError && <span className="text-red-500 text-xs">({locationError})</span>}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={detectLocation}
                disabled={isLocating}
                className="text-xs bg-white text-teal-600 border border-teal-200 px-3 py-1 rounded-full hover:bg-teal-100 transition-colors"
              >
                📡 Relocate
              </button>

              <select
                className="text-xs bg-white text-gray-700 border border-gray-300 px-2 py-1 rounded-full focus:outline-none focus:ring-1 focus:ring-teal-500"
                value={cityTag || ''}
                onChange={(e) => setManualCity(e.target.value)}
              >
                <option value="">All Cities</option>
                {POPULAR_CITIES.map(c => (
                  <option key={c.tag} value={c.tag}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 时间线 */}
      <main className="max-w-2xl mx-auto">
        {isLoading && newsBatches.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : newsBatches.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-20 text-center">
            <div className="text-gray-500 mb-4">暂无新闻</div>
          </div>
        ) : (
          <div className="space-y-6">
            {newsBatches.map((batch, batchIndex) => (
              <div key={batch.batchTime} className="bg-card rounded-lg shadow-sm overflow-hidden transition-colors">
                {/* 批次内的新闻列表 */}
                <div className="divide-y divide-card-border">
                  {batch.items.map(item => (
                    <article key={item.id} className="bg-card p-4 sm:p-6 hover:bg-background transition-colors">
                      {/* 头部信息 */}
                      <div className="flex items-center gap-2 sm:gap-3 mb-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                          {item.source?.name.charAt(0) || 'N'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            <span className="font-bold text-text-accent text-sm sm:text-base truncate">{item.source?.name || '未知来源'}</span>
                            <span className="text-text-muted text-xs sm:text-sm">·</span>
                            <span className="text-text-muted text-xs sm:text-sm">{formatBatchTime(batch.batchTime)}</span>
                          </div>
                          {/* 已移除评论风格显示 */}
                        </div>
                        {item.source && (
                          <FollowButton
                            sourceId={item.source_id}
                          />
                        )}
                      </div>

                      {/* 标题 */}
                      <h2 className="text-lg sm:text-xl font-bold mb-3 text-foreground leading-tight">{item.title}</h2>

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

                      {/* 内容摘要 */}
                      {item.ai_summary && item.content_type === 'article' && (
                        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border-l-4 border-teal-400">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-bold text-teal-700">📝 内容摘要</div>
                            <button
                              onClick={() => toggleCommentary(`${item.id}-summary`)}
                              className="text-teal-600 hover:text-teal-800 text-xs font-medium"
                            >
                              {expandedCommentary.has(`${item.id}-summary`) ? '收起 ▲' : '查看全文 ▼'}
                            </button>
                          </div>
                          <p className={`text-text-secondary text-base leading-normal ${expandedCommentary.has(`${item.id}-summary`) ? '' : 'line-clamp-1'}`}>
                            {item.ai_summary}
                          </p>
                        </div>
                      )}

                      {/* 专业解读 */}
                      {item.ai_commentary && (
                        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border-l-4 border-cyan-400">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-bold text-cyan-700">💬 专业解读</div>
                            <button
                              onClick={() => toggleCommentary(item.id)}
                              className="text-cyan-600 hover:text-cyan-800 text-xs font-medium"
                            >
                              {expandedCommentary.has(item.id) ? '收起 ▲' : '展开解读 ▼'}
                            </button>
                          </div>
                          <p className={`text-text-secondary text-base leading-normal whitespace-pre-wrap ${expandedCommentary.has(item.id) ? '' : 'line-clamp-1'}`}>
                            {item.ai_commentary}
                          </p>
                        </div>
                      )}

                      {/* 底部链接与分享 */}
                      <div className="flex items-center gap-3 mb-4">
                        <a
                          href={item.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-card text-text-accent rounded-full text-sm font-medium hover:bg-background transition-colors border border-card-border"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-0.5">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                          <span>查看原文</span>
                        </a>
                        <button
                          onClick={() => handleShare(item)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-card text-text-muted rounded-full text-sm font-medium hover:bg-background transition-colors border border-card-border"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-0.5">
                            <path d="M15 8l5 5-5 5" />
                            <path d="M20 13H10a8 8 0 0 0-8 8" />
                          </svg>
                          <span>分享</span>
                        </button>
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

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
