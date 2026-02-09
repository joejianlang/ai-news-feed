'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { MessageSquare, Plus, TrendingUp, Clock, Users } from 'lucide-react';

export default function ForumPage() {
    const [activeTab, setActiveTab] = useState<'trending' | 'latest' | 'following'>('trending');

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <header className="bg-white sticky top-[60px] z-20 shadow-sm pt-4 pb-2">
                <div className="max-w-2xl mx-auto px-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">社区论坛</h2>
                        <button className="bg-teal-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center">
                            <Plus size={18} className="mr-1" strokeWidth={3} /> 发帖
                        </button>
                    </div>

                    {/* 标签栏 */}
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
                        {[
                            { id: 'trending', label: '热门', icon: TrendingUp },
                            { id: 'latest', label: '最新', icon: Clock },
                            { id: 'following', label: '关注', icon: Users },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1 ${activeTab === tab.id
                                        ? 'bg-teal-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto p-4">
                {/* 占位内容 */}
                <div className="py-20 text-center">
                    <MessageSquare size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-400 mb-2">论坛功能开发中</h3>
                    <p className="text-gray-400">很快就可以在这里讨论话题了！</p>
                </div>
            </div>
        </div>
    );
}
