<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-xl font-bold text-gray-800">标准服务审核管理</h1>
        <p class="text-sm text-gray-500 mt-1">服务全生命周期跟踪与审核</p>
      </div>
      <el-button @click="fetchData" :icon="Refresh">刷新</el-button>
    </div>

    <!-- Status Filter Tabs -->
    <div class="mb-4">
      <el-radio-group v-model="statusFilter" @change="fetchData">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button value="draft">草稿</el-radio-button>
        <el-radio-button value="pending">待审核</el-radio-button>
        <el-radio-button value="approved">已通过</el-radio-button>
        <el-radio-button value="published">已上架</el-radio-button>
        <el-radio-button value="rejected">已驳回</el-radio-button>
        <el-radio-button value="unpublished">已下架</el-radio-button>
      </el-radio-group>
    </div>

    <el-card>
      <el-table :data="applications" v-loading="loading" stripe>
        <el-table-column label="服务标识" width="180">
          <template #default="{ row }">
            <div class="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
              {{ row.service_identity_id || row.serviceIdentityId || '-' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="服务商" min-width="150">
          <template #default="{ row }">
            <div>{{ row.provider?.company_name || row.user?.name || '-' }}</div>
            <div class="text-xs text-gray-400">{{ row.user?.email }}</div>
          </template>
        </el-table-column>
        <el-table-column label="服务标题" min-width="200">
          <template #default="{ row }">
            <div class="font-medium">{{ getField(row, 'title') || row.template_name || '-' }}</div>
            <div class="text-xs text-gray-400">{{ row.category || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="120">
          <template #default="{ row }">
            <span class="text-emerald-600 font-medium">${{ getField(row, 'price') || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.listing_status || row.status)">
              {{ getStatusLabel(row.listing_status || row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <el-button size="small" @click="viewHistory(row)" type="info" plain>历史</el-button>
            <template v-if="row.listing_status === 'pending' || row.status === 'pending'">
              <el-button size="small" type="primary" @click="handleApprove(row)">通过</el-button>
              <el-button size="small" type="danger" @click="openRejectDialog(row)">驳回</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <!-- Detail Dialog -->
    <el-dialog v-model="showDetailDialog" title="服务详情" width="750px" destroy-on-close>
      <div v-if="currentItem" class="space-y-4">
        <!-- Service Identity -->
        <div class="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <el-icon class="text-blue-500"><Document /></el-icon>
            <span class="font-medium text-blue-700">服务唯一标识</span>
          </div>
          <div class="font-mono text-lg">{{ currentItem.service_identity_id || currentItem.serviceIdentityId || '未分配' }}</div>
          <div class="text-xs text-gray-500 mt-1">此 ID 在服务全生命周期中保持不变</div>
        </div>

        <!-- Basic Info -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-gray-500 text-sm">服务商</label>
            <div class="font-medium">{{ currentItem.provider?.company_name || currentItem.user?.name }}</div>
            <div class="text-xs text-gray-400">{{ currentItem.user?.email }}</div>
          </div>
          <div>
            <label class="text-gray-500 text-sm">当前状态</label>
            <div>
              <el-tag :type="getStatusType(currentItem.listing_status || currentItem.status)" size="large">
                {{ getStatusLabel(currentItem.listing_status || currentItem.status) }}
              </el-tag>
            </div>
          </div>
          <div>
            <label class="text-gray-500 text-sm">服务标题</label>
            <div class="font-medium">{{ getField(currentItem, 'title') || currentItem.template_name || '-' }}</div>
          </div>
          <div>
            <label class="text-gray-500 text-sm">服务分类</label>
            <div class="font-medium">{{ currentItem.category || '-' }}</div>
          </div>
        </div>

        <el-divider />

        <!-- Service Details -->
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="text-gray-500 text-sm">价格</label>
            <div class="font-medium text-emerald-600">${{ getField(currentItem, 'price') || '-' }} / {{ getUnitLabel(getField(currentItem, 'unit')) }}</div>
          </div>
          <div>
            <label class="text-gray-500 text-sm">服务方式</label>
            <div class="font-medium">{{ getModeLabel(getField(currentItem, 'service_mode')) }}</div>
          </div>
          <div>
            <label class="text-gray-500 text-sm">定金比例</label>
            <div class="font-medium">{{ getField(currentItem, 'deposit_ratio') || 20 }}%</div>
          </div>
        </div>

        <!-- Description -->
        <div v-if="getField(currentItem, 'description')">
          <label class="text-gray-500 text-sm block mb-1">服务描述</label>
          <div class="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">{{ getField(currentItem, 'description') }}</div>
        </div>

        <!-- Images -->
        <div v-if="getImages(currentItem).length > 0">
          <label class="text-gray-500 text-sm block mb-2">服务图片</label>
          <div class="flex flex-wrap gap-2">
            <el-image
              v-for="(img, idx) in getImages(currentItem)"
              :key="idx"
              :src="img"
              :preview-src-list="getImages(currentItem)"
              :initial-index="idx"
              fit="cover"
              class="w-24 h-24 rounded-lg border cursor-pointer"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <template v-if="currentItem?.listing_status === 'pending' || currentItem?.status === 'pending'">
          <el-button type="primary" @click="handleApprove(currentItem)">通过</el-button>
          <el-button type="danger" @click="openRejectDialog(currentItem)">驳回</el-button>
        </template>
      </template>
    </el-dialog>

    <!-- Reject Dialog with Categories -->
    <el-dialog v-model="showRejectDialog" title="驳回服务申请" width="500px">
      <div class="space-y-4">
        <div>
          <label class="text-sm font-medium text-gray-700 block mb-2">驳回原因分类 <span class="text-red-500">*</span></label>
          <el-radio-group v-model="rejectForm.category" class="flex flex-col gap-2">
            <el-radio v-for="cat in rejectionCategories" :key="cat.value" :value="cat.value">
              {{ cat.label }}
            </el-radio>
          </el-radio-group>
        </div>
        <div>
          <label class="text-sm font-medium text-gray-700 block mb-2">详细说明</label>
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入具体的驳回原因，以帮助服务商改进..."
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmReject" :disabled="!rejectForm.category">确认驳回</el-button>
      </template>
    </el-dialog>

    <!-- History Dialog -->
    <el-dialog v-model="showHistoryDialog" title="操作历史" width="600px">
      <div v-if="historyLoading" class="flex justify-center py-8">
        <el-icon class="is-loading text-2xl"><Loading /></el-icon>
      </div>
      <div v-else-if="auditHistory.length === 0" class="text-center py-8 text-gray-400">
        暂无操作记录
      </div>
      <el-timeline v-else>
        <el-timeline-item
          v-for="item in auditHistory"
          :key="item.id"
          :timestamp="formatDate(item.created_at)"
          :type="getTimelineType(item.action)"
          placement="top"
        >
          <div class="bg-gray-50 p-3 rounded-lg">
            <div class="flex items-center justify-between mb-1">
              <span class="font-medium">{{ getActionLabel(item.action) }}</span>
              <el-tag :type="getStatusType(item.new_status)" size="small" v-if="item.new_status">
                {{ getStatusLabel(item.new_status) }}
              </el-tag>
            </div>
            <div class="text-sm text-gray-500">
              <span>操作人: {{ item.actor_name || item.actor_role || '系统' }}</span>
            </div>
            <div v-if="item.reason" class="text-sm mt-2 p-2 bg-yellow-50 rounded">
              <span class="font-medium">原因:</span> {{ item.reason }}
              <span v-if="item.reason_category" class="text-gray-400 ml-2">({{ item.reason_category }})</span>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Refresh, Document, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminSubmissionsApi, serviceLifecycleApi } from '../../services/api'

const loading = ref(false)
const applications = ref<any[]>([])
const page = ref(1)
const pageSize = 20
const total = ref(0)
const statusFilter = ref('')

const showDetailDialog = ref(false)
const showRejectDialog = ref(false)
const showHistoryDialog = ref(false)
const currentItem = ref<any>(null)
const historyLoading = ref(false)
const auditHistory = ref<any[]>([])

// Predefined rejection categories
const rejectionCategories = [
  { value: 'qualification', label: '资质不全 - 缺少必要的认证或资质文件' },
  { value: 'content', label: '内容不合规 - 描述包含违禁或不当内容' },
  { value: 'pricing', label: '价格异常 - 定价不合理或与市场差异过大' },
  { value: 'description', label: '描述不清晰 - 服务内容描述不完整或模糊' },
  { value: 'images', label: '图片问题 - 图片不清晰、不相关或侵权' },
  { value: 'duplicate', label: '重复提交 - 与已有服务重复' },
  { value: 'other', label: '其他原因' }
]

const rejectForm = ref({
  category: '',
  reason: ''
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await adminSubmissionsApi.getListingApplications({
      page: page.value,
      size: pageSize,
      type: 'standard',
      status: statusFilter.value || undefined
    })
    applications.value = res.submissions || []
    total.value = res.total || 0
  } catch (e: any) {
    ElMessage.error(e.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

// Helper functions
const formatDate = (date: string) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    draft: 'info',
    pending: 'warning',
    approved: 'success',
    published: 'success',
    rejected: 'danger',
    unpublished: 'info',
    archived: 'info'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    draft: '草稿',
    pending: '待审核',
    approved: '已通过',
    published: '已上架',
    rejected: '已驳回',
    unpublished: '已下架',
    archived: '已归档'
  }
  return map[status] || status
}

const getField = (item: any, key: string) => {
  if (!item) return null
  return item.form_data?.[key] ?? item[key] ?? null
}

const getImages = (item: any): string[] => {
  if (!item) return []
  const images = item.form_data?.images || item.images || []
  return Array.isArray(images) ? images.filter(Boolean) : []
}

const getUnitLabel = (unit: string) => {
  const map: Record<string, string> = {
    per_service: '次',
    per_hour: '小时',
    per_sqft: '平方英尺',
    per_room: '房间'
  }
  return map[unit] || unit || '次'
}

const getModeLabel = (mode: string) => {
  const map: Record<string, string> = {
    offline: '上门服务',
    remote: '远程服务',
    store: '到店服务'
  }
  return map[mode] || mode || '上门服务'
}

const viewDetail = (row: any) => {
  currentItem.value = row
  showDetailDialog.value = true
}

const openRejectDialog = (row: any) => {
  currentItem.value = row
  rejectForm.value = { category: '', reason: '' }
  showRejectDialog.value = true
  showDetailDialog.value = false
}

const handleApprove = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定通过此服务上架申请?', '确认通过')
    await adminSubmissionsApi.approveListingApplication(row.id, row.source)
    ElMessage.success('已通过')
    showDetailDialog.value = false
    fetchData()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '操作失败')
    }
  }
}

const confirmReject = async () => {
  if (!rejectForm.value.category) {
    ElMessage.warning('请选择驳回原因分类')
    return
  }
  
  try {
    const categoryLabel = rejectionCategories.find(c => c.value === rejectForm.value.category)?.label || ''
    const fullReason = `[${categoryLabel.split(' - ')[0]}] ${rejectForm.value.reason || ''}`
    
    await adminSubmissionsApi.rejectListingApplication(
      currentItem.value.id, 
      fullReason, 
      currentItem.value.source
    )
    ElMessage.success('已驳回')
    showRejectDialog.value = false
    showDetailDialog.value = false
    fetchData()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

// History related
const viewHistory = async (row: any) => {
  currentItem.value = row
  showHistoryDialog.value = true
  historyLoading.value = true
  
  try {
    // Call real API if service has an ID
    if (row.id) {
      const res = await serviceLifecycleApi.getServiceHistory(row.id)
      auditHistory.value = res.history || []
    } else {
      // Fallback to mock data for items without DB ID
      auditHistory.value = [
        {
          id: '1',
          action: 'created',
          new_status: 'pending',
          actor_name: row.user?.name || '服务商',
          created_at: row.created_at
        }
      ]
    }
  } catch (e: any) {
    console.error('Get history error:', e)
    // Show placeholder on error
    auditHistory.value = []
  } finally {
    historyLoading.value = false
  }
}

const getTimelineType = (action: string) => {
  const map: Record<string, string> = {
    created: 'primary',
    submitted: 'warning',
    approved: 'success',
    published: 'success',
    rejected: 'danger',
    unpublished: 'info',
    edited: 'primary',
    resubmitted: 'warning'
  }
  return map[action] || 'primary'
}

const getActionLabel = (action: string) => {
  const map: Record<string, string> = {
    created: '创建服务',
    submitted: '提交审核',
    approved: '审核通过',
    published: '上架',
    rejected: '审核驳回',
    unpublished: '下架',
    edited: '编辑修改',
    resubmitted: '重新提交'
  }
  return map[action] || action
}
</script>
