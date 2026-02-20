'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import {
    CreditCard,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    ChevronLeft,
    Calendar,
    Download,
    Wallet
} from 'lucide-react';

export default function FinancialDashboard() {
    const { user, isLoading: isUserLoading } = useUser();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (!isUserLoading && user?.role !== 'admin') {
            router.push('/');
        } else if (user) {
            loadFinanceData();
        }
    }, [user, isUserLoading, router]);

    const loadFinanceData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/finance');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Failed to load finance data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (isUserLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    const transactions = data?.transactions || [];
    const stats = [
        { label: '预计总营收', value: `¥${data?.stats?.totalRevenue?.toFixed(2) || '0.00'}`, change: '+0%', icon: <DollarSign className="w-5 h-5" />, color: 'emerald' },
        { label: '广告收入', value: `¥${data?.stats?.adRevenue?.toFixed(2) || '0.00'}`, change: '+0%', icon: <TrendingUp className="w-5 h-5" />, color: 'blue' },
        { label: '待处理提现', value: `¥${data?.stats?.pendingWithdrawals?.toFixed(2) || '0.00'}`, change: '0 笔', icon: <Wallet className="w-5 h-5" />, color: 'amber' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-6 sticky top-0 z-10 transition-colors">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/admin')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 italic tracking-tighter">
                            <CreditCard className="w-7 h-7 text-orange-500" />
                            FINANCE.审计
                        </h1>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-teal-500/20">
                        <Download className="w-4 h-4" />
                        导出报表
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {stats.map((stat) => (
                        <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:translate-y-[-4px]">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-500`}>
                                    {stat.icon}
                                </div>
                                <div className={`flex items-center text-xs font-black ${stat.change.startsWith('+') ? 'text-emerald-500' : 'text-slate-400'}`}>
                                    {stat.change}
                                    {stat.change.startsWith('+') ? <ArrowUpRight className="w-3 h-3 ml-0.5" /> : null}
                                </div>
                            </div>
                            <div className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">{stat.label}</div>
                            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</div>
                        </div>
                    ))}
                </div>

                {/* Transaction Table */}
                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-teal-600" />
                            最近流水记录
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">交易类型</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">用户/商户</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">金额</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">日期</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">状态</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {transactions.map((tx: any) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-sm">{tx.type}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">{tx.user}</td>
                                        <td className={`px-6 py-4 text-right font-black ${tx.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-400 font-bold">{new Date(tx.date).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${tx.status === 'success'
                                                ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5'
                                                : 'border-amber-500/20 text-amber-500 bg-amber-500/5'
                                                }`}>
                                                {tx.status === 'success' ? '已到账' : '处理中'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
