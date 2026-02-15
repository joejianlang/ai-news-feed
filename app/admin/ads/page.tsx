'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';

import type { AdItem } from '@/types';
import Navbar from '@/components/Navbar';
import AdCard from '@/components/AdCard';
import Toast from '@/components/Toast';
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
    X,
    ShieldCheck,
    Image as ImageIcon
} from 'lucide-react';

export default function AdminAdsPage() {
    const router = useRouter();
    const { user, isLoading: isUserLoading } = useUser();
    const [ads, setAds] = useState<AdItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedAd, setSelectedAd] = useState<AdItem | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ id: string; type: 'approve' | 'online' } | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
            setToast({ message: '获取广告列表失败', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmPayment = async (id: string) => {
        setIsProcessing(true);
        try {
            const res = await fetch('/api/admin/ads/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'active' })
            });

            if (!res.ok) throw new Error('API failed');

            setAds(ads.filter(a => a.id !== id));
            setToast({ message: '广告已正式上线', type: 'success' });
            setSelectedAd(null);
            setConfirmAction(null);
        } catch (err) {
            console.error(err);
            setToast({ message: '操作失败，请重试', type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleApproveForPayment = async (id: string) => {
        setIsProcessing(true);
        try {
            const res = await fetch('/api/admin/ads/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'unpaid' })
            });

            if (!res.ok) throw new Error('API failed');

            setAds(ads.filter(a => a.id !== id));
            setToast({ message: '审核通过，已更新为“待支付”状态', type: 'success' });
            setSelectedAd(null);
            setConfirmAction(null);
        } catch (err) {
            console.error(err);
            setToast({ message: '操作失败，请重试', type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async (id: string) => {
        if (!rejectReason.trim()) {
            setToast({ message: '请填写拒绝理由', type: 'error' });
            return;
        }
        setIsProcessing(true);
        try {
            const res = await fetch('/api/admin/ads/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'rejected', rejectionReason: rejectReason })
            });

            if (!res.ok) throw new Error('API failed');

            setAds(ads.filter(a => a.id !== id));
            setToast({ message: '已驳回该广告申请', type: 'success' });
            setSelectedAd(null);
            setShowRejectForm(false);
            setRejectReason('');
        } catch (err) {
            console.error(err);
            setToast({ message: '驳回操作失败', type: 'error' });
        } finally {
            setIsProcessing(false);
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
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

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
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${ad.status === 'pending' ? 'bg-teal-100 text-teal-700' :
                                            ad.status === 'verifying_payment' ? 'bg-blue-100 text-blue-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                            {ad.status === 'pending' ? '待审核' :
                                                ad.status === 'verifying_payment' ? '打款核对' :
                                                    ad.status === 'unpaid' ? '待支付' : ad.status}
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={() => { if (!isProcessing && !confirmAction) setSelectedAd(null); setShowRejectForm(false); }}>
                    <div className="bg-background w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-card-border" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-card-border flex justify-between items-center bg-card">
                            <h3 className="text-xl font-black">详情审核</h3>
                            <button onClick={() => { if (!isProcessing && !confirmAction) setSelectedAd(null); setShowRejectForm(false); }} className="text-text-muted hover:text-foreground">
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

                                    {selectedAd.payment_voucher_url && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-black uppercase text-blue-600 tracking-widest flex items-center gap-2">
                                                <ImageIcon size={14} />
                                                支付凭证 (用户上传)
                                            </label>
                                            <div className="border-2 border-blue-100 rounded-2xl p-2 bg-blue-50/30">
                                                <a href={selectedAd.payment_voucher_url} target="_blank" rel="noreferrer">
                                                    <img src={selectedAd.payment_voucher_url} alt="Voucher" className="w-full rounded-xl object-contain max-h-60 hover:opacity-90 transition-opacity" />
                                                </a>
                                                <p className="text-[10px] text-center text-blue-400 mt-2 font-bold italic">点击图片可查看大图</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-card border border-card-border rounded-2xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-text-muted uppercase">投放范围</span>
                                            <span className="font-black capitalize">{selectedAd.scope === 'local' ? '本地' : selectedAd.scope === 'city' ? '全市' : selectedAd.scope === 'province' ? '全省' : '全国'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-text-muted uppercase">投放时长</span>
                                            <span className="font-black">{selectedAd.duration_days} 天</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-text-muted uppercase">总金额</span>
                                            <span className="font-black text-teal-600 text-xl">¥{selectedAd.price_total}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-text-muted uppercase">支付方式</span>
                                            <span className="font-bold text-[13px]">{selectedAd.payment_method === 'online' ? '在线支付' : selectedAd.payment_method === 'manual' ? '手动转账' : '未支付'}</span>
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
                                            <label className="text-xs font-black uppercase text-text-muted tracking-widest block mb-1">联系方式</label>
                                            <p className="text-sm font-bold">{selectedAd.contact_info || '无'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-black uppercase text-text-muted tracking-widest block mb-1">跳转链接</label>
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
                                        <button disabled={isProcessing} onClick={() => setShowRejectForm(false)} className="px-6 py-2 text-sm font-bold text-red-800 dark:text-red-400">取消</button>
                                        <button disabled={isProcessing} onClick={() => handleReject(selectedAd.id)} className="px-8 py-2 bg-red-600 text-white rounded-xl font-bold flex items-center gap-2">
                                            {isProcessing && <RefreshCw size={16} className="animate-spin" />}
                                            确认拒绝
                                        </button>
                                    </div>
                                </div>
                            )}

                            {confirmAction && (
                                <div className="mt-8 p-6 bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-900/30 rounded-2xl animate-in slide-in-from-top-2">
                                    <p className="font-bold text-teal-900 dark:text-teal-400 mb-4">
                                        {confirmAction.type === 'approve' ? '确定内容合规，并通知用户进行支付吗？' : '已确认收到客户转账，现在让广告立即上线吗？'}
                                    </p>
                                    <div className="flex justify-end gap-3">
                                        <button disabled={isProcessing} onClick={() => setConfirmAction(null)} className="px-6 py-2 text-sm font-bold text-teal-800 dark:text-teal-400">再想想</button>
                                        <button
                                            disabled={isProcessing}
                                            onClick={() => confirmAction.type === 'approve' ? handleApproveForPayment(confirmAction.id) : handleConfirmPayment(confirmAction.id)}
                                            className="px-8 py-2 bg-teal-600 text-white rounded-xl font-bold flex items-center gap-2"
                                        >
                                            {isProcessing && <RefreshCw size={16} className="animate-spin" />}
                                            确认执行
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {!showRejectForm && !confirmAction && (
                            <div className="p-8 border-t border-card-border bg-card flex justify-end gap-4">
                                <button
                                    disabled={isProcessing}
                                    onClick={() => setShowRejectForm(true)}
                                    className="px-10 py-4 border border-red-200 text-red-600 font-black rounded-2xl hover:bg-red-50 transition-all"
                                >
                                    拒绝申请
                                </button>
                                {selectedAd.status === 'pending' ? (
                                    <button
                                        disabled={isProcessing}
                                        onClick={() => setConfirmAction({ id: selectedAd.id, type: 'approve' })}
                                        className="px-12 py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl shadow-xl shadow-teal-500/20 transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <CheckCircle size={20} />
                                        内容合规，去收费
                                    </button>
                                ) : (
                                    <button
                                        disabled={isProcessing}
                                        onClick={() => setConfirmAction({ id: selectedAd.id, type: 'online' })}
                                        className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        {selectedAd.status === 'verifying_payment' ? <ShieldCheck size={20} /> : <DollarSign size={20} />}
                                        {selectedAd.status === 'verifying_payment' ? '确认凭证合法，立即上线' : '确认收妥，立即上线'}
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
