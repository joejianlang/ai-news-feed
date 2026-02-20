<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-xl font-bold text-gray-800">标准服务申请上架</h1>
      <el-button @click="fetchData" :icon="Refresh">刷新</el-button>
    </div>

    <el-card>
      <el-table :data="applications" v-loading="loading" stripe>
        <el-table-column prop="created_at" label="申请时间" width="180">
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
        <el-table-column prop="template_name" label="服务模板" min-width="150" />
        <el-table-column prop="category" label="服务分类" width="120" />
        <el-table-column label="服务详情" min-width="200">
          <template #default="{ row }">
            <div class="text-sm text-gray-600 truncate">
              {{ getServiceSummary(row.form_data) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.listing_status)">{{ getStatusLabel(row.listing_status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">查看详情</el-button>
            <template v-if="row.listing_status === 'pending'">
              <el-button size="small" type="primary" @click="handleApprove(row)">通过</el-button>
              <el-button size="small" type="danger" @click="handleReject(row)">拒绝</el-button>
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
    <el-dialog v-model="showDetailDialog" title="服务详情" width="700px">
      <div v-if="currentItem" class="space-y-4">
        <!-- Basic Info -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-gray-500 text-sm">服务商</label>
            <div class="font-medium">{{ currentItem.provider?.company_name || currentItem.user?.name }}</div>
            <div class="text-xs text-gray-400">{{ currentItem.user?.email }}</div>
          </div>
          <div>
            <label class="text-gray-500 text-sm">申请时间</label>
            <div class="font-medium">{{ formatDate(currentItem.created_at) }}</div>
          </div>
          <div>
            <label class="text-gray-500 text-sm">服务标题</label>
            <div class="font-medium">{{ getField('title') || currentItem.template_name || '-' }}</div>
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
            <div class="font-medium text-emerald-600">${{ getField('price') || '-' }} / {{ getUnitLabel(getField('unit')) }}</div>
          </div>
          <div>
            <label class="text-gray-500 text-sm">服务方式</label>
            <div class="font-medium">{{ getModeLabel(getField('service_mode')) }}</div>
          </div>
          <div>
            <label class="text-gray-500 text-sm">定金比例</label>
            <div class="font-medium">{{ getField('deposit_ratio') || 20 }}%</div>
          </div>
        </div>

        <!-- Description -->
        <div v-if="getField('description')">
          <label class="text-gray-500 text-sm block mb-1">服务描述</label>
          <div class="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">{{ getField('description') }}</div>
        </div>

        <!-- Images -->
        <div v-if="getImages().length > 0">
          <label class="text-gray-500 text-sm block mb-2">服务图片</label>
          <div class="flex flex-wrap gap-2">
            <el-image
              v-for="(img, idx) in getImages()"
              :key="idx"
              :src="img"
              :preview-src-list="getImages()"
              :initial-index="idx"
              fit="cover"
              class="w-24 h-24 rounded-lg border cursor-pointer"
            />
          </div>
        </div>

        <!-- Add-ons -->
        <div v-if="getAddOns().length > 0">
          <label class="text-gray-500 text-sm block mb-1">附加服务</label>
          <div class="bg-gray-50 p-3 rounded text-sm">
            <div v-for="(addon, idx) in getAddOns()" :key="idx" class="flex justify-between py-1">
              <span>{{ addon.name }}</span>
              <span class="text-emerald-600">${{ addon.price }}</span>
            </div>
          </div>
        </div>

        <!-- Raw Data (Collapsed) -->
        <el-collapse>
          <el-collapse-item title="原始数据 (JSON)" name="raw">
            <pre class="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">{{ JSON.stringify(currentItem.form_data, null, 2) }}</pre>
          </el-collapse-item>
        </el-collapse>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <template v-if="currentItem?.listing_status === 'pending'">
          <el-button type="primary" @click="handleApprove(currentItem)">通过</el-button>
          <el-button type="danger" @click="handleReject(currentItem)">拒绝</el-button>
        </template>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminSubmissionsApi } from '../../services/api'

const loading = ref(false)
const applications = ref<any[]>([])
const page = ref(1)
const pageSize = 20
const total = ref(0)
const showDetailDialog = ref(false)
const currentItem = ref<any>(null)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await adminSubmissionsApi.getListingApplications({
      page: page.value,
      size: pageSize,
      type: 'standard'
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

const formatDate = (date: string) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return map[status] || status
}

const getServiceSummary = (formData: any) => {
  if (!formData) return '-'
  const keys = Object.keys(formData).slice(0, 3)
  return keys.map(k => `${k}: ${formData[k]}`).join(', ')
}

const viewDetail = (row: any) => {
  currentItem.value = row
  showDetailDialog.value = true
}

// Helper functions for detail view
const getField = (key: string) => {
  if (!currentItem.value) return null
  // Check form_data first (for transformed data), then direct fields (for provider_services)
  return currentItem.value.form_data?.[key] ?? currentItem.value[key] ?? null
}

const getImages = (): string[] => {
  if (!currentItem.value) return []
  // Check form_data.images, then direct images field
  const images = currentItem.value.form_data?.images || currentItem.value.images || []
  return Array.isArray(images) ? images.filter(Boolean) : []
}

const getAddOns = (): { name: string; price: number }[] => {
  if (!currentItem.value) return []
  const addOns = currentItem.value.form_data?.add_ons || currentItem.value.add_ons || []
  return Array.isArray(addOns) ? addOns : []
}

const getUnitLabel = (unit: string) => {
  const map: Record<string, string> = {
    per_service: '次',
    per_hour: '小时',
    per_sqft: '平方英尺',
    per_room: '房间',
    per_person: '人',
    per_case: '单'
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

const handleReject = async (row: any) => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝申请', {
      inputPlaceholder: '请输入原因...'
    })
    await adminSubmissionsApi.rejectListingApplication(row.id, reason, row.source)
    ElMessage.success('已拒绝')
    showDetailDialog.value = false
    fetchData()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '操作失败')
    }
  }
}
</script>
