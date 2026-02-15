'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import { useLocation } from '@/lib/contexts/LocationContext';
import ThemeToggle from './ThemeToggle';
import { POPULAR_CITIES } from '@/lib/contexts/LocationContext';

export default function Navbar() {
  const { user, isLoading } = useUser();
  const { city, detectLocation, setManualCity } = useLocation();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCityMenuOpen, setIsCityMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load categories to find the ID for "本地"
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.categories) setCategories(data.categories);
      } catch (e) {
        console.error('Failed to load categories in Navbar:', e);
      }
    };
    loadCategories();
  }, []);

  const navigateToLocalNews = () => {
    const localCat = categories.find(c => c.name === '本地' || c.name === 'Local');
    if (localCat) {
      router.push(`/?categoryId=${localCat.id}`);
    } else {
      router.push('/');
    }
  };

  if (isLoading) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    // 强制刷新页面以清除所有状态
    window.location.href = '/';
    setIsMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?keyword=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 bg-nav border-b border-teal-700 dark:border-slate-800 z-50 shadow-md transition-colors">
      <div className="max-w-[900px] mx-auto px-4 py-1 sm:py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Location Container */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex-shrink-0 transition-opacity hover:opacity-80">
              <div
                className="h-7 sm:h-12 w-20 sm:w-40 bg-white shrink-0"
                style={{
                  maskImage: 'url(/logo.png)',
                  WebkitMaskImage: 'url(/logo.png)',
                  maskMode: 'luminance' as any,
                  WebkitMaskMode: 'luminance' as any,
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskSize: '100% auto',
                  WebkitMaskSize: '100% auto',
                  maskPosition: 'left center',
                  WebkitMaskPosition: 'left center'
                } as React.CSSProperties}
                role="img"
                aria-label="数位 Buffet"
              />
            </Link>

            {/* Simplified Location */}
            {/* City Selection Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsCityMenuOpen(!isCityMenuOpen)}
                className="flex items-center gap-1.5 text-white/90 hover:text-white transition-colors py-1 px-2 rounded-md hover:bg-white/10"
                title="选择城市"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-sm font-bold tracking-tight">{city || '选择城市'}</span>
                <svg className={`w-3 h-3 transition-transform ${isCityMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {isCityMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsCityMenuOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50 dark:border-slate-800 mb-1">
                      热门城市
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      <button
                        onClick={() => {
                          detectLocation();
                          setIsCityMenuOpen(false);
                          navigateToLocalNews();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        自动重新定位
                      </button>
                      {POPULAR_CITIES.map((group) => (
                        <div key={group.province} className="mb-2">
                          <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-white/5 uppercase tracking-wider">
                            {group.province}
                          </div>
                          {group.cities.map((cityItem) => (
                            <button
                              key={cityItem.tag}
                              onClick={() => {
                                setManualCity(cityItem.tag);
                                setIsCityMenuOpen(false);
                                navigateToLocalNews();
                              }}
                              className={`w-full text-left px-5 py-2 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${city === cityItem.name ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10' : 'text-slate-600 dark:text-slate-300'
                                }`}
                            >
                              {cityItem.name}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索新闻..."
                className="w-full px-4 py-2 pr-10 bg-teal-700/50 border border-teal-500/50 rounded-full focus:outline-none focus:ring-2 focus:ring-white/30 text-white placeholder-teal-100 text-sm transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-teal-100 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* 桌面端中心主导航 */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            <Link
              href="/"
              className="flex flex-col items-center px-3 py-1 text-white hover:text-teal-100 transition-colors group"
            >
              <span className="text-[13px] font-black tracking-widest uppercase">新闻</span>
              <div className="h-0.5 w-0 group-hover:w-full bg-white transition-all duration-300"></div>
            </Link>
            <Link
              href="/forum"
              className="flex flex-col items-center px-3 py-1 text-white hover:text-teal-100 transition-colors group"
            >
              <span className="text-[13px] font-black tracking-widest uppercase">论坛</span>
              <div className="h-0.5 w-0 group-hover:w-full bg-white transition-all duration-300"></div>
            </Link>
            <Link
              href="/services"
              className="flex flex-col items-center px-3 py-1 text-white hover:text-teal-100 transition-colors group"
            >
              <span className="text-[13px] font-black tracking-widest uppercase">服务</span>
              <div className="h-0.5 w-0 group-hover:w-full bg-white transition-all duration-300"></div>
            </Link>
            <Link
              href="/profile"
              className="flex flex-col items-center px-3 py-1 text-white hover:text-teal-100 transition-colors group"
            >
              <span className="text-[13px] font-black tracking-widest uppercase">我的</span>
              <div className="h-0.5 w-0 group-hover:w-full bg-white transition-all duration-300"></div>
            </Link>
          </div>

          {/* 桌面端右侧功能区 */}
          <div className="hidden md:flex items-center gap-3">
            {user?.role === 'admin' ? (
              <div className="relative group">
                <button className="text-[11px] font-black text-white/70 hover:text-white uppercase tracking-tighter border border-white/20 px-2 py-1 rounded">
                  管理后台
                </button>
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 py-2 z-[60] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link href="/publish" className="block px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5">文章管理</Link>
                  <Link href="/admin/ads" className="block px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5">广告审核</Link>
                  <Link href="/admin/settings" className="block px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5">系统设置</Link>
                </div>
              </div>
            ) : user && (
              <Link
                href="/ads/create"
                className="hidden xl:block text-[11px] font-black text-white hover:bg-white/10 border border-white/30 px-3 py-1 rounded-full transition-all uppercase tracking-widest"
              >
                投放广告
              </Link>
            )}

            <div className="h-6 w-px bg-white/10 mx-1"></div>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-tighter leading-none">Welcome</span>
                  <span className="text-[12px] font-black text-white leading-tight">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                  title="退出登录"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-[13px] font-black text-white hover:text-teal-100 transition-colors px-2"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="text-[13px] font-black bg-white text-teal-600 px-4 py-1.5 rounded-full hover:bg-teal-50 transition-colors shadow-lg"
                >
                  注册
                </Link>
              </div>
            )}
          </div>

          {/* 移动端菜单按钮 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                if (isMobile) {
                  alert("点击浏览器菜单底部的“分享”图标，然后选择“添加到主屏幕”即可收藏本站。");
                } else {
                  alert("按下 Ctrl+D (Windows) 或 Cmd+D (Mac) 即可将本站加入收藏夹。");
                }
              }}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
              title="收藏本站"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
            </button>
            <ThemeToggle />
            <button
              className="md:hidden p-2 text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="菜单"
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* 移动端下拉菜单 */}
        {isMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-teal-500">
            {/* 移动端搜索框 */}
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索新闻..."
                  className="w-full px-4 py-2 pr-10 bg-teal-700/50 border border-teal-500/50 rounded-full focus:outline-none focus:ring-2 focus:ring-white/30 text-white placeholder-teal-100 text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-teal-100 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>

            <div className="flex flex-col gap-3">
              {user && (
                <Link
                  href="/following"
                  className="py-2 text-white hover:text-teal-100 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  我的关注
                </Link>
              )}
              {user?.role === 'admin' && (
                <>
                  <Link
                    href="/recommendations"
                    className="py-2 text-white hover:text-teal-100 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    推荐源
                  </Link>
                  <Link
                    href="/sources"
                    className="py-2 text-white hover:text-teal-100 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    管理源
                  </Link>
                  <Link
                    href="/admin/fetch-stats"
                    className="py-2 text-white hover:text-teal-100 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    抓取统计
                  </Link>
                  <Link
                    href="/publish"
                    className="py-2 text-white hover:text-teal-100 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    文章管理
                  </Link>
                  <Link
                    href="/admin/maintenance"
                    className="py-2 text-white hover:text-teal-100 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    库维护
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="py-2 text-white hover:text-teal-100 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    系统设置
                  </Link>
                  <Link
                    href="/admin/users"
                    className="py-2 text-white hover:text-teal-100 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    用户管理
                  </Link>
                </>
              )}

              <div className="pt-3 border-t border-teal-500">
                {user ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-teal-50">
                      {user.username}
                    </span>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Link
                      href="/login"
                      className="flex-1 text-center py-2 text-white border border-teal-400 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      登录
                    </Link>
                    <Link
                      href="/register"
                      className="flex-1 text-center py-2 bg-white text-teal-600 rounded-lg shadow-sm font-bold"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      注册
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>

  );
}
