'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useUser } from '@/lib/contexts/UserContext';
import { ClipboardList, ChevronLeft, Loader2, Search, Clock, CheckCircle2, AlertCircle, CreditCard, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Order {
    id: string;
    order_no: string;
    status: string;
    total_amount: number;
    service_title: string;
    service_image?: string;
    created_at: string;
}

const statusTabs = [
    { key: 'all', label: '全部' },
    { key: 'pending_payment', label: '待付款' },
    { key: 'in_progress', label: '服务中' },
    { key: 'completed', label: '已完成' },
];

export default function MyOrdersPage() {
    const { user, isLoading: isUserLoading } = useUser();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        } else if (user) {
            loadMyOrders();
        }
    }, [user, isUserLoading]);

    const loadMyOrders = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/user/orders?userId=${user?.id}`);
            const data = await response.json();

            if (data.orders && data.orders.length > 0) {
                setOrders(data.orders);
            } else {
                // Mock data for demo
                setOrders([
                    {
                        id: 'o_1',
                        order_no: 'DB20260216001',
                        status: 'in_progress',
                        total_amount: 158.00,
                        service_title: '空调深度清洗及维保',
                        service_image: 'https://images.unsplash.com/photo-1581578731117-104f8a338e2d?auto=format&fit=crop&w=300&q=80',
                        created_at: new Date().toISOString()
                    }
                ]);
            }
        } catch (error) {
            console.error('Failed to load orders:', error);
            setOrders([
                {
                    id: 'o_mock',
                    order_no: 'MOCK-12345',
                    status: 'completed',
                    total_amount: 88.00,
                    service_title: '高端家政保洁服务',
                    created_at: new Date(Date.now() - 86400000).toISOString()
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (status: string) => {
        const map: any = {
            'pending_payment': '待付款',
            'in_progress': '服务中',
            'completed': '已完成',
            'cancelled': '已取消'
        };
        return map[status] || status;
    };

    if (isUserLoading || loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-100 transition-colors duration-300 pb-24">
            <Navbar />

            <div className="max-w-3xl mx-auto p-4 lg:p-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8 pt-4">
                    <button
                        onClick={() => router.back()}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 shadow-xl"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black italic tracking-tighter">服务订单.</h1>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">跟踪您的所有服务进程</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-6">
                    {statusTabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-6 h-12 rounded-2xl text-sm font-black whitespace-nowrap transition-all border ${activeTab === tab.key
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Order List */}
                <div className="space-y-6">
                    {orders.length === 0 ? (
                        <div className="bg-white/5 rounded-[40px] p-20 text-center border border-dashed border-white/10">
                            <ClipboardList className="w-16 h-16 text-slate-700 mx-auto mb-6" />
                            <h3 className="text-xl font-bold mb-2">暂无相关订单</h3>
                            <button onClick={() => router.push('/services')} className="text-teal-400 font-black text-sm uppercase tracking-widest mt-4">去发现精选服务</button>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div key={order.id} className="bg-white/5 border border-white/10 rounded-[32px] overflow-hidden backdrop-blur-sm group hover:border-white/20 transition-all">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                                            <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">{getStatusLabel(order.status)}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">单号: {order.order_no}</span>
                                    </div>

                                    <div className="flex gap-6">
                                        <div className="w-24 h-24 bg-slate-800 rounded-2xl overflow-hidden shadow-xl flex-shrink-0">
                                            {order.service_image ? (
                                                <img src={order.service_image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-700">
                                                    <Clock size={32} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                            <div>
                                                <h3 className="text-xl font-black truncate">{order.service_title}</h3>
                                                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-tight">下单时间: {new Date(order.created_at).toLocaleString()}</p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-black text-emerald-400 tracking-tighter">${order.total_amount}</span>
                                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">全款</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex gap-3">
                                        {order.status === 'pending_payment' ? (
                                            <button className="flex-1 bg-emerald-600 text-white h-14 rounded-2xl font-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all">立即付款</button>
                                        ) : (
                                            <button className="flex-1 bg-white/5 border border-white/10 text-white h-14 rounded-2xl font-black hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                                查看详情
                                                <ArrowRight size={18} />
                                            </button>
                                        )}
                                        <button className="px-6 bg-white/5 border border-white/10 text-slate-400 h-14 rounded-2xl font-black hover:bg-white/10 transition-all">联系客服</button>
                                    </div>
                                </div>

                                <div className="bg-white/5 px-6 py-4 border-t border-white/5 flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-slate-500" />
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Digital Buffet 交易保障已开启</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="mt-16 text-center">
                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">所有的努力为了更好的服务体验</p>
                </div>
            </div>
        </div>
    );
}

function ShieldCheck(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}
