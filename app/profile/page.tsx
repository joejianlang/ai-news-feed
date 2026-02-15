'use client';

import Navbar from '@/components/Navbar';
import { useUser } from '@/lib/contexts/UserContext';
import { User, FileText, Store, Heart, Settings, LogOut, Sun, Moon, Megaphone } from 'lucide-react';
import { useTheme } from '@/lib/contexts/ThemeContext';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function ProfilePage() {
    const { user } = useUser();
    const { theme, toggleTheme } = useTheme();
    const [counts, setCounts] = useState({ posts: 0, services: 0, favorites: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadCounts();
        }
    }, [user]);

    const loadCounts = async () => {
        try {
            setLoading(true);
            // 获取发帖数
            const postsRes = await fetch(`/api/forum?userId=${user?.id}`);
            const postsData = await postsRes.json();

            // 获取服务数
            const servicesRes = await fetch(`/api/services?userId=${user?.id}`);
            const servicesData = await servicesRes.json();

            setCounts({
                posts: postsData.total || 0,
                services: servicesData.total || 0,
                favorites: 0
            });
        } catch (error) {
            console.error('Failed to load activity counts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        }
        // 强制刷新页面以清除所有状态
        window.location.href = '/';
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
                <Navbar />
                <div className="max-w-2xl mx-auto p-4">
                    <div className="py-20 text-center">
                        <User size={64} className="mx-auto text-text-muted mb-4" />
                        <h3 className="text-xl font-bold text-text-secondary mb-4">登录后查看个人中心</h3>
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
        { icon: FileText, label: '我的发帖', href: '/profile/posts', count: counts.posts },
        { icon: Store, label: '我的服务', href: '/profile/services', count: counts.services },
        { icon: Megaphone, label: '我的投放', href: '/profile/ads' },
        { icon: Heart, label: '我的收藏', href: '/profile/favorites', count: counts.favorites },
        { icon: Settings, label: '账户设置', href: '/profile/settings' },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />

            <div className="max-w-2xl mx-auto p-4">
                {/* 用户卡片 */}
                <div className="bg-card rounded-2xl p-6 shadow-sm mb-4 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                                    {(user.display_name || user.username || user.email)?.[0].toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">
                                {user.display_name || user.username || user.email?.split('@')[0]}
                            </h2>
                            <p className="text-text-muted text-sm">{user.email}</p>
                        </div>
                    </div>
                </div>

                {/* 菜单列表 */}
                <div className="bg-card rounded-2xl shadow-sm overflow-hidden transition-colors">
                    {menuItems.map((item, index) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center justify-between p-4 hover:bg-background transition-colors ${index !== menuItems.length - 1 ? 'border-b border-card-border' : ''
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon size={22} className="text-text-muted" />
                                <span className="font-medium text-text-secondary">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {item.count !== undefined && (
                                    <span className="text-text-muted text-sm">{item.count}</span>
                                )}
                                <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between p-4 hover:bg-background transition-colors border-t border-card-border"
                    >
                        <div className="flex items-center gap-3">
                            {theme === 'light' ? (
                                <Moon size={22} className="text-text-muted" />
                            ) : (
                                <Sun size={22} className="text-text-muted" />
                            )}
                            <span className="font-medium text-text-secondary">切换{theme === 'light' ? '夜间' : '日间'}模式</span>
                        </div>
                        <div className="text-sm text-text-muted">
                            {theme === 'light' ? '关灯' : '开灯'}
                        </div>
                    </button>
                </div>

                {/* 登出按钮 */}
                <button
                    onClick={handleLogout}
                    className="w-full mt-4 bg-card text-red-500 p-4 rounded-2xl font-bold shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
                >
                    <LogOut size={20} />
                    退出登录
                </button>
            </div>
        </div>
    );
}
