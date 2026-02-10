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
            <div key={item.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              {/* 来源信息 */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-3 flex-wrap">
                <span className="font-semibold text-teal-600">{item.source?.name}</span>
                {item.published_at && (
                  <>
                    <span>•</span>
                    <span>{new Date(item.published_at).toLocaleString('zh-CN')}</span>
                  </>
                )}
              </div>

              {/* 标题 */}
              <h2 className="text-lg sm:text-xl font-bold mb-3 text-gray-800 leading-tight">{item.title}</h2>

              {/* 内容摘要 - 已移动到标题后面 */}
              {item.ai_summary && item.content_type === 'article' && (
                <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-teal-50 rounded-lg border-l-4 border-teal-400">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold text-teal-700">📝 内容摘要</div>
                    <button
                      onClick={() => toggleExpand(`${item.id}-summary`)}
                      className="text-teal-600 hover:text-teal-800 text-xs font-medium"
                    >
                      {expandedItems.has(`${item.id}-summary`) ? '收起 ▲' : '查看全文 ▼'}
                    </button>
                  </div>
                  <p className={`text-gray-800 text-sm leading-relaxed ${expandedItems.has(`${item.id}-summary`) ? '' : 'line-clamp-1'}`}>
                    {item.ai_summary}
                  </p>
                </div>
              )}

              {/* 文章配图 */}
              {item.content_type === 'article' && item.image_url && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-auto object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* 视频播放器 */}
              {item.content_type === 'video' && (() => {
                const videoId = item.video_id || extractYouTubeVideoId(item.original_url);
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
                          <img
                            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src.includes('maxresdefault')) {
                                target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                              } else if (target.src.includes('hqdefault')) {
                                target.src = `https://img.youtube.com/vi/${videoId}/sddefault.jpg`;
                              }
                            }}
                          />
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


              {/* 专业解读（可折叠） */}
              {item.ai_commentary && (
                <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-cyan-50 rounded-lg border-l-4 border-cyan-400">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-bold text-cyan-700">💬 专业解读</div>
                    <button
                      onClick={() => toggleExpand(`${item.id}-commentary`)}
                      className="text-cyan-600 hover:text-cyan-800 text-xs font-medium"
                    >
                      {expandedItems.has(`${item.id}-commentary`) ? '收起 ▲' : '展开解读 ▼'}
                    </button>
                  </div>
                  <p className={`text-gray-800 text-sm leading-relaxed whitespace-pre-wrap ${expandedItems.has(`${item.id}-commentary`) ? '' : 'line-clamp-1'}`}>
                    {item.ai_commentary}
                  </p>
                </div>
              )}

              {/* 查看原文链接 */}
              <a
                href={item.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 active:text-teal-800 text-xs sm:text-sm font-medium"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                查看原文
              </a>

              {/* 评论区 */}
              <CommentSection
                newsItemId={item.id}
                initialCommentCount={item.comment_count || 0}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
