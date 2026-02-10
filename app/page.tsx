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
      <div className="bg-card border-b border-card-border sticky top-[48px] sm:top-[61.5px] z-10 transition-colors h-[48px]">
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
                    <article key={item.id} className="bg-card p-4 sm:p-5 hover:bg-background/50 transition-colors border-b border-card-border last:border-0 rounded-xl mb-4 sm:mb-6 shadow-sm ring-1 ring-card-border">
                      {/* 头部信息 - 更加精致 */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-extrabold text-sm sm:text-base flex-shrink-0 shadow-inner">
                          {item.source?.name.charAt(0) || 'N'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-text-accent text-[15px] sm:text-[17px] truncate leading-tight">
                              {item.source?.name || '未知来源'}
                            </span>
                            <span className="text-text-muted text-[12px] sm:text-[13px] font-medium opacity-80 uppercase tracking-wider">
                              {formatBatchTime(batch.batchTime)}
                            </span>
                          </div>
                        </div>
                        {item.source && (
                          <div className="flex-shrink-0 scale-90 sm:scale-100">
                            <FollowButton sourceId={item.source_id} />
                          </div>
                        )}
                      </div>

                      {/* 标题 - 更加醒目 */}
                      <h2 className="text-[19px] sm:text-[22px] font-black mb-4 text-foreground leading-[1.3] tracking-tight hover:text-teal-600 transition-colors cursor-pointer">
                        {item.title}
                      </h2>

                      {/* 内容摘要 - City666 风格方框 */}
                      {item.ai_summary && item.content_type === 'article' && (
                        <div className="mb-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border-l-[6px] border-teal-500 overflow-hidden shadow-sm">
                          <div className="flex items-center justify-between px-4 py-3 bg-gray-100/50 dark:bg-white/5">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">📝</span>
                              <span className="text-[14px] font-black text-teal-700 dark:text-teal-400 tracking-wide uppercase">内容摘要</span>
                            </div>
                            <button
                              onClick={() => toggleCommentary(`${item.id}-summary`)}
                              className="text-teal-600 dark:text-teal-400 hover:text-teal-800 text-[13px] font-bold flex items-center gap-1 group"
                            >
                              <span>{expandedCommentary.has(`${item.id}-summary`) ? '收起全文' : '查看全文'}</span>
                              <span className={`transform transition-transform ${expandedCommentary.has(`${item.id}-summary`) ? 'rotate-180' : ''}`}>▼</span>
                            </button>
                          </div>
                          <div className="px-4 py-3">
                            <p className={`text-text-secondary text-[16px] leading-[1.6] font-medium font-sans ${expandedCommentary.has(`${item.id}-summary`) ? '' : 'line-clamp-2'}`}>
                              {item.ai_summary}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 文章配图 - 带城市角标 */}
                      {item.content_type === 'article' && item.image_url && (
                        <div className="mb-5 rounded-xl overflow-hidden shadow-md relative group">
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-auto max-h-[400px] object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          {/* 城市角标 */}
                          {item.location && (
                            <div className="absolute top-4 left-4 bg-black/80 text-white text-[12px] font-black px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm border border-white/10 tracking-widest uppercase">
                              {item.location}
                            </div>
                          )}
                        </div>
                      )}

                      {/* YouTube 视频播放器 */}
                      {item.content_type === 'video' && (() => {
                        const videoId = item.video_id || extractYouTubeVideoId(item.original_url);
                        if (!videoId) return null;
                        const isPlaying = playingVideoId === videoId;

                        return (
                          <div className="mb-5 rounded-xl overflow-hidden shadow-xl ring-1 ring-white/10 relative">
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
                                  <img
                                    src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      if (target.src.includes('maxresdefault')) {
                                        target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                      } else if (target.src.includes('hqdefault')) {
                                        target.src = `https://img.youtube.com/vi/${videoId}/sddefault.jpg`;
                                      }
                                    }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600/90 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform backdrop-blur-[2px]">
                                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            {/* 视频城市角标 */}
                            {item.location && !isPlaying && (
                              <div className="absolute top-4 left-4 bg-black/80 text-white text-[12px] font-black px-3 py-1.5 rounded-lg shadow-lg border border-white/10 tracking-widest uppercase">
                                {item.location}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* 专业解读 - City666 风格方框 */}
                      {item.ai_commentary && (
                        <div className="mb-5 bg-gray-50 dark:bg-gray-800/40 rounded-xl border-l-[6px] border-cyan-500 overflow-hidden shadow-sm">
                          <div className="flex items-center justify-between px-4 py-3 bg-gray-100/50 dark:bg-white/5">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">💬</span>
                              <span className="text-[14px] font-black text-cyan-700 dark:text-cyan-400 tracking-wide uppercase">专业解读</span>
                            </div>
                            <button
                              onClick={() => toggleCommentary(item.id)}
                              className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 text-[13px] font-bold flex items-center gap-1 group"
                            >
                              <span>{expandedCommentary.has(item.id) ? '收起解读' : '展开解读'}</span>
                              <span className={`transform transition-transform ${expandedCommentary.has(item.id) ? 'rotate-180' : ''}`}>▼</span>
                            </button>
                          </div>
                          <div className="px-4 py-3">
                            <p className={`text-text-secondary text-[16px] leading-[1.6] font-medium whitespace-pre-wrap font-sans ${expandedCommentary.has(item.id) ? '' : 'line-clamp-2'}`}>
                              {item.ai_commentary}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 底部链接与分享 - 精简化 */}
                      <div className="flex items-center justify-between mb-5 border-t border-card-border pt-4">
                        <div className="flex items-center gap-3">
                          <a
                            href={item.original_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 py-1.5 text-teal-600 dark:text-teal-400 text-[14px] font-black hover:opacity-80 transition-all group"
                          >
                            <span className="group-hover:translate-x-1 transition-transform tracking-tight">阅读原文</span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </a>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleShare(item)}
                            className="p-2 text-text-muted hover:text-teal-600 transition-colors bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                            title="分享"
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                              <polyline points="16 6 12 2 8 6" />
                              <line x1="12" y1="2" x2="12" y2="15" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* 评论区 */}
                      <div className="mt-2">
                        <CommentSection
                          newsItemId={item.id}
                          initialCommentCount={item.comment_count || 0}
                        />
                      </div>
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
