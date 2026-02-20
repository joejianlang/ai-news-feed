'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/contexts/UserContext';
import {
    ClipboardList,
    Search,
    Filter,
    ChevronLeft,
    Clock,
    CheckCircle2,
    AlertCircle,
    CreditCard,
    ArrowRight,
    User,
    ShoppingBag
} from 'lucide-react';

interface Order {
    id: string;
    order_no: string;
    status: 'pending_payment' | 'in_progress' | 'completed' | 'cancelled';
    total_amount: number;
    service_title: string;
    customer_name: string;
    created_at: string;
}

export default function OrderManagementPage() {
    const { user, isLoading: isUserLoading } = useUser();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeStatus, setActiveStatus] = useState('all');

    useEffect(() => {
        if (!isUserLoading && user?.role !== 'admin') {
            router.push('/');
        } else {
            loadAllOrders();
        }
    }, [user, isUserLoading, router]);

    const loadAllOrders = async () => {
        try {
            setLoading(true);
            const url = `/api/admin/orders?limit=100${activeStatus !== 'all' ? `&status=${activeStatus}` : ''}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.orders) {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error('Failed to load orders:', error);
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

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-6 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/admin')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <ShoppingBag className="w-7 h-7 text-rose-500" />
                            全平台订单管理
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-1 flex gap-1">
                            {['all', 'pending_payment', 'in_progress', 'completed'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setActiveStatus(s)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${activeStatus === s
                                        ? 'bg-white dark:bg-slate-700 text-teal-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    {s === 'all' ? '全部' : s === 'pending_payment' ? '待支付' : s === 'in_progress' ? '服务中' : '已完成'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-8">
                <div className="grid grid-cols-1 gap-4">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                                    order.status === 'pending_payment' ? 'bg-amber-500/10 text-amber-500' :
                                        'bg-blue-500/10 text-blue-500'
                                    }`}>
                                    <ClipboardList className="w-7 h-7" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{order.order_no}</span>
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${order.status === 'completed' ? 'bg-emerald-500 text-white' :
                                            order.status === 'pending_payment' ? 'bg-amber-500 text-white' :
                                                'bg-blue-500 text-white'
                                            }`}>
                                            {order.status === 'completed' ? '已完成' : order.status === 'pending_payment' ? '待支付' : '服务中'}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{order.service_title}</h3>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                            <User className="w-3.5 h-3.5" />
                                            {order.customer_name}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(order.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-8 justify-between md:justify-end">
                                <div className="text-right">
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">订单金额</div>
                                    <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">¥{order.total_amount.toFixed(2)}</div>
                                </div>
                                <button className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl text-sm font-black transition-all flex items-center gap-2">
                                    核销/详情
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {orders.length === 0 && (
                        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-800">
                            <AlertCircle className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold italic">当前暂无活跃订单</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
