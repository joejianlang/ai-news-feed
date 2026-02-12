'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { NewsItem, Category, AdItem } from '@/types';
import { useUser } from '@/lib/contexts/UserContext';
import { useLocation, POPULAR_CITIES } from '@/lib/contexts/LocationContext';
import Navbar from '@/components/Navbar';
import FollowButton from '@/components/FollowButton';
import CommentSection from '@/components/comments/CommentSection';
import Toast from '@/components/Toast';
import AdCard from '@/components/AdCard';
import { renderMarkdown } from '@/lib/utils/markdown';
import { formatTime, formatBatchTime } from '@/lib/utils/format';

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
  const [activeAds, setActiveAds] = useState<AdItem[]>([]);
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

      // 同时获取广告
      try {
        const adsRes = await fetch('/api/ads');
        const adsData = await adsRes.json();
        if (adsData.ads) setActiveAds(adsData.ads);
      } catch (e) {
        console.error('Failed to fetch ads:', e);
      }

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

  // 自动收起已离开屏幕的展开条目
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            const itemId = entry.target.id.replace('article-', '');
            setExpansionStates((prev) => {
              if (prev[itemId] === 'full') {
                return { ...prev, [itemId]: 'preview' };
              }
              return prev;
            });
          }
        });
      },
      {
        threshold: 0,
        rootMargin: '400px 0px 400px 0px', // 给予较大的上下缓冲空间，确保用户只是稍微划过时不会断开阅读
      }
    );

    // 监听所有带 article id 的元素
    const articles = document.querySelectorAll('article[id^="article-"]');
    articles.forEach((article) => observer.observe(article));

    return () => observer.disconnect();
  }, [newsBatches, expansionStates]); // 当新闻列表或展开状态变化时，确保观察者保持最新状态

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

    // 当切换 Tab 时，自动将“正在阅读”栏对齐到分类栏下方
    setTimeout(() => {
      const element = document.getElementById(`reading-bar-${itemId}`);
      if (element) {
        // 计算顶部吸顶栏的高度 (Navbar + CategoryBar)
        const headerHeight = window.innerWidth < 640 ? 96 : 112;
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: elementPosition - headerHeight,
          behavior: 'smooth'
        });
      }
    }, 50);
  };

  const toggleExpansion = (itemId: string, state: 'preview' | 'full') => {
    setExpansionStates(prev => ({ ...prev, [itemId]: state }));

    if (state === 'preview') {
      // 收起时滚动回条目顶部
      const element = document.getElementById(`article-${itemId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (state === 'full') {
      // 展开时，自动将“正在阅读”栏对齐到分类栏下方
      setTimeout(() => {
        const element = document.getElementById(`reading-bar-${itemId}`);
        if (element) {
          const headerHeight = window.innerWidth < 640 ? 96 : 112;
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({
            top: elementPosition - headerHeight,
            behavior: 'smooth'
          });
        }
      }, 100); // 稍微长一点的延迟确保展开动画和 DOM 渲染完成
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
        <div className="max-w-6xl mx-auto">
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
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-4">
        {isLoading && newsBatches.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : newsBatches.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-20 text-center">
            <div className="text-gray-500 mb-4">暂无新闻</div>
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              let globalItemIndex = 0;
              return newsBatches.map((batch) => (
                <div key={batch.batchTime}>
                  {batch.items
                    .filter((item) => item.ai_summary) // 过滤掉没有 AI 摘要的条目
                    .map((item) => {
                      globalItemIndex++;
                      const isAllCategory = selectedCategory === null;
                      const activeTab = activeTabs[item.id] || (item.ai_summary ? 'summary' : 'commentary');
                      const isFullExpanded = expansionStates[item.id] === 'full';
                      const isInternal = item.source?.name === '原创文章' ||
                        item.source?.name === '数位 Buffet' ||
                        (item.original_url && (
                          item.original_url.includes('/article/') ||
                          item.original_url.startsWith('#')
                        ));

                      const displayContent = activeTab === 'summary'
                        ? (item.ai_summary || item.content) // 始终优先显示 AI 摘要（通常是中文），只有没有摘要时才显示原始内容
                        : item.ai_commentary;

                      const ad = activeAds.length > 0 && globalItemIndex % 5 === 0
                        ? activeAds[Math.floor(globalItemIndex / 5 - 1) % activeAds.length]
                        : null;

                      const videoId = item.content_type === 'video' ? (item.video_id || extractYouTubeVideoId(item.original_url)) : null;

                      return (
                        <React.Fragment key={item.id}>
                          <article
                            id={`article-${item.id}`}
                            className="bg-card rounded-[24px] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] overflow-hidden mb-5 transition-all duration-300 border border-card-border"
                          >
                            {isAllCategory && !isFullExpanded ? (                                /* 1. Collapsed "All" Category Layout: List Style */
                              <div
                                className="flex gap-4 p-4 items-center cursor-pointer active:bg-slate-50/50 dark:active:bg-white/5 transition-colors"
                                onClick={() => toggleExpansion(item.id, 'full')}
                              >
                                {/* Left: Thumbnail */}
                                {(videoId || (item.image_url && item.image_url !== '')) && (
                                  <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-2xl bg-slate-100 dark:bg-white/5 overflow-hidden">
                                    <img
                                      src={item.content_type === 'video' && videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : item.image_url!}
                                      alt={item.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}

                                {/* Right: Meta & Title & Details Button */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5 overflow-hidden">
                                    <span className="text-blue-600 dark:text-blue-400 font-extrabold text-[11px] uppercase tracking-tight truncate max-w-[120px]">
                                      {item.source?.name || 'Unknown Source'}
                                    </span>
                                    <span className="text-slate-300 dark:text-slate-600 font-black">·</span>
                                    <span className="text-text-muted text-[11px] font-bold uppercase whitespace-nowrap">
                                      {formatTime(item.created_at)}
                                    </span>
                                  </div>
                                  <h2 className="text-[16px] sm:text-[17px] font-black text-text-primary leading-[1.4] tracking-tight line-clamp-2">
                                    {item.title}
                                    <span
                                      className="inline-flex items-center gap-1 ml-2 text-teal-600 dark:text-teal-400 font-black text-[13px] whitespace-nowrap"
                                    >
                                      详情
                                      <svg className="w-3 h-3 translate-y-px" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </span>
                                  </h2>
                                </div>
                              </div>
                            ) : (
                              /* 2. Standard Layout (Full Expansion or Other Categories) */
                              <>
                                {/* 1. Image Area (Top) - Conditional Rendering */}
                                {(videoId || (item.image_url && item.image_url !== '')) && (
                                  <div className="relative mx-[10px] mt-[10px] rounded-[16px] aspect-[16/10] bg-slate-100 dark:bg-slate-800/50 overflow-hidden group">
                                    {item.content_type === 'video' && videoId ? (
                                      <div className="absolute inset-0 bg-black">
                                        {playingVideoId === videoId ? (
                                          <iframe
                                            className="w-full h-full"
                                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
                                            title={item.title}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                          />
                                        ) : (
                                          <div
                                            className="absolute inset-0 cursor-pointer"
                                            onClick={() => setPlayingVideoId(videoId)}
                                          >
                                            <img
                                              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                                              alt={item.title}
                                              className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                                              onError={(e) => {
                                                const target = e.currentTarget;
                                                if (target.src.includes('maxresdefault')) {
                                                  target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                                }
                                              }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                                                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <img
                                        src={item.image_url!}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }}
                                      />
                                    )}

                                    {/* Location Tag */}
                                    {item.location && (
                                      <div className="absolute top-4 left-4 z-10">
                                        <div className="bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-black px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-wider flex items-center gap-1.5 border border-white/10 transition-transform hover:scale-105">
                                          <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.6)]"></span>
                                          {item.location}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Card Body */}
                                <div className="px-5 pt-3 sm:px-6 sm:pt-3 pb-0">
                                  {/* 2. Meta Row: Source & Follow */}
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                      <span className="text-blue-600 dark:text-blue-400 font-extrabold text-[13px] uppercase tracking-tight truncate max-w-[200px]">
                                        {item.source?.name || 'Unknown Source'}
                                      </span>
                                      <span className="text-slate-300 dark:text-slate-600 font-black">·</span>
                                      <span className="text-text-muted text-[12px] font-bold uppercase whitespace-nowrap">
                                        {formatTime(item.created_at)}
                                      </span>
                                    </div>
                                    {item.source && (
                                      <div className="flex-shrink-0 origin-right transition-transform active:scale-95">
                                        <FollowButton sourceId={item.source_id} />
                                      </div>
                                    )}
                                  </div>

                                  {/* 3. Title */}
                                  <h2
                                    className="text-[18px] sm:text-[20px] font-black text-text-primary leading-[1.3] tracking-tight mb-3 hover:text-teal-700 dark:hover:text-teal-400 transition-colors cursor-pointer line-clamp-3"
                                    onClick={() => !isFullExpanded && toggleExpansion(item.id, 'full')}
                                  >
                                    {item.title}
                                    {!isFullExpanded && (
                                      <span
                                        className="inline-flex items-center gap-1 ml-2 text-teal-600 dark:text-teal-400 font-black text-[14px] whitespace-nowrap"
                                      >
                                        详情
                                        <svg className="w-3.5 h-3.5 translate-y-px" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                      </span>
                                    )}
                                  </h2>

                                  {/* 4. AI Section */}
                                  {(item.ai_summary || item.ai_commentary) && (
                                    <div className="mb-0">
                                      {!isFullExpanded ? null : (
                                        /* Expanded: Show Tabs and Full Content */
                                        <div className="mb-4 animate-in fade-in slide-in-from-top-1 duration-300">
                                          <div className="flex gap-8 border-b border-card-border mb-3 px-1">
                                            {/* Summary Tab */}
                                            <button
                                              onClick={(e) => { e.stopPropagation(); toggleTab(item.id, 'summary'); }}
                                              className={`pb-3 text-[15px] font-black transition-all relative group ${activeTab === 'summary' ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
                                            >
                                              内容摘要
                                              {activeTab === 'summary' && (
                                                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-teal-500 rounded-t-full shadow-[0_-2px_6px_rgba(20,184,166,0.2)]"></div>
                                              )}
                                            </button>

                                            {/* Analysis Tab */}
                                            {item.ai_commentary && (
                                              <button
                                                onClick={(e) => { e.stopPropagation(); toggleTab(item.id, 'commentary'); }}
                                                className={`pb-3 text-[15px] font-black transition-all relative group ${activeTab === 'commentary' ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
                                              >
                                                专业解读
                                                {activeTab === 'commentary' && (
                                                  <div className="absolute bottom-0 left-0 w-full h-[3px] bg-teal-500 rounded-t-full shadow-[0_-2px_6px_rgba(20,184,166,0.2)]"></div>
                                                )}
                                              </button>
                                            )}
                                          </div>

                                          <div className="relative min-h-[60px] mb-4">
                                            <div className="prose prose-slate prose-sm sm:prose-base dark:prose-invert max-w-none text-text-secondary leading-relaxed font-medium">
                                              {displayContent ? (
                                                activeTab === 'summary' ? (
                                                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(displayContent) }} />
                                                ) : (
                                                  <div className="italic text-text-primary bg-background p-4 rounded-xl border border-card-border">
                                                    {displayContent}
                                                  </div>
                                                )
                                              ) : (
                                                <p className="italic text-slate-400 dark:text-slate-600 text-center py-4">暂无摘要内容...</p>
                                              )}
                                            </div>
                                          </div>

                                          {/* Collapse Button */}
                                          <div className="flex justify-center mb-2">
                                            <button
                                              onClick={() => toggleExpansion(item.id, 'preview')}
                                              className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 px-8 py-2 rounded-full border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-black text-[13px] group shadow-sm active:scale-95"
                                            >
                                              <svg className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                                              收起全文
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {isFullExpanded && (
                                  <>
                                    <div className="px-5 sm:px-6 py-1.5 flex items-center justify-between border-t border-card-border mt-1">
                                      <div className="flex items-center gap-6">
                                        {!isInternal && (
                                          <a
                                            href={item.original_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-blue-500 hover:text-blue-700 transition-colors group"
                                          >
                                            <span className="text-[13px] font-extrabold group-hover:underline decoration-2 underline-offset-4 decoration-blue-200">阅读原文</span>
                                            <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                          </a>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2 text-slate-300">
                                        <button
                                          onClick={() => handleShare(item)}
                                          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-50 hover:text-slate-600 transition-all text-slate-400"
                                        >
                                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                                        </button>
                                        <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-50 hover:text-slate-600 transition-all text-slate-400">
                                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                                        </button>
                                      </div>
                                    </div>

                                    {/* 6. Footer Level 2: Comments (Integrated) */}
                                    <div className="border-t border-slate-100 bg-slate-50/30">
                                      <div className="px-5 sm:px-6 py-2">
                                        <CommentSection
                                          newsItemId={item.id}
                                          initialCommentCount={item.comment_count || 0}
                                        />
                                      </div>
                                    </div>
                                  </>
                                )}
                              </>
                            )}
                          </article>
                          {ad && <AdCard ad={ad as AdItem} />}
                        </React.Fragment>
                      );
                    })}
                </div>
              ));
            })()}

            {newsBatches.length > 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                共 {newsBatches.length} 批更新，累计 {getTotalNewsCount()} 条新闻
              </div>
            )}
          </div>
        )}
      </main>

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
