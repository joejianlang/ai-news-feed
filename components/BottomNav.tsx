'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Newspaper, MessageSquare, Store, User } from 'lucide-react';

const navItems = [
    { href: '/', label: '新闻', icon: Newspaper },
    { href: '/forum', label: '论坛', icon: MessageSquare },
    { href: '/services', label: '服务', icon: Store },
    { href: '/profile', label: '我的', icon: User },
];

export default function BottomNav() {
    const pathname = usePathname();

    // 在管理页面不显示底部导航
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/sources')) {
        return null;
    }

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-40 pb-safe md:hidden">
            <div className="flex justify-center gap-8 items-center h-16 max-w-lg mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 active:scale-95 ${isActive ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <Icon
                                size={26}
                                className={`mb-1 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className={`tracking-wide ${isActive ? 'text-xs font-extrabold' : 'text-xs font-bold'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
