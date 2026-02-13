'use client';

import { useState, useEffect } from 'react';

export default function BookmarkTip() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // Check if user has already seen the tip or if it's already installed (simplified)
        const hasSeen = localStorage.getItem('hideBookmarkTip');
        if (!hasSeen) {
            const timer = setTimeout(() => setShow(true), 5000); // Show after 5s
            return () => clearTimeout(timer);
        }
    }, []);

    if (!show) return null;

    return (
        <div className="fixed bottom-24 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-teal-100 dark:border-teal-900/30 p-4 max-w-[280px] relative group">
                <button
                    onClick={() => {
                        setShow(false);
                        localStorage.setItem('hideBookmarkTip', 'true');
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
                >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>

                <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 bg-teal-500 rounded-xl flex-shrink-0 flex items-center justify-center text-white shadow-lg shadow-teal-500/20">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                    </div>
                    <div>
                        <h4 className="font-black text-text-primary text-sm mb-1">收藏 数位 Buffet</h4>
                        <p className="text-text-muted text-xs leading-relaxed">
                            觉得内容不错？点击浏览器菜单 <span className="text-teal-600 font-bold">“添加到主屏幕”</span> 或按 <span className="text-teal-600 font-bold">Ctrl+D</span> 随时回访。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
