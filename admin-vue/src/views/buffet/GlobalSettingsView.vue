<template>
  <div class="p-6 max-w-4xl mx-auto">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
      <div class="flex items-center gap-3">
        <el-icon :size="30" color="#0d9488"><Setting /></el-icon>
        <div>
          <h2 class="text-2xl font-black tracking-tight">全局系统设置</h2>
          <p class="text-gray-400 text-sm mt-0.5">配置广告定价、展示逻辑及系统全局开关</p>
        </div>
      </div>
      <el-button type="primary" size="large" :loading="saving" :icon="Check" @click="handleSave">
        保存所有修改
      </el-button>
    </div>

    <!-- Quick Nav Grid -->
    <div class="mb-10">
      <div class="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">
        <el-icon><Plus /></el-icon>
        核心管理功能
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div
          v-for="item in navItems"
          :key="item.title"
          class="nav-card bg-white border border-gray-100 rounded-3xl p-4 cursor-pointer hover:border-teal-400 hover:shadow-lg transition-all group shadow-sm"
          @click="$router.push(item.to)"
        >
          <div
            class="w-10 h-10 rounded-2xl flex items-center justify-center text-white mb-3 shadow-md group-hover:scale-110 transition-transform"
            :style="{ background: item.color }"
          >
            <el-icon :size="20"><component :is="item.icon" /></el-icon>
          </div>
          <h3 class="font-black text-xs uppercase tracking-tight text-gray-800 mb-0.5">{{ item.title }}</h3>
          <p class="text-[10px] text-gray-400 leading-tight">{{ item.desc }}</p>
        </div>
      </div>
    </div>

    <!-- Payment toggle -->
    <el-card shadow="never" class="border border-gray-100 rounded-3xl mb-8">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
            <el-icon :size="20"><Wallet /></el-icon>
          </div>
          <div>
            <div class="font-black text-sm uppercase tracking-tight">广告支付模式</div>
            <div class="text-xs text-gray-400 mt-0.5">控制用户提交广告时是否开启在线支付通道</div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs font-black uppercase tracking-widest" :class="enableOnlinePayment ? 'text-teal-600' : 'text-gray-400'">
            {{ enableOnlinePayment ? '在线支付已开启' : '在线支付已禁用' }}
          </span>
          <el-switch v-model="enableOnlinePayment" active-color="#0d9488" />
        </div>
      </div>
    </el-card>

    <!-- Pricing tables -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

      <!-- Scope pricing -->
      <el-card shadow="never" class="border border-gray-100 rounded-3xl overflow-hidden p-0">
        <template #header>
          <div class="flex items-center gap-2 text-sm font-bold">
            <el-icon color="#0d9488"><Location /></el-icon>
            投放范围基础定价 ($)
          </div>
        </template>
        <div v-loading="loading" class="space-y-4">
          <div
            v-for="(value, key) in pricing.scope"
            :key="key"
            class="flex items-center justify-between"
          >
            <div>
              <div class="font-semibold text-sm text-gray-800">{{ scopeLabel(key) }}</div>
              <div class="text-[10px] text-gray-400 font-mono">{{ key }}</div>
            </div>
            <el-input-number
              v-model="pricing.scope[key]"
              :min="0"
              :precision="0"
              :step="10"
              controls-position="right"
              style="width: 130px"
            />
          </div>
        </div>
      </el-card>

      <!-- Duration pricing -->
      <el-card shadow="never" class="border border-gray-100 rounded-3xl overflow-hidden p-0">
        <template #header>
          <div class="flex items-center gap-2 text-sm font-bold">
            <el-icon color="#0d9488"><Clock /></el-icon>
            时长附加费用 ($)
          </div>
        </template>
        <div v-loading="loading" class="space-y-4">
          <div
            v-for="(value, key) in sortedDuration"
            :key="key"
            class="flex items-center justify-between"
          >
            <div>
              <div class="font-semibold text-sm text-gray-800">{{ key }} 天展示</div>
              <div class="text-[10px] text-gray-400 font-mono">{{ key }} days</div>
            </div>
            <el-input-number
              v-model="pricing.duration[key]"
              :min="0"
              :precision="0"
              :step="10"
              controls-position="right"
              style="width: 130px"
            />
          </div>
        </div>
        <el-alert
          class="mt-4"
          title="提示：总费用 = 范围基础价 + 时长附加费"
          type="info"
          :closable="false"
          show-icon
        />
      </el-card>
    </div>

    <!-- Billing note -->
    <el-alert
      title="计费说明"
      description="修改此处的定价后，所有新创建的广告订单将按新价格计算。已经在审核中或已上线的订单费用保持不变（以创建时的快照为准）。"
      type="warning"
      :closable="false"
      show-icon
      class="rounded-2xl"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Setting, Check, Plus, Clock, Location,
  DataLine, Money, Refresh, TrendCharts, Search,
  DataBoard, Cpu, Fold, UserFilled, Files, Wallet, Grid
} from '@element-plus/icons-vue'


// ── API helper (reuse admin/settings route from api.ts) ──
const API_BASE = (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
  ? 'https://fongbeev1-backe-end.onrender.com/api'
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000/api')

const getToken = () => localStorage.getItem('admin_token')

async function settingsRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── State ──────────────────────────────────────────
const loading = ref(false)
const saving  = ref(false)

const enableOnlinePayment = ref(true)

const pricing = reactive<{
  scope: Record<string, number>
  duration: Record<string, number>
}>({
  scope:    { local: 50, city: 100, province: 200, national: 500 },
  duration: { '1': 10, '3': 25, '7': 50, '14': 80, '30': 150 },
})

const sortedDuration = computed(() => {
  const entries = Object.entries(pricing.duration).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
  return Object.fromEntries(entries)
})

// ── Nav items ──────────────────────────────────────
const navItems = [
  { title: '分类管理',     icon: Grid,        to: '/dashboard/buffet/categories',       desc: '服务大类图标与启用控制',   color: '#10b981' },
  { title: '原创文章管理', icon: DataLine,    to: '/dashboard/buffet/articles',         desc: '内容撰写与发布',          color: '#3b82f6' },
  { title: '广告审核',     icon: Money,       to: '/dashboard/buffet/ads',              desc: '订单、收据与定价',         color: '#6366f1' },
  { title: '抓取源配置',   icon: Refresh,     to: '/dashboard/buffet/sources',          desc: 'RSS、YouTube 源管理',     color: '#a855f7' },
  { title: '抓取质量分析', icon: TrendCharts, to: '/dashboard/buffet/fetch-stats',      desc: '抓取流水线健康监控',        color: '#f97316' },
  { title: '搜索分析',     icon: Search,      to: '/dashboard/buffet/search-analytics', desc: '用户搜什么？反馈建议',      color: '#ef4444' },
  { title: '系统维护',     icon: DataBoard,   to: '/dashboard/buffet/maintenance',      desc: '数据清理与保质期管理',      color: '#64748b' },
  { title: 'AI 配置',      icon: Cpu,         to: '/dashboard/buffet/ai-config',        desc: '模型参数与故障切换',        color: '#0d9488' },
  { title: 'AI 新闻管理',  icon: Fold,        to: '/dashboard/buffet/news',             desc: '新闻及抓取源类别划分',      color: '#0891b2' },
  { title: '社区内容治理', icon: UserFilled,  to: '/dashboard/buffet/forum',            desc: '权限、角色与注册管理',      color: '#1e293b' },
  { title: '协议文档管理', icon: Files,       to: '/dashboard/buffet/agreements',       desc: '注册、隐私及服务条款',      color: '#d97706' },
]

// ── Helpers ────────────────────────────────────────
const scopeLabel = (key: string) => {
  const map: Record<string, string> = {
    local: '周边 (Local)', city: '市级 (City)',
    province: '省级 (Province)', national: '全国 (National)',
  }
  return map[key] ?? key
}

// ── Fetch ──────────────────────────────────────────
const fetchSettings = async () => {
  loading.value = true
  try {
    const data = await settingsRequest<Record<string, any>>('/admin/settings')
    if (data.ad_pricing) {
      Object.assign(pricing.scope,    data.ad_pricing.scope    || {})
      Object.assign(pricing.duration, data.ad_pricing.duration || {})
    }
    if (data.ad_payment_settings) {
      enableOnlinePayment.value = data.ad_payment_settings.enable_online_payment ?? true
    }
  } catch (e: any) {
    ElMessage.error(e.message || '加载设置失败')
  } finally {
    loading.value = false
  }
}

// ── Save ───────────────────────────────────────────
const handleSave = async () => {
  saving.value = true
  try {
    await Promise.all([
      settingsRequest('/admin/settings', {
        method: 'POST',
        body: JSON.stringify({ key: 'ad_pricing', value: { scope: pricing.scope, duration: pricing.duration } }),
      }),
      settingsRequest('/admin/settings', {
        method: 'POST',
        body: JSON.stringify({ key: 'ad_payment_settings', value: { enable_online_payment: enableOnlinePayment.value } }),
      }),
    ])
    ElMessage.success('配置已成功保存并即时生效')
  } catch (e: any) {
    ElMessage.error(e.message || '保存配置失败，请检查网络')
  } finally {
    saving.value = false
  }
}

onMounted(fetchSettings)
</script>

<style scoped>
.nav-card {
  user-select: none;
}
</style>
