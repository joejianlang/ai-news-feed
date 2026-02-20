import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: () => {
                try {
                    const userStr = localStorage.getItem('admin_user')
                    if (userStr) {
                        const user = JSON.parse(userStr)
                        if (user.role === 'provider') return '/provider/services'
                    }
                } catch { }
                return '/dashboard'
            }
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/LoginView.vue')
        },
        {
            path: '/sso',
            name: 'sso',
            component: () => import('../views/SSO.vue')
        },
        {
            path: '/dashboard',
            name: 'dashboard',
            component: () => import('../views/DashboardLayout.vue'),
            children: [
                {
                    path: '',
                    name: 'home',
                    component: () => import('../views/HomeView.vue')
                },
                // 分类管理
                {
                    path: 'categories',
                    name: 'categories',
                    component: () => import('../views/categories/CategoryListView.vue')
                },
                // 标准服务管理
                {
                    path: 'standard/orders',
                    name: 'standard-orders',
                    component: () => import('../views/standard/OrderListView.vue')
                },
                {
                    path: 'standard/listing-applications',
                    name: 'standard-listing-applications',
                    component: () => import('../views/standard/ListingApplicationsView.vue')
                },
                {
                    path: 'standard/lifecycle',
                    name: 'standard-lifecycle',
                    component: () => import('../views/standard/ServiceLifecycleView.vue')
                },
                // 表单管理
                {
                    path: 'forms',
                    name: 'forms',
                    component: () => import('../views/forms/FormListView.vue')
                },
                {
                    path: 'forms/:id',
                    name: 'form-edit',
                    component: () => import('../views/forms/FormEditView.vue')
                },
                // 合同文件管理
                {
                    path: 'contracts',
                    name: 'contracts',
                    component: () => import('../views/contracts/ContractListView.vue')
                },
                {
                    path: 'contracts/:id',
                    name: 'contract-edit',
                    component: () => import('../views/contracts/ContractEditView.vue')
                },
                // 蓝图管理
                {
                    path: 'blueprints',
                    name: 'blueprints',
                    component: () => import('../views/blueprints/BlueprintListView.vue')
                },
                {
                    path: 'blueprints/:id',
                    name: 'blueprint-edit',
                    component: () => import('../views/blueprints/BlueprintEditView.vue')
                },
                // 需求管理
                {
                    path: 'requests',
                    name: 'requests',
                    component: () => import('../views/requests/RequestListView.vue')
                },
                {
                    path: 'requests/:id',
                    name: 'request-detail',
                    component: () => import('../views/requests/RequestDetailView.vue')
                },
                // 服务商管理
                {
                    path: 'providers',
                    name: 'providers',
                    component: () => import('../views/providers/ProviderListView.vue')
                },
                {
                    path: 'providers/applications',
                    name: 'provider-applications',
                    component: () => import('../views/providers/CategoryApplicationListView.vue')
                },
                {
                    path: 'providers/:id',
                    name: 'provider-detail',
                    component: () => import('../views/providers/ProviderDetailView.vue')
                },
                // 用户管理
                // Sales Partners
                {
                    path: 'users/sales-partners',
                    name: 'sales-partners',
                    component: () => import('../views/users/SalesPartnerList.vue')
                },
                {
                    path: 'users/sales-partners/:id',
                    name: 'sales-partner-detail',
                    component: () => import('../views/users/SalesPartnerDetail.vue')
                },
                {
                    path: 'users',
                    name: 'users',
                    component: () => import('../views/users/UserListView.vue')
                },
                {
                    path: 'users/:id',
                    name: 'user-detail',
                    component: () => import('../views/users/UserDetailView.vue')
                },
                {
                    path: 'users/invite-sales',
                    name: 'invite-sales',
                    component: () => import('../views/users/InviteSales.vue')
                },
                {
                    path: 'users/subscriptions',
                    name: 'user-subscriptions',
                    component: () => import('../views/users/UserSubscriptionsView.vue')
                },
                // 财务管理
                {
                    path: 'finance',
                    name: 'finance',
                    component: () => import('../views/finance/FinanceView.vue')
                },
                {
                    path: 'banners',
                    name: 'banners',
                    component: () => import('../views/banners/BannerListView.vue')
                },
                // 短信配置
                {
                    path: 'sms-templates',
                    name: 'sms-templates',
                    component: () => import('../views/sms/SmsTemplates.vue')
                },
                // 邮件配置
                {
                    path: 'email-templates',
                    name: 'email-templates',
                    component: () => import('../views/email/EmailTemplates.vue')
                },
                // 系统设置
                {
                    path: 'settings',
                    name: 'settings',
                    component: () => import('../views/settings/SettingsView.vue')
                },
                // 套餐配置
                {
                    path: 'pricing-config',
                    name: 'pricing-config',
                    component: () => import('../views/pricing/PricingConfigView.vue')
                },

                {
                    path: 'cities',
                    name: 'cities',
                    component: () => import('../views/settings/CityListView.vue')
                },
                // 内容管理 (CMS)
                {
                    path: 'cms',
                    name: 'cms-list',
                    component: () => import('../views/cms/ArticleListView.vue')
                },
                {
                    path: 'cms/create',
                    name: 'cms-create',
                    component: () => import('../views/cms/ArticleEditView.vue')
                },
                {
                    path: 'cms/edit/:id',
                    name: 'cms-edit',
                    component: () => import('../views/cms/ArticleEditView.vue')
                },
                // 数位运营 (DigitBuffet)
                {
                    path: 'buffet/articles',
                    name: 'buffet-articles',
                    component: () => import('../views/buffet/ArticlesAdminView.vue')
                },
                {
                    path: 'buffet/news',
                    name: 'buffet-news',
                    component: () => import('../views/buffet/NewsAdminView.vue')
                },
                {
                    path: 'buffet/sources',
                    name: 'buffet-sources',
                    component: () => import('../views/buffet/SourceAdminView.vue')
                },
                {
                    path: 'buffet/maintenance',
                    name: 'buffet-maintenance',
                    component: () => import('../views/buffet/MaintenanceView.vue')
                },
                {
                    path: 'buffet/ads',
                    name: 'buffet-ads',
                    component: () => import('../views/buffet/AdsAdminView.vue')
                },
                {
                    path: 'buffet/fetch-stats',
                    name: 'buffet-fetch-stats',
                    component: () => import('../views/buffet/FetchStatsView.vue')
                },
                {
                    path: 'buffet/ai-config',
                    name: 'buffet-ai-config',
                    component: () => import('../views/buffet/AiConfigView.vue')
                },
                {
                    path: 'buffet/search-analytics',
                    name: 'buffet-search-analytics',
                    component: () => import('../views/buffet/SearchAnalyticsView.vue')
                },
                {
                    path: 'buffet/agreements',
                    name: 'buffet-agreements',
                    component: () => import('../views/buffet/AgreementsView.vue')
                },
                {
                    path: 'buffet/forum',
                    name: 'buffet-forum',
                    component: () => import('../views/buffet/ForumView.vue')
                },
                {
                    path: 'buffet/global-settings',
                    name: 'buffet-global-settings',
                    component: () => import('../views/buffet/GlobalSettingsView.vue')
                },
                {
                    path: 'buffet/categories',
                    name: 'buffet-categories',
                    component: () => import('../views/categories/CategoryListView.vue')
                }

            ]
        },
        {
            path: '/provider',
            component: () => import('../views/provider/ProviderLayout.vue'),
            redirect: '/provider/services',
            children: [
                // { path: 'reports', component: () => import('../views/provider/ProviderReports.vue') },
                { path: 'hall', component: () => import('../views/provider/ProviderTaskHall.vue') },
                { path: 'services', component: () => import('../views/provider/ProviderServicesV2.vue') },
                { path: 'orders', component: () => import('../views/provider/ProviderOrderManager.vue') },
                { path: 'quotes', component: () => import('../views/provider/ProviderQuotes.vue') },
                { path: 'custom-orders', component: () => import('../views/provider/ProviderCustomOrders.vue') },
                { path: 'inbox', component: () => import('../views/provider/ProviderInbox.vue') },
                { path: 'transactions', component: () => import('../views/provider/ProviderTransactions.vue') },
                { path: 'subscription', component: () => import('../views/provider/ProviderSubscription.vue') },
                { path: 'credits', redirect: 'subscription' }, // Redirect old credits link
                { path: 'reviews', component: () => import('../views/provider/ProviderReviews.vue') },
                { path: 'invoices', component: () => import('../views/provider/ProviderInvoices.vue') },
                { path: 'contracts', component: () => import('../views/provider/ProviderContracts.vue') },
                { path: 'profile', component: () => import('../views/provider/ProviderPlaceholder.vue') },
                { path: 'password', component: () => import('../views/provider/ProviderPassword.vue') },
                { path: 'payment-methods', component: () => import('../views/provider/ProviderPaymentMethods.vue') },
                { path: 'areas', component: () => import('../views/provider/ProviderAreas.vue') },
                { path: 'schedule', component: () => import('../views/provider/ProviderSchedule.vue') }
            ]
        }
    ]
})

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('admin_token')
    const userStr = localStorage.getItem('admin_user')

    // If going to login or sso
    if (to.name === 'login' || to.name === 'sso') {
        if (to.name === 'login' && token) {
            try {
                const user = JSON.parse(userStr || '{}')
                if (user.role === 'provider') return next('/provider')
                return next('/dashboard')
            } catch (e) {
                localStorage.clear()
                return next()
            }
        }
        return next()
    }

    // Require Auth
    if (!token) {
        return next('/login')
    }

    // Role Checks
    try {
        const user = JSON.parse(userStr || '{}')

        // Provider trying to access Admin Dashboard
        if (to.path.startsWith('/dashboard') && user.role === 'provider') {
            return next('/provider')
        }

        // Admin trying to access Provider Dashboard (Strict Separation)
        if (to.path.startsWith('/provider') && user.role !== 'provider') {
            return next('/dashboard')
        }

    } catch {
        localStorage.clear()
        return next('/login')
    }

    next()
})

export default router
