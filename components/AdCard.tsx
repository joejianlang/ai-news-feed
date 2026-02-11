'use client';

import React from 'react';
import type { AdItem } from '@/types';
import { ExternalLink, Info } from 'lucide-react';

interface AdCardProps {
    ad: Partial<AdItem>;
    isPreview?: boolean;
}

const AdCard: React.FC<AdCardProps> = ({ ad, isPreview = false }) => {
    const handleClick = () => {
        if (isPreview) return;
        if (ad.link_url) {
            window.open(ad.link_url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`bg-white dark:bg-card border border-card-border rounded-2xl p-4 mb-4 shadow-sm relative overflow-hidden transition-all ${!isPreview && ad.link_url ? 'cursor-pointer hover:shadow-md active:scale-[0.99]' : ''}`}
        >
            <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-sm">
                赞助内容
            </div>

            <div className="flex items-start gap-4">
                {ad.image_url && (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 relative rounded-xl overflow-hidden shadow-inner bg-gray-100 dark:bg-black/20">
                        <img
                            src={ad.image_url}
                            alt={ad.title}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-black text-foreground mb-1 line-clamp-2 leading-tight">
                        {ad.title || '广告标题'}
                    </h3>
                    <p className="text-text-muted text-xs sm:text-sm line-clamp-2 mb-2 leading-relaxed">
                        {ad.content || '请输入广告内容描述...'}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-auto">
                        {ad.contact_info && (
                            <div className="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400 px-2 py-0.5 rounded-lg border border-teal-100 dark:border-teal-900/30">
                                {ad.contact_info}
                            </div>
                        )}
                        {!isPreview && ad.link_url && (
                            <div className="text-[10px] items-center gap-1 text-blue-600 font-bold hover:underline flex">
                                <ExternalLink size={10} />
                                了解详情
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isPreview && (
                <div className="mt-3 pt-2 border-t border-card-border/50 flex items-center gap-2 text-[10px] text-text-muted italic">
                    <Info size={10} />
                    预览模式：这仅用于展示广告在信息流中的样子。
                </div>
            )}
        </div>
    );
};

export default AdCard;
