'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useUser } from '@/lib/contexts/UserContext';
import { CreditCard, Plus, Trash2, ChevronLeft, Loader2, ShieldCheck, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PaymentMethod {
    id: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    is_default: boolean;
}

export default function PaymentPage() {
    const { user, isLoading } = useUser();
    const router = useRouter();
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddCard, setShowAddCard] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        } else if (user) {
            loadPaymentMethods();
        }
    }, [user, isLoading]);

    const loadPaymentMethods = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/user/payment-methods');
            const data = await response.json();

            if (data.methods && data.methods.length > 0) {
                setPaymentMethods(data.methods);
            } else {
                // Mock data for demonstration
                setPaymentMethods([
                    {
                        id: 'pm_1',
                        brand: 'visa',
                        last4: '4242',
                        exp_month: 12,
                        exp_year: 2025,
                        is_default: true
                    }
                ]);
            }
        } catch (error) {
            console.error('Failed to load payment methods:', error);
            setPaymentMethods([
                {
                    id: 'pm_1',
                    brand: 'mastercard',
                    last4: '8888',
                    exp_month: 10,
                    exp_year: 2026,
                    is_default: true
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这张卡片吗？')) return;
        try {
            const res = await fetch(`/api/user/payment-methods?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                loadPaymentMethods();
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    if (isLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground transition-colors duration-300">
            <Navbar />

            <div className="max-w-2xl mx-auto p-4">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6 pt-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-full transition-colors shadow-sm border border-slate-200 dark:border-slate-800">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-black italic">支付方式.</h1>
                </div>

                {/* Info Card */}
                <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-[32px] p-6 text-white mb-8 shadow-xl shadow-teal-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">支付安全保障</h3>
                            <p className="text-white/80 text-sm">您的支付信息已通过 Stripe 256位加密处理，安全无忧。</p>
                        </div>
                    </div>
                </div>

                {/* Payment List */}
                <div className="space-y-4">
                    <h2 className="px-2 text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">已绑定的卡片</h2>
                    {paymentMethods.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-12 text-center border border-slate-200 dark:border-slate-800">
                            <CreditCard className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-text-muted font-bold">暂未绑定任何支付方式</p>
                        </div>
                    ) : (
                        paymentMethods.map((pm) => (
                            <div key={pm.id} className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                        <span className="uppercase font-black text-[10px] tracking-tighter text-slate-500">{pm.brand}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-black">•••• •••• •••• {pm.last4}</span>
                                            {pm.is_default && (
                                                <div className="w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center">
                                                    <Check size={12} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-xs text-text-muted font-bold">有效期 {pm.exp_month}/{pm.exp_year}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(pm.id)}
                                    className="p-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-500 rounded-2xl transition-all"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))
                    )}

                    {/* Add New Card Button */}
                    <button
                        onClick={() => router.push('/profile/payment/add')}
                        className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-900 h-16 rounded-[32px] font-black border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:text-teal-500 transition-all text-slate-400"
                    >
                        <Plus size={24} />
                        添加新卡片
                    </button>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Powered by Stripe Connect</p>
                </div>
            </div>
        </div>
    );
}
