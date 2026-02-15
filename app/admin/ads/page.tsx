'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';

import type { AdItem } from '@/types';
import Navbar from '@/components/Navbar';
import AdCard from '@/components/AdCard';
import {
    Shield,
    CheckCircle,
    XCircle,
    Calendar,
    User,
    DollarSign,
    AlertCircle,
    Eye,
    RefreshCw,
    X
} from 'lucide-react';

export default function AdminAdsPage() {
    const router = useRouter();
    const { user, isLoading: isUserLoading } = useUser();
    const [ads, setAds] = useState<AdItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAd, setSelectedAd] = useState<AdItem | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);

    useEffect(() => {
        if (!isUserLoading) {
            if (!user || user.role !== 'admin') {
                router.push('/');
            } else {
                fetchAds();
            }
        }
    }, [user, isUserLoading, router]);

    const fetchAds = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/ads/pending');
            const data = await res.json();
            if (data.ads) {
                setAds(data.ads);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmPayment = async (id: string) => {
        if (!confirm('已确认收到客户转账，现在让广告立即上线吗？')) return;
        try {
            const res = await fetch('/api/admin/ads/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'active' })
            });

            if (!res.ok) throw new Error('API failed');

            setAds(ads.filter(a => a.id !== id));
            setSelectedAd(null);
            alert('广告已通过并正式上线');
        } catch (err) {
            console.error(err);
            alert('操作失败');
        }
    };

    const handleApproveForPayment = async (id: string) => {
        if (!confirm('确定内容合规，通知用户进行支付吗？')) return;
        try {
            const res = await fetch('/api/admin/ads/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'unpaid' })
            });

            if (!res.ok) throw new Error('API failed');

            setAds(ads.filter(a => a.id !== id));
            setSelectedAd(null);
            alert('审核已通过，状态已更新为“待支付”');
        } catch (err) {
            console.error(err);
            alert('操作失败');
        }
    };

    const handleReject = async (id: string) => {
        if (!rejectReason.trim()) return alert('请填写拒绝理由');
        try {
            const res = await fetch('/api/admin/ads/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'rejected', rejectionReason: rejectReason })
            });

            if (!res.ok) throw new Error('API failed');

            setAds(ads.filter(a => a.id !== id));
            setSelectedAd(null);
            setShowRejectForm(false);
            setRejectReason('');
            alert('广告已拒绝');
        } catch (err) {
            console.error(err);
            alert('操作失败');
        }
    };

    if (isUserLoading || !user || user.role !== 'admin') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background transition-colors">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-2">
                            <Shield className="text-teal-600" />
                            广告审核控制台
                        </h1>
                        <p className="text-text-muted mt-1">审核并管理全站投放的赞助内容</p>
                    </div>
                    <button
                        onClick={fetchAds}
                        className="p-2 hover:bg-card-border rounded-full transition-colors"
                        title="刷新"
                    >
                        <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-40 bg-card border border-card-border rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : ads.length === 0 ? (
                    <div className="text-center py-20 bg-card border border-dashed border-card-border rounded-3xl">
                        <AlertCircle className="mx-auto text-text-muted mb-4" size={48} />
                        <p className="text-text-muted font-bold text-lg">暂无待处理的广告申请</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ads.map(ad => (
                            <div
                                key={ad.id}
                                onClick={() => setSelectedAd(ad)}
                                className="bg-card border border-card-border rounded-2xl overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group"
                            >
                                <div className="aspect-video w-full bg-black/5 relative overflow-hidden">
                                    {ad.image_url ? (
                                        <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-text-muted uppercase font-black text-xs opacity-20">No Image</div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Eye className="text-white" size={32} />
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-black text-lg truncate flex-1">{ad.title}</h3>
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${ad.status === 'pending' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {ad.status === 'pending' ? '待审核' : '待支付'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-text-muted font-bold">
                                        <span className="flex items-center gap-1">
                                            <DollarSign size={12} />
                                            {ad.price_total}
                                        </span>
                                        <span className="flex items-center gap-1 uppercase tracking-tighter">
                                            <Calendar size={12} />
                                            {ad.duration_days}天
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Ad Detail Modal */}
            {selectedAd && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={() => { setSelectedAd(null); setShowRejectForm(false); }}>
                    <div className="bg-background w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-card-border" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-card-border flex justify-between items-center bg-card">
                            <h3 className="text-xl font-black">详情审核</h3>
                            <button onClick={() => { setSelectedAd(null); setShowRejectForm(false); }} className="text-text-muted hover:text-foreground">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-text-muted tracking-widest">Feed 效果预览</label>
                                        <div className="border border-card-border rounded-2xl p-4 bg-background">
                                            <AdCard ad={selectedAd} isPreview />
                                        </div>
                                    </div>

                                    <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-text-muted uppercase">投放范围</span>
                                            <span className="font-black capitalize">{selectedAd.scope}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-text-muted uppercase">投放时长</span>
                                            <span className="font-black">{selectedAd.duration_days} 天</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-text-muted uppercase">总金额</span>
                                            <span className="font-black text-teal-600 text-xl">${selectedAd.price_total}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-xs font-black uppercase text-text-muted tracking-widest block mb-2">广告标题</label>
                                        <p className="text-xl font-black">{selectedAd.title}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-black uppercase text-text-muted tracking-widest block mb-2">正文内容</label>
                                        <div className="bg-card p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">{selectedAd.content}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-black uppercase text-text-muted tracking-widest block mb-2">联系方式</label>
                                            <p className="text-sm font-bold">{selectedAd.contact_info || '无'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-black uppercase text-text-muted tracking-widest block mb-2">跳转链接</label>
                                            {selectedAd.link_url ? (
                                                <a href={selectedAd.link_url} target="_blank" className="text-sm font-bold text-blue-600 truncate block hover:underline">{selectedAd.link_url}</a>
                                            ) : <p className="text-sm font-bold">无</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-black uppercase text-text-muted tracking-widest block mb-2">原始输入 (草稿)</label>
                                        <p className="text-xs text-text-muted italic bg-black/5 p-3 rounded-lg">{selectedAd.raw_content || '未提供'}</p>
                                    </div>
                                </div>
                            </div>

                            {showRejectForm && (
                                <div className="mt-8 p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl animate-in slide-in-from-top-2">
                                    <label className="block text-sm font-black text-red-800 dark:text-red-400 mb-2 uppercase">拒绝理由</label>
                                    <textarea
                                        value={rejectReason}
                                        onChange={e => setRejectReason(e.target.value)}
                                        className="w-full bg-white dark:bg-black/20 border border-red-200 dark:border-red-900/40 rounded-xl p-4 focus:ring-2 focus:ring-red-500 outline-none"
                                        placeholder="请说明拒绝原因..."
                                        rows={3}
                                    />
                                    <div className="flex justify-end gap-3 mt-4">
                                        <button onClick={() => setShowRejectForm(false)} className="px-6 py-2 text-sm font-bold text-red-800 dark:text-red-400">取消</button>
                                        <button onClick={() => handleReject(selectedAd.id)} className="px-8 py-2 bg-red-600 text-white rounded-xl font-bold">确认拒绝</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {!showRejectForm && (
                            <div className="p-8 border-t border-card-border bg-card flex justify-end gap-4">
                                <button
                                    onClick={() => setShowRejectForm(true)}
                                    className="px-10 py-4 border border-red-200 text-red-600 font-black rounded-2xl hover:bg-red-50 transition-all"
                                >
                                    拒绝申请
                                </button>
                                {selectedAd.status === 'pending' ? (
                                    <button
                                        onClick={() => handleApproveForPayment(selectedAd.id)}
                                        className="px-12 py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl shadow-xl shadow-teal-500/20 transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <CheckCircle size={20} />
                                        内容合规，去收费
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleConfirmPayment(selectedAd.id)}
                                        className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <DollarSign size={20} />
                                        确认收妥，立即上线
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
