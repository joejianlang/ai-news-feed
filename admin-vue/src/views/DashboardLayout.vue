<template>
  <el-container class="h-screen">
    <!-- Mobile Overlay -->
    <div
      v-if="sidebarOpen && isMobile"
      class="sidebar-overlay"
      @click="sidebarOpen = false"
    ></div>

    <!-- Sidebar -->
    <el-aside
      :width="sidebarWidth"
      :class="['sidebar', { 'sidebar-open': sidebarOpen, 'sidebar-mobile': isMobile }]"
    >
      <div class="sidebar-header">
        <span v-if="!isCollapsed || isMobile" class="sidebar-title">
          {{ isProvider ? '优服佳 / 服务商' : '优服佳 / 后台' }}
        </span>
        <el-icon v-if="isMobile" class="close-btn" @click="sidebarOpen = false"><Close /></el-icon>
      </div>
      <el-menu
        class="sidebar-menu"
        :router="true"
        :default-active="currentRoute"
        text-color="#94a3b8"
        active-text-color="#ffffff"
        background-color="transparent"
        :collapse="isCollapsed && !isMobile"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>控制台</span>
        </el-menu-item>

        <!-- Standard Service Management -->
        <el-sub-menu index="standard">
           <template #title>
             <el-icon><Box /></el-icon>
             <span>标准服务管理</span>
           </template>
           <el-menu-item index="/dashboard/standard/lifecycle">服务生命周期</el-menu-item>
           <el-menu-item index="/dashboard/standard/orders">标准服务订单</el-menu-item>
           <el-menu-item index="/dashboard/standard/listing-applications">服务申请上架</el-menu-item>
           <el-menu-item index="/dashboard/forms?tab=standard">标准服务模版</el-menu-item>
           <el-menu-item index="/dashboard/providers/applications">服务类型申请</el-menu-item>
        </el-sub-menu>

        <!-- Custom Service Management -->
        <el-sub-menu index="custom">
           <template #title>
             <el-icon><List /></el-icon>
             <span>定制服务管理</span>
           </template>
           <el-menu-item index="/dashboard/requests">定制服务需求</el-menu-item>
           <el-menu-item index="/dashboard/forms?tab=custom">定制服务表单</el-menu-item>
        </el-sub-menu>

        <!-- 入驻管理 -->
        <el-sub-menu index="onboarding">
          <template #title>
            <el-icon><Coordinate /></el-icon>
            <span>入驻管理</span>
          </template>
          <el-menu-item index="/dashboard/forms?tab=provider_reg">入驻申请表单</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/dashboard/contracts">
            <el-icon><Document /></el-icon>
            <span>合同模板</span>
        </el-menu-item>

        <el-sub-menu index="users">
          <template #title>
            <el-icon><UserFilled /></el-icon>
            <span>用户管理</span>
          </template>
          <el-menu-item index="/dashboard/users/sales-partners">销售合伙人</el-menu-item>
          <el-menu-item index="/dashboard/users">用户列表</el-menu-item>
          <el-menu-item index="/dashboard/users/subscriptions">订阅记录</el-menu-item>
          <el-menu-item index="/dashboard/users/invite-sales">销售邀请</el-menu-item>
          <el-menu-item index="/dashboard/providers">服务商列表</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/dashboard/finance">
          <el-icon><Money /></el-icon>
          <span>财务管理</span>
        </el-menu-item>

        <el-menu-item index="/dashboard/banners">
          <el-icon><Picture /></el-icon>
          <span>广告设置</span>
        </el-menu-item>

        <el-menu-item index="/dashboard/sms-templates">
          <el-icon><Message /></el-icon>
          <span>短信配置</span>
        </el-menu-item>

        <el-menu-item index="/dashboard/email-templates">
          <el-icon><Message /></el-icon>
          <span>邮件配置</span>
        </el-menu-item>

        <el-menu-item index="/dashboard/cms">
          <el-icon><Notebook /></el-icon>
          <span>内容管理</span>
        </el-menu-item>

        <!-- 数位运营 (DigitBuffet) -->
        <el-sub-menu index="buffet">
          <template #title>
            <el-icon><DataLine /></el-icon>
            <span>数位运营</span>
          </template>
          <el-menu-item index="/dashboard/buffet/global-settings">全局系统设置</el-menu-item>
          <el-menu-item index="/dashboard/buffet/categories">分类管理</el-menu-item>
          <el-menu-item index="/dashboard/buffet/articles">原创文章管理</el-menu-item>
          <el-menu-item index="/dashboard/buffet/ads">广告审核</el-menu-item>
          <el-menu-item index="/dashboard/buffet/forum">社区内容治理</el-menu-item>
          <el-menu-item index="/dashboard/buffet/news">AI 新闻管理</el-menu-item>
          <el-menu-item index="/dashboard/buffet/sources">抓取源配置</el-menu-item>
          <el-menu-item index="/dashboard/buffet/fetch-stats">抓取质量分析</el-menu-item>
          <el-menu-item index="/dashboard/buffet/search-analytics">搜索分析</el-menu-item>
          <el-menu-item index="/dashboard/buffet/ai-config">AI 配置</el-menu-item>
          <el-menu-item index="/dashboard/buffet/agreements">协议文档管理</el-menu-item>
          <el-menu-item index="/dashboard/buffet/maintenance">系统维护与清理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="sys">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/dashboard/settings">系统配置</el-menu-item>
          <el-menu-item index="/dashboard/pricing-config">套餐定价</el-menu-item>
          <el-menu-item index="/dashboard/cities">城市管理</el-menu-item>
          <el-menu-item index="/dashboard/categories">服务分类</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container class="main-container">
      <!-- Header -->
      <el-header class="header">
        <div class="header-left">
          <el-icon class="menu-toggle" @click="toggleSidebar">
            <Fold v-if="sidebarOpen && !isMobile" /><Expand v-else />
          </el-icon>
          <span class="welcome-text hidden sm:inline">欢迎回来, {{ adminName }}</span>
        </div>

        <div class="header-right">
          <!-- Dark mode toggle -->
          <button
            class="theme-toggle"
            :title="isDark ? '切换浅色模式' : '切换深色模式'"
            @click="toggleDark"
          >
            <!-- Sun icon (shown in dark mode) -->
            <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
            <!-- Moon icon (shown in light mode) -->
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>

          <!-- User dropdown -->
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link">
              <span class="hidden sm:inline">{{ adminName }}</span>
              <div class="user-avatar sm:hidden">{{ (adminName || '?')[0].toUpperCase() }}</div>
              <el-icon class="el-icon--right hidden sm:flex"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="settings">个人设置</el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon class="mr-1"><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Odometer, Document, List, ArrowDown, UserFilled, Setting, SwitchButton,
  Money, Picture, Message, Notebook, Box, Fold, Expand, Close, Coordinate, DataLine
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()

// ── Responsive state ───────────────────────────────────────────
const windowWidth = ref(window.innerWidth)
const sidebarOpen = ref(window.innerWidth >= 768)
const isCollapsed = ref(false)

const isMobile = computed(() => windowWidth.value < 768)
const sidebarWidth = computed(() => {
  if (isMobile.value) return '260px'
  if (isCollapsed.value) return '64px'
  return '220px'
})

const handleResize = () => {
  windowWidth.value = window.innerWidth
  if (windowWidth.value >= 768) {
    sidebarOpen.value = true
  } else {
    sidebarOpen.value = false
  }
}

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))

const toggleSidebar = () => {
  if (isMobile.value) {
    sidebarOpen.value = !sidebarOpen.value
  } else {
    isCollapsed.value = !isCollapsed.value
  }
}

// ── Dark mode ──────────────────────────────────────────────────
const isDark = ref(document.documentElement.classList.contains('dark'))

const toggleDark = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('admin_theme', isDark.value ? 'dark' : 'light')
}

// ── Active route ───────────────────────────────────────────────
const currentRoute = computed(() => {
  if (route.path === '/dashboard/forms') {
    const tab = route.query.tab || 'all'
    if (tab === 'custom') return '/dashboard/forms?tab=custom'
    if (tab === 'provider_reg') return '/dashboard/forms?tab=provider_reg'
  }
  return route.path
})

// ── User info ──────────────────────────────────────────────────
const userInfo = computed(() => {
  try {
    const userStr = localStorage.getItem('admin_user')
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
})

const isProvider = computed(() => userInfo.value?.role === 'provider')
const adminName = computed(() => userInfo.value?.name || (isProvider.value ? '服务商' : '管理员'))

// ── Dropdown commands ──────────────────────────────────────────
const handleCommand = (command: string) => {
  if (command === 'logout') {
    handleLogout()
  } else if (command === 'settings') {
    router.push('/dashboard/settings')
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '确认退出', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch {
    // cancelled
  }
}
</script>

<style scoped>
/* ── Sidebar ──────────────────────────────────────────────── */
.sidebar {
  background-color: var(--nav-bg);
  color: #fff;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease, transform 0.3s ease;
  z-index: 100;
  flex-shrink: 0;
}

.sidebar-mobile {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  transform: translateX(-100%);
}

.sidebar-mobile.sidebar-open {
  transform: translateX(0);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 99;
  backdrop-filter: blur(2px);
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 0.03em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-title {
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
}

.close-btn {
  cursor: pointer;
  font-size: 20px;
  color: #94a3b8;
  flex-shrink: 0;
  transition: color 0.2s;
}
.close-btn:hover {
  color: #fff;
}

.sidebar-menu {
  border-right: none !important;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: transparent !important;
}

/* Active item teal highlight */
:deep(.el-menu-item.is-active) {
  background-color: rgba(13, 148, 136, 0.18) !important;
  color: #fff !important;
  border-right: 3px solid #0d9488;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: rgba(255, 255, 255, 0.06) !important;
}

:deep(.el-menu) {
  border-right: none !important;
  background-color: transparent !important;
}

:deep(.el-sub-menu .el-menu) {
  background-color: rgba(0,0,0,0.12) !important;
}

:deep(.el-menu--collapse .el-sub-menu__title span),
:deep(.el-menu--collapse .el-menu-item span) {
  display: none;
}

/* ── Main container ───────────────────────────────────────── */
.main-container {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* ── Header ───────────────────────────────────────────────── */
.header {
  background-color: var(--header-bg);
  border-bottom: 1px solid var(--header-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 60px;
  flex-shrink: 0;
  transition: background-color 0.3s ease, border-color 0.3s ease;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.menu-toggle {
  font-size: 20px;
  cursor: pointer;
  color: var(--text-muted);
  transition: color 0.2s;
  flex-shrink: 0;
}
.menu-toggle:hover {
  color: var(--text-primary);
}

.welcome-text {
  color: var(--text-muted);
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Dark mode toggle button ──────────────────────────────── */
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border-primary);
  background-color: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.theme-toggle:hover {
  background-color: var(--card-bg);
  color: var(--text-primary);
  border-color: #0d9488;
}

/* ── User dropdown ────────────────────────────────────────── */
.el-dropdown-link {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  transition: color 0.2s;
}
.el-dropdown-link:hover {
  color: var(--text-primary);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0d9488, #14b8a6);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Main content area ────────────────────────────────────── */
.main-content {
  background-color: var(--background);
  overflow-y: auto;
  flex: 1;
  transition: background-color 0.3s ease;
}

/* ── Mobile styles ────────────────────────────────────────── */
@media (max-width: 767px) {
  .header {
    padding: 0 12px;
  }

  :deep(.el-table) {
    font-size: 12px;
  }

  :deep(.el-card) {
    margin-bottom: 12px;
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
  }

  :deep(.el-dialog) {
    width: 95% !important;
    border-radius: 20px !important;
  }
}

/* ── Tablet styles ────────────────────────────────────────── */
@media (min-width: 768px) and (max-width: 1023px) {
  :deep(.el-dialog) {
    width: 80% !important;
  }
}
</style>
