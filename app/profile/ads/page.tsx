'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import {
    ChevronLeft,
    Megaphone,
    Clock,
    CheckCircle,
    AlertCircle,
    Plus,
    CreditCard,
    Image as ImageIcon,
    Upload,
    X,
    ShieldCheck,
    RefreshCw
} from 'lucide-react';
import type { AdItem } from '@/types';
import { formatTime } from '@/lib/utils/format';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import Toast from '@/components/Toast';

export default function UserAdsPage() {
    const { user, isLoading: authLoading } = useUser();
    const router = useRouter();
    const [ads, setAds] = useState<AdItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Payment Modal State
    const [payingAd, setPayingAd] = useState<AdItem | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'online' | 'manual'>('online');
    const [voucherUrl, setVoucherUrl] = useState('');

    const supabase = createSupabaseBrowserClient();

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
            setToast({ message: '获取列表失败', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVoucherUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setToast({ message: '图片不能超过 5MB', type: 'error' });
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `voucher-${user?.id}-${Date.now()}.${fileExt}`;
            const filePath = `vouchers/${fileName}`;

            const { data, error } = await supabase.storage
                .from('ad-images')
                .upload(filePath, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('ad-images')
                .getPublicUrl(filePath);

            setVoucherUrl(publicUrl);
            setToast({ message: '凭证上传成功', type: 'success' });
        } catch (err) {
            console.error('Upload failed:', err);
            setToast({ message: '上传失败，请重试', type: 'error' });
        } finally {
            setIsUploading(false);
        }
    };

    const handlePaymentSubmit = async () => {
        if (!payingAd) return;
        if (paymentMethod === 'manual' && !voucherUrl) {
            setToast({ message: '请上传支付凭据', type: 'error' });
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch('/api/user/ads/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adId: payingAd.id,
                    method: paymentMethod,
                    voucherUrl: paymentMethod === 'manual' ? voucherUrl : undefined
                })
            });

            if (!res.ok) throw new Error('Payment failed');

            setToast({
                message: paymentMethod === 'online' ? '支付成功，广告已上线！' : '凭证已提交，请等待管理员核对',
                type: 'success'
            });
            setPayingAd(null);
            setVoucherUrl('');
            fetchAds();
        } catch (err) {
            console.error(err);
            setToast({ message: '提交失败，请重试', type: 'error' });
        } finally {
            setIsProcessing(false);
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
            case 'verifying_payment':
                return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full"><ShieldCheck className="w-3 h-3" /> 打款核对中</span>;
            case 'offline':
                return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full"><AlertCircle className="w-3 h-3" /> 已下架</span>;
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
            <Toast message={toast?.message || ''} type={toast?.type || 'success'} onClose={() => setToast(null)} />

            {/* Header */}
            <div className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-black italic">我的推广.</h1>
                </div>
                <button
                    onClick={() => router.push('/ads/create')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-black shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    发布
                </button>
            </div>

            <div className="max-w-[600px] mx-auto p-4 space-y-4">
                {ads.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                            <Megaphone className="w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-black mb-2 text-slate-400">暂无正在进行的推广</h3>
                        <p className="text-sm text-slate-400 mb-8 max-w-[240px] mx-auto">立即开启您的首次推广，精准触达数千名 AI 爱好者。</p>
                        <button
                            onClick={() => router.push('/ads/create')}
                            className="px-8 py-3 bg-white dark:bg-slate-900 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 font-black rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                        >
                            发布我的第一支广告
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
                                        <h3 className="font-black text-[15px] pr-4">{ad.title}</h3>
                                        {getStatusBadge(ad.status)}
                                    </div>
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                                        {ad.content}
                                    </p>
                                    <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {ad.duration_days} 天</span>
                                        <span className="flex items-center gap-1.5"><Megaphone className="w-3.5 h-3.5" /> {ad.scope === 'local' ? '本地' : ad.scope === 'city' ? '全市' : ad.scope === 'province' ? '全省' : '全国'}</span>
                                        <span className="ml-auto font-black text-indigo-600 dark:text-indigo-400">¥{ad.price_total}</span>
                                    </div>

                                    {ad.status === 'unpaid' && (
                                        <button
                                            onClick={() => setPayingAd(ad)}
                                            className="w-full mt-4 py-2.5 bg-indigo-600 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
                                        >
                                            <CreditCard size={14} />
                                            立即支付
                                        </button>
                                    )}
                                </div>
                            </div>
                            {ad.rejection_reason && (
                                <div className="px-4 py-3 bg-red-50 dark:bg-red-900/10 border-t border-red-100 dark:border-red-900/20">
                                    <p className="text-[11px] text-red-600 dark:text-red-400 font-bold">
                                        <span className="uppercase tracking-widest mr-2">驳回原因：</span>
                                        {ad.rejection_reason}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Payment Modal */}
            {payingAd && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => !isProcessing && setPayingAd(null)}>
                    <div className="bg-white dark:bg-slate-900 w-full max-w-[440px] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-xl font-black italic">完成支付.</h3>
                            <button onClick={() => setPayingAd(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">待支付金额</div>
                                <div className="text-3xl font-black text-indigo-600">¥{payingAd.price_total}</div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">选择支付方式</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setPaymentMethod('online')}
                                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'online' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                                    >
                                        <CreditCard size={24} />
                                        <span className="text-[13px] font-black">在线支付</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('manual')}
                                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'manual' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`}
                                    >
                                        <ImageIcon size={24} />
                                        <span className="text-[13px] font-black">凭证上传</span>
                                    </button>
                                </div>
                            </div>

                            {paymentMethod === 'manual' ? (
                                <div className="space-y-4 animate-in fade-in zoom-in-95">
                                    <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 rounded-2xl text-[12px] text-orange-800 dark:text-orange-400 leading-relaxed font-bold">
                                        请通过银行或支付宝转账至个人账户：<br />
                                        <span className="text-black dark:text-white font-black">账户名：智流科技 | 账号：6228 8888 8888</span><br />
                                        支付完成后请上传包含订单号的交易截图。
                                    </div>

                                    <div
                                        onClick={() => !isUploading && document.getElementById('voucher-upload')?.click()}
                                        className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl aspect-video flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group relative overflow-hidden"
                                    >
                                        {voucherUrl ? (
                                            <>
                                                <img src={voucherUrl} className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Upload size={32} className="text-white" />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className={`p-4 rounded-full mb-2 ${isUploading ? 'bg-indigo-100' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                    {isUploading ? <RefreshCw className="animate-spin text-indigo-600" /> : <Upload className="text-slate-400" />}
                                                </div>
                                                <span className="text-[13px] font-bold text-slate-400">点击上传打款凭证</span>
                                            </>
                                        )}
                                        <input id="voucher-upload" type="file" accept="image/*" className="hidden" onChange={handleVoucherUpload} />
                                    </div>
                                </div>
                            ) : (
                                <div className="py-10 text-center animate-in fade-in zoom-in-95">
                                    <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                                        <ShieldCheck size={40} />
                                    </div>
                                    <h4 className="font-black text-lg">支持自动上线</h4>
                                    <p className="text-xs text-slate-400 mt-1 font-bold">点击支付后，API 将检测支付状态并立即启用广告。</p>
                                </div>
                            )}

                            <button
                                disabled={isProcessing || isUploading}
                                onClick={handlePaymentSubmit}
                                className="w-full h-14 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {isProcessing ? <RefreshCw className="animate-spin" /> : <CheckCircle size={20} />}
                                {paymentMethod === 'online' ? '模拟支付并激活' : '提交核对申请'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
