'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Briefcase,
    FileText,
    Users,
    CreditCard,
    ShieldCheck,
    ChevronDown,
    ChevronRight,
    Search,
    UserPlus,
    FileSignature,
    ClipboardList,
    Settings,
    Database,
    Bot,
    Activity,
    Newspaper,
    MessageSquare
} from 'lucide-react';

interface SidebarItem {
    title: string;
    icon: React.ReactNode;
    href?: string;
    children?: { title: string; href: string }[];
}

export default function AdminSidebar() {
    const pathname = usePathname();
    const [openMenus, setOpenMenus] = useState<string[]>(['标准服务管理', '定制服务管理', '入驻管理']);

    const toggleMenu = (title: string) => {
        setOpenMenus(prev =>
            prev.includes(title)
                ? prev.filter(t => t !== title)
                : [...prev, title]
        );
    };

    const sidebarItems: SidebarItem[] = [
        {
            title: '控制台',
            icon: <LayoutDashboard className="w-5 h-5" />,
            href: '/admin'
        },
        {
            title: '标准服务管理',
            icon: <Briefcase className="w-5 h-5" />,
            children: [
                { title: '服务生命周期', href: '/admin/services/lifecycle' },
                { title: '标准服务订单', href: '/admin/orders' },
                { title: '服务申请上架', href: '/admin/services/applications' },
                { title: '标准服务模板', href: '/admin/services/templates' },
                { title: '服务类型申请', href: '/admin/services/types' }
            ]
        },
        {
            title: '定制服务管理',
            icon: <FileSignature className="w-5 h-5" />,
            children: [
                { title: '定制服务需求', href: '/admin/requests' },
                { title: '定制服务表单', href: '/admin/forms' }
            ]
        },
        {
            title: '入驻管理',
            icon: <UserPlus className="w-5 h-5" />,
            children: [
                { title: '入驻申请表单', href: '/admin/forms?type=provider_reg' }
            ]
        },
        {
            title: '合同模板',
            icon: <FileText className="w-5 h-5" />,
            href: '/admin/contracts'
        },
        {
            title: '内容管理',
            icon: <Newspaper className="w-5 h-5" />,
            children: [
                { title: '文章管理', href: '/publish' },
                { title: '广告审核', href: '/admin/ads' },
                { title: '社区治理', href: '/admin/forum' },
                { title: '源管理', href: '/sources' },
                { title: '抓取记录', href: '/admin/fetch-stats' }
            ]
        },
        {
            title: '用户管理',
            icon: <Users className="w-5 h-5" />,
            href: '/admin/users'
        },
        {
            title: '财务管理',
            icon: <CreditCard className="w-5 h-5" />,
            href: '/admin/finance'
        },
        {
            title: '系统与 AI',
            icon: <Bot className="w-5 h-5" />,
            children: [
                { title: 'AI 配置', href: '/admin/ai-config' },
                { title: '系统维护', href: '/admin/maintenance' },
                { title: '系统设置', href: '/admin/settings' }
            ]
        }
    ];

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen border-r border-slate-800 flex flex-col sticky top-0">
            {/* Logo */}
            <div className="p-6 border-b border-slate-800">
                <Link href="/admin" className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-black text-white tracking-tight">优服佳/后台</span>
                </Link>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                {sidebarItems.map((item) => {
                    const hasChildren = item.children && item.children.length > 0;
                    const isOpen = openMenus.includes(item.title);
                    const isActive = item.href === pathname || (item.children?.some(child => child.href === pathname));

                    return (
                        <div key={item.title}>
                            {hasChildren ? (
                                <>
                                    <button
                                        onClick={() => toggleMenu(item.title)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isActive ? 'bg-slate-800/50 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {item.icon}
                                            <span className="font-bold text-sm tracking-wide">{item.title}</span>
                                        </div>
                                        {isOpen ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
                                    </button>

                                    {isOpen && (
                                        <div className="mt-1 ml-4 pl-4 border-l border-slate-800 space-y-1">
                                            {item.children?.map((child) => (
                                                <Link
                                                    key={child.href}
                                                    href={child.href}
                                                    className={`block p-2 text-xs font-medium rounded-lg transition-colors ${pathname === child.href ? 'text-teal-500 bg-teal-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                                                >
                                                    {child.title}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Link
                                    href={item.href || '#'}
                                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${pathname === item.href ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/20' : 'hover:bg-slate-800 hover:text-white'}`}
                                >
                                    {item.icon}
                                    <span className="font-bold text-sm tracking-wide">{item.title}</span>
                                </Link>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 p-2 bg-slate-800/30 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-black text-xs">
                        管
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-white truncate">欢迎回来, 管理员</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">管理员权限</p>
                    </div>
                    <Link href="/logout" className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors">
                        <Activity className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </aside>
    );
}
