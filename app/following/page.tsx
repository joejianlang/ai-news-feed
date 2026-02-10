'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { NewsItem } from '@/types';
import Navbar from '@/components/Navbar';
import FollowButton from '@/components/FollowButton';
import CommentSection from '@/components/comments/CommentSection';

export default function FollowingPage() {
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [activeTabs, setActiveTabs] = useState<Record<string, 'summary' | 'commentary'>>({});
  const [expansionStates, setExpansionStates] = useState<Record<string, 'preview' | 'full'>>({});

  useEffect(() => {
    loadFollowingNews();
  }, []);

  const loadFollowingNews = async () => {
    try {
      const response = await fetch('/api/news/following');

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load news');
      }

      const data = await response.json();
      setNews(data);
    } catch (error) {
      console.error('Failed to load following news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (key: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const toggleTab = (itemId: string, tab: 'summary' | 'commentary') => {
    setActiveTabs(prev => ({ ...prev, [itemId]: tab }));

    // 当切换 Tab 时，自动将“正在阅读”栏对齐到导航栏下方
    setTimeout(() => {
      const element = document.getElementById(`reading-bar-${itemId}`);
      if (element) {
        // 计算顶部导航栏的高度
        const headerHeight = window.innerWidth < 640 ? 48 : 64;
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
      const element = document.getElementById(`article-${itemId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const extractYouTubeVideoId = (url: string): string | null => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100">
        <div className="max-w-2xl mx-auto p-4 sm:p-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 text-sm sm:text-base">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100">
        <div className="max-w-2xl mx-auto p-4 sm:p-8">
          <div className="text-center py-12">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">我的关注</h1>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">你还没有关注任何媒体源</p>
            <button
              onClick={() => router.push('/')}
              className="bg-teal-600 text-white px-5 sm:px-6 py-2 rounded-lg hover:bg-teal-700 active:bg-teal-800 text-sm sm:text-base font-medium shadow-md"
            >
              返回首页浏览内容
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar />

      <main className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">我的关注</h1>
          <button
            onClick={() => router.push('/')}
            className="text-teal-600 hover:text-teal-700 active:text-teal-800 text-sm sm:text-base font-medium"
          >
            ← 返回首页
          </button>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {news.map((item) => {
            const activeTab = activeTabs[item.id] || 'summary';
            const isFullExpanded = expansionStates[item.id] === 'full';
            const content = activeTab === 'summary' ? item.ai_summary : item.ai_commentary;

            return (
              <article
                key={item.id}
                id={`article-${item.id}`}
                className={`bg-white dark:bg-card transition-all duration-500 border-b border-card-border last:border-0 rounded-2xl mb-4 sm:mb-8 shadow-sm ring-1 ring-card-border overflow-hidden ${isFullExpanded ? 'ring-teal-500/30 shadow-xl scale-[1.01]' : ''}`}
              >
                {/* 头部信息 - 全文模式下隐藏 */}
                {!isFullExpanded && (
                  <>
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
                              {item.published_at ? new Date(item.published_at).toLocaleString('zh-CN') : '刚刚'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 mb-2">
                      <h2 className="text-xl sm:text-2xl font-black text-foreground leading-[1.3] group-hover:text-teal-600 transition-colors">
                        {item.title}
                      </h2>
                    </div>
                  </>
                )}

                {/* 整合容器：包含操控栏、图片、Tab 和内容 */}
                <div className={`mx-0 mb-5 bg-transparent dark:bg-black rounded-none border-y border-card-border/50 ${isFullExpanded ? 'mt-0 pt-0' : '-mt-2.5'}`}>
                  {/* 展开后的顶部操控栏 - 移入容器内部以防止遮挡图片 */}
                  {isFullExpanded && (
                    <div id={`reading-bar-${item.id}`} className="z-20 bg-background/95 backdrop-blur-md px-4 pt-3 pb-0 flex items-center justify-between animate-in fade-in slide-in-from-top-1">
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
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                      </a>
                    </div>
                  )}

                  <div className={`px-4 ${isFullExpanded ? 'pt-0 pb-3 sm:pt-0 sm:pb-4' : 'py-3 sm:py-4'}`}>
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
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* 交互式 Tabs */}
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

                    {/* 内容展示区 */}
                    <div className="relative">
                      <div
                        className={`transition-all duration-700 overflow-hidden ${isFullExpanded ? 'max-h-none' : 'max-h-[100px]'
                          }`}
                      >
                        <p className={`text-text-secondary dark:text-white text-[16px] leading-[1.7] font-medium font-sans whitespace-pre-wrap ${!isFullExpanded ? 'line-clamp-1' : ''}`}>
                          {content}
                        </p>

                        {!isFullExpanded && (
                          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-100 dark:from-black via-gray-100/50 dark:via-black/50 to-transparent flex items-end justify-center pb-1">
                            <button
                              onClick={() => toggleExpansion(item.id, 'full')}
                              className="px-6 py-2 bg-teal-600 text-white rounded-full font-black text-xs shadow-xl hover:bg-teal-700 transition-all flex items-center gap-1.5 ring-4 ring-teal-500/10"
                            >
                              <span>继续阅读</span>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m6 9 6 6 6-6" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 收起按钮移到底部 */}
                      {isFullExpanded && (
                        <div className="mt-8 pt-4 border-t border-card-border/30 flex justify-center pb-4">
                          <button
                            onClick={() => toggleExpansion(item.id, 'preview')}
                            className="px-8 py-2.5 bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-gray-300 rounded-full font-black text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
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

                {/* 底部功能栏 - 重构 */}
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
                        onClick={() => {
                          const shareData = {
                            title: item.title,
                            text: item.ai_summary || item.title,
                            url: window.location.origin + `?item=${item.id}`,
                          };
                          if (navigator.share) {
                            navigator.share(shareData);
                          } else {
                            navigator.clipboard.writeText(`${item.title}\n${item.original_url}`);
                          }
                        }}
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

                    {/* 第二行：评论区 */}
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
      </main>
    </div>
  );
}
