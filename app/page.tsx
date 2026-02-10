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
  const [activeTabs, setActiveTabs] = useState<Record<string, 'summary' | 'commentary'>>({});
  const [expansionStates, setExpansionStates] = useState<Record<string, 'preview' | 'full'>>({});
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

  const toggleTab = (itemId: string, tab: 'summary' | 'commentary') => {
    setActiveTabs(prev => ({ ...prev, [itemId]: tab }));
  };

  const toggleExpansion = (itemId: string, state: 'preview' | 'full') => {
    setExpansionStates(prev => ({ ...prev, [itemId]: state }));
    if (state === 'preview') {
      // 收起时滚动回条目顶部
      const element = document.getElementById(`article-${itemId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
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
      <div className="bg-card border-b border-card-border sticky top-[48px] sm:top-[64px] z-30 transition-colors h-[48px]">
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

            {/* 我的关注 - 显示快捷入口 */}
            {user && (
              <Link
                href="/following"
                className="flex-shrink-0 px-4 py-3 text-[17px] font-bold border-b-2 border-transparent text-teal-600 hover:text-teal-700 flex items-center gap-1.5 transition-colors group"
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg className="w-4 h-4 fill-teal-600 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <span>关注</span>
              </Link>
            )}
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
                  {batch.items.map(item => {
                    const activeTab = activeTabs[item.id] || 'summary';
                    const isFullExpanded = expansionStates[item.id] === 'full';
                    const content = activeTab === 'summary' ? item.ai_summary : item.ai_commentary;
                    const hasBoth = !!(item.ai_summary && item.ai_commentary);

                    return (
                      <article
                        key={item.id}
                        id={`article-${item.id}`}
                        className={`bg-card transition-all duration-500 border-b border-card-border last:border-0 sm:rounded-2xl mb-4 sm:mb-8 shadow-sm ring-1 ring-card-border overflow-hidden ${isFullExpanded ? 'ring-teal-500/30 shadow-xl' : ''}`}
                      >
                        {/* 头部信息 - 全文模式下隐藏 */}
                        {!isFullExpanded && (
                          <div className="px-4 pt-3 sm:pt-4 pb-2">
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

                            <h2 className="text-xl sm:text-2xl font-black text-foreground leading-[1.3] tracking-tight group-hover:text-teal-600 transition-colors mb-2">
                              {item.title}
                            </h2>
                          </div>
                        )}

                        {/* 整合容器：包含操控栏、图片、Tab 和内容 */}
                        <div className={`mx-0 mb-5 bg-transparent dark:bg-black rounded-none border-y border-card-border/50 ${isFullExpanded ? 'mt-0 pt-0' : '-mt-2.5'}`}>
                          {/* 展开后的顶部操控栏 - 移入容器内部以防止遮挡图片 */}
                          {isFullExpanded && (
                            <div className="sticky top-[96px] sm:top-[112px] z-20 bg-background/95 backdrop-blur-md border-b border-teal-500/10 px-4 py-2 flex items-center justify-between animate-in fade-in slide-in-from-top-1">
                              <div className="flex items-center gap-4">
                                <span className="text-teal-600 font-extrabold text-sm uppercase tracking-widest">
                                  正在阅读
                                </span>
                                <a
                                  href={item.original_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-text-muted hover:text-teal-600 text-sm font-bold flex items-center gap-1"
                                >
                                  <span>打开原文</span>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                  </svg>
                                </a>
                              </div>
                              <button
                                onClick={() => handleShare(item)}
                                className="p-2 text-text-muted hover:text-teal-600 font-bold"
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                  <polyline points="16 6 12 2 8 6" />
                                  <line x1="12" y1="2" x2="12" y2="15" />
                                </svg>
                              </button>
                            </div>
                          )}

                          <div className="px-4 py-3 sm:py-4">
                            {/* 文章配图 / 视频 - 专业解读模式下显示时隐藏 */}
                            {!(isFullExpanded && activeTab === 'commentary') && (
                              <div className="mb-2 rounded-xl overflow-hidden shadow-sm ring-1 ring-black/5 transition-all duration-300">
                                {item.content_type === 'article' && item.image_url && (
                                  <div className="relative group overflow-hidden">
                                    <img
                                      src={item.image_url}
                                      alt={item.title}
                                      className="w-full h-auto max-h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                    {item.location && (
                                      <div className="absolute top-3 left-3 bg-black/80 text-white text-[10px] font-black px-2 py-1 rounded flex items-center gap-1.5 shadow-lg backdrop-blur-sm border border-white/10 tracking-widest uppercase">
                                        <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse"></span>
                                        {item.location}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {item.content_type === 'video' && (() => {
                                  const videoId = item.video_id || extractYouTubeVideoId(item.original_url);
                                  if (!videoId) return null;
                                  const isPlaying = playingVideoId === videoId;

                                  return (
                                    <div className="relative overflow-hidden">
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
                                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                              onError={(e) => {
                                                const target = e.currentTarget;
                                                if (target.src.includes('maxresdefault')) {
                                                  target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                                }
                                              }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-all">
                                              <div className="w-14 h-14 bg-red-600/90 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                                                <svg className="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M8 5v14l11-7z" />
                                                </svg>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      {item.location && !isPlaying && (
                                        <div className="absolute top-3 left-3 bg-black/80 text-white text-[10px] font-black px-2 py-1 rounded flex items-center gap-1.5 shadow-lg border border-white/10 tracking-widest uppercase">
                                          <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse"></span>
                                          {item.location}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}

                            {/* 交互式 Tabs - 紧贴下方 */}
                            <div className="flex border-b border-card-border/50 mb-3">
                              <button
                                onClick={() => toggleTab(item.id, 'summary')}
                                className={`flex-1 py-3 text-[16px] font-black uppercase tracking-widest transition-all ${activeTab === 'summary'
                                  ? 'text-teal-600 border-b-2 sm:border-b-4 border-teal-600'
                                  : 'text-text-muted opacity-60'
                                  }`}
                              >
                                内容摘要
                              </button>
                              {item.ai_commentary && (
                                <button
                                  onClick={() => toggleTab(item.id, 'commentary')}
                                  className={`flex-1 py-3 text-[16px] font-black uppercase tracking-widest transition-all ${activeTab === 'commentary'
                                    ? 'text-cyan-600 border-b-2 sm:border-b-4 border-cyan-600'
                                    : 'text-text-muted opacity-60'
                                    }`}
                                >
                                  专业解读
                                </button>
                              )}
                            </div>

                            {/* 内容展示区 -摘要仅 1 行 */}
                            <div className="relative">
                              <div
                                className={`transition-all duration-700 overflow-hidden ${isFullExpanded ? 'max-h-none' : 'max-h-[100px]'
                                  }`}
                              >
                                <p className={`text-text-secondary dark:text-white text-[16px] leading-[1.7] font-medium font-sans whitespace-pre-wrap ${!isFullExpanded ? 'line-clamp-1' : ''}`}>
                                  {content}
                                </p>

                                {/* 预览状态下的展开按钮 */}
                                {!isFullExpanded && (
                                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-100 dark:from-black via-gray-100/50 dark:via-black/50 to-transparent flex items-end justify-center pb-1">
                                    <button
                                      onClick={() => toggleExpansion(item.id, 'full')}
                                      className="px-6 py-2 bg-teal-600 text-white rounded-full font-black text-xs shadow-lg hover:bg-teal-700 transition-all flex items-center gap-1.5 ring-4 ring-teal-500/10"
                                    >
                                      <span>继续阅读</span>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m6 9 6 6 6-6" />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* 全量展开后的收起按钮 - 移到底部 */}
                              {isFullExpanded && (
                                <div className="mt-8 pt-4 border-t border-card-border/30 flex justify-center pb-4">
                                  <button
                                    onClick={() => toggleExpansion(item.id, 'preview')}
                                    className="px-8 py-2.5 bg-gray-200 dark:bg-gray-800 text-text-muted dark:text-gray-300 rounded-full font-black text-xs hover:bg-gray-300 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="m18 15-6-6-6 6" />
                                    </svg>
                                    <span>收起全文内容</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 底部功能栏 - 重构为多行布局 */}
                        {!isFullExpanded && (
                          <div className="px-4 pb-5 pt-2 flex flex-col gap-4">
                            {/* 第一行：原文与分享 */}
                            <div className="flex justify-between items-center">
                              <a
                                href={item.original_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-teal-600 dark:text-teal-400 text-[15px] font-black hover:opacity-80 transition-all flex items-center gap-1.5"
                              >
                                <span>原文</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="m9 18 6-6-6-6" />
                                </svg>
                              </a>

                              <button
                                onClick={() => handleShare(item)}
                                className="p-2 text-text-muted hover:text-teal-600 hover:bg-teal-500/10 rounded-full transition-all"
                                aria-label="分享"
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                                  <polyline points="16 6 12 2 8 6" />
                                  <line x1="12" y1="2" x2="12" y2="15" />
                                </svg>
                              </button>
                            </div>

                            {/* 第二行：独立的评论区块 */}
                            <div className="w-full">
                              <CommentSection
                                newsItemId={item.id}
                                initialCommentCount={item.comment_count || 0}
                              />
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 底部提示 */}
      {
        newsBatches.length > 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            共 {newsBatches.length} 批更新，累计 {getTotalNewsCount()} 条新闻
          </div>
        )
      }

      {
        toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )
      }
    </div >
  );
}
