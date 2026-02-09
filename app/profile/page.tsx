'use client';

import Navbar from '@/components/Navbar';
import { useUser } from '@/lib/contexts/UserContext';
import { User, FileText, Store, Heart, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
    const { user } = useUser();

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="max-w-2xl mx-auto p-4">
                    <div className="py-20 text-center">
                        <User size={64} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-600 mb-4">登录后查看个人中心</h3>
                        <Link
                            href="/login"
                            className="inline-block bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors"
                        >
                            立即登录
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const menuItems = [
        { icon: FileText, label: '我的发帖', href: '/profile/posts', count: 0 },
        { icon: Store, label: '我的服务', href: '/profile/services', count: 0 },
        { icon: Heart, label: '我的收藏', href: '/profile/favorites', count: 0 },
        { icon: Settings, label: '账户设置', href: '/profile/settings' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-2xl mx-auto p-4">
                {/* 用户卡片 */}
                <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
                            <span className="text-2xl font-bold text-teal-600">
                                {user.email?.substring(0, 2).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {user.email?.split('@')[0]}
                            </h2>
                            <p className="text-gray-500 text-sm">{user.email}</p>
                        </div>
                    </div>
                </div>

                {/* 菜单列表 */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {menuItems.map((item, index) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={22} className="text-gray-500" />
                                <span className="font-medium text-gray-800">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {item.count !== undefined && (
                                    <span className="text-gray-400 text-sm">{item.count}</span>
                                )}
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* 登出按钮 */}
                <button className="w-full mt-4 bg-white text-red-500 p-4 rounded-2xl font-bold shadow-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                    <LogOut size={20} />
                    退出登录
                </button>
            </div>
        </div>
    );
}
