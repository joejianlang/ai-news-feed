'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import { useLocation } from '@/lib/contexts/LocationContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, isLoading } = useUser();
  const { city, detectLocation } = useLocation();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    <nav className="sticky top-0 bg-nav border-b border-teal-700 dark:border-slate-800 z-40 shadow-md transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-1.5 sm:py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Location Container */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex-shrink-0 transition-opacity hover:opacity-80">
              <div
                className="h-8 sm:h-12 w-24 sm:w-40 bg-white shrink-0"
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
            <button
              onClick={detectLocation}
              className="flex items-center gap-1.5 text-white/90 hover:text-white transition-colors py-1 px-2 rounded-md hover:bg-white/10"
              title="点击重新定位"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-sm font-bold tracking-tight">{city || '定位中...'}</span>
              <svg className="w-3 h-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" className="rotate-180 origin-center" />
              </svg>
            </button>
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

          {/* 桌面端导航 */}
          <div className="hidden md:flex items-center gap-6">
            {user && (
              <>
                <Link
                  href="/following"
                  className="text-white hover:text-teal-100 font-medium text-sm transition-colors"
                >
                  我的关注
                </Link>
                <Link
                  href="/ads/create"
                  className="text-white hover:text-teal-100 font-medium text-sm transition-colors border border-white/20 px-3 py-1 rounded-full hover:bg-white/10"
                >
                  投放广告
                </Link>
              </>
            )}
            {user?.role === 'admin' && (
              <>
                <Link
                  href="/recommendations"
                  className="text-white hover:text-teal-100 font-medium text-sm transition-colors"
                >
                  推荐源
                </Link>
                <Link
                  href="/sources"
                  className="text-white hover:text-teal-100 font-medium text-sm transition-colors"
                >
                  管理源
                </Link>
                <Link
                  href="/admin/fetch-stats"
                  className="text-white hover:text-teal-100 font-medium text-sm transition-colors"
                >
                  抓取统计
                </Link>
                <Link
                  href="/admin/maintenance"
                  className="text-white hover:text-teal-100 font-medium text-sm transition-colors"
                >
                  库维护
                </Link>
                <Link
                  href="/admin/ads"
                  className="text-white hover:text-teal-100 font-medium text-sm transition-colors"
                >
                  广告审核
                </Link>
                <Link
                  href="/admin/settings"
                  className="text-white hover:text-teal-100 font-medium text-sm transition-colors bg-white/10 px-2 py-1 rounded"
                >
                  系统设置
                </Link>
              </>
            )}
          </div>

          {/* 桌面端用户区 */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-teal-50">
                  欢迎, {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-teal-100 hover:text-white transition-colors"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-white hover:text-teal-100 font-medium"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-white text-teal-600 px-4 py-2 rounded-lg hover:bg-teal-50 transition-colors shadow-sm font-bold"
                >
                  注册
                </Link>
              </>
            )}
          </div>

          {/* 移动端菜单按钮 */}
          <div className="flex items-center gap-2">
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
