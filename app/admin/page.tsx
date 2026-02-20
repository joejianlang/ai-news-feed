'use client';

import React from 'react';
import {
    Users,
    Briefcase,
    FileText,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    ClipboardList,
    DollarSign,
    Layers,
    Bot
} from 'lucide-react';

export default function AdminDashboardHome() {
    const stats = [
        {
            label: '总活跃用户',
            value: '1,284',
            change: '+12.5%',
            trend: 'up',
            icon: <Users className="w-5 h-5" />,
            color: 'blue'
        },
        {
            label: '本月服务订单',
            value: '458',
            change: '+8.2%',
            trend: 'up',
            icon: <ClipboardList className="w-5 h-5" />,
            color: 'emerald'
        },
        {
            label: '广告总营收',
            value: '¥12,400',
            change: '-2.4%',
            trend: 'down',
            icon: <DollarSign className="w-5 h-5" />,
            color: 'amber'
        },
        {
            label: '全站内容收录',
            value: '52,103',
            change: '+24.1%',
            trend: 'up',
            icon: <Layers className="w-5 h-5" />,
            color: 'indigo'
        }
    ];

    return (
        <div className="p-8">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">
                <span>管理中心</span>
                <span className="opacity-30">/</span>
                <span className="text-teal-500">业务概览</span>
            </div>

            {/* Header */}
            <div className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white">
                    数据看板
                </h1>
                <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium">
                    这里是优服佳全业务平台的实时运行数据统计与系统健康状态。
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl bg-opacity-10`} style={{ backgroundColor: `${stat.color === 'emerald' ? '#10b98122' : stat.color === 'blue' ? '#3b82f622' : stat.color === 'amber' ? '#f59e0b22' : '#6366f122'}` }}>
                                <div className={`${stat.color === 'emerald' ? 'text-emerald-500' : stat.color === 'blue' ? 'text-blue-500' : stat.color === 'amber' ? 'text-amber-500' : 'text-indigo-500'}`}>
                                    {stat.icon}
                                </div>
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-black ${stat.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {stat.change}
                            </div>
                        </div>
                        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">{stat.label}</h3>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts Placeholder / Detailed Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">服务请求趋势</h3>
                            <p className="text-sm text-slate-500 font-medium mt-1">过去 30 天的每日订单与需求统计</p>
                        </div>
                        <select className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold px-4 py-2">
                            <option>最近 7 天</option>
                            <option>最近 30 天</option>
                        </select>
                    </div>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {[40, 60, 45, 90, 65, 80, 55, 70, 85, 50, 75, 95].map((h, i) => (
                            <div key={i} className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-t-lg relative group overflow-hidden">
                                <div
                                    className="absolute bottom-0 left-0 w-full bg-teal-500/50 group-hover:bg-teal-500 transition-all rounded-t-lg"
                                    style={{ height: `${h}%` }}
                                ></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[3rem] text-white overflow-hidden relative">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                            <Activity className="w-6 h-6 text-teal-400" />
                        </div>
                        <h3 className="text-xl font-black mb-2">系统运行状态</h3>
                        <p className="text-slate-400 text-sm font-medium mb-8">当前服务器负载均衡正常，响应时间稳定。</p>

                        <div className="space-y-6">
                            {[
                                { label: 'CPU 占用', val: '24%', color: 'bg-teal-400' },
                                { label: '内存使用', val: '68%', color: 'bg-indigo-400' },
                                { label: '磁盘空间', val: '41%', color: 'bg-teal-400' }
                            ].map((item, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between text-xs font-bold mb-2">
                                        <span>{item.label}</span>
                                        <span>{item.val}</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color}`} style={{ width: item.val }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl"></div>
                </div>
            </div>

            {/* Quick Actions / Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                        <TrendingUp className="w-6 h-6 text-teal-500" />
                        最近待办
                    </h3>
                    <div className="space-y-4">
                        {[
                            { title: '待审核入驻申请', count: 12, color: 'emerald' },
                            { title: '异常维权订单', count: 3, color: 'rose' },
                            { title: '敏感内容举报', count: 7, color: 'amber' }
                        ].map((task, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl transition-all hover:translate-x-1">
                                <span className="font-bold text-slate-700 dark:text-slate-300">{task.title}</span>
                                <span className={`px-4 py-1.5 rounded-full text-xs font-black bg-${task.color}-500 text-white shadow-lg shadow-${task.color}-500/20`}>
                                    {task.count}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">快速访问</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: '设计表单', icon: <FileText className="w-5 h-5" />, href: '/admin/forms' },
                            { label: '管理需求', icon: <Briefcase className="w-5 h-5" />, href: '/admin/requests' },
                            { label: '配置 AI', icon: <Bot className="w-5 h-5" />, href: '/admin/ai-config' },
                            { label: '查看账单', icon: <DollarSign className="w-5 h-5" />, href: '/admin/finance' }
                        ].map((action, idx) => (
                            <button key={idx} className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800 hover:bg-teal-500 hover:text-white transition-all rounded-[2rem] group">
                                <div className="mb-3 p-3 bg-white dark:bg-slate-900 rounded-xl group-hover:bg-teal-400 group-hover:text-white transition-colors">
                                    {action.icon}
                                </div>
                                <span className="text-xs font-black">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
