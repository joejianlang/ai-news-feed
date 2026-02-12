'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { NewsItem } from '@/types';
import Navbar from '@/components/Navbar';
import FollowButton from '@/components/FollowButton';
import CommentSection from '@/components/comments/CommentSection';
import { renderMarkdown } from '@/lib/utils/markdown';
import { formatTime } from '@/lib/utils/format';

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
      // 收起时滚动回条目顶部
      const element = document.getElementById(`article-${itemId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (state === 'full') {
      // 展开时，自动将“正在阅读”栏对齐到导航栏下方
      setTimeout(() => {
        const element = document.getElementById(`reading-bar-${itemId}`);
        if (element) {
          const headerHeight = window.innerWidth < 640 ? 48 : 64;
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({
            top: elementPosition - headerHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
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
        rootMargin: '400px 0px 400px 0px',
      }
    );

    const articles = document.querySelectorAll('article[id^="article-"]');
    articles.forEach((article) => observer.observe(article));

    return () => observer.disconnect();
  }, [news, expansionStates]);

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
        <div className="sticky top-[48px] sm:top-[64px] z-10 bg-background/95 backdrop-blur-md -mt-8 pt-8 pb-4 mb-4 sm:mb-8 border-b border-card-border/50 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-black text-foreground italic uppercase tracking-tighter">我的关注</h1>
          <button
            onClick={() => router.push('/')}
            className="text-teal-600 hover:text-teal-700 active:text-teal-800 text-sm sm:text-base font-black flex items-center gap-1.5 group transition-all"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>返回首页</span>
          </button>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {news.map((item) => {
            const activeTab = activeTabs[item.id] || (item.ai_summary ? 'summary' : 'commentary');
            const isFullExpanded = expansionStates[item.id] === 'full';
            const displayContent = activeTab === 'summary' ? (item.ai_summary || item.content) : item.ai_commentary;
            const videoId = item.content_type === 'video' ? (item.video_id || extractYouTubeVideoId(item.original_url)) : null;

            return (
              <article
                key={item.id}
                id={`article-${item.id}`}
                className="bg-card rounded-[24px] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] overflow-hidden mb-5 transition-all duration-300 border border-card-border"
              >
                {!isFullExpanded ? (
                  /* 1. Collapsed Scanning Layout: List Style */
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
                  /* 2. Expanded Layout (Card Style) */
                  <>
                    {/* Image Area */}
                    {(videoId || (item.image_url && item.image_url !== '')) && (
                      <div className="relative mx-[10px] mt-[10px] rounded-[16px] aspect-[16/10] bg-slate-100 dark:bg-slate-800/50 overflow-hidden group">
                        {item.content_type === 'video' && videoId ? (
                          <div className="absolute inset-0 bg-black">
                            {playingVideoId === videoId ? (
                              <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`} title={item.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                            ) : (
                              <div className="absolute inset-0 cursor-pointer" onClick={() => setPlayingVideoId(videoId)}>
                                <img src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} alt={item.title} className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" onError={(e) => { e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`; }} />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <img src={item.image_url!} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" onError={(e) => { e.currentTarget.parentElement!.style.display = 'none'; }} />
                        )}
                      </div>
                    )}

                    <div className="px-5 pt-3 sm:px-6 sm:pt-3 pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="text-blue-600 dark:text-blue-400 font-extrabold text-[13px] uppercase tracking-tight truncate max-w-[200px]">{item.source?.name}</span>
                          <span className="text-slate-300 dark:text-slate-600 font-black">·</span>
                          <span className="text-text-muted text-[12px] font-bold uppercase whitespace-nowrap">{formatTime(item.created_at)}</span>
                        </div>
                        <FollowButton sourceId={item.source_id} />
                      </div>

                      <h2 className="text-[18px] sm:text-[20px] font-black text-text-primary leading-[1.3] tracking-tight mb-3 line-clamp-3">{item.title}</h2>

                      <div className="mb-4 animate-in fade-in slide-in-from-top-1 duration-300">
                        <div className="flex gap-8 border-b border-card-border mb-3 px-1">
                          <button onClick={() => toggleTab(item.id, 'summary')} className={`pb-3 text-[15px] font-black transition-all relative group ${activeTab === 'summary' ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}>内容摘要{activeTab === 'summary' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-teal-500 rounded-t-full"></div>}</button>
                          {item.ai_commentary && <button onClick={() => toggleTab(item.id, 'commentary')} className={`pb-3 text-[15px] font-black transition-all relative group ${activeTab === 'commentary' ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}>专业解读{activeTab === 'commentary' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-teal-500 rounded-t-full"></div>}</button>}
                        </div>

                        <div className="relative min-h-[60px] mb-4">
                          <div className="prose prose-slate prose-sm sm:prose-base dark:prose-invert max-w-none text-text-secondary leading-relaxed font-medium">
                            {displayContent ? <div dangerouslySetInnerHTML={{ __html: renderMarkdown(displayContent) }} /> : <p className="italic text-slate-400 text-center py-4">暂无内容...</p>}
                          </div>
                        </div>

                        <div className="flex justify-center mb-2">
                          <button onClick={() => toggleExpansion(item.id, 'preview')} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 text-slate-400 px-8 py-2 rounded-full border border-slate-100 transition-all font-black text-[13px] group shadow-sm active:scale-95">
                            <svg className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                            收起全文
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="px-5 sm:px-6 py-1.5 flex items-center justify-between border-t border-card-border mt-1">
                      <a href={item.original_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 font-extrabold text-[13px] flex items-center gap-1.5 group">阅读原文<svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg></a>
                      <div className="flex items-center gap-2 text-slate-400">
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
                          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-50 transition-all"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 bg-slate-50/30">
                      <div className="px-5 sm:px-6 py-2">
                        <CommentSection newsItemId={item.id} initialCommentCount={item.comment_count || 0} />
                      </div>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
