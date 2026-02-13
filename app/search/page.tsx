'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import CommentSection from '@/components/comments/CommentSection';
import type { NewsItem } from '@/types';

function SearchContent() {
  const searchParams = useSearchParams();
  const keyword = searchParams.get('keyword');

  const [results, setResults] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [expandedCommentary, setExpandedCommentary] = useState<Set<string>>(new Set());
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (keyword) {
      searchNews(keyword);
    }
  }, [keyword]);

  const searchNews = async (searchKeyword: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/search?keyword=${encodeURIComponent(searchKeyword)}`);
      const data = await response.json();

      if (response.ok) {
        setResults(data.results || []);
      } else {
        setError(data.error || '搜索失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
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

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
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

  if (!keyword) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">请输入搜索关键字</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* 搜索标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          搜索结果
        </h1>
        <p className="text-gray-600">
          关键字: <span className="font-semibold text-blue-600">"{keyword}"</span>
          {!isLoading && (
            <span className="ml-2 text-sm">
              找到 {results.length} 条结果
            </span>
          )}
        </p>
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="text-gray-500">搜索中...</div>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* 搜索结果 */}
      {!isLoading && !error && (
        <>
          {results.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-lg mb-2">暂无相关新闻</p>
              <p className="text-gray-400 text-sm">试试其他关键字吧</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((item) => {
                const isExpanded = expandedItems.has(item.id);

                return (
                  <article key={item.id} className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
                    {/* 新闻来源 */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {item.source?.name.charAt(0) || 'N'}
                      </div>
                      <span className="text-sm text-gray-600">{item.source?.name || '未知来源'}</span>
                      {item.categories?.name && (
                        <>
                          <span className="text-gray-400 text-xs">·</span>
                          <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded text-[10px] font-bold">
                            {item.categories.name}
                          </span>
                        </>
                      )}
                      <span className="text-gray-400 text-xs">·</span>
                      <span className="text-gray-400 text-xs">{formatTime(item.created_at)}</span>
                    </div>

                    {/* 标题 */}
                    <h2 className="text-lg sm:text-xl font-bold mb-3 text-gray-900">
                      {item.title}
                    </h2>

                    {/* AI 摘要 */}
                    {item.ai_summary && (
                      <div className="mb-4">

                        <p className={`text-gray-700 text-xs sm:text-sm leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
                          {item.ai_summary}
                        </p>
                      </div>
                    )}

                    {/* YouTube 视频播放器或链接 */}
                    {item.content_type === 'video' && (() => {
                      // 优先使用数据库中的 video_id，如果没有则从 URL 提取
                      const videoId = item.video_id || extractYouTubeVideoId(item.original_url);

                      // 如果有 videoId，显示播放器
                      if (videoId) {
                        const isPlaying = playingVideoId === videoId;

                        return (
                          <div className="mb-4 rounded-lg overflow-hidden shadow-lg bg-gray-900">
                            <div className="relative" style={{ paddingBottom: '56.25%' }}>
                              {isPlaying ? (
                                <iframe
                                  className="absolute top-0 left-0 w-full h-full"
                                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                                  title="YouTube video player"
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              ) : (
                                <div
                                  className="absolute top-0 left-0 w-full h-full cursor-pointer group bg-gray-900"
                                  onClick={() => setPlayingVideoId(videoId)}
                                >
                                  <img
                                    src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                                    alt="Video thumbnail"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
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
                      }

                      // 如果没有 videoId，只显示一个提示
                      return (
                        <div className="mb-4 p-4 bg-gray-100 rounded-lg flex items-center gap-3">
                          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                          </svg>
                          <span className="text-sm text-gray-600">视频内容，请点击"查看原文"观看</span>
                        </div>
                      );
                    })()}

                    {/* 展开后显示专业解读 */}
                    {isExpanded && item.ai_commentary && item.ai_commentary !== '暂无评论' && (
                      <div className="mb-4 bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-purple-600">
                            💡 专业解读
                          </span>
                        </div>
                        {(() => {
                          const isCommentaryExpanded = expandedCommentary.has(item.id);
                          const shouldTruncate = item.ai_commentary.length > 100;
                          const displayText = isCommentaryExpanded || !shouldTruncate
                            ? item.ai_commentary
                            : item.ai_commentary.substring(0, 100) + '...';

                          return (
                            <>
                              <p className="text-gray-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                                {displayText}
                              </p>
                              {shouldTruncate && (
                                <button
                                  onClick={() => toggleCommentary(item.id)}
                                  className="mt-2 text-purple-600 hover:text-purple-800 text-xs font-medium transition-colors"
                                >
                                  {isCommentaryExpanded ? '收起 ▲' : '展开 ▼'}
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}

                    {/* 展开后显示评论 */}
                    {isExpanded && (
                      <div className="mb-4">
                        <CommentSection newsItemId={item.id} />
                      </div>
                    )}

                    {/* 底部操作栏 */}
                    <div className="flex items-center justify-between gap-4 pt-3 border-t border-gray-100">
                      <div className="flex gap-4 text-gray-500 text-xs">
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

                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        {isExpanded ? '收起 ▲' : '展开全文 ▼'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Suspense fallback={
        <div className="flex justify-center items-center py-20">
          <div className="text-gray-500">加载中...</div>
        </div>
      }>
        <SearchContent />
      </Suspense>
    </div>
  );
}
