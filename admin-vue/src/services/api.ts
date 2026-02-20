// API configuration
const API_BASE_URL =
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
        ? 'https://fongbeev1-backe-end.onrender.com/api'
        : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');

// Get token from localStorage
const getToken = () => localStorage.getItem('admin_token');

// Helper to build query string
const buildQuery = (params: any) => {
    if (!params) return '';
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.append(key, String(value));
        }
    });
    return query.toString();
};

// Generic fetch wrapper
async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
}

// ============ Auth API ============
export const authApi = {
    // Admin login
    adminLogin: (email: string, password: string) =>
        request<{ message: string; user: any; token: string }>('/auth/admin/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    // User login
    login: (email: string, password: string, code?: string) =>
        request<{ message: string; user: any; token: string; require2fa?: boolean }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, code }),
        }),
    changePassword: (oldPw: string, newPw: string) =>
        request<{ message: string }>('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
        }),

    // Get current user
    getMe: () => request<{ user: any }>('/auth/me'),

    // Register
    register: (data: { email: string; password: string; name?: string; phone?: string }) =>
        request<{ message: string; user: any; token: string }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};

// ============ Users API ============
export const usersApi = {
    // Get all users (admin)
    getAll: (params?: { page?: number; size?: number; keyword?: string; status?: string; role?: string }) => {
        const query = buildQuery(params);
        return request<{ users: any[]; total: number; page: number; size: number }>(
            `/users${query ? `?${query}` : ''}`
        );
    },

    // Get single user by ID (admin)
    getById: (id: string) =>
        request<{ user: any }>(`/users/${id}`),

    // Get user stats (admin)
    getStats: () =>
        request<{ total: number; active: number; todayNew: number; monthNew: number }>('/users/stats'),

    // Update user status (admin)
    updateStatus: (id: string, status: 'active' | 'disabled') =>
        request<{ message: string; user: any }>(`/users/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }),

    // Update user role (admin)
    updateRole: (id: string, role: 'user' | 'provider' | 'admin') =>
        request<{ message: string; user: any }>(`/users/${id}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role }),
        }),
    resetPassword: (id: string, password: string) =>
        request<{ message: string }>(`/users/${id}/reset-password`, {
            method: 'POST',
            body: JSON.stringify({ password }),
        }),
    inviteSales: (contact: string) =>
        request<{ message: string; link: string }>('/admin/invite-sales', {
            method: 'POST',
            body: JSON.stringify({ contact }),
        }),
    // Sales Partners
    getSalesPartners: () => request<{ partners: any[] }>('/admin/sales-partners'),
    getSalesPartnerDetail: (id: string) => request<{ partner: any; providers: any[] }>(`/admin/sales-partners/${id}`),
};

// ============ Form Templates API ============
export const formTemplatesApi = {
    // Get all templates
    getAll: (params?: { type?: string; status?: string; includeSteps?: boolean; template_mode?: string }) => {
        const query = buildQuery(params);
        return request<{ templates: any[] }>(`/form-templates${query ? `?${query}` : ''}`);
    },

    // Get published templates (for frontend)
    getPublished: (type?: string, category?: string) => {
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        if (category) params.append('category', category);
        const query = params.toString();
        return request<{ templates: any[] }>(`/form-templates/published${query ? `?${query}` : ''}`);
    },

    // Get single template
    getById: (id: string) =>
        request<{ template: any }>(`/form-templates/${id}`),

    // Create template (admin)
    create: (data: { name: string; description?: string; type: string; steps: any[]; color?: string }) =>
        request<{ message: string; template: any }>('/form-templates', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // Update template (admin)
    update: (id: string, data: Partial<{
        name: string;
        description: string;
        type: string;
        steps: any[];
        color: string;
        status: string;
        is_popular: boolean;
        contract_template_id: string | null;
        quote_credit_cost: number;
    }>) =>
        request<{ message: string; template: any }>(`/form-templates/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    // Publish template (admin)
    publish: (id: string) =>
        request<{ message: string; template: any }>(`/form-templates/${id}/publish`, {
            method: 'PATCH',
        }),

    // Delete template (admin)
    delete: (id: string) =>
        request<{ message: string }>(`/form-templates/${id}`, {
            method: 'DELETE',
        }),
};

// ============ Submissions API ============
export const submissionsApi = {
    // Get submissions
    getAll: (params?: { page?: number; size?: number; status?: string; templateId?: string }) => {
        const query = buildQuery(params);
        return request<{ submissions: any[]; total: number; page: number; size: number }>(
            `/submissions${query ? `?${query}` : ''}`
        );
    },

    // Get submission stats (admin)
    getStats: () =>
        request<{ total: number; pending: number; processing: number; completed: number }>('/submissions/stats'),

    // Get single submission
    getById: (id: string) =>
        request<{ submission: any }>(`/submissions/${id}`),

    // Create submission
    create: (data: { templateId: string; formData: Record<string, any> }) =>
        request<{ message: string; submission: any }>('/submissions', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // Update submission status (admin)
    updateStatus: (id: string, status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'assigned', assignedProviderId?: string) =>
        request<{ message: string; submission: any }>(`/submissions/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, assignedProviderId }),
        }),
};

// ============ Providers API ============
// ============ Providers API ============
export const providersApi = {
    // Get all service type applications (admin)
    getServiceTypeApplications: () =>
        request<{ applications: any[] }>('/providers/admin/applications'),

    // Review application (admin)
    reviewApplication: (id: string, status: 'approved' | 'rejected', reason?: string) =>
        request<{ message: string; application: any }>(`/providers/admin/applications/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status, reason }),
        }),

    // Verify provider application (approve/reject initial application)
    verifyProvider: (userId: string, status: 'approved' | 'rejected', reason?: string) => {
        return request(`/providers/admin/verify/${userId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status, reason })
        });
    },
    // Get all providers list (admin - includes pending)
    getProvidersList: (params?: { page?: number; size?: number; status?: string; keyword?: string }) => {
        const query = buildQuery(params);
        return request<{ providers: any[]; total: number; page: number; size: number }>(
            `/providers/admin/list${query ? `?${query}` : ''}`
        );
    },

    // Get provider stats
    getStats: () => request<{ stats: { total: number; verified: number; pending: number; frozen: number } }>('/providers/admin/stats'),

    // Update provider credits (admin)
    updateCredits: (userId: string, amount: number, reason: string) =>
        request<{ message: string; credits: number }>(`/providers/admin/${userId}/credits`, {
            method: 'PATCH',
            body: JSON.stringify({ amount, reason }),
        }),

    // Create a new standard service
    createService: (data: any) =>
        request<{ message: string; service: any }>('/providers/services', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // Get my services (provider's own services)
    getMyServices: (params?: { status?: string; page?: number; size?: number }) => {
        const query = buildQuery(params);
        return request<{ services: any[]; total: number }>(`/providers/my-services${query ? `?${query}` : ''}`);
    },

    // Unpublish a service
    unpublishService: (id: string, reason?: string) =>
        request<{ message: string; service: any }>(`/providers/services/${id}/unpublish`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        }),

    // Delete a service (soft delete)
    deleteService: (id: string) =>
        request<{ message: string }>(`/providers/services/${id}`, {
            method: 'DELETE',
        }),

    // Update a service
    updateService: (id: string, data: any) =>
        request<{ message: string; service: any }>(`/providers/services/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    // Get templates available for this provider (based on approved categories)
    getMyTemplates: () =>
        request<{ templates: any[]; categories: string[]; total: number }>('/providers/my-templates'),
};


// ============ Service Categories API (service_categories 表，优服佳服务分类) ============
export const categoriesApi = {
    // GET /admin/categories → service_categories 表（搬家、接送等服务大类）
    getAll: () => request<{ categories: any[] }>('/admin/categories'),
    create: (data: any) => request('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request('/admin/categories', { method: 'PUT', body: JSON.stringify({ id, ...data }) }),
    delete: (id: string) => request(`/admin/categories?id=${id}`, { method: 'DELETE' }),
};


// ============ Custom Service Categories API ============
export const customServiceCategoriesApi = {
    getAll: () => request<{ categories: any[] }>('/custom-service-categories'),
    getById: (id: string) => request<{ category: any }>(`/custom-service-categories/${id}`),
    create: (data: any) => request<{ message: string; category: any }>('/custom-service-categories', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => request<{ message: string; category: any }>(`/custom-service-categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => request<{ message: string }>(`/custom-service-categories/${id}`, {
        method: 'DELETE',
    }),
};

// ============ Subscription Plans API ============
export const subscriptionPlansApi = {
    getAll: () => request<any[]>('/subscription-plans'),
    getById: (id: string) => request<any>(`/subscription-plans/${id}`),
    create: (data: any) => request<any>('/subscription-plans', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => request<any>(`/subscription-plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: string) => request(`/subscription-plans/${id}`, {
        method: 'DELETE',
    }),
};

// ============ User Subscriptions API ============
export const userSubscriptionsApi = {
    getAll: (params?: { page?: number; size?: number; status?: string; keyword?: string }) => {
        const query = buildQuery(params);
        return request<{ subscriptions: any[]; total: number }>(`/user-subscriptions/admin/list${query ? `?${query}` : ''}`);
    },
    update: (id: string, data: any) => request<any>(`/user-subscriptions/admin/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
};

// Health check
export const healthCheck = () => request<{ status: string; timestamp: string }>('/health');

// ============ Finance API ============
export const financeApi = {
    getSummary: () => request<{ stripe_balance: number; escrow_balance: number; platform_revenue: number }>('/admin/finance/summary'),
    updateBankAccount: () => request<{ message: string }>('/admin/finance/bank-account', { method: 'POST' }),
    getSettings: () => request<{ platform_fee_percent: number }>('/admin/system/settings'),
    updateSettings: (data: { platform_fee_percent: number }) => request<{ message: string }>('/admin/system/settings', { method: 'POST', body: JSON.stringify(data) }),
    resetDatabase: (type: 'all' | 'orders') => request<{ success: boolean; message: string }>('/admin/system/database-reset', { method: 'POST', body: JSON.stringify({ type }) })
};

// ============ Pricing Config API ============
export const pricingConfigApi = {
    getAll: (category?: string) => {
        const query = category ? `?category=${category}` : '';
        return request<{ configs: any[]; grouped: any }>(`/admin/pricing-config${query}`);
    },
    update: (key: string, value: string | number, description?: string) =>
        request<{ message: string; config: any }>(`/admin/pricing-config/${key}`, {
            method: 'PUT',
            body: JSON.stringify({ value, description }),
        }),
    batchUpdate: (configs: Array<{ config_key: string; config_value: string }>) =>
        request<{ message: string; configs: any[] }>('/admin/pricing-config', {
            method: 'PUT',
            body: JSON.stringify({ configs }),
        }),
};

export const bannersApi = {
    getAll: () => request<any[]>('/banners'),
    create: (data: any) => request<any>('/banners', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/banners/${id}`, { method: 'DELETE' }),
    getActive: () => request<any[]>('/banners/active')
};

// ============ SMS Templates API ============
export const smsTemplatesApi = {
    getAll: () => request<{ templates: any[] }>('/sms-templates'),
    update: (id: string, data: any) =>
        request<{ message: string; template: any }>(`/sms-templates/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
};

// ============ Email Templates API ============
export const emailTemplatesApi = {
    getAll: () => request<{ templates: any[] }>('/email-templates'),
    update: (id: string, data: any) =>
        request<{ message: string; template: any }>(`/email-templates/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    sendTest: (id: string, email: string) =>
        request<{ success: boolean; message: string }>(`/email-templates/${id}/test`, {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),
};

// ============ Cities API ============
export const citiesApi = {
    getAll: () => request<any[]>('/cities'),
    getActive: () => request<any[]>('/cities/active'),
    create: (data: any) => request<any>('/cities', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/cities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/cities/${id}`, { method: 'DELETE' }),
};

// ============ Admin Submissions API ============
export const adminSubmissionsApi = {
    // Get submissions (general query for admin)
    getSubmissions: (params?: { page?: number; size?: number; type?: string; status?: string }) => {
        const query = buildQuery(params);
        return request<{ submissions: any[]; total: number }>(`/admin/submissions${query ? `?${query}` : ''}`);
    },

    // Backward compatibility for standard service orders
    getStandardOrders: (params?: { page?: number; size?: number; status?: string; keyword?: string }) => {
        const query = buildQuery(params);
        return request<{ orders: any[]; total: number }>(`/admin/orders${query ? `?${query}` : ''}`);
    },

    // Get listing applications (specifically for standard service applications)
    getListingApplications: (params?: { page?: number; size?: number; type?: string; status?: string }) => {
        const query = buildQuery(params);
        return request<{ submissions: any[]; total: number }>(`/admin/submissions${query ? `?${query}` : ''}`);
    },

    // Approve listing application
    approveListingApplication: (id: string, source?: string) =>
        request<{ message: string }>(`/admin/submissions/${id}/approve-listing`, {
            method: 'POST',
            body: JSON.stringify({ source }),
        }),

    // Reject listing application
    rejectListingApplication: (id: string, reason?: string, source?: string) =>
        request<{ message: string }>(`/admin/submissions/${id}/reject-listing`, {
            method: 'POST',
            body: JSON.stringify({ reason, source }),
        }),
};

// ============ Contracts API ============
export const contractsApi = {
    getAll: () => request<{ templates: any[] }>('/contracts'),
    getById: (id: string) => request<{ template: any }>(`/contracts/${id}`),
    create: (data: { name: string; content: string; status?: string }) =>
        request<{ message: string; template: any }>('/contracts', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
    update: (id: string, data: { name?: string; content?: string; status?: string }) =>
        request<{ message: string; template: any }>(`/contracts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
    delete: (id: string) => request<{ message: string }>(`/contracts/${id}`, { method: 'DELETE' }),
    preview: (data: { templateContent: string; mockData?: any }) =>
        request<{ html: string }>('/contracts/preview', {
            method: 'POST',
            body: JSON.stringify(data)
        })
}

// ============ Buffet Articles (原创文章) API ============
export const buffetArticlesApi = {
    getAll: () => request<{ articles: any[] }>('/articles'),
    create: (data: { title: string; content: string; summary?: string; imageUrl?: string; authorName?: string }) =>
        request<{ success: boolean; article: any }>('/articles', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    update: (data: { id: string; title?: string; content?: string; summary?: string; imageUrl?: string; authorName?: string; isPublished?: boolean; isPinned?: boolean }) =>
        request<{ success: boolean; article: any }>('/articles', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
    delete: (id: string) =>
        request<{ success: boolean }>(`/articles?id=${id}`, { method: 'DELETE' }),
};

// ============ Buffet API (Digital Buffet) ============
export const buffetApi = {
    // News Management
    getNews: (params?: { page?: number; size?: number; keyword?: string; categoryId?: string; status?: string }) => {
        const query = buildQuery(params);
        return request<{ items: any[]; total: number; page: number; size: number }>(
            `/admin/news${query ? `?${query}` : ''}`
        );
    },
    updateNews: (id: string, updates: any) =>
        request<{ item: any }>('/admin/news', {
            method: 'PATCH',
            body: JSON.stringify({ id, ...updates }),
        }),
    deleteNews: (id: string) =>
        request<{ message: string }>(`/admin/news?id=${id}`, {
            method: 'DELETE',
        }),

    // Sources Management
    getSources: () => request<{ sources: any[] }>('/admin/sources'),
    createSource: (data: any) =>
        request<{ source: any }>('/admin/sources', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    updateSource: (id: string, updates: any) =>
        request<{ source: any }>('/admin/sources', {
            method: 'PATCH',
            body: JSON.stringify({ id, ...updates }),
        }),
    deleteSource: (id: string) =>
        request<{ message: string }>(`/admin/sources?id=${id}`, {
            method: 'DELETE',
        }),
};

// ============ Ads Admin (广告审核) API ============
export const adsAdminApi = {
    // GET /api/admin/ads/pending — no status param = pending queue
    // status = 'active' | 'offline' | 'pending'
    getAds: (status?: 'pending' | 'active' | 'offline') => {
        const url = status ? `/admin/ads/pending?status=${status}` : '/admin/ads/pending';
        return request<{ ads: any[] }>(url);
    },
    // POST /api/admin/ads/update
    updateAd: (id: string, status: string, rejectionReason?: string) =>
        request<{ success: boolean; ad: any }>('/admin/ads/update', {
            method: 'POST',
            body: JSON.stringify({ id, status, ...(rejectionReason ? { rejectionReason } : {}) }),
        }),
};

// ============ Fetch Stats (抓取质量分析) API ============
export const fetchStatsApi = {
    getStats: () => request<any>('/admin/ai-stats'),
};

// ============ AI Config (AI配置) API ============
export const aiConfigApi = {
    getConfig: () => request<Record<string, { value: string; description: string; updated_at: string }>>('/admin/ai-config'),
    saveConfig: (data: Record<string, string>) =>
        request<{ success: boolean; message: string }>('/admin/ai-config', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
};

// ============ Search Analytics (搜索分析) API ============
export const searchAnalyticsApi = {
    getAnalytics: () => request<{
        topSearches: any[];
        hotNoResults: any[];
        totalUniqueKeywords: number;
        totalSearches: number;
    }>('/admin/search-analytics'),
};

// ============ Agreements (协议管理) API ============
export const agreementsApi = {
    // Public read — GET /api/agreements
    getAll: () => request<Record<string, any>>('/agreements'),
    // Admin save — POST /api/admin/settings
    save: (key: string, value: { title: string; content: string }) =>
        request<{ success: boolean }>('/admin/settings', {
            method: 'POST',
            body: JSON.stringify({ key, value }),
        }),
};

// ============ Forum (社区内容治理) API ============
export const forumApi = {
    getPosts: (params?: { status?: string; page?: number; limit?: number }) => {
        const q = buildQuery(params);
        return request<{ posts: any[]; total: number }>(`/admin/forum${q ? `?${q}` : ''}`);
    },
    deletePost: (id: string) =>
        request<{ success: boolean }>(`/admin/forum?id=${id}`, { method: 'DELETE' }),
    updatePost: (id: string, updates: { is_pinned?: boolean; status?: string }) =>
        request<{ success: boolean; post: any }>('/admin/forum', {
            method: 'PATCH',
            body: JSON.stringify({ id, ...updates }),
        }),
};

// ============ Dashboard API ============
export const dashboardApi = {
    getStats: () => request<{ stats: any; recentRequests: any[] }>('/admin/dashboard/stats'),
};

;

// ============ Blueprints API ============
export const blueprintsApi = {
    // Get all blueprints (admin)
    getAll: (params?: { category?: string; status?: string }) => {
        const query = buildQuery(params);
        return request<{ blueprints: any[] }>(`/blueprints${query ? `?${query}` : ''}`);
    },

    // Get single blueprint by ID
    getById: (id: string) =>
        request<{ blueprint: any }>(`/blueprints/${id}`),

    // Create blueprint (admin)
    create: (data: {
        name: string;
        description?: string;
        category: string;
        template_type?: string;
        pre_filled_content?: any;
        sop_content?: string;
        faq_content?: any;
        pricing_guide?: any;
        images?: any;
        status?: string;
    }) =>
        request<{ message: string; blueprint: any }>('/blueprints', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    // Update blueprint (admin)
    update: (id: string, data: Partial<{
        name: string;
        description: string;
        category: string;
        template_type: string;
        pre_filled_content: any;
        sop_content: string;
        faq_content: any;
        pricing_guide: any;
        images: any;
        status: string;
        is_featured: boolean;
        sort_order: number;
    }>) =>
        request<{ message: string; blueprint: any }>(`/blueprints/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    // Delete blueprint (admin)
    delete: (id: string) =>
        request<{ message: string }>(`/blueprints/${id}`, {
            method: 'DELETE',
        }),

    // Clone blueprint
    clone: (id: string, data: { name: string }) =>
        request<{ message: string; blueprint: any }>(`/blueprints/${id}/clone`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};

// ============ Service Lifecycle API ============
export const serviceLifecycleApi = {
    // Get service audit history
    getServiceHistory: (serviceId: string) =>
        request<{
            history: Array<{
                id: string;
                action: string;
                previous_status?: string;
                new_status?: string;
                actor_name?: string;
                actor_role?: string;
                reason?: string;
                reason_category?: string;
                created_at: string;
            }>
        }>(`/providers/services/${serviceId}/history`),

    // Get service by identity ID with history
    getByIdentityId: (serviceIdentityId: string) =>
        request<{ service: any; history: any[] }>(`/providers/services/by-identity/${serviceIdentityId}`),

    // Get predefined rejection categories
    getRejectionCategories: () =>
        request<{ categories: Array<{ code: string; label: string; description: string }> }>('/providers/rejection-categories'),
};

// ============ Maintenance API ============
export const maintenanceApi = {
    getStats: () => request<{ settings: any; stats: { totalNews: number } }>('/admin/maintenance'),
    saveSettings: (settings: { auto_enabled: boolean; retention_hours: number }) =>
        request<{ success: boolean; message: string }>('/admin/maintenance', {
            method: 'POST',
            body: JSON.stringify({ action: 'update_settings', settings }),
        }),
    manualCleanup: (start_date: string, end_date: string) =>
        request<{ success: boolean; message: string; deleted_count: number }>('/admin/maintenance', {
            method: 'POST',
            body: JSON.stringify({ action: 'manual_cleanup', start_date, end_date }),
        }),
};

// ============ CMS Articles API ============
export const cmsApi = {
    getAll: (params?: { type?: string; status?: string }) => {
        const query = buildQuery(params);
        return request<{ articles: any[]; total: number }>(`/cms${query ? `?${query}` : ''}`);
    },
    getById: (id: number | string) => request<{ article: any }>(`/cms/${id}`),
    create: (data: any) => request<{ article: any }>('/cms', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id: number | string, data: any) => request<{ article: any }>(`/cms/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    delete: (id: number | string) => request<{ message: string }>(`/cms/${id}`, {
        method: 'DELETE',
    }),
};

// ============ Generic API (for simple requests) ============
export const api = {
    get: <T = any>(endpoint: string) =>
        request<{ data?: T; success?: boolean;[key: string]: any }>(`${endpoint}`).then(res => ({ data: res })),
    post: <T = any>(endpoint: string, data?: any) =>
        request<{ data?: T; success?: boolean;[key: string]: any }>(`${endpoint}`, {
            method: 'POST',
            body: JSON.stringify(data)
        }).then(res => ({ data: res })),
    put: <T = any>(endpoint: string, data?: any) =>
        request<{ data?: T; success?: boolean;[key: string]: any }>(`${endpoint}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }).then(res => ({ data: res })),
};
