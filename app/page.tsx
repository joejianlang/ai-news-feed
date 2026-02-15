'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

function HomeContent() {
  const { user } = useUser();
  const { city, cityTag, isLocating, error: locationError, detectLocation, setManualCity } = useLocation();
  const [newsBatches, setNewsBatches] = useState<NewsBatch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [autoPlayingVideoId, setAutoPlayingVideoId] = useState<string | null>(null);
  const [expandedCommentary, setExpandedCommentary] = useState<Set<string>>(new Set());
  const [activeTabs, setActiveTabs] = useState<Record<string, 'summary' | 'commentary'>>({});
  const [expansionStates, setExpansionStates] = useState<Record<string, 'preview' | 'full'>>({});
  const [contentPageLevel, setContentPageLevel] = useState<Record<string, number>>({});
  const [contentOverflow, setContentOverflow] = useState<Record<string, boolean>>({});
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [expandedVideoSummary, setExpandedVideoSummary] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // null = 全部
  const [activeAds, setActiveAds] = useState<AdItem[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const searchParams = useSearchParams();
  const itemId = searchParams.get('item');
  const urlCategoryId = searchParams.get('categoryId');

  // 初始化分类（支持从 URL 获取）
  useEffect(() => {
    if (urlCategoryId) {
      setSelectedCategory(urlCategoryId);
    }
  }, [urlCategoryId]);

  // 处理深层链接（当新闻加载完成后）
  useEffect(() => {
    const handleDeepLink = async () => {
      if (!isLoading && itemId) {
        // 1. 检查是否已经在批次中
        const found = newsBatches.some(batch => batch.items.some(item => item.id === itemId));

        if (found) {
          toggleExpansion(itemId, 'full');
          scrollToItem(itemId);
        } else if (newsBatches.length > 0) {
          // 2. 如果没找到，尝试单独加载该文章（用于预览或直接链接到旧文章）
          try {
            const res = await fetch(`/api/news/item?id=${itemId}`);
            if (res.ok) {
              const item = await res.json();
              // 将其插入到一个特殊的“搜索结果”或“当前查看”批次中
              setNewsBatches(prev => [
                { batchTime: item.created_at, items: [item] },
                ...prev
              ]);
              // 自动展开
              setTimeout(() => {
                toggleExpansion(item.id, 'full');
                scrollToItem(item.id);
              }, 100);
            }
          } catch (e) {
            console.error('Failed to fetch deep link item:', e);
          }
        }
      }
    };

    handleDeepLink();
  }, [isLoading, itemId, newsBatches.length > 0]); // 监听长度变化而不是整个数组，避免循环

  const scrollToItem = (id: string) => {
    setTimeout(() => {
      const element = document.getElementById(`article-${id}`);
      if (element) {
        const headerHeight = window.innerWidth < 640 ? 96 : 112;
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: elementPosition - headerHeight,
          behavior: 'smooth'
        });
      }
    }, 500);
  };

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
            // 只在内容离开屏幕底部时才收起（即 entry.boundingClientRect.top > 0）
            // 这样可以防止向下滚动时，上方内容收缩导致页面位置跳动
            if (entry.boundingClientRect.top > 0) {
              const itemId = entry.target.id.replace('article-', '');
              setExpansionStates((prev) => {
                if (prev[itemId] === 'full') {
                  return { ...prev, [itemId]: 'preview' };
                }
                return prev;
              });
            }
          }
        });
      },
      {
        threshold: 0,
        rootMargin: '400px 0px 400px 0px', // 给予较大的上下缓冲空间，确保用户只是稍微划过时不会断开阅读
      }
    );

    // 监听所有带 article id 的元素
    return () => observer.disconnect();
  }, [newsBatches, expansionStates]);

  // 视频自动播放逻辑：监听视频是否进入屏幕中央
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const itemId = entry.target.getAttribute('data-item-id');
          const videoId = entry.target.getAttribute('data-video-id');

          if (entry.isIntersecting && videoId) {
            // 进入中心区域，设为自动播放（静音）
            setAutoPlayingVideoId(videoId);
          } else {
            // 离开中心区域，停止自动播放
            setAutoPlayingVideoId((prev) => (prev === videoId ? null : prev));
          }
        });
      },
      {
        threshold: 0,
        rootMargin: '-30% 0px -30% 0px', // 只有在垂直中心 40% 的区域才算“进入中间”
      }
    );

    const videoContainers = document.querySelectorAll('[data-video-id]');
    videoContainers.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [newsBatches]);

  const handleVideoClick = (itemId: string, videoId: string) => {
    // 用户主动点击：开启声音，并展开摘要
    setPlayingVideoId(videoId);
    setAutoPlayingVideoId(null);
    setExpandedVideoSummary(prev => new Set(prev).add(itemId));

    // 如果还没展开全文，自动展开
    if (expansionStates[itemId] !== 'full') {
      toggleExpansion(itemId, 'full', videoId);
    }
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

  const LINES_PER_PAGE = 11; // 翻页逻辑：每次翻 11 行，保留 1 行

  const nextContentPage = (itemId: string) => {
    setContentPageLevel(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 1) + 1
    }));

    // 翻页后，微调视图位置，确保内容顶部对齐
    setTimeout(() => {
      const element = document.getElementById(`content-viewport-${itemId}`);
      if (element) {
        const headerHeight = window.innerWidth < 640 ? 96 : 112;
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: elementPosition - headerHeight - 15, // 向上留出 15px 间距
          behavior: 'smooth'
        });
      }
      checkContentOverflow(itemId);
    }, 100);
  };

  const resetContentPage = (itemId: string) => {
    setContentPageLevel(prev => ({ ...prev, [itemId]: 1 }));
    // Scroll back to the article
    setTimeout(() => {
      const element = document.getElementById(`article-${itemId}`);
      if (element) {
        const headerHeight = window.innerWidth < 640 ? 96 : 112;
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: elementPosition - headerHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const checkContentOverflow = (itemId: string) => {
    const el = contentRefs.current[itemId];
    if (el) {
      const level = contentPageLevel[itemId] || 1;
      const currentViewportHeight = level > 1 ? 650 : 312;
      // 计算当前位移加上当前视口高度，是否还有余量
      const currentDisplacement = level === 1 ? 0 : 286 + (level - 2) * 624;
      const isOverflowing = el.scrollHeight > (currentDisplacement + currentViewportHeight + 10);
      setContentOverflow(prev => ({ ...prev, [itemId]: isOverflowing }));
    }
  };

  const toggleVideoSummary = (itemId: string) => {
    setExpandedVideoSummary(prev => {
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

    // 当切换 Tab 时，自动将内容栏对齐
    setTimeout(() => {
      const element = document.getElementById(`article-${itemId}`);
      if (element) {
        const headerHeight = window.innerWidth < 640 ? 96 : 112;
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: elementPosition - headerHeight,
          behavior: 'smooth'
        });
      }
    }, 50);
  };

  const toggleExpansion = (itemId: string, state: 'preview' | 'full', videoId?: string | null, isInternal?: boolean) => {
    setExpansionStates(prev => ({ ...prev, [itemId]: state }));

    if (state === 'full') {
      if (videoId) {
        setPlayingVideoId(videoId);
        setExpandedVideoSummary(prev => new Set(prev).add(itemId));
      } else if (isInternal) {
        setContentPageLevel(prev => ({ ...prev, [itemId]: 1 }));
        setTimeout(() => checkContentOverflow(itemId), 200);
      }
    }

    if (state === 'preview') {
      const element = document.getElementById(`article-${itemId}`);
      if (element) {
        const headerHeight = window.innerWidth < 640 ? 96 : 112;
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: elementPosition - headerHeight,
          behavior: 'smooth'
        });
      }
    } else if (state === 'full') {
      setTimeout(() => {
        const element = document.getElementById(`article-${itemId}`);
        if (element) {
          // 首页有两个 sticky 栏：Navbar 和 Category nav
          // Navbar 高度约 48px/64px, Category nav 高度约 48px
          const headerHeight = window.innerWidth < 640 ? 96 : 112;
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;

          window.scrollTo({
            top: elementPosition - headerHeight - 10, // 多留 10px 间距，更美观
            behavior: 'smooth'
          });
        }
      }, 150); // 稍微增加延迟，确保 DOM 展开后高度稳定
    }
  };

  const handleShare = async (item: NewsItem) => {
    const shareData = {
      title: item.title,
      text: item.ai_summary || item.title,
      url: window.location.origin + `?item=${item.id}`,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.url}`);
        setToast({ message: '分享链接已复制', type: 'success' });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar />

      <nav className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-40 shadow-sm transition-colors">
        <div className="max-w-[900px] mx-auto relative group">
          {/* Left fading mask for scrollability hints */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-slate-900 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>

          <div className="flex items-center overflow-x-auto scrollbar-hide px-3 py-2 sm:px-4 sm:py-2.5 gap-1 sm:gap-2 relative">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-4 py-1 sm:px-5 sm:py-1.5 text-[14px] sm:text-[15px] font-black rounded-full transition-all duration-300 ${selectedCategory === null
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-105'
                : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
            >
              全部
            </button>

            {user && (
              <Link
                href="/following"
                className="flex-shrink-0 px-4 py-1 sm:px-5 sm:py-1.5 text-[14px] sm:text-[15px] font-black rounded-full text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center gap-1.5"
              >
                <span>关注</span>
              </Link>
            )}

            {categories
              .filter((cat: Category) => !['传统新闻媒体', 'YouTube网红', '网络专业媒体'].includes(cat.name))
              .map((category: Category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 px-4 py-1 sm:px-5 sm:py-1.5 text-[14px] sm:text-[15px] font-black rounded-full transition-all duration-300 ${selectedCategory === category.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 scale-105'
                    : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                >
                  {category.name}
                </button>
              ))}
          </div>

          {/* Right fading mask for scrollability hints */}
          <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white dark:from-slate-900 to-transparent z-10 pointer-events-none"></div>
        </div>
      </nav>

      <main className="max-w-[720px] lg:max-w-[900px] mx-auto px-2 sm:px-4 md:px-6 pt-2 sm:pt-4">
        {!isLoading || newsBatches.length > 0 ? (
          <div className="space-y-4">
            {newsBatches.map((batch, batchIndex) => (
              <div key={batch.batchTime}>
                <div className="space-y-4">
                  {batch.items
                    .filter(item => {
                      const isInternal = item.source?.name === '数位 Buffet';
                      const isVideo = item.content_type === 'video';
                      return item.ai_summary || item.ai_commentary || isInternal || isVideo;
                    })
                    .map((item, itemIndex) => {
                      const globalIndex = batchIndex * 100 + itemIndex;
                      const isInternal = item.source?.name === '数位 Buffet';
                      const isFullExpanded = expansionStates[item.id] === 'full';
                      const activeTab = activeTabs[item.id] || 'summary';
                      const videoId = item.content_type === 'video' ? (item.video_id || extractYouTubeVideoId(item.original_url)) : null;
                      const currentPageLevel = contentPageLevel[item.id] || 0;
                      const isContentOverflowing = contentOverflow[item.id] !== false;
                      const displayContent = activeTab === 'summary' ? (item.ai_summary || item.content) : item.ai_commentary;
                      const ad = globalIndex > 0 && globalIndex % 5 === 0 ? activeAds[Math.floor(globalIndex / 5) % activeAds.length] : null;

                      return (
                        <React.Fragment key={item.id}>
                          <article
                            id={`article-${item.id}`}
                            className="bg-card rounded-[24px] shadow-sm overflow-hidden border border-card-border"
                          >
                            {selectedCategory === null && !isFullExpanded ? (
                              /* "全部" Category: List Style Collapsed Layout */
                              <div
                                className="flex gap-3 p-2 items-center cursor-pointer active:bg-slate-50/50 dark:active:bg-white/5 transition-colors"
                                onClick={() => toggleExpansion(item.id, 'full', videoId, isInternal)}
                              >
                                {/* Left: Thumbnail */}
                                {(videoId || (item.image_url && item.image_url !== '')) && (
                                  <div className="w-24 h-24 sm:w-36 sm:h-36 flex-shrink-0 rounded-xl bg-slate-100 dark:bg-white/5 overflow-hidden">
                                    <img
                                      src={item.content_type === 'video' && videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : item.image_url!}
                                      alt={item.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}

                                {/* Right: Meta & Title */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5 overflow-hidden">
                                    <span className="text-blue-600 dark:text-blue-400 font-extrabold text-[11px] uppercase tracking-tight truncate max-w-[120px]">
                                      {item.author_name || item.source?.name || 'Unknown Source'}
                                    </span>
                                    {item.categories?.name && (
                                      <>
                                        <span className="text-slate-300 dark:text-slate-600 font-black">·</span>
                                        <span className="text-slate-500 dark:text-slate-400 font-extrabold text-[11px] uppercase tracking-tight truncate max-w-[80px]">
                                          {item.categories.name}
                                        </span>
                                      </>
                                    )}
                                    <span className="text-slate-300 dark:text-slate-600 font-black">·</span>
                                    <span className="text-text-muted text-[11px] font-bold uppercase whitespace-nowrap">
                                      {formatTime(item.created_at)}
                                    </span>
                                  </div>
                                  <h2 className="text-[13px] sm:text-[14px] md:text-[15px] font-black text-text-primary leading-[1.4] tracking-tight line-clamp-2">
                                    {item.title}
                                    <span
                                      className="inline-flex items-center gap-1 ml-2 text-teal-600 dark:text-teal-400 font-black text-[12px] sm:text-[13px] whitespace-nowrap"
                                    >
                                      详情
                                      <svg className="w-3 h-3 translate-y-px" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </span>
                                  </h2>
                                </div>
                              </div>
                            ) : !isFullExpanded ? (
                              /* Collapsed View (Other Categories: Card Style) */
                              <div
                                className="cursor-pointer p-5 active:bg-slate-50 dark:active:bg-white/5 transition-colors"
                                onClick={() => toggleExpansion(item.id, 'full', videoId, isInternal)}
                              >
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-blue-600 dark:text-blue-400 font-extrabold text-[13px] uppercase">
                                    {item.author_name || item.source?.name}
                                  </span>
                                  <span className="text-slate-300 dark:text-slate-600">·</span>
                                  <span className="text-text-muted text-[12px]">{formatTime(item.created_at)}</span>
                                </div>

                                {(videoId || item.image_url) && (
                                  <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-4 bg-slate-100 dark:bg-white/5">
                                    <img
                                      src={videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : item.image_url!}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                    {videoId && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white">
                                          <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <h2 className="text-[15px] sm:text-[17px] md:text-[19px] font-black leading-tight sm:leading-relaxed">
                                  {item.title}
                                  <span className="inline-flex items-center gap-1 ml-2 text-teal-600 dark:text-teal-400 font-black text-[13px] sm:text-[14px]">
                                    {videoId ? (item.ai_summary ? '视频摘要' : '查看详情') : isInternal ? '正文详情' : '内容摘要'}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="m6 9 6 6 6-6" /></svg>
                                  </span>
                                </h2>
                              </div>
                            ) : (
                              /* Expanded View */
                              <div className="flex flex-col">
                                <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                                  <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                                    <span className="text-blue-600 dark:text-blue-400 font-extrabold text-[13px] uppercase truncate">
                                      {item.author_name || item.source?.name}
                                    </span>
                                    <span className="text-slate-300 dark:text-slate-600">·</span>
                                    <span className="text-text-muted text-[12px] whitespace-nowrap">{formatTime(item.created_at)}</span>
                                  </div>
                                  <FollowButton sourceId={item.source_id} />
                                </div>

                                <div className="mx-[5px]">
                                  {videoId ? (
                                    <div
                                      className="aspect-[16/10] rounded-xl overflow-hidden bg-black"
                                      data-item-id={item.id}
                                      data-video-id={videoId}
                                    >
                                      {playingVideoId === videoId ? (
                                        /* 1. 用户点击后的播放：有声音 */
                                        <iframe
                                          className="w-full h-full"
                                          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          allowFullScreen
                                        />
                                      ) : autoPlayingVideoId === videoId ? (
                                        /* 2. 划到中间自动播放：静音 */
                                        <div className="relative w-full h-full cursor-pointer" onClick={() => handleVideoClick(item.id, videoId)}>
                                          <iframe
                                            className="w-full h-full pointer-events-none"
                                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&rel=0`}
                                            allow="autoplay"
                                          />
                                          {/* 透明遮罩层，防止点击 iframe 而不触发 React 事件 */}
                                          <div className="absolute inset-0 bg-transparent" />
                                        </div>
                                      ) : (
                                        /* 3. 默认预览图 */
                                        <div className="relative w-full h-full cursor-pointer" onClick={() => handleVideoClick(item.id, videoId)}>
                                          <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white">
                                              <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    /* Image Area: Hide for Internal articles when beyond Page 1 */
                                    item.image_url && (!isInternal || currentPageLevel <= 1) && (
                                      <div className="aspect-[16/10] rounded-xl overflow-hidden transition-all duration-500">
                                        <img src={item.image_url} className="w-full h-full object-cover" />
                                      </div>
                                    )
                                  )}
                                </div>

                                {videoId && <div className="px-5 pt-3"><h2 className="text-[16px] font-black">{item.title}</h2></div>}

                                <div className="px-5 py-3">
                                  {videoId ? (
                                    /* Video Summary */
                                    item.ai_summary && (
                                      <>
                                        <div className="flex items-center gap-2 mb-3 cursor-pointer" onClick={() => toggleVideoSummary(item.id)}>
                                          <div className="w-1 h-5 bg-teal-500 rounded-full"></div>
                                          <span className="text-[16px] font-black">视频摘要</span>
                                          <svg className={`w-4 h-4 text-teal-500 transition-transform ${expandedVideoSummary.has(item.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                        {expandedVideoSummary.has(item.id) && (
                                          <div className="prose prose-slate prose-sm sm:prose-base dark:prose-invert max-w-none text-text-secondary leading-relaxed px-1 mb-2" dangerouslySetInnerHTML={{ __html: renderMarkdown(item.ai_summary) }} />
                                        )}
                                      </>
                                    )
                                  ) : isInternal ? (
                                    /* Internal Article: Paged Flip (Dynamic Height & Immersive) */
                                    <>
                                      {currentPageLevel > 0 && (
                                        <div
                                          id={`content-viewport-${item.id}`}
                                          className="relative overflow-hidden mb-2 transition-all duration-500 ease-in-out"
                                          style={{ height: currentPageLevel > 1 ? '650px' : '312px' }}
                                        >
                                          <div
                                            ref={el => { contentRefs.current[item.id] = el; }}
                                            className="prose prose-slate prose-sm sm:prose-base dark:prose-invert max-w-none text-text-secondary leading-relaxed transition-transform duration-500 ease-in-out px-1"
                                            style={{
                                              transform: `translateY(-${currentPageLevel === 1
                                                ? 0
                                                : 286 + (currentPageLevel - 2) * 624
                                                }px)`
                                            }}
                                            dangerouslySetInnerHTML={{ __html: renderMarkdown(item.content || '') }}
                                          />
                                        </div>
                                      )}
                                      {currentPageLevel > 0 && (
                                        <div className="flex gap-3 mb-4">
                                          <button onClick={() => isContentOverflowing ? nextContentPage(item.id) : resetContentPage(item.id)} className="flex-1 h-11 bg-white dark:bg-slate-900 text-teal-600 font-extrabold rounded-xl border border-slate-200 dark:border-slate-700">
                                            {isContentOverflowing ? '下一页' : '收起全文'}
                                          </button>
                                          <button onClick={() => toggleExpansion(item.id, 'preview')} className="flex-1 h-11 bg-slate-50 dark:bg-slate-800 text-slate-500 font-extrabold rounded-xl border border-slate-200 dark:border-slate-700">收起</button>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    /* Non-Internal Tabs */
                                    <>
                                      <div className="flex gap-8 border-b border-card-border mb-3 px-1">
                                        <button onClick={() => toggleTab(item.id, 'summary')} className={`pb-3 text-[15px] font-black relative ${activeTab === 'summary' ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}>
                                          内容摘要 {activeTab === 'summary' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-teal-500 rounded-t-full" />}
                                        </button>
                                        {item.ai_commentary && (
                                          <button onClick={() => toggleTab(item.id, 'commentary')} className={`pb-3 text-[15px] font-black relative ${activeTab === 'commentary' ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}>
                                            专业解读 {activeTab === 'commentary' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-teal-500 rounded-t-full" />}
                                          </button>
                                        )}
                                      </div>
                                      <div className="prose prose-slate prose-sm sm:prose-base dark:prose-invert max-w-none text-text-secondary leading-relaxed px-1 mb-2" dangerouslySetInnerHTML={{ __html: renderMarkdown(displayContent || '') }} />
                                    </>
                                  )}
                                </div>

                                {isFullExpanded && !isInternal && !videoId && (
                                  <div className="flex justify-center mb-4">
                                    <button onClick={() => toggleExpansion(item.id, 'preview')} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 text-slate-400 px-8 py-2 rounded-full border border-slate-100 dark:border-slate-700 font-black text-[13px]">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="m18 15-6-6-6 6" /></svg> 收起
                                    </button>
                                  </div>
                                )}

                                <div className="px-5 sm:px-8 py-2.5 border-t border-card-border bg-slate-50/30 dark:bg-white/5 flex items-center justify-between">
                                  {!isInternal && !videoId && (
                                    <a href={item.original_url} target="_blank" className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 hover:text-teal-700 font-extrabold text-[13px]">
                                      阅读原文
                                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6" /></svg>
                                    </a>
                                  )}
                                  <button onClick={() => handleShare(item)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-secondary text-teal-600 dark:text-teal-400 transition-all">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                                  </button>
                                </div>
                                <div className="border-t border-card-border"><div className="px-5 sm:px-8 py-2"><CommentSection newsItemId={item.id} initialCommentCount={item.comment_count || 0} /></div></div>
                              </div>
                            )}
                          </article>
                          {ad && <AdCard ad={ad as AdItem} />}
                        </React.Fragment>
                      );
                    })}
                </div>
              </div>
            ))}
            {newsBatches.length > 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                共 {newsBatches.length} 批更新，累计 {getTotalNewsCount()} 条新闻
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center py-20 font-bold text-gray-500">加载中...</div>
        )}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-gray-500 font-bold">正在加载...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
