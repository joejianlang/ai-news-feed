'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
    ArrowLeft, Star, MapPin, Clock, Shield, CheckCircle2,
    Phone, MessageCircle, ChevronLeft, ChevronRight,
    BadgeCheck, Banknote, CalendarDays, Zap,
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
    const [service, setService] = useState<Service | null>(null);
    const [provider, setProvider] = useState<Provider | null>(null);
    const [loading, setLoading] = useState(true);
    const [imgIndex, setImgIndex] = useState(0);

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

    return (
        <div className="min-h-screen flex flex-col font-sans pb-28" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
            <Navbar />

            {/* ── 图片轮播 ── */}
            <div className="relative w-full aspect-[16/9] max-h-[420px] overflow-hidden"
                style={{ background: 'var(--card-bg)' }}>
                {images.length > 0 ? (
                    <>
                        <Image
                            src={images[imgIndex]}
                            alt={service.title}
                            fill className="object-cover"
                        />
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
                {/* 返回按钮 */}
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
                                {service.price && service.price !== '面议' ? `¥${service.price}` : '面议'}
                            </p>
                            {priceUnit && service.price !== '面议' && (
                                <p className="text-[11px] font-semibold -mt-0.5" style={{ color: 'var(--text-muted)' }}>{priceUnit}</p>
                            )}
                        </div>
                    </div>

                    {/* 标签行 */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        {service.category && (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold"
                                style={{ background: '#0d948818', color: '#0d9488' }}>
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
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                                style={{ background: '#16a34a18', color: '#16a34a' }}>
                                <BadgeCheck size={11} /> 持证上岗
                            </span>
                        )}
                        {service.has_insurance && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                                style={{ background: '#0891b218', color: '#0891b2' }}>
                                <Shield size={11} /> 保险保障
                            </span>
                        )}
                        {service.tax_included && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                                style={{ background: '#7c3aed18', color: '#7c3aed' }}>
                                <Banknote size={11} /> 含税
                            </span>
                        )}
                    </div>
                </div>

                {/* 服务信息 */}
                {(service.duration || service.advance_booking || service.deposit_ratio) && (
                    <div className="rounded-2xl p-4 border grid grid-cols-3 gap-3"
                        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
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
                        {service.deposit_ratio > 0 && (
                            <div className="flex flex-col items-center gap-1">
                                <Banknote size={18} style={{ color: '#7c3aed' }} />
                                <p className="text-[10px] font-bold text-center" style={{ color: 'var(--text-muted)' }}>定金比例</p>
                                <p className="text-[12px] font-black text-center" style={{ color: 'var(--text-primary)' }}>{service.deposit_ratio}%</p>
                            </div>
                        )}
                    </div>
                )}

                {/* 服务描述 */}
                {service.description && (
                    <div className="rounded-2xl p-4 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                        <h2 className="text-[13px] font-black mb-2" style={{ color: 'var(--text-primary)' }}>服务介绍</h2>
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                            {service.description}
                        </p>
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
                                            <span className="w-3 h-3 flex-shrink-0 mt-0.5 text-red-400">×</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                )}

                {/* 客户要求 */}
                {service.client_requirements && (
                    <div className="rounded-2xl p-4 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                        <h2 className="text-[13px] font-black mb-2" style={{ color: 'var(--text-primary)' }}>客户须知</h2>
                        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {service.client_requirements}
                        </p>
                    </div>
                )}

                {/* 取消政策 */}
                {service.cancellation_policy && (
                    <div className="rounded-2xl p-4 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                        <h2 className="text-[13px] font-black mb-2" style={{ color: 'var(--text-primary)' }}>取消政策</h2>
                        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {service.cancellation_policy}
                        </p>
                    </div>
                )}

                {/* 服务商信息 */}
                {provider && (
                    <div className="rounded-2xl p-4 border flex items-center gap-3"
                        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                        <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-black text-base"
                            style={{ background: '#0d9488' }}>
                            {provider.avatar_url
                                ? <Image src={provider.avatar_url} alt={provider.name} width={44} height={44} className="object-cover" />
                                : (provider.name?.[0] || provider.email?.[0] || '?').toUpperCase()
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-black truncate" style={{ color: 'var(--text-primary)' }}>
                                {provider.name || provider.email}
                            </p>
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
                    <button className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-[13px] text-white transition-all active:scale-95"
                        style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)', boxShadow: '0 4px 16px rgba(13,148,136,0.3)' }}>
                        <Phone size={16} />
                        立即预约
                    </button>
                </div>
            </div>
        </div>
    );
}
