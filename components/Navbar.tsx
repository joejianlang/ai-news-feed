'use client';

import { useState } from 'react';
import Link from 'next/link';
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

  const handleLogout = () => {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/login');
    router.refresh();
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
    <nav className="sticky top-0 bg-white border-b border-gray-200 z-20 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="text-lg sm:text-xl font-bold text-gray-900 hover:text-blue-600 tracking-wide flex-shrink-0">
            知流
          </Link>

          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索新闻..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600"
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
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                我的关注
              </Link>
            )}
            {user?.role === 'admin' && (
              <>
                <Link
                  href="/recommendations"
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  推荐源
                </Link>
                <Link
                  href="/sources"
                  className="text-gray-700 hover:text-blue-600 font-medium"
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
                <span className="text-sm text-gray-600">
                  欢迎, {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  注册
                </Link>
              </>
            )}
          </div>

          {/* 移动端菜单按钮 */}
          <button
            className="md:hidden p-2 -mr-2 text-gray-600"
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
          <div className="md:hidden mt-3 pt-3 border-t border-gray-100">
            {/* 移动端搜索框 */}
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索新闻..."
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-teal-600"
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
                  className="py-2 text-gray-700 hover:text-teal-600 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  我的关注
                </Link>
              )}
              {user?.role === 'admin' && (
                <>
                  <Link
                    href="/recommendations"
                    className="py-2 text-gray-700 hover:text-teal-600 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    推荐源
                  </Link>
                  <Link
                    href="/sources"
                    className="py-2 text-gray-700 hover:text-teal-600 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    管理源
                  </Link>
                </>
              )}

              <div className="pt-3 border-t border-gray-100">
                {user ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {user.username}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      退出登录
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Link
                      href="/login"
                      className="flex-1 text-center py-2 text-gray-600 border border-gray-300 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      登录
                    </Link>
                    <Link
                      href="/register"
                      className="flex-1 text-center py-2 bg-blue-500 text-white rounded-lg"
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
