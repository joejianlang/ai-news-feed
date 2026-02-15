'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { NewsItem } from '@/types';
import { renderMarkdown } from '@/lib/utils/markdown';
import { formatTime } from '@/lib/utils/format';
import CommentSection from '@/components/comments/CommentSection';
import Navbar from '@/components/Navbar';
import FollowButton from '@/components/FollowButton';
import { ArrowLeft, Share2, MoreHorizontal } from 'lucide-react';

interface ArticleDetailProps {
    article: NewsItem;
}

export default function ArticleDetail({ article }: ArticleDetailProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'summary' | 'commentary'>(
        article.ai_summary ? 'summary' : 'commentary'
    );

    const isInternal = article.source?.name === '数位 Buffet';
    const displayContent = activeTab === 'summary'
        ? (article.ai_summary || (isInternal ? '' : article.content))
        : (isInternal ? article.content : article.ai_commentary);

    const handleShare = async () => {
        const shareData = {
            title: article.title,
            text: article.ai_summary || article.title,
            url: window.location.href,
        };
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (e) {
                console.error('Error sharing:', e);
            }
        } else {
            navigator.clipboard.writeText(`${article.title}\n${window.location.href}`);
            alert('链接已复制到剪贴板');
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 pb-10">
            <Navbar />

            <main className="max-w-[800px] mx-auto px-4 sm:px-6 pt-4">
                {/* 返回按钮 */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-text-secondary hover:text-teal-600 transition-colors font-bold group"
                    >
                        <div className="p-2 rounded-full group-hover:bg-teal-50 dark:group-hover:bg-teal-900/20 transition-all">
                            <ArrowLeft size={20} />
                        </div>
                        <span>返回</span>
                    </button>

                    <div className="flex items-center gap-3">
                        <button onClick={handleShare} className="p-2 text-text-secondary hover:text-teal-600 transition-colors">
                            <Share2 size={20} />
                        </button>
                        <button className="p-2 text-text-secondary hover:text-teal-600 transition-colors">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>
                </div>

                <article className="bg-card rounded-[32px] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] overflow-hidden mb-8 border border-card-border p-6 sm:p-8">
                    {/* Header Meta */}
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <span className="text-blue-600 dark:text-blue-400 font-extrabold text-[15px] uppercase tracking-tight truncate">
                                {article.author_name || article.source?.name || '未知来源'}
                            </span>
                            {article.categories?.name && (
                                <>
                                    <span className="text-slate-300 dark:text-slate-600 font-black">·</span>
                                    <span className="px-3 py-1 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-lg text-[11px] font-black uppercase tracking-wider">
                                        {article.categories.name}
                                    </span>
                                </>
                            )}
                            <span className="text-slate-300 dark:text-slate-600 font-black">·</span>
                            <span className="text-text-muted text-[13px] font-bold uppercase whitespace-nowrap">
                                {formatTime(article.created_at)}
                            </span>
                        </div>
                        {article.source && (
                            <FollowButton sourceId={article.source_id} />
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-text-primary leading-tight tracking-tight mb-6">
                        {article.title}
                    </h1>

                    {/* Cover Image */}
                    {article.image_url && (
                        <div className="relative rounded-2xl aspect-[16/9] bg-slate-100 dark:bg-slate-800/50 overflow-hidden mb-8">
                            <img
                                src={article.image_url}
                                alt={article.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Tabs */}
                    {(article.ai_summary || article.ai_commentary || isInternal) && (
                        <div className="mb-0">
                            <div className="flex gap-10 border-b border-card-border mb-6 px-1">
                                <button
                                    onClick={() => setActiveTab('summary')}
                                    className={`pb-4 text-[16px] font-black transition-all relative ${activeTab === 'summary' ? 'text-text-primary' : 'text-text-muted'}`}
                                >
                                    内容摘要
                                    {activeTab === 'summary' && (
                                        <div className="absolute bottom-0 left-0 w-full h-[4px] bg-teal-500 rounded-t-full shadow-[0_-2px_6px_rgba(20,184,166,0.2)]"></div>
                                    )}
                                </button>
                                {(article.ai_commentary || isInternal) && (
                                    <button
                                        onClick={() => setActiveTab('commentary')}
                                        className={`pb-4 text-[16px] font-black transition-all relative ${activeTab === 'commentary' ? 'text-text-primary' : 'text-text-muted'}`}
                                    >
                                        {isInternal ? '正文详情' : '专业解读'}
                                        {activeTab === 'commentary' && (
                                            <div className="absolute bottom-0 left-0 w-full h-[4px] bg-teal-500 rounded-t-full shadow-[0_-2px_6px_rgba(20,184,166,0.2)]"></div>
                                        )}
                                    </button>
                                )}
                            </div>

                            <div className="prose prose-slate prose-base sm:prose-lg dark:prose-invert max-w-none text-text-secondary leading-relaxed font-medium mb-8">
                                {displayContent ? (
                                    <div
                                        className={`text-text-primary ${activeTab === 'commentary' && !isInternal ? "italic" : ""}`}
                                        dangerouslySetInnerHTML={{ __html: renderMarkdown(displayContent) }}
                                    />
                                ) : (
                                    <p className="italic text-slate-400 text-center py-4">暂无摘要内容...</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Footer Action */}
                    <div className="flex items-center justify-between border-t border-card-border pt-6 mt-8">
                        {!isInternal && (
                            <a
                                href={article.original_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors group"
                            >
                                <span className="text-[14px] font-black group-hover:underline underline-offset-4">查看原文</span>
                                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
                            </a>
                        )}
                        <div className="text-text-muted text-xs font-bold uppercase">
                            ID: {article.id.substring(0, 8)}
                        </div>
                    </div>
                </article>

                {/* 评论区 */}
                <div className="bg-card rounded-[32px] border border-card-border p-6 sm:p-8">
                    <CommentSection
                        newsItemId={article.id}
                        initialCommentCount={article.comment_count || 0}
                    />
                </div>
            </main>
        </div>
    );
}
