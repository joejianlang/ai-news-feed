'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useUser } from '@/lib/contexts/UserContext';
import {
    ArrowLeft, MapPin, Clock, Shield, CheckCircle2,
    Phone, MessageCircle, ChevronLeft, ChevronRight,
    BadgeCheck, Banknote, CalendarDays, Zap, CreditCard, X,
} from 'lucide-react';

interface Service {
    id: string;
    title: string;
    description: string;
    price: string;
    price_unit: string;
    category: string;
    service_mode: string;
    service_city: string;
    service_area: string;
    images: string[];
    duration: string;
    advance_booking: string;
    deposit_ratio: number;
    is_licensed: boolean;
    has_insurance: boolean;
    tax_included: boolean;
    cancellation_policy: string;
    client_requirements: string;
    inclusions: string[];
    exclusions: string[];
    extra_fees: any[];
    add_ons: any[];
    created_at: string;
    provider_id: string;
}

interface Provider {
    id: string;
    name: string;
    email: string;
    avatar_url: string;
}

const PRICE_UNIT_MAP: Record<string, string> = {
    per_service: '每次',
    per_hour: '每小时',
    per_day: '每天',
    per_sqft: '每平方尺',
    per_item: '每件',
    negotiable: '面议',
};

const SERVICE_MODE_MAP: Record<string, string> = {
    online: '线上',
    offline: '上门',
    both: '线上/上门',
};

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useUser();
    const [service, setService] = useState<Service | null>(null);
    const [provider, setProvider] = useState<Provider | null>(null);
    const [loading, setLoading] = useState(true);
    const [imgIndex, setImgIndex] = useState(0);

    // 确认订单 Modal
    const [showOrder, setShowOrder] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [orderDone, setOrderDone] = useState(false);

    useEffect(() => {
        fetch(`/api/services/${id}`)
            .then(r => r.json())
            .then(d => {
                setService(d.service || null);
                setProvider(d.provider || null);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const handleBook = () => {
        if (!user) { router.push('/login'); return; }
        setShowOrder(true);
    };

    const handleConfirmOrder = async () => {
        if (!service || !user) return;
        setSubmitting(true);
        try {
            const totalAmount = parseFloat(service.price) || 0;
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: service.id,
                    service_name: service.title,
                    provider_id: provider?.id || null,
                    total_amount: totalAmount,
                    deposit_amount: totalAmount * (service.deposit_ratio || 0) / 100,
                    service_type: 'standard',
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '创建订单失败');
            setOrderDone(true);
        } catch (e: any) {
            alert(e.message || '创建订单失败，请重试');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
            <Navbar />
            <div className="flex-1 flex items-center justify-center">
                <div className="w-9 h-9 border-[3px] border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: '#0d9488', borderTopColor: 'transparent' }} />
            </div>
        </div>
    );

    if (!service) return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>
            <Navbar />
            <div className="flex-1 flex items-center justify-center flex-col gap-3 p-8">
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>服务不存在</p>
                <button onClick={() => router.back()} className="text-sm font-bold" style={{ color: '#0d9488' }}>← 返回</button>
            </div>
        </div>
    );

    const images = service.images?.length > 0 ? service.images : [];
    const priceUnit = PRICE_UNIT_MAP[service.price_unit] || service.price_unit || '';
    const serviceMode = SERVICE_MODE_MAP[service.service_mode] || service.service_mode || '';
    const totalAmount = parseFloat(service.price) || 0;
    const depositRatio = service.deposit_ratio || 0;
    const depositAmount = depositRatio > 0 ? (totalAmount * depositRatio / 100) : totalAmount;
    const needDeposit = depositRatio > 0;

    return (
        <div className="min-h-screen flex flex-col font-sans pb-28" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
            <Navbar />

            {/* ── 图片轮播 ── */}
            <div className="relative w-full aspect-[16/9] max-h-[420px] overflow-hidden"
                style={{ background: 'var(--card-bg)' }}>
                {images.length > 0 ? (
                    <>
                        <Image src={images[imgIndex]} alt={service.title} fill className="object-cover" />
                        {images.length > 1 && (
                            <>
                                <button onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
                                    <ChevronLeft size={18} className="text-white" />
                                </button>
                                <button onClick={() => setImgIndex(i => (i + 1) % images.length)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center">
                                    <ChevronRight size={18} className="text-white" />
                                </button>
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {images.map((_, i) => (
                                        <button key={i} onClick={() => setImgIndex(i)}
                                            className="w-1.5 h-1.5 rounded-full transition-all"
                                            style={{ background: i === imgIndex ? '#fff' : 'rgba(255,255,255,0.45)' }} />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                        <Zap size={40} strokeWidth={1.5} />
                    </div>
                )}
                <button onClick={() => router.back()}
                    className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm"
                    style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <ArrowLeft size={18} className="text-white" />
                </button>
            </div>

            {/* ── 主内容 ── */}
            <div className="max-w-2xl mx-auto w-full px-4 py-5 space-y-4">

                {/* 标题 + 价格 */}
                <div className="rounded-2xl p-4 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <h1 className="text-[18px] font-black leading-snug flex-1" style={{ color: 'var(--text-primary)' }}>
                            {service.title}
                        </h1>
                        <div className="text-right flex-shrink-0">
                            <p className="text-[22px] font-black" style={{ color: '#0d9488' }}>
                                {service.price && service.price !== '面议' ? `$${service.price}` : '面议'}
                            </p>
                            {priceUnit && service.price !== '面议' && (
                                <p className="text-[11px] font-semibold -mt-0.5" style={{ color: 'var(--text-muted)' }}>/{priceUnit}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                        {service.category && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: '#0d948818', color: '#0d9488' }}>
                                {service.category}
                            </span>
                        )}
                        {serviceMode && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                                style={{ background: 'var(--background)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}>
                                {serviceMode}
                            </span>
                        )}
                        {service.service_city && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                                style={{ background: 'var(--background)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}>
                                <MapPin size={10} /> {service.service_city}
                            </span>
                        )}
                        {service.is_licensed && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: '#16a34a18', color: '#16a34a' }}>
                                <BadgeCheck size={11} /> 持证上岗
                            </span>
                        )}
                        {service.has_insurance && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: '#0891b218', color: '#0891b2' }}>
                                <Shield size={11} /> 保险保障
                            </span>
                        )}
                        {service.tax_included && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: '#7c3aed18', color: '#7c3aed' }}>
                                <Banknote size={11} /> 含税
                            </span>
                        )}
                    </div>
                </div>

                {/* 服务信息 */}
                {(service.duration || service.advance_booking || service.deposit_ratio) && (
                    <div className="rounded-2xl p-4 border grid grid-cols-3 gap-3" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                        {service.duration && (
                            <div className="flex flex-col items-center gap-1">
                                <Clock size={18} style={{ color: '#0d9488' }} />
                                <p className="text-[10px] font-bold text-center" style={{ color: 'var(--text-muted)' }}>服务时长</p>
                                <p className="text-[12px] font-black text-center" style={{ color: 'var(--text-primary)' }}>{service.duration}</p>
                            </div>
                        )}
                        {service.advance_booking && (
                            <div className="flex flex-col items-center gap-1">
                                <CalendarDays size={18} style={{ color: '#0891b2' }} />
                                <p className="text-[10px] font-bold text-center" style={{ color: 'var(--text-muted)' }}>提前预约</p>
                                <p className="text-[12px] font-black text-center" style={{ color: 'var(--text-primary)' }}>{service.advance_booking}</p>
                            </div>
                        )}
                        {depositRatio > 0 && (
                            <div className="flex flex-col items-center gap-1">
                                <Banknote size={18} style={{ color: '#7c3aed' }} />
                                <p className="text-[10px] font-bold text-center" style={{ color: 'var(--text-muted)' }}>定金比例</p>
                                <p className="text-[12px] font-black text-center" style={{ color: 'var(--text-primary)' }}>{depositRatio}%</p>
                            </div>
                        )}
                    </div>
                )}

                {/* 服务描述 */}
                {service.description && (
                    <div className="rounded-2xl p-4 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                        <h2 className="text-[13px] font-black mb-2" style={{ color: 'var(--text-primary)' }}>服务介绍</h2>
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{service.description}</p>
                    </div>
                )}

                {/* 包含/不包含 */}
                {(service.inclusions?.length > 0 || service.exclusions?.length > 0) && (
                    <div className="rounded-2xl p-4 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                        {service.inclusions?.length > 0 && (
                            <>
                                <h2 className="text-[13px] font-black mb-2" style={{ color: 'var(--text-primary)' }}>✅ 服务包含</h2>
                                <ul className="space-y-1 mb-3">
                                    {service.inclusions.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                                            <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" style={{ color: '#16a34a' }} />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                        {service.exclusions?.length > 0 && (
                            <>
                                <h2 className="text-[13px] font-black mb-2" style={{ color: 'var(--text-primary)' }}>❌ 不包含</h2>
                                <ul className="space-y-1">
                                    {service.exclusions.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                                            <span className="flex-shrink-0 mt-0.5 text-red-400">×</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                )}

                {/* 客户须知 */}
                {service.client_requirements && (
                    <div className="rounded-2xl p-4 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                        <h2 className="text-[13px] font-black mb-2" style={{ color: 'var(--text-primary)' }}>客户须知</h2>
                        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{service.client_requirements}</p>
                    </div>
                )}

                {/* 取消政策 */}
                {service.cancellation_policy && (
                    <div className="rounded-2xl p-4 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                        <h2 className="text-[13px] font-black mb-2" style={{ color: 'var(--text-primary)' }}>取消政策</h2>
                        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{service.cancellation_policy}</p>
                    </div>
                )}

                {/* 服务商信息 */}
                {provider && (
                    <div className="rounded-2xl p-4 border flex items-center gap-3" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                        <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-black text-base"
                            style={{ background: '#0d9488' }}>
                            {provider.avatar_url
                                ? <Image src={provider.avatar_url} alt={provider.name} width={44} height={44} className="object-cover" />
                                : (provider.name?.[0] || provider.email?.[0] || '?').toUpperCase()
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-black truncate" style={{ color: 'var(--text-primary)' }}>{provider.name || provider.email}</p>
                            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>认证服务商</p>
                        </div>
                        <BadgeCheck size={18} style={{ color: '#0d9488' }} />
                    </div>
                )}
            </div>

            {/* ── 底部 CTA ── */}
            <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 px-4 py-3 border-t"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                <div className="max-w-2xl mx-auto flex gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border font-bold text-[13px] transition-all active:scale-95"
                        style={{ borderColor: '#0d9488', color: '#0d9488', background: 'transparent' }}>
                        <MessageCircle size={16} />
                        咨询
                    </button>
                    <button onClick={handleBook}
                        className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-[13px] text-white transition-all active:scale-95"
                        style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)', boxShadow: '0 4px 16px rgba(13,148,136,0.3)' }}>
                        <Phone size={16} />
                        立即预约
                    </button>
                </div>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                确认订单 Modal（底部弹出）
            ════════════════════════════════════════════════════════════════ */}
            {showOrder && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center"
                    style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                    onClick={e => { if (e.target === e.currentTarget && !submitting) setShowOrder(false); }}>
                    <div className="w-full max-w-lg rounded-t-3xl overflow-hidden flex flex-col"
                        style={{ background: '#f5f5f5', maxHeight: '92vh' }}>

                        {/* 标题栏 */}
                        <div className="flex items-center gap-3 px-5 pt-5 pb-4" style={{ background: '#f5f5f5' }}>
                            <button onClick={() => { if (!submitting) setShowOrder(false); }}
                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: '#e5e7eb' }}>
                                <X size={16} style={{ color: '#374151' }} />
                            </button>
                            <h2 className="text-[17px] font-black flex-1 text-center pr-8" style={{ color: '#111827' }}>确认订单</h2>
                        </div>

                        {orderDone ? (
                            /* ── 成功状态 ── */
                            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10 gap-4">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#dcfce7' }}>
                                    <CheckCircle2 size={36} style={{ color: '#16a34a' }} strokeWidth={1.8} />
                                </div>
                                <p className="text-[18px] font-black" style={{ color: '#111827' }}>订单已创建！</p>
                                <p className="text-sm text-center" style={{ color: '#6b7280' }}>
                                    订单已提交，请等待服务商确认后完成支付。
                                </p>
                                <button onClick={() => { setShowOrder(false); router.push('/profile/orders'); }}
                                    className="w-full py-3.5 rounded-2xl font-bold text-white text-[15px]"
                                    style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
                                    查看我的订单
                                </button>
                            </div>
                        ) : (
                            /* ── 确认内容 ── */
                            <div className="overflow-y-auto flex-1 px-4 pb-4 space-y-3">

                                {/* 服务项目卡片 */}
                                <div className="rounded-2xl p-4" style={{ background: '#ffffff' }}>
                                    <p className="text-[11px] font-bold mb-2" style={{ color: '#9ca3af' }}>服务项目</p>
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="text-[14px] font-black leading-snug flex-1" style={{ color: '#111827' }}>
                                            {service.title}
                                        </p>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-[18px] font-black" style={{ color: '#111827' }}>
                                                ${totalAmount.toFixed(0)}
                                            </p>
                                            <p className="text-[10px]" style={{ color: '#9ca3af' }}>/{priceUnit || 'per_service'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: '#f3f4f6' }}>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[12px]" style={{ color: '#6b7280' }}>服务商</span>
                                            <span className="text-[12px] font-bold" style={{ color: '#111827' }}>
                                                {provider?.name || 'Provider'}
                                            </span>
                                        </div>
                                        {depositRatio > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-[12px]" style={{ color: '#6b7280' }}>定金比例</span>
                                                <span className="text-[12px] font-bold" style={{ color: '#111827' }}>{depositRatio}%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 需支付定金 / 总价 */}
                                <div className="rounded-2xl p-4" style={{ background: '#f0fdf4' }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[14px] font-black" style={{ color: '#15803d' }}>
                                                {needDeposit ? '需支付定金' : '需支付总额'}
                                            </p>
                                            {needDeposit && (
                                                <p className="text-[11px] mt-0.5" style={{ color: '#16a34a' }}>支付定金后订单生效</p>
                                            )}
                                        </div>
                                        <p className="text-[26px] font-black" style={{ color: '#15803d' }}>
                                            ${depositAmount.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                {/* 反悔期保障 */}
                                <div className="rounded-2xl p-4" style={{ background: '#eff6ff' }}>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                            style={{ background: '#dbeafe' }}>
                                            <Clock size={16} style={{ color: '#2563eb' }} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-black mb-1" style={{ color: '#1d4ed8' }}>反悔期保障</p>
                                            <p className="text-[12px] leading-relaxed" style={{ color: '#3b82f6' }}>
                                                支付后 <strong>24 小时</strong>内可免费取消订单，定金将全额原路退还。超过反悔期后取消，定金将不予退还。
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 付款方式 */}
                                <div className="rounded-2xl p-4" style={{ background: '#ffffff' }}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <CreditCard size={16} style={{ color: '#6b7280' }} />
                                        <p className="text-[13px] font-black" style={{ color: '#111827' }}>付款方式</p>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl"
                                        style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-7 rounded-md flex items-center justify-center"
                                                style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                                                <span className="text-white text-[8px] font-black">VISA</span>
                                            </div>
                                            <span className="text-[13px] font-bold tracking-widest" style={{ color: '#374151' }}>
                                                ····
                                            </span>
                                        </div>
                                        <div className="w-4 h-4 rounded-full" style={{ background: '#16a34a' }} />
                                    </div>
                                </div>

                                {/* 安全说明 */}
                                <p className="text-center text-[11px] pb-2" style={{ color: '#9ca3af' }}>
                                    🔒 支付由 Stripe 加密处理 · 优服佳不存储您的卡片信息
                                </p>
                            </div>
                        )}

                        {/* 底部按钮 */}
                        {!orderDone && (
                            <div className="px-4 pb-6 pt-2 flex-shrink-0" style={{ background: '#f5f5f5' }}>
                                <button onClick={handleConfirmOrder} disabled={submitting}
                                    className="w-full py-4 rounded-2xl font-black text-[16px] text-white transition-all active:scale-[0.98] disabled:opacity-60"
                                    style={{ background: 'linear-gradient(135deg,#0d9488,#059669)', boxShadow: '0 4px 20px rgba(13,148,136,0.35)' }}>
                                    {submitting
                                        ? '处理中…'
                                        : `确认支付定金 $${depositAmount.toFixed(2)}`
                                    }
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
