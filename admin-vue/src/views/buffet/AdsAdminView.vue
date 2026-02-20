<template>
  <div class="p-6">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
      <div>
        <div class="flex items-center gap-2">
          <el-icon :size="26" color="#0d9488"><Shield /></el-icon>
          <h2 class="text-2xl font-bold">广告审核控制台</h2>
        </div>
        <p class="text-gray-400 text-sm mt-1 ml-8">审核并管理全站投放的赞助内容</p>
      </div>

      <!-- Tab + Refresh bar -->
      <div class="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
        <el-button
          :type="activeTab === 'pending' ? 'primary' : ''"
          :plain="activeTab !== 'pending'"
          size="small"
          class="tab-btn"
          @click="switchTab('pending')"
        >待处理</el-button>
        <el-button
          :class="activeTab === 'active' ? 'tab-active-blue' : ''"
          :plain="activeTab !== 'active'"
          size="small"
          class="tab-btn"
          @click="switchTab('active')"
        >上线中</el-button>
        <el-button
          :plain="activeTab !== 'offline'"
          size="small"
          class="tab-btn"
          @click="switchTab('offline')"
        >已下架</el-button>
        <el-divider direction="vertical" style="height:20px;margin:0 4px;" />
        <el-tooltip content="刷新" placement="top">
          <el-button
            :icon="Refresh"
            circle
            size="small"
            :loading="loading"
            @click="fetchAds"
          />
        </el-tooltip>
      </div>
    </div>

    <!-- Loading skeletons -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <el-skeleton v-for="i in 3" :key="i" :rows="3" animated class="bg-white rounded-2xl p-4 border border-gray-100" />
    </div>

    <!-- Empty state -->
    <div v-else-if="ads.length === 0" class="text-center py-24 bg-white border border-dashed border-gray-200 rounded-3xl">
      <el-icon :size="56" color="#d1d5db"><Warning /></el-icon>
      <p class="text-gray-400 font-semibold text-lg mt-4">
        {{ activeTab === 'pending' ? '暂无待处理的广告申请' :
           activeTab === 'active'  ? '当前没有正在投放的广告' :
                                     '暂无已下架的广告记录' }}
      </p>
      <p class="text-gray-300 text-sm mt-1 italic">所有操作都会实时同步到数据库</p>
    </div>

    <!-- Ad grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="ad in ads"
        :key="ad.id"
        class="ad-card bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group"
        @click="openDetail(ad)"
      >
        <!-- Cover image -->
        <div class="aspect-video w-full bg-gray-100 relative overflow-hidden">
          <img v-if="ad.image_url" :src="ad.image_url" :alt="ad.title" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-gray-300 text-xs uppercase font-bold">No Image</div>
          <!-- hover overlay -->
          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <el-icon :size="32" color="white"><View /></el-icon>
          </div>
        </div>
        <!-- Card body -->
        <div class="p-4">
          <div class="flex items-start justify-between gap-2 mb-2">
            <span class="font-bold text-gray-800 text-base truncate flex-1">{{ ad.title }}</span>
            <el-tag :type="statusTagType(ad.status)" size="small" class="flex-shrink-0">
              {{ statusLabel(ad.status) }}
            </el-tag>
          </div>
          <div class="flex items-center justify-between text-xs text-gray-400">
            <span class="flex items-center gap-1">
              <el-icon><Money /></el-icon>
              $ {{ ad.price_total }}
            </span>
            <span class="flex items-center gap-1">
              <el-icon><Calendar /></el-icon>
              {{ ad.duration_days }} 天
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Detail Dialog ─────────────────────────────── -->
    <el-dialog
      v-model="dialogVisible"
      title="详情审核"
      width="900px"
      :close-on-click-modal="!processing"
      top="5vh"
      @close="resetDialog"
    >
      <template v-if="selectedAd">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <!-- Left: preview + voucher + meta -->
          <div class="space-y-5">
            <!-- Feed preview -->
            <div>
              <div class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Feed 效果预览</div>
              <div class="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div class="flex gap-3">
                  <div class="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                    <img v-if="selectedAd.image_url" :src="selectedAd.image_url" class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full flex items-center justify-center text-gray-300 text-xs">无图</div>
                  </div>
                  <div class="min-w-0">
                    <div class="font-bold text-gray-800 text-sm truncate">{{ selectedAd.title }}</div>
                    <div class="text-xs text-gray-500 mt-1 line-clamp-2">{{ selectedAd.content }}</div>
                    <div class="text-xs text-teal-600 mt-1 font-semibold">赞助</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Payment voucher -->
            <div v-if="selectedAd.payment_voucher_url">
              <div class="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                <el-icon><Picture /></el-icon>
                支付凭证 (用户上传)
              </div>
              <div class="border-2 border-blue-100 rounded-xl p-2 bg-blue-50/30">
                <a :href="selectedAd.payment_voucher_url" target="_blank" rel="noreferrer">
                  <img :src="selectedAd.payment_voucher_url" alt="凭证" class="w-full rounded-lg object-contain max-h-52 hover:opacity-80 transition-opacity" />
                </a>
                <p class="text-center text-blue-400 text-xs mt-1 italic">点击图片可查看大图</p>
              </div>
            </div>

            <!-- Meta info -->
            <div class="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-gray-400 text-xs uppercase">投放范围</span>
                <span class="font-semibold">{{ scopeLabel(selectedAd.scope) }}</span>
              </div>
              <el-divider style="margin:8px 0;" />
              <div class="flex items-center justify-between">
                <span class="text-gray-400 text-xs uppercase">投放时长</span>
                <span class="font-semibold">{{ selectedAd.duration_days }} 天</span>
              </div>
              <el-divider style="margin:8px 0;" />
              <div class="flex items-center justify-between">
                <span class="text-gray-400 text-xs uppercase">总金额</span>
                <span class="font-bold text-teal-600 text-lg">¥{{ selectedAd.price_total }}</span>
              </div>
              <el-divider style="margin:8px 0;" />
              <div class="flex items-center justify-between">
                <span class="text-gray-400 text-xs uppercase">支付方式</span>
                <span class="font-semibold">{{ paymentMethodLabel(selectedAd.payment_method) }}</span>
              </div>
            </div>
          </div>

          <!-- Right: ad details -->
          <div class="space-y-5">
            <div>
              <div class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">广告标题</div>
              <p class="text-xl font-bold text-gray-800">{{ selectedAd.title }}</p>
            </div>
            <div>
              <div class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">正文内容</div>
              <div class="bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{{ selectedAd.content }}</div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">联系方式</div>
                <p class="text-sm font-medium text-gray-700">{{ selectedAd.contact_info || '无' }}</p>
              </div>
              <div>
                <div class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">跳转链接</div>
                <a
                  v-if="selectedAd.link_url"
                  :href="selectedAd.link_url"
                  target="_blank"
                  class="text-sm font-medium text-blue-600 hover:underline truncate block"
                >{{ selectedAd.link_url }}</a>
                <p v-else class="text-sm text-gray-400">无</p>
              </div>
            </div>
            <div v-if="selectedAd.raw_content">
              <div class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">原始输入 (草稿)</div>
              <p class="text-xs text-gray-400 italic bg-gray-50 border border-gray-100 p-3 rounded-lg">{{ selectedAd.raw_content }}</p>
            </div>
            <div v-if="selectedAd.rejection_reason" class="bg-red-50 border border-red-200 rounded-xl p-4">
              <div class="text-xs font-semibold text-red-500 uppercase mb-1">拒绝理由</div>
              <p class="text-sm text-red-700">{{ selectedAd.rejection_reason }}</p>
            </div>
          </div>
        </div>

        <!-- Reject form -->
        <div v-if="showRejectForm" class="mt-6 p-5 bg-red-50 border border-red-200 rounded-2xl">
          <div class="text-sm font-bold text-red-700 mb-2 uppercase">拒绝理由</div>
          <el-input
            v-model="rejectReason"
            type="textarea"
            :rows="3"
            placeholder="请说明拒绝原因..."
          />
          <div class="flex justify-end gap-3 mt-3">
            <el-button @click="showRejectForm = false">取消</el-button>
            <el-button type="danger" :loading="processing" @click="doReject">确认拒绝</el-button>
          </div>
        </div>

        <!-- Confirm action panel -->
        <div v-if="confirmAction" class="mt-6 p-5 bg-teal-50 border border-teal-200 rounded-2xl">
          <p class="font-semibold text-teal-800 mb-4">
            {{ confirmAction === 'approve' ? '确定内容合规，并通知用户进行支付吗？' :
               confirmAction === 'online'  ? '已确认收到客户转账，现在让广告立即上线吗？' :
                                             '下架后广告将不再在首页展示，确定要执行此操作吗？' }}
          </p>
          <div class="flex justify-end gap-3">
            <el-button @click="confirmAction = null">再想想</el-button>
            <el-button
              :type="confirmAction === 'offline' ? 'danger' : 'primary'"
              :loading="processing"
              @click="executeConfirm"
            >确认执行</el-button>
          </div>
        </div>
      </template>

      <!-- Dialog footer actions -->
      <template #footer>
        <div v-if="selectedAd && !showRejectForm && !confirmAction">
          <!-- Active ad: only take offline -->
          <template v-if="selectedAd.status === 'active'">
            <el-button type="danger" :loading="processing" @click="confirmAction = 'offline'">
              <el-icon><CircleClose /></el-icon>
              立即下架
            </el-button>
          </template>
          <!-- Pending / unpaid / verifying_payment -->
          <template v-else-if="['pending','unpaid','verifying_payment'].includes(selectedAd.status)">
            <el-button @click="dialogVisible = false">关闭</el-button>
            <el-button type="danger" plain :loading="processing" @click="showRejectForm = true">
              拒绝申请
            </el-button>
            <el-button
              v-if="selectedAd.status === 'pending'"
              type="primary"
              :loading="processing"
              @click="confirmAction = 'approve'"
            >
              <el-icon><CircleCheck /></el-icon>
              内容合规，去收费
            </el-button>
            <el-button
              v-else
              type="primary"
              :loading="processing"
              @click="confirmAction = 'online'"
            >
              <el-icon><Upload /></el-icon>
              {{ selectedAd.status === 'verifying_payment' ? '确认凭证合法，立即上线' : '确认收妥，立即上线' }}
            </el-button>
          </template>
          <!-- Offline / other -->
          <template v-else>
            <el-button @click="dialogVisible = false">关闭</el-button>
          </template>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adsAdminApi } from '@/services/api'
import {
  Shield, Refresh, Warning, View, Money, Calendar, Picture,
  CircleCheck, CircleClose, Upload
} from '@element-plus/icons-vue'

// ── Types ───────────────────────────────────────────
type TabType = 'pending' | 'active' | 'offline'
type ConfirmType = 'approve' | 'online' | 'offline' | null

// ── State ───────────────────────────────────────────
const loading    = ref(false)
const processing = ref(false)
const ads        = ref<any[]>([])
const activeTab  = ref<TabType>('pending')

const dialogVisible  = ref(false)
const selectedAd     = ref<any>(null)
const showRejectForm = ref(false)
const rejectReason   = ref('')
const confirmAction  = ref<ConfirmType>(null)

// ── Helpers ─────────────────────────────────────────
const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending:            '待审核',
    verifying_payment:  '打款核对',
    active:             '投放中',
    offline:            '已下架',
    unpaid:             '待支付',
    rejected:           '已拒绝',
    expired:            '已过期',
  }
  return map[status] ?? status
}

const statusTagType = (status: string): '' | 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    pending:           'warning',
    verifying_payment: '',
    active:            'success',
    offline:           'danger',
    unpaid:            'info',
    rejected:          'danger',
    expired:           'info',
  }
  return map[status] ?? 'info'
}

const scopeLabel = (scope: string) => {
  const map: Record<string, string> = {
    local:    '本地',
    city:     '全市',
    province: '全省',
    national: '全国',
  }
  return map[scope] ?? scope
}

const paymentMethodLabel = (method: string) => {
  if (method === 'online')  return '在线支付'
  if (method === 'manual')  return '手动转账'
  return '未支付'
}

// ── Fetch ───────────────────────────────────────────
const fetchAds = async () => {
  loading.value = true
  try {
    const res = await adsAdminApi.getAds(activeTab.value)
    ads.value = res.ads || []
  } catch (e: any) {
    ElMessage.error(e.message || '获取广告列表失败')
  } finally {
    loading.value = false
  }
}

const switchTab = (tab: TabType) => {
  activeTab.value = tab
  fetchAds()
}

// ── Dialog ──────────────────────────────────────────
const openDetail = (ad: any) => {
  selectedAd.value     = ad
  showRejectForm.value = false
  rejectReason.value   = ''
  confirmAction.value  = null
  dialogVisible.value  = true
}

const resetDialog = () => {
  showRejectForm.value = false
  rejectReason.value   = ''
  confirmAction.value  = null
}

// ── Actions ─────────────────────────────────────────
const doReject = async () => {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写拒绝理由')
    return
  }
  processing.value = true
  try {
    await adsAdminApi.updateAd(selectedAd.value.id, 'rejected', rejectReason.value)
    ads.value = ads.value.filter(a => a.id !== selectedAd.value.id)
    ElMessage.success('已驳回该广告申请')
    dialogVisible.value = false
  } catch (e: any) {
    ElMessage.error(e.message || '驳回操作失败')
  } finally {
    processing.value = false
  }
}

const executeConfirm = async () => {
  if (!confirmAction.value || !selectedAd.value) return
  processing.value = true
  try {
    const action = confirmAction.value
    let newStatus = ''
    let msg = ''

    if (action === 'approve') {
      newStatus = 'unpaid'
      msg = '审核通过，已更新为"待支付"状态'
    } else if (action === 'online') {
      newStatus = 'active'
      msg = '广告已正式上线'
    } else if (action === 'offline') {
      newStatus = 'offline'
      msg = '广告已成功下架'
    }

    await adsAdminApi.updateAd(selectedAd.value.id, newStatus)
    ads.value = ads.value.filter(a => a.id !== selectedAd.value.id)
    ElMessage.success(msg)
    dialogVisible.value = false
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败，请重试')
  } finally {
    processing.value = false
    confirmAction.value = null
  }
}

onMounted(fetchAds)
</script>

<style scoped>
.ad-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.tab-btn {
  border: none !important;
  background: transparent !important;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
