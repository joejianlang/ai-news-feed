'use client';

import React, { useState } from 'react';
import { Share2, Download, Copy, QrCode, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    summary: string;
    imageUrl?: string;
    source?: string;
    articleId: string;
}

export default function ShareModal({
    isOpen,
    onClose,
    title,
    summary,
    imageUrl,
    source,
    articleId
}: ShareModalProps) {
    const [copySuccess, setCopySuccess] = useState(false);

    if (!isOpen) return null;

    const detailUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/article/${articleId}?utm_source=share&utm_medium=social&utm_campaign=poster`
        : '';

    // 生成动态分享图 URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const ogImageUrl = new URL(`${baseUrl}/api/og`);
    ogImageUrl.searchParams.set('title', title);
    if (imageUrl) ogImageUrl.searchParams.set('image', imageUrl);
    if (source) ogImageUrl.searchParams.set('source', source);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(`${title}\n${detailUrl}`);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const downloadPoster = async () => {
        // 生成长图海报 URL
        const posterUrl = new URL(ogImageUrl.toString());
        posterUrl.searchParams.set('type', 'poster');
        posterUrl.searchParams.set('url', detailUrl);

        try {
            const response = await fetch(posterUrl.toString());
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `数位Buffet-${title.substring(0, 10)}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Download failed:', e);
            window.open(posterUrl.toString(), '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-card w-full max-w-sm rounded-[32px] border border-card-border p-8 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-text-muted hover:text-text-primary transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-2xl flex items-center justify-center mb-6">
                        <Share2 size={32} />
                    </div>
                    <h3 className="text-xl font-black text-text-primary mb-2">分享这篇文章</h3>
                    <p className="text-text-secondary text-sm text-center mb-8">选择您喜欢的分享方式</p>

                    <div className="grid grid-cols-2 gap-4 w-full mb-8">
                        <button
                            onClick={copyToClipboard}
                            className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                        >
                            <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-blue-500 group-hover:scale-110 transition-transform">
                                <Copy size={24} />
                            </div>
                            <span className="text-xs font-black text-text-secondary">{copySuccess ? '已复制' : '复制链接'}</span>
                        </button>
                        <button
                            onClick={downloadPoster}
                            className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                        >
                            <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm text-teal-600 group-hover:scale-110 transition-transform">
                                <Download size={24} />
                            </div>
                            <span className="text-xs font-black text-text-secondary">下载海报</span>
                        </button>
                    </div>

                    <div className="w-full p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex flex-col items-center">
                        <div className="bg-white p-3 rounded-xl mb-4 shadow-sm">
                            <QRCodeSVG value={detailUrl} size={140} />
                        </div>
                        <div className="flex items-center gap-2 text-text-muted">
                            <QrCode size={14} />
                            <span className="text-[11px] font-bold uppercase tracking-widest">扫码直接阅读</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
