'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import { ChevronLeft, Megaphone, Clock, CheckCircle, AlertCircle, Plus, MoreVertical } from 'lucide-react';
import type { AdItem } from '@/types';
import { formatTime } from '@/lib/utils/format';

export default function UserAdsPage() {
    const { user, isLoading: authLoading } = useUser();
    const router = useRouter();
    const [ads, setAds] = useState<AdItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user) {
            fetchAds();
        }
    }, [user, authLoading, router]);

    const fetchAds = async () => {
        try {
            const res = await fetch('/api/user/ads');
            const data = await res.json();
            if (data.success) {
                setAds(data.ads);
            }
        } catch (error) {
            console.error('Failed to fetch ads:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" /> 进行中</span>;
            case 'pending':
                return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" /> 审核中</span>;
            case 'rejected':
                return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full"><AlertCircle className="w-3 h-3" /> 已驳回</span>;
            case 'unpaid':
                return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-400/10 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" /> 待支付</span>;
            default:
                return <span className="text-[10px] font-black tracking-wider text-slate-400 bg-slate-400/10 px-2 py-0.5 rounded-full">{status}</span>;
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-black italic">My Ads.</h1>
                </div>
                <button
                    onClick={() => router.push('/ads/create')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-black shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Launch
                </button>
            </div>

            <div className="max-w-[600px] mx-auto p-4 space-y-4">
                {ads.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                            <Megaphone className="w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-black mb-2 text-slate-400">No active campaigns</h3>
                        <p className="text-sm text-slate-400 mb-8 max-w-[240px] mx-auto">Launch your first advertisement to reach thousands of AI enthusiasts today.</p>
                        <button
                            onClick={() => router.push('/ads/create')}
                            className="px-8 py-3 bg-white dark:bg-slate-900 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-black rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                            Create Your First Ad
                        </button>
                    </div>
                ) : (
                    ads.map((ad) => (
                        <div key={ad.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                            <div className="p-4 flex gap-4">
                                {ad.image_url && (
                                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                                        <img src={ad.image_url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-1">
                                        <h3 className="font-black text-[15px] truncate pr-4">{ad.title}</h3>
                                        {getStatusBadge(ad.status)}
                                    </div>
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                                        {ad.content}
                                    </p>
                                    <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {ad.duration_days} Days</span>
                                        <span className="flex items-center gap-1.5"><Megaphone className="w-3.5 h-3.5" /> {ad.scope}</span>
                                        <span className="ml-auto font-black text-indigo-600 dark:text-indigo-400">¥{ad.price_total}</span>
                                    </div>
                                </div>
                            </div>
                            {ad.rejection_reason && (
                                <div className="px-4 py-3 bg-red-50 dark:bg-red-900/10 border-t border-red-100 dark:border-red-900/20">
                                    <p className="text-[11px] text-red-600 dark:text-red-400 font-bold">
                                        <span className="uppercase tracking-widest mr-2">Rejection Reason:</span>
                                        {ad.rejection_reason}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
