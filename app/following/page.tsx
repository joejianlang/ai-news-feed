'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { NewsItem } from '@/types';
import CommentSection from '@/components/comments/CommentSection';

export default function FollowingPage() {
  const router = useRouter();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100">
      <div className="max-w-2xl mx-auto px-4 py-4 sm:py-8">
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
          {news.map((item) => (
            <article key={item.id} className="bg-white dark:bg-card p-4 sm:p-5 hover:bg-teal-50/30 dark:hover:bg-background/50 transition-colors border-b border-card-border last:border-0 rounded-xl mb-4 sm:mb-6 shadow-sm ring-1 ring-card-border">
              {/* 头部信息 */}
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

              {/* 标题 */}
              <h2 className="text-[19px] sm:text-[22px] font-black mb-4 text-foreground leading-[1.3] tracking-tight hover:text-teal-600 transition-colors cursor-pointer">
                {item.title}
              </h2>

              {/* 内容摘要 */}
              {item.ai_summary && item.content_type === 'article' && (
                <div className="mb-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border-l-[6px] border-teal-500 overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-100/50 dark:bg-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📝</span>
                      <span className="text-[14px] font-black text-teal-700 dark:text-teal-400 tracking-wide uppercase">内容摘要</span>
                    </div>
                    <button
                      onClick={() => toggleExpand(`${item.id}-summary`)}
                      className="text-teal-600 dark:text-teal-400 hover:text-teal-800 text-[13px] font-bold flex items-center gap-1 group"
                    >
                      <span>{expandedItems.has(`${item.id}-summary`) ? '收起全文' : '查看全文'}</span>
                      <span className={`transform transition-transform ${expandedItems.has(`${item.id}-summary`) ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                  </div>
                  <div className="px-4 py-3">
                    <p className={`text-text-secondary text-[16px] leading-[1.6] font-medium font-sans ${expandedItems.has(`${item.id}-summary`) ? '' : 'line-clamp-2'}`}>
                      {item.ai_summary}
                    </p>
                  </div>
                </div>
              )}

              {/* 文章配图 */}
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

              {/* 视频播放器 */}
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
                  </div>
                );
              })()}

              {/* 专业解读 */}
              {item.ai_commentary && (
                <div className="mb-5 bg-gray-50 dark:bg-gray-800/40 rounded-xl border-l-[6px] border-cyan-500 overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-100/50 dark:bg-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💬</span>
                      <span className="text-[14px] font-black text-cyan-700 dark:text-cyan-400 tracking-wide uppercase">专业解读</span>
                    </div>
                    <button
                      onClick={() => toggleExpand(`${item.id}-commentary`)}
                      className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 text-[13px] font-bold flex items-center gap-1 group"
                    >
                      <span>{expandedItems.has(`${item.id}-commentary`) ? '收起解读' : '展开解读'}</span>
                      <span className={`transform transition-transform ${expandedItems.has(`${item.id}-commentary`) ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                  </div>
                  <div className="px-4 py-3">
                    <p className={`text-text-secondary text-[16px] leading-[1.6] font-medium whitespace-pre-wrap font-sans ${expandedItems.has(`${item.id}-commentary`) ? '' : 'line-clamp-2'}`}>
                      {item.ai_commentary}
                    </p>
                  </div>
                </div>
              )}

              {/* 底部链接 */}
              <div className="flex items-center justify-between mb-5 border-t border-card-border pt-4">
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
    </div>
  );
}
