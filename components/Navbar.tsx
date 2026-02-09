'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';

export default function Navbar() {
  const { user, isLoading } = useUser();
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
    <nav className="sticky top-0 bg-teal-600 border-b border-teal-700 z-20 shadow-md">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 transition-opacity hover:opacity-80">
            <Image
              src="/logo.png"
              alt="数位 Buffet"
              width={160}
              height={40}
              className="h-8 sm:h-10 w-auto"
              priority
            />
          </Link>

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
              <Link
                href="/following"
                className="text-white hover:text-teal-100 font-medium text-sm transition-colors"
              >
                我的关注
              </Link>
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
          <button
            className="md:hidden p-2 -mr-2 text-white"
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
