'use client';

import React from 'react';
import type { AdItem } from '@/types';
import { ExternalLink, Info } from 'lucide-react';

interface AdCardProps {
    ad: Partial<AdItem>;
    isPreview?: boolean;
    isListStyle?: boolean;
}

const AdCard: React.FC<AdCardProps> = ({ ad, isPreview = false, isListStyle = false }) => {
    const handleClick = () => {
        if (isPreview) return;
        if (ad.link_url) {
            window.open(ad.link_url, '_blank', 'noopener,noreferrer');
        }
    };

    if (isListStyle) {
        return (
            <div
                onClick={handleClick}
                className={`bg-card rounded-[24px] shadow-sm overflow-hidden border border-card-border mb-4 flex gap-3 p-2 items-center transition-all ${!isPreview && ad.link_url ? 'cursor-pointer active:bg-slate-50' : ''}`}
            >
                {/* Left: Small Thumbnail */}
                {ad.image_url && (
                    <div className="w-24 h-24 sm:w-36 sm:h-36 flex-shrink-0 rounded-xl bg-slate-100 dark:bg-white/5 overflow-hidden">
                        <img
                            src={ad.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Right: Content */}
                <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1.5 overflow-hidden">
                        <span className="text-blue-600 dark:text-blue-400 font-extrabold text-[11px] uppercase tracking-tight truncate max-w-[120px]">
                            广告推荐
                        </span>
                        <span className="text-slate-300 dark:text-slate-600 font-black">·</span>
                        <span className="text-slate-500 dark:text-slate-400 font-extrabold text-[11px] uppercase tracking-tight truncate">
                            精选推广
                        </span>
                    </div>
                    <h2 className="text-[13px] sm:text-[14px] md:text-[15px] font-black text-text-primary leading-[1.4] tracking-tight line-clamp-2">
                        {ad.title}
                        {!isPreview && ad.link_url && (
                            <span className="inline-flex items-center gap-1 ml-2 text-teal-600 dark:text-teal-400 font-black text-[12px] sm:text-[13px] whitespace-nowrap">
                                了解更多
                                <svg className="w-3 h-3 translate-y-px" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </span>
                        )}
                    </h2>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={handleClick}
            className={`bg-card rounded-[24px] shadow-sm overflow-hidden border border-card-border mb-4 transition-all ${!isPreview && ad.link_url ? 'cursor-pointer active:bg-slate-50 dark:active:bg-white/5' : ''}`}
        >
            <div className="p-5">
                {/* Meta Header */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-blue-600 dark:text-blue-400 font-extrabold text-[13px] uppercase">
                        广告推荐
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-text-muted text-[12px]">精选推广</span>
                </div>

                {/* Media Area */}
                {ad.image_url && (
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-4 bg-slate-100 dark:bg-white/5">
                        <img
                            src={ad.image_url}
                            alt={ad.title}
                            className="w-full h-full object-cover transition-transform duration-500"
                        />
                    </div>
                )}

                {/* Title & Content */}
                <div className="space-y-2">
                    <h2 className="text-[15px] sm:text-[17px] md:text-[19px] font-black leading-tight sm:leading-relaxed text-foreground">
                        {ad.title || '广告标题'}
                        {!isPreview && ad.link_url && (
                            <span className="inline-flex items-center gap-1 ml-2 text-teal-600 dark:text-teal-400 font-black text-[13px] sm:text-[14px]">
                                了解详情
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="m6 9 6 6 6-6" /></svg>
                            </span>
                        )}
                    </h2>

                    <p className="text-text-secondary text-[14px] sm:text-[15px] leading-relaxed line-clamp-3">
                        {ad.content || '请输入广告内容描述...'}
                    </p>
                </div>

                {/* Footer Meta */}
                {(ad.contact_info || (!isPreview && ad.link_url)) && (
                    <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-card-border">
                        {ad.contact_info && (
                            <div className="text-[11px] font-black text-teal-600 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400 px-2.5 py-1 rounded-lg border border-teal-100 dark:border-teal-900/30">
                                联系方式: {ad.contact_info}
                            </div>
                        )}
                        {!isPreview && ad.link_url && (
                            <div className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider">
                                <ExternalLink size={12} strokeWidth={3} />
                                Visit Website
                            </div>
                        )}
                    </div>
                )}

                {isPreview && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30 flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-400 font-bold">
                        <Info size={14} />
                        预览模式：广告在实际页面中的展示效果
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdCard;
