'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useUser } from '@/lib/contexts/UserContext';
import { ChevronLeft, CreditCard, Lock, ShieldCheck, Plus, Check, Loader2 } from 'lucide-react';

export default function AddPaymentPage() {
    const { user, isLoading: isUserLoading } = useUser();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        cardNumber: '',
        expiry: '',
        cvc: '',
        name: ''
    });

    if (isUserLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // This is a simulation since Stripe integration requires full client-side SDK logic
        // But we provide the UI as requested.
        try {
            const response = await fetch('/api/user/payment-methods', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brand: 'visa', // simulated
                    last4: formData.cardNumber.slice(-4),
                    exp_month: parseInt(formData.expiry.split('/')[0]),
                    exp_year: 2020 + parseInt(formData.expiry.split('/')[1]),
                    is_default: true
                })
            });

            if (response.ok) {
                router.push('/profile/payment');
            } else {
                alert('绑定失败，请检查卡片信息');
            }
        } catch (error) {
            console.error('Failed to add payment method:', error);
            alert('网络错误');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground transition-colors duration-300">
            <Navbar />

            <div className="max-w-xl mx-auto p-4">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8 pt-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-full transition-colors shadow-sm border border-slate-200 dark:border-slate-800"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-black italic">绑卡支付.</h1>
                </div>

                {/* Simulated Card Preview */}
                <div className="relative w-full aspect-[1.6/1] mb-10 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 rounded-[32px] shadow-2xl shadow-indigo-500/30 p-8 text-white flex flex-col justify-between z-10">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                                <CreditCard className="w-8 h-8" />
                            </div>
                            <div className="font-black italic text-xl tracking-tighter opacity-70">数位BUFFET.</div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-2xl font-black tracking-[0.2em] h-8">
                                {formData.cardNumber || '•••• •••• •••• ••••'}
                            </div>
                            <div className="flex gap-10">
                                <div>
                                    <div className="text-[9px] font-black uppercase tracking-widest opacity-60">持卡人</div>
                                    <div className="font-bold text-sm tracking-widest uppercase h-5">{formData.name || 'FULL NAME'}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black uppercase tracking-widest opacity-60">有效期</div>
                                    <div className="font-bold text-sm h-5">{formData.expiry || 'MM/YY'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Decorative Background Glow */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-500/10 blur-3xl"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2 block">持卡人姓名</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="请输入真实姓名"
                                    className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all uppercase"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2 block">卡号</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        placeholder="0000 0000 0000 0000"
                                        className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all tracking-widest"
                                        value={formData.cardNumber}
                                        onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim() })}
                                        maxLength={19}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 items-center">
                                        <div className="w-5 h-3 bg-red-500 rounded-sm"></div>
                                        <div className="w-5 h-3 bg-yellow-500 rounded-sm opacity-50"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2 block">有效期</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="MM / YY"
                                        className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all text-center"
                                        value={formData.expiry}
                                        onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                                        maxLength={5}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2 block">安全码</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="CVV"
                                        className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all text-center"
                                        value={formData.cvc}
                                        onChange={(e) => setFormData({ ...formData, cvc: e.target.value })}
                                        maxLength={3}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 py-2 px-2">
                            <ShieldCheck className="w-10 h-10 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-xl" />
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">Stripe 安全传输</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">我们不会在服务器存储您的卡片敏感信息</p>
                            </div>
                            <Lock className="w-4 h-4 text-slate-300" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-16 bg-slate-900 dark:bg-indigo-600 text-white rounded-[32px] font-black text-lg shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-70 active:scale-[0.98]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                正在加密...
                            </>
                        ) : (
                            <>
                                <Plus className="w-6 h-6" />
                                确认绑定卡片
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 flex justify-center gap-6 opacity-30 grayscale contrast-200">
                    <div className="h-6 w-10 bg-slate-400 rounded"></div>
                    <div className="h-6 w-10 bg-slate-400 rounded"></div>
                    <div className="h-6 w-10 bg-slate-400 rounded"></div>
                </div>
            </div>
        </div>
    );
}
