'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { useUser } from '@/lib/contexts/UserContext';
import { Store, Plus, MapPin, Tag, Search, X, Home, Wrench, ShoppingBag } from 'lucide-react';

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
    service_categories: ServiceCategory;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
    'Home': Home,
    'Wrench': Wrench,
    'ShoppingBag': ShoppingBag,
    'Tag': Tag,
};

export default function ServicesPage() {
    const { user } = useUser();
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // 表单状态
    const [formData, setFormData] = useState({
        categoryId: '',
        title: '',
        description: '',
        price: '',
        priceUnit: '月',
        location: '',
        contactName: '',
        contactPhone: '',
    });

    useEffect(() => {
        loadCategories();
        loadServices();
    }, []);

    useEffect(() => {
        loadServices();
    }, [activeCategory, searchQuery]);

    const loadCategories = async () => {
        try {
            const response = await fetch('/api/services/categories');
            const data = await response.json();
            setCategories(data.categories || []);
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    };

    const loadServices = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (activeCategory) params.append('categoryId', activeCategory);
            if (searchQuery) params.append('search', searchQuery);

            const response = await fetch(`/api/services?${params}`);
            const data = await response.json();
            setServices(data.services || []);
        } catch (error) {
            console.error('Failed to load services:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const response = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    ...formData
                })
            });

            if (response.ok) {
                setShowCreateModal(false);
                setFormData({
                    categoryId: '',
                    title: '',
                    description: '',
                    price: '',
                    priceUnit: '月',
                    location: '',
                    contactName: '',
                    contactPhone: '',
                });
                loadServices();
            }
        } catch (error) {
            console.error('Failed to create service:', error);
        }
    };

    const getCategoryIcon = (iconName: string) => {
        const Icon = ICON_MAP[iconName] || Tag;
        return <Icon size={12} className="mr-1" strokeWidth={3} />;
    };

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />

            {/* 搜索和筛选 */}
            <div className="bg-card sticky top-[60px] z-20 shadow-sm pb-3 border-b border-card-border">
                <div className="max-w-2xl mx-auto px-4 pt-4">
                    <div className="relative mb-4">
                        <input
                            type="text"
                            placeholder="搜索服务、物品..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-black/20 rounded-2xl py-4 pl-12 pr-4 text-base font-black border-2 border-gray-100 dark:border-white/5 focus:outline-none focus:border-teal-500 text-text-primary placeholder-gray-500 transition-all"
                        />
                        <Search className="absolute left-4 top-4 text-gray-400" size={20} strokeWidth={3} />
                    </div>

                    {/* 分类标签 */}
                    <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
                        <button
                            onClick={() => setActiveCategory(null)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-black whitespace-nowrap border transition-all ${!activeCategory
                                ? 'bg-text-primary text-background border-text-primary shadow-lg'
                                : 'bg-card border-card-border text-text-muted hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                        >
                            全部
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap border transition-colors ${activeCategory === cat.id
                                    ? 'bg-teal-600 text-white border-teal-600'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4">
                {loading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="mt-4 text-gray-500">加载中...</p>
                    </div>
                ) : services.length === 0 ? (
                    <div className="py-20 text-center">
                        <Store size={64} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-400 mb-2">暂无服务信息</h3>
                        <p className="text-gray-400">点击右下角按钮发布第一条服务吧！</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {services.map((service) => (
                            <div key={service.id} className="bg-card rounded-[32px] overflow-hidden shadow-sm border border-card-border group hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                                {/* 图片 */}
                                <div className="relative h-48 overflow-hidden bg-gray-200">
                                    {service.images && service.images[0] ? (
                                        <Image
                                            src={service.images[0]}
                                            alt={service.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Store size={48} className="text-gray-300" />
                                        </div>
                                    )}
                                    {/* 价格标签 */}
                                    <span className="absolute top-3 right-3 bg-white/95 backdrop-blur text-teal-700 text-sm font-extrabold px-3 py-1.5 rounded-lg shadow-sm">
                                        {service.price}/{service.price_unit}
                                    </span>
                                    {/* 分类标签 */}
                                    <span className="absolute bottom-3 left-3 bg-black/70 text-white text-xs font-bold px-2.5 py-1 rounded-md flex items-center backdrop-blur-sm">
                                        {getCategoryIcon(service.service_categories?.icon)}
                                        {service.service_categories?.name}
                                    </span>
                                </div>

                                {/* 内容 */}
                                <div className="p-4">
                                    <h3 className="font-extrabold text-gray-900 text-base line-clamp-1 mb-1.5">{service.title}</h3>
                                    <div className="flex items-center text-gray-500 text-sm font-semibold mb-3">
                                        <MapPin size={14} className="mr-1" strokeWidth={2.5} />
                                        {service.location || '未知位置'}
                                    </div>
                                    <p className="text-gray-600 text-sm font-medium line-clamp-2 mb-4 leading-relaxed">
                                        {service.description}
                                    </p>
                                    <button className="w-full bg-teal-50 text-teal-700 text-sm font-extrabold py-3 rounded-xl hover:bg-teal-100 transition-colors">
                                        联系 {service.contact_name || '发布者'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 发布按钮 */}
            <button
                onClick={() => user ? setShowCreateModal(true) : alert('请先登录')}
                className="fixed bottom-20 right-5 bg-teal-600 text-white p-4 rounded-full shadow-xl hover:bg-teal-700 transition-transform active:scale-95 z-40"
            >
                <Plus size={28} strokeWidth={3} />
            </button>

            {/* 发布模态框 */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5">
                    <div className="bg-white w-full max-w-md rounded-3xl p-7 relative shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-2xl font-black text-gray-900">发布新信息</h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-2 bg-gray-100 rounded-xl text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">分类 *</label>
                                <select
                                    required
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    className="w-full bg-gray-50 p-4 rounded-xl text-base font-medium border-none focus:ring-2 focus:ring-teal-500 text-gray-800"
                                >
                                    <option value="">请选择分类</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">标题 *</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-gray-50 p-4 rounded-xl text-base font-medium border-none focus:ring-2 focus:ring-teal-500 text-gray-900"
                                    placeholder="例如：市中心一室一厅出租"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">描述</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full bg-gray-50 p-4 rounded-xl text-base font-medium border-none focus:ring-2 focus:ring-teal-500 text-gray-900 resize-none"
                                    placeholder="详细描述您的服务..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-2">价格</label>
                                    <input
                                        type="text"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full bg-gray-50 p-4 rounded-xl text-base font-medium border-none focus:ring-2 focus:ring-teal-500 text-gray-900"
                                        placeholder="$1,800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-2">单位</label>
                                    <select
                                        value={formData.priceUnit}
                                        onChange={(e) => setFormData({ ...formData, priceUnit: e.target.value })}
                                        className="w-full bg-gray-50 p-4 rounded-xl text-base font-medium border-none focus:ring-2 focus:ring-teal-500 text-gray-800"
                                    >
                                        <option value="月">月</option>
                                        <option value="次">次</option>
                                        <option value="件">件</option>
                                        <option value="起">起</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-2">位置</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full bg-gray-50 p-4 rounded-xl text-base font-medium border-none focus:ring-2 focus:ring-teal-500 text-gray-900"
                                    placeholder="例如：Toronto Downtown"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-2">联系人</label>
                                    <input
                                        type="text"
                                        value={formData.contactName}
                                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                        className="w-full bg-gray-50 p-4 rounded-xl text-base font-medium border-none focus:ring-2 focus:ring-teal-500 text-gray-900"
                                        placeholder="您的名字"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-2">电话</label>
                                    <input
                                        type="tel"
                                        value={formData.contactPhone}
                                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                        className="w-full bg-gray-50 p-4 rounded-xl text-base font-medium border-none focus:ring-2 focus:ring-teal-500 text-gray-900"
                                        placeholder="联系电话"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-base"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3.5 bg-teal-600 text-white rounded-xl font-bold text-base shadow-lg"
                                >
                                    立即发布
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
