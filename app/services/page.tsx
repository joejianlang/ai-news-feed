'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Store, Plus, MapPin, Tag, Search } from 'lucide-react';

const SERVICE_TYPES = [
    { id: 'all', label: '全部' },
    { id: 'rent', label: '房屋出租' },
    { id: 'repair', label: '维修服务' },
    { id: 'marketplace', label: '二手市场' },
    { id: 'deals', label: '本地优惠' },
];

export default function ServicesPage() {
    const [activeType, setActiveType] = useState('all');

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* 搜索和筛选 */}
            <div className="bg-white sticky top-[60px] z-20 shadow-sm pb-3">
                <div className="max-w-2xl mx-auto px-4 pt-4">
                    <div className="relative mb-4">
                        <input
                            type="text"
                            placeholder="搜索服务、物品..."
                            className="w-full bg-gray-100 rounded-xl py-3.5 pl-11 pr-4 text-base font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-800 placeholder-gray-500"
                        />
                        <Search className="absolute left-4 top-4 text-gray-500" size={20} strokeWidth={2.5} />
                    </div>

                    {/* 分类标签 */}
                    <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
                        {SERVICE_TYPES.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setActiveType(type.id)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap border transition-colors ${activeType === type.id
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4">
                {/* 占位内容 */}
                <div className="py-20 text-center">
                    <Store size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-bold text-gray-400 mb-2">服务功能开发中</h3>
                    <p className="text-gray-400">很快就可以在这里发布和浏览服务了！</p>
                </div>
            </div>

            {/* 发布按钮 */}
            <button className="fixed bottom-20 right-5 bg-teal-600 text-white p-4 rounded-full shadow-xl hover:bg-teal-700 transition-transform active:scale-95 z-40">
                <Plus size={28} strokeWidth={3} />
            </button>
        </div>
    );
}
