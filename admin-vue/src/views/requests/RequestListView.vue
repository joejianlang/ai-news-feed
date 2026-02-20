<template>
  <div class="p-6">
    <!-- Page Header -->
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">需求管理</h1>
        <p class="text-gray-500 mt-1">管理所有用户提交的服务需求</p>
      </div>
      <el-button type="primary" @click="exportData">
        <el-icon class="mr-1"><Download /></el-icon>
        导出数据
      </el-button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <el-input v-model="filters.keyword" placeholder="搜索编号/用户名" clearable>
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filters.service" placeholder="服务类型" clearable>
          <el-option label="搬家服务" value="搬家服务" />
          <el-option label="家庭清洁" value="家庭清洁" />
          <el-option label="接机服务" value="接机服务" />
          <el-option label="家电维修" value="家电维修" />
          <el-option label="装修服务" value="装修服务" />
        </el-select>
        <el-select v-model="filters.status" placeholder="状态" clearable>
          <el-option label="待处理" value="pending" />
          <el-option label="已派单" value="assigned" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-date-picker 
          v-model="filters.dateRange" 
          type="daterange" 
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 100%"
        />
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <el-table :data="requests" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="需求编号" width="120" fixed />
        <el-table-column prop="service" label="服务类型" width="120" />
        <el-table-column prop="user" label="用户信息" width="150">
          <template #default="{ row }">
            <div>
              <p class="font-medium text-gray-800">{{ row.user }}</p>
              <p class="text-gray-400 text-xs">{{ row.phone }}</p>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="服务地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="date" label="预约时间" width="120" />
        <el-table-column prop="createdAt" label="提交时间" width="160" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status" :type="getStatusType(row.status)" size="small">{{ row.statusText || row.status }}</el-tag>
            <span v-else class="text-gray-400 text-xs">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="provider" label="服务商" width="120">
          <template #default="{ row }">
            <span v-if="row.provider">{{ row.provider }}</span>
            <span v-else class="text-gray-400">未分配</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="180">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">查看</el-button>
            <el-button type="success" link size="small" @click="assignProvider(row)" v-if="row.status === 'pending'">派单</el-button>
            <el-button type="danger" link size="small" @click="cancelRequest(row)" v-if="row.status === 'pending'">取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="p-4 flex justify-end border-t border-gray-100">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>

    <!-- Assign Provider Dialog -->
    <el-dialog v-model="showAssignDialog" title="分配服务商" width="500px">
      <el-form label-width="80px">
        <el-form-item label="服务商">
          <el-select v-model="selectedProvider" placeholder="请选择服务商" style="width: 100%">
            <el-option 
              v-for="p in availableProviders" 
              :key="p.id" 
              :label="`${p.name} (${p.rating}★)`" 
              :value="p.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="assignNote" type="textarea" rows="3" placeholder="填写派单备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAssignDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign">确认派单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Download } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { submissionsApi, usersApi } from '../../services/api'

const router = useRouter()
const loading = ref(false)

const filters = reactive({
  keyword: '',
  service: '',
  status: '',
  dateRange: null as any
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 128
})

// Mock Data
const requests = ref<any[]>([])

const fetchRequests = async () => {
    loading.value = true
    try {
        const res = await submissionsApi.getAll({
            page: pagination.page,
            size: pagination.size,
            status: filters.status || undefined
            // Note: service filter currently requires templateId which we don't have mapping for yet in this view without fetching templates.
            // Leaving service filter ineffective for API for now unless backend supports filtering by template name.
        })
        requests.value = res.submissions.map((s: any) => {
            const formData = s.form_data || {}
            return {
                id: formData._order_no || s.id.substring(0, 8).toUpperCase(),
                service: s.form_templates?.name || '未知服务',
                user: s.user_name || '未知用户',
                phone: s.user_email || '-', // Email as fallback
                address: formData.address || formData.from_address || formData.company_address || '-',
                date: formData.service_date || formData.move_date || '-',
                createdAt: new Date(s.created_at).toLocaleString(),
                status: s.status,
                statusText: getStatusText(s.status),
                provider: s.assigned_provider_id ? '已分配' : null,
                raw: s
            }
        })
        pagination.total = res.total
    } catch (e) {
        console.error(e)
        ElMessage.error('获取需求列表失败')
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchRequests()
})


const showAssignDialog = ref(false)
const selectedProvider = ref('')
const assignNote = ref('')
const currentRequest = ref<any>(null)

const availableProviders = ref<any[]>([])

const fetchProviders = async (serviceCategory?: string) => {
  try {
    const res = await usersApi.getAll({
        role: 'provider',
        status: 'active',
        size: 100 // Fetch reasonably large number for dropdown
    })
    
    // Map to dropdown format
    let providers = res.users.map(u => ({
        id: u.id,
        name: u.name || u.email,
        rating: u.provider_profiles?.rating || 5.0,
        categories: u.provider_profiles?.service_categories || []
    }))

    // Optional: Front-end filtering if serviceCategory is known
    if (serviceCategory && serviceCategory !== '未知服务') {
        // Sort providers: those who have the category come first
        providers.sort((a, b) => {
            const aHas = a.categories.includes(serviceCategory) ? 1 : 0
            const bHas = b.categories.includes(serviceCategory) ? 1 : 0
            return bHas - aHas
        })
    }

    availableProviders.value = providers
  } catch (error) {
    console.error(error)
    ElMessage.error('获取服务商列表失败')
  }
}


// Helpers
const getStatusType = (status: string): 'warning' | 'primary' | 'success' | 'info' | 'danger' | undefined => {
  const map: Record<string, 'warning' | 'primary' | 'success' | 'info' | 'danger'> = {
    pending: 'warning',
    assigned: 'primary',
    in_progress: 'primary',
    completed: 'success',
    cancelled: 'info'
  }
  return map[status] ?? undefined
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    assigned: '已派单',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const viewDetail = (row: any) => {
  // Use the real UUID from raw data for navigation, not the shortened display ID
  const realId = row.raw?.id || row.id
  router.push(`/dashboard/requests/${realId}`)
}

const assignProvider = (row: any) => {
  currentRequest.value = row
  fetchProviders(row.service)
  showAssignDialog.value = true
}

const confirmAssign = async () => {
    if (!selectedProvider.value || !currentRequest.value) return
    
    try {
        await submissionsApi.updateStatus(
            currentRequest.value.raw?.id || currentRequest.value.id, 
            'assigned', 
            selectedProvider.value
        )
        ElMessage.success('派单成功')
        showAssignDialog.value = false
        selectedProvider.value = ''
        assignNote.value = ''
        fetchRequests()
    } catch (e: any) {
        ElMessage.error(e.message || '派单失败')
    }
}

const cancelRequest = (row: any) => {
  ElMessageBox.confirm('确定要取消该需求吗？', '确认取消', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('已取消')
  })
}

const exportData = () => {
  ElMessage.success('数据导出中...')
}
</script>
