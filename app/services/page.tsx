'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useUser } from '@/lib/contexts/UserContext';
import {
    Search, Star, ChevronRight, X, Sparkles,
    Truck, Car, Wind, Wrench, Sun, DollarSign, Key,
    Zap, Droplets, LayoutGrid, ArrowLeft, CheckCircle2, FileText,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ServiceCategory {
    id: string;
    name: string;
    name_en: string;
    icon: string;
}

interface Service {
    id: string;
    title: string;
    description: string;
    price: string;
    price_unit: string;
    location: string;
    contact_name: string;
    images: string[];
    created_at: string;
    service_categories: { name: string };
    rating?: number;
    review_count?: string;
}

interface FormField {
    key: string;
    type: string;      // text | textarea | select | radio | date | time | number | phone | address | image
    label: string;
    required?: boolean;
    placeholder?: string;
    options?: Array<string | { label: string; value: string }>;
}

interface FormStep {
    title: string;
    description?: string;
    fields: FormField[];
}

interface FormTemplate {
    id: string;
    name: string;
    description: string;
    color: string;
    steps: FormStep[];
    custom_service_category_id: string | null;
    category: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
    truck: Truck, car: Car, spray: Wind, tool: Wrench,
    sun: Sun, 'dollar-sign': DollarSign, key: Key,
    zap: Zap, droplet: Droplets, grid: LayoutGrid,
};

const CAT_COLORS = [
    '#0d9488','#0891b2','#7c3aed','#db2777','#ea580c',
    '#16a34a','#ca8a04','#dc2626','#0284c7','#9333ea','#059669',
];

type ModalStep = null | 'pick-cat' | 'pick-template' | 'form' | 'done';

// ── Input component (handles all field types) ─────────────────────────────────

function DynField({ field, value, onChange }: {
    field: FormField;
    value: string;
    onChange: (v: string) => void;
}) {
    const base = "w-full px-3 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all";
    const style = { background: 'var(--background)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' };

    if (field.type === 'textarea') {
        return (
            <textarea rows={3} required={field.required} placeholder={field.placeholder}
                value={value} onChange={e => onChange(e.target.value)}
                className={`${base} resize-none`} style={style} />
        );
    }

    if (field.type === 'select' && field.options?.length) {
        return (
            <select required={field.required} value={value} onChange={e => onChange(e.target.value)}
                className={base} style={style}>
                <option value="">请选择…</option>
                {field.options.map((opt, i) => {
                    const label = typeof opt === 'string' ? opt : opt.label;
                    const val = typeof opt === 'string' ? opt : opt.value;
                    return <option key={i} value={val}>{label}</option>;
                })}
            </select>
        );
    }

    if (field.type === 'radio' && field.options?.length) {
        return (
            <div className="flex flex-wrap gap-2">
                {field.options.map((opt, i) => {
                    const label = typeof opt === 'string' ? opt : opt.label;
                    const val = typeof opt === 'string' ? opt : opt.value;
                    const active = value === val;
                    return (
                        <button type="button" key={i} onClick={() => onChange(val)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                            style={active
                                ? { background: '#0d9488', color: '#fff', borderColor: '#0d9488' }
                                : { background: 'var(--background)', color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' }
                            }>
                            {label}
                        </button>
                    );
                })}
            </div>
        );
    }

    // text / number / date / time / phone / address / image(skip) / city_select → text fallback
    const inputType = field.type === 'date' ? 'date'
        : field.type === 'time' ? 'time'
        : field.type === 'number' ? 'number'
        : field.type === 'phone' ? 'tel'
        : 'text';

    return (
        <input type={inputType} required={field.required} placeholder={field.placeholder}
            value={value} onChange={e => onChange(e.target.value)}
            className={base} style={style} />
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ServicesPage() {
    const { user } = useUser();
    const router = useRouter();
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [allTemplates, setAllTemplates] = useState<FormTemplate[]>([]);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // modal
    const [modalStep, setModalStep] = useState<ModalStep>(null);
    const [selectedCat, setSelectedCat] = useState<ServiceCategory | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { loadCategories(); loadServices(); loadTemplates(); }, []);
    useEffect(() => { loadServices(); }, [activeCategory, searchQuery]);

    const loadCategories = async () => {
        try {
            const r = await fetch('/api/services/categories');
            const d = await r.json();
            setCategories(d.categories || []);
        } catch (e) { console.error(e); }
    };

    const loadTemplates = async () => {
        try {
            // Fetch custom + complex type templates only (exclude standard/provider_reg forms)
            const [r1, r2] = await Promise.all([
                fetch('/api/form-templates?status=published&type=custom'),
                fetch('/api/form-templates?status=published&type=complex'),
            ]);
            const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
            const templates = [...(d1.templates || []), ...(d2.templates || [])];
            console.log('[templates] loaded:', templates.map((t: FormTemplate) => ({ id: t.id, name: t.name, category: t.category, type: (t as any).type, custom_service_category_id: t.custom_service_category_id })));
            setAllTemplates(templates);
        } catch (e) { console.error(e); }
    };

    const loadServices = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (activeCategory) params.append('categoryId', activeCategory);
            if (searchQuery) params.append('search', searchQuery);
            const r = await fetch(`/api/services?${params}`);
            const d = await r.json();

            const mock: Service[] = [
                { id:'m1', title:'专业空调维保服务', price:'89.0', price_unit:'起', description:'', location:'', contact_name:'', images:['https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?q=80&w=800&auto=format&fit=crop'], created_at:'', rating:4.9, review_count:'2.3k', service_categories:{ name:'专业维保' } },
                { id:'m2', title:'深度家政清洁', price:'158.0', price_unit:'起', description:'', location:'', contact_name:'', images:['https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=800&auto=format&fit=crop'], created_at:'', rating:4.8, review_count:'1.8k', service_categories:{ name:'家政清洁' } },
                { id:'m3', title:'IT数码专家维修', price:'66.0', price_unit:'起', description:'', location:'', contact_name:'', images:['https://images.unsplash.com/photo-1597733336794-12d05021d510?q=80&w=800&auto=format&fit=crop'], created_at:'', rating:4.7, review_count:'980', service_categories:{ name:'IT数码' } },
                { id:'m4', title:'本地搬家贴心服务', price:'299.0', price_unit:'起', description:'', location:'', contact_name:'', images:['https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?q=80&w=800&auto=format&fit=crop'], created_at:'', rating:4.6, review_count:'450', service_categories:{ name:'本地搬家' } },
            ];

            const db = d.services || [];
            setServices((d.error || db.length === 0) ? mock : db.map((s: any) => ({ ...s, rating: s.rating || (4 + Math.random()).toFixed(1), review_count: s.review_count || `${(Math.random()*3).toFixed(1)}k` })));
        } catch { setServices([]); } finally { setLoading(false); }
    };

    // ── modal helpers ──────────────────────────────────────────────────────────

    const openPicker = () => {
        if (!user) { router.push('/login'); return; }
        setSelectedCat(null); setSelectedTemplate(null);
        setFieldValues({}); setSubmitting(false);
        setModalStep('pick-cat');
    };

    // Match templates to a category by ID first, then fall back to name matching
    const getTemplatesForCat = (cat: ServiceCategory) => {
        const byId = allTemplates.filter(t => t.custom_service_category_id === cat.id);
        if (byId.length > 0) return byId;
        // fallback: match by category name string (handles ID mismatch between tables)
        return allTemplates.filter(t => t.category && t.category === cat.name);
    };

    const pickCat = (cat: ServiceCategory) => {
        setSelectedCat(cat); setSelectedTemplate(null); setFieldValues({});
        // templates for this category
        const catTemplates = getTemplatesForCat(cat);
        console.log('[pickCat]', cat.name, cat.id, '→ matched templates:', catTemplates.map(t => t.name));
        if (catTemplates.length === 0) {
            // no templates → use a blank form
            setSelectedTemplate({ id: '', name: cat.name + '定制需求', description: '', color: '#0d9488', steps: [{ title: '基本信息', fields: [
                { key: 'description', type: 'textarea', label: '需求描述', required: true, placeholder: '请详细描述您的需求…' },
                { key: 'contact_name', type: 'text', label: '联系姓名', required: true, placeholder: '您的姓名' },
                { key: 'contact_phone', type: 'phone', label: '联系电话', required: true, placeholder: '647-xxx-xxxx' },
            ] }], custom_service_category_id: cat.id, category: cat.name });
            setModalStep('form');
        } else if (catTemplates.length === 1) {
            setSelectedTemplate(catTemplates[0]);
            setModalStep('form');
        } else {
            setModalStep('pick-template');
        }
    };

    const pickTemplate = (tpl: FormTemplate) => {
        setSelectedTemplate(tpl); setFieldValues({});
        setModalStep('form');
    };

    const closeModal = () => {
        setModalStep(null); setSelectedCat(null);
        setSelectedTemplate(null); setFieldValues({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedTemplate || !selectedCat) return;
        setSubmitting(true);
        try {
            await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    categoryId: selectedCat.id,
                    title: selectedTemplate.name,
                    description: JSON.stringify(fieldValues),
                    price: '面议', priceUnit: '起',
                    location: fieldValues['address'] || fieldValues['location'] || '',
                    contactName: fieldValues['contact_name'] || fieldValues['联系人'] || fieldValues['联系人姓名'] || '',
                    contactPhone: fieldValues['contact_phone'] || fieldValues['手机'] || fieldValues['联系电话'] || fieldValues['联系人手机'] || '',
                }),
            });
        } catch (e) { console.error(e); }
        setSubmitting(false);
        setModalStep('done');
    };

    // ── derived ────────────────────────────────────────────────────────────────

    const catTemplates = selectedCat ? getTemplatesForCat(selectedCat) : [];

    // all fields across all steps (flatten for single scroll form)
    const allFields: FormField[] = selectedTemplate
        ? selectedTemplate.steps.flatMap(s => s.fields).filter(f => f.type !== 'image')
        : [];

    // ── render ────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen flex flex-col font-sans"
            style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
            <Navbar />

            {/* ── Sticky header ── */}
            <div className="sticky top-[44px] sm:top-[64px] z-30 border-b"
                style={{ background: 'var(--background)', borderColor: 'var(--card-border)' }}>
                <div className="max-w-[1200px] mx-auto px-4 pt-3 pb-2.5">
                    <div className="flex items-center rounded-xl px-4 py-2.5 border mb-2.5"
                        style={{ background: 'var(--card-bg)', borderColor: 'var(--border-primary)' }}>
                        <Search className="mr-3 flex-shrink-0" size={17} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="搜索专业服务…" value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent text-[14px] font-medium border-none focus:outline-none focus:ring-0"
                            style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-4 px-4">
                        <button onClick={() => setActiveCategory(null)}
                            className="flex-shrink-0 px-3.5 py-1 rounded-full text-[12px] font-bold transition-all"
                            style={!activeCategory ? { background: '#0d9488', color: '#fff' } : { background: 'var(--card-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}>
                            全部
                        </button>
                        {categories.map(cat => (
                            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                                className="flex-shrink-0 px-3.5 py-1 rounded-full text-[12px] font-bold transition-all"
                                style={activeCategory === cat.id ? { background: '#0d9488', color: '#fff' } : { background: 'var(--card-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}>
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Service grid ── */}
            <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 py-4 pb-28">
                {loading ? (
                    <div className="py-14 flex flex-col items-center gap-3">
                        <div className="w-9 h-9 border-[3px] border-t-transparent rounded-full animate-spin"
                            style={{ borderColor: '#0d9488', borderTopColor: 'transparent' }} />
                        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>加载中…</p>
                    </div>
                ) : services.length === 0 ? (
                    <div className="py-14 text-center flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--card-bg)' }}>
                            <Search size={24} style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <p className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>未找到相关服务</p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>尝试搜索其它关键词</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {services.map(service => (
                            <div key={service.id}
                                onClick={() => router.push(`/services/${service.id}`)}
                                className="group rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md flex flex-col h-full border"
                                style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                                <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ background: 'var(--border-primary)' }}>
                                    {service.images?.[0] ? (
                                        <Image src={service.images[0]} alt={service.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                                            <Search size={28} />
                                        </div>
                                    )}
                                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg px-1.5 py-0.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Star size={9} className="fill-yellow-400 text-yellow-400" />
                                        <span className="text-[10px] font-bold text-white">{service.rating || '4.8'}</span>
                                    </div>
                                </div>
                                <div className="p-2.5 sm:p-3.5 flex flex-col flex-1">
                                    <h3 className="text-[12px] sm:text-[14px] font-bold mb-1.5 line-clamp-2 leading-snug" style={{ color: 'var(--text-primary)' }}>
                                        {service.title}
                                    </h3>
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="font-black text-[14px] sm:text-[16px]" style={{ color: '#0d9488' }}>
                                            ¥{service.price}
                                            <span className="text-[10px] font-semibold ml-0.5" style={{ color: 'var(--text-muted)' }}>{service.price_unit}</span>
                                        </span>
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ border: '1px solid var(--border-primary)' }}>
                                            <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* ── Footer ── */}
            <footer className="py-5 border-t" style={{ borderColor: 'var(--card-border)' }}>
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    <span>优质服务由</span>
                    <span className="font-black" style={{ color: 'var(--text-primary)' }}>优服佳</span>
                    <span>提供</span>
                </div>
            </footer>

            {/* ── FAB ── */}
            <div className="fixed bottom-20 md:bottom-8 left-0 right-0 flex justify-center z-50 pointer-events-none">
                <button onClick={openPicker}
                    className="pointer-events-auto flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-[14px] text-white transition-all active:scale-95 hover:scale-105"
                    style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)', boxShadow: '0 4px 20px rgba(13,148,136,0.4)' }}>
                    <Sparkles size={15} strokeWidth={2.5} />
                    定制服务
                </button>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                STEP 1 — 选择服务类别（居中全屏）
            ════════════════════════════════════════════════════════════════ */}
            {modalStep === 'pick-cat' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                    onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border flex flex-col"
                        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)', maxHeight: '80vh' }}>
                        {/* header */}
                        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
                            <div>
                                <h2 className="text-[17px] font-black" style={{ color: 'var(--text-primary)' }}>选择服务类别</h2>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>选择您需要定制的服务类型</p>
                            </div>
                            <button onClick={closeModal}
                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ background: 'var(--background)' }}>
                                <X size={16} style={{ color: 'var(--text-muted)' }} />
                            </button>
                        </div>
                        {/* grid */}
                        <div className="overflow-y-auto flex-1 px-4 pb-5 grid grid-cols-3 gap-2.5 content-start">
                            {categories.map((cat, i) => {
                                const Icon = ICON_MAP[cat.icon] || LayoutGrid;
                                const color = CAT_COLORS[i % CAT_COLORS.length];
                                const tplCount = getTemplatesForCat(cat).length;
                                return (
                                    <button key={cat.id} onClick={() => pickCat(cat)}
                                        className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all active:scale-95 border"
                                        style={{ background: 'var(--background)', borderColor: 'var(--border-primary)' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.background = color + '12'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-primary)'; (e.currentTarget as HTMLElement).style.background = 'var(--background)'; }}>
                                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: color + '18' }}>
                                            <Icon size={22} style={{ color }} strokeWidth={1.8} />
                                        </div>
                                        <span className="text-[11px] font-bold text-center leading-tight" style={{ color: 'var(--text-primary)' }}>
                                            {cat.name}
                                        </span>
                                        {tplCount > 0 && (
                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: color + '20', color }}>
                                                {tplCount}个表单
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                STEP 2 — 选择该分类下的表单模板（居中）
            ════════════════════════════════════════════════════════════════ */}
            {modalStep === 'pick-template' && selectedCat && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                    onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border flex flex-col"
                        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)', maxHeight: '80vh' }}>
                        {/* header */}
                        <div className="flex items-center gap-2 px-5 pt-5 pb-3 flex-shrink-0">
                            <button onClick={() => setModalStep('pick-cat')}
                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: 'var(--background)' }}>
                                <ArrowLeft size={16} style={{ color: 'var(--text-muted)' }} />
                            </button>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-[16px] font-black truncate" style={{ color: 'var(--text-primary)' }}>
                                    {selectedCat.name}
                                </h2>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>选择定制表单</p>
                            </div>
                            <button onClick={closeModal}
                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: 'var(--background)' }}>
                                <X size={16} style={{ color: 'var(--text-muted)' }} />
                            </button>
                        </div>
                        {/* template list */}
                        <div className="overflow-y-auto flex-1 px-4 pb-5 space-y-2.5">
                            {catTemplates.map(tpl => (
                                <button key={tpl.id} onClick={() => pickTemplate(tpl)}
                                    className="w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all active:scale-[0.98] hover:shadow-sm"
                                    style={{ background: 'var(--background)', borderColor: 'var(--border-primary)' }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: (tpl.color || '#0d9488') + '20' }}>
                                        <FileText size={18} style={{ color: tpl.color || '#0d9488' }} strokeWidth={1.8} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{tpl.name}</p>
                                        {tpl.description && (
                                            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{tpl.description}</p>
                                        )}
                                        <p className="text-[10px] mt-1 font-bold" style={{ color: tpl.color || '#0d9488' }}>
                                            {tpl.steps.flatMap(s => s.fields).filter(f => f.type !== 'image').length} 个填写项
                                        </p>
                                    </div>
                                    <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                STEP 3 — 动态表单（底部弹出 sheet）
            ════════════════════════════════════════════════════════════════ */}
            {modalStep === 'form' && selectedTemplate && selectedCat && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                    onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col"
                        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)', maxHeight: '92vh' }}>

                        {/* drag handle (mobile) */}
                        <div className="w-9 h-1 rounded-full mx-auto mt-3 mb-1 sm:hidden" style={{ background: 'var(--border-primary)' }} />

                        {/* form header */}
                        <div className="flex items-center gap-2.5 px-5 pt-4 pb-3 border-b flex-shrink-0"
                            style={{ borderColor: 'var(--card-border)' }}>
                            <button onClick={() => catTemplates.length > 1 ? setModalStep('pick-template') : setModalStep('pick-cat')}
                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: 'var(--background)' }}>
                                <ArrowLeft size={16} style={{ color: 'var(--text-muted)' }} />
                            </button>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: (selectedTemplate.color || '#0d9488') + '1a' }}>
                                    <FileText size={15} style={{ color: selectedTemplate.color || '#0d9488' }} strokeWidth={1.8} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[14px] font-black truncate" style={{ color: 'var(--text-primary)' }}>
                                        {selectedTemplate.name}
                                    </p>
                                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                        {selectedCat.name} · {allFields.length} 个填写项
                                    </p>
                                </div>
                            </div>
                            <button onClick={closeModal}
                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: 'var(--background)' }}>
                                <X size={16} style={{ color: 'var(--text-muted)' }} />
                            </button>
                        </div>

                        {/* scrollable form */}
                        <div className="overflow-y-auto flex-1 px-5 py-4">
                            <form id="custom-form" onSubmit={handleSubmit} className="space-y-3.5">
                                {selectedTemplate.steps.map((step, si) => (
                                    <div key={si}>
                                        {/* step title (only if multiple steps) */}
                                        {selectedTemplate.steps.length > 1 && (
                                            <p className="text-xs font-black uppercase tracking-wide mb-2"
                                                style={{ color: selectedTemplate.color || '#0d9488' }}>
                                                {step.title}
                                            </p>
                                        )}
                                        {step.fields
                                            .filter(f => f.type !== 'image')   // skip image uploads for now
                                            .map(field => (
                                                <div key={field.key} className="space-y-1 mb-3">
                                                    <label className="text-xs font-bold flex items-center gap-1"
                                                        style={{ color: 'var(--text-muted)' }}>
                                                        {field.label}
                                                        {field.required && <span className="text-red-500">*</span>}
                                                    </label>
                                                    <DynField field={field}
                                                        value={fieldValues[field.key] || ''}
                                                        onChange={v => setFieldValues(prev => ({ ...prev, [field.key]: v }))} />
                                                </div>
                                            ))}
                                    </div>
                                ))}
                            </form>
                        </div>

                        {/* sticky submit button */}
                        <div className="px-5 py-4 border-t flex-shrink-0" style={{ borderColor: 'var(--card-border)' }}>
                            <button form="custom-form" type="submit" disabled={submitting}
                                className="w-full py-3 rounded-2xl font-bold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-60"
                                style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
                                {submitting ? '提交中…' : '提交定制需求'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                STEP 4 — 提交成功
            ════════════════════════════════════════════════════════════════ */}
            {modalStep === 'done' && selectedCat && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                    <div className="w-full max-w-xs rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl border"
                        style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                            style={{ background: '#0d948818' }}>
                            <CheckCircle2 size={34} style={{ color: '#0d9488' }} strokeWidth={1.8} />
                        </div>
                        <h3 className="text-[18px] font-black mb-2" style={{ color: 'var(--text-primary)' }}>需求已提交！</h3>
                        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
                            我们会在24小时内为您匹配合适的<strong>{selectedCat.name}</strong>服务商，请保持电话畅通。
                        </p>
                        <button onClick={closeModal}
                            className="px-8 py-2.5 rounded-full font-bold text-sm text-white"
                            style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
                            完成
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
