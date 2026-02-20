<template>
  <div class="p-6">
    <!-- Breadcrumb -->
    <el-breadcrumb separator="/" class="mb-4">
      <el-breadcrumb-item :to="{ path: '/dashboard' }">控制台</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/dashboard/requests' }">需求管理</el-breadcrumb-item>
      <el-breadcrumb-item>需求详情</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Info -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Basic Info Card -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div class="flex justify-between items-start mb-6">
            <div>
              <h2 class="text-xl font-bold text-gray-800">{{ request.service }}</h2>
              <p class="text-gray-500 mt-1">需求编号: {{ request.id }}</p>
            </div>
            <el-tag v-if="request.status" :type="getStatusType(request.status)" size="large">{{ request.statusText || request.status }}</el-tag>
          </div>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="预约日期">{{ request.date }}</el-descriptions-item>
            <el-descriptions-item label="提交时间">{{ request.createdAt }}</el-descriptions-item>
            
            <!-- Dynamic Details -->
            <el-descriptions-item 
              v-for="item in displayDetails" 
              :key="item.label" 
              :label="item.label"
              :span="item.fullWidth ? 2 : 1"
            >
              {{ item.value }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- Timeline -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">处理进度</h3>
          <el-timeline>
            <el-timeline-item 
              v-for="(event, idx) in timeline" 
              :key="idx"
              :timestamp="event.time"
              :type="event.type"
              placement="top"
            >
              <div class="font-medium">{{ event.title }}</div>
              <div class="text-gray-500 text-sm">{{ event.desc }}</div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>

      <!-- Side Panel -->
      <div class="space-y-6">
        <!-- User Info -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">用户信息</h3>
          <div class="flex items-center gap-4 mb-4">
            <el-avatar :size="48" class="bg-blue-500">{{ request.user.charAt(0) }}</el-avatar>
            <div>
              <p class="font-bold text-gray-800">{{ request.user }}</p>
              <p class="text-gray-500 text-sm">{{ request.phone }}</p>
            </div>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">历史订单</span>
              <span class="text-gray-800">{{ request.userOrders }} 单</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">注册时间</span>
              <span class="text-gray-800">{{ request.userSince }}</span>
            </div>
          </div>
          <el-button class="w-full mt-4" @click="contactUser">联系用户</el-button>
        </div>

        <!-- Provider Info -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">服务商信息</h3>
          <div v-if="request.provider" class="flex items-center gap-4 mb-4">
            <el-avatar :size="48" class="bg-emerald-500">{{ request.provider.name.charAt(0) }}</el-avatar>
            <div>
              <p class="font-bold text-gray-800">{{ request.provider.name }}</p>
              <div class="flex items-center gap-1 text-yellow-500">
                <el-icon><Star /></el-icon>
                <span class="text-sm">{{ request.provider.rating }}</span>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-4 text-gray-400">
            <el-icon :size="32" class="mb-2"><User /></el-icon>
            <p>暂未分配服务商</p>
          </div>
          <el-button type="primary" class="w-full mt-4" @click="showAssignDialog = true">
            {{ request.provider ? '重新派单' : '分配服务商' }}
          </el-button>
        </div>

        <!-- Actions -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">操作</h3>
          <div class="space-y-3">
            <el-button type="success" class="w-full" v-if="request.status === 'in_progress'">标记完成</el-button>
            <el-button class="w-full" @click="addNote">添加备注</el-button>
            <el-button type="danger" class="w-full" plain v-if="request.status === 'pending'">取消需求</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign Dialog -->
    <el-dialog v-model="showAssignDialog" title="分配服务商" width="500px">
      <el-select v-model="selectedProvider" placeholder="请选择服务商" style="width: 100%">
        <el-option 
          v-for="p in availableProviders" 
          :key="p.id" 
          :label="`${p.name} (${p.rating}★)`" 
          :value="p.id" 
        />
      </el-select>
      <template #footer>
        <el-button @click="showAssignDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Star, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { submissionsApi, usersApi } from '../../services/api'

const route = useRoute()
const requestId = route.params.id

// Data State
const request = ref<any>({
  id: '',
  service: '',
  status: '',
  statusText: '',
  date: '',
  createdAt: '',
  fromAddress: '',
  toAddress: '',
  itemsDesc: '',
  user: '',
  phone: '',
  userOrders: 0,
  userSince: '',
  provider: null
})

const timeline = ref<any[]>([])
const showAssignDialog = ref(false)
const selectedProvider = ref('')
const availableProviders = ref<any[]>([])

const displayDetails = computed(() => {
    if (!request.value.formData) return []
    const data = request.value.formData
    const details = []
    
    const LABEL_MAP: Record<string, string> = {
        'from_address': '出发地址',
        'to_address': '目的地址',
        'address': '详细地址',
        'pickup_location': '接送地点',
        'pickup_address': '接送地址',
        'destination': '目的地点',
        'from_floor': '出发楼层',
        'to_floor': '目的楼层',
        'items': '物品描述',
        'description': '详情描述',
        'notes': '备注说明',
        'flight_no': '航班号',
        'passenger_count': '乘机人数',
        'luggage_count': '行李件数',
        'car_type': '车型要求',
        'service_time': '服务时间',
        'pickup_time': '接送时间',
        'estimated_price': '预估价格'
    }

    // Filter and map fields
    for (const key in data) {
        if (key.startsWith('_')) continue // Ignore internal fields
        const val = data[key]
        if (!val) continue

        // Handled in header/basic already
        if (['service_date', 'move_date', 'date', 'service_type', 'pickup_date', 'time', 'service_time'].includes(key)) {
            // But if it's a rich field and we don't have a date yet, we might want to skip only if already displayed
            // Actually, if it's in the top summary, don't show in list
            if (request.value.date !== '-' && ['service_date', 'move_date', 'date', 'pickup_date'].includes(key)) continue
        }
        
        let label = LABEL_MAP[key] || key
        let displayVal = val

        // Handle "Rich Field" (Object with label/value)
        if (typeof val === 'object' && val !== null) {
            if (val.label) label = val.label
            displayVal = val.displayValue || val.value || JSON.stringify(val)
        }

        // Avoid duplicate "Reservation Date" if it's already in the header
        if (label === '日期' || label === '预约日期') {
            if (request.value.date !== '-' && request.value.date === displayVal) continue
        }

        details.push({
            label: label,
            value: displayVal,
            fullWidth: ['出发地址', '目的地址', '详细地址', '接送地点', '接送地址', '目的地点', '物品描述', '详情描述', '备注说明', '行李描述'].includes(label) || key.includes('address') || key.includes('notes')
        })
    }
    
    return details
})

// Fetch Logic
const fetchRequest = async () => {
    try {
        const res = await submissionsApi.getById(requestId as string)
        const s = res.submission
        const formData = s.form_data || {}
        
        // Helper to find date in rich fields if standard keys missing
        let foundDate = formData.service_date || formData.move_date || formData.date || formData.pickup_date
        if (!foundDate) {
            for (const k in formData) {
                const v = formData[k]
                if (typeof v === 'object' && v?.label?.includes('日期')) {
                    foundDate = v.displayValue || v.value
                    break
                }
            }
        }

        request.value = {
            id: s.id.substring(0, 8).toUpperCase(),
            service: s.form_templates?.name || formData.service_type || '未知服务',
            status: s.status,
            statusText: getStatusText(s.status),
            date: foundDate || '-',
            createdAt: new Date(s.created_at).toLocaleString(),
            user: s.user_name || s.user_email || '未知用户',
            phone: s.user_phone || '-',
            userOrders: 0,
            userSince: new Date(s.user_created_at || s.created_at).toLocaleDateString(),
            provider: s.assigned_provider_id ? {
                id: s.assigned_provider_id,
                name: '服务商 ' + s.assigned_provider_id.substring(0,4),
                rating: 5.0
            } : null,
            formData: formData
        }

        // Basic Timeline (Simulation based on status)
        timeline.value = [
            { time: new Date(s.created_at).toLocaleString(), title: '需求提交', desc: '用户提交了需求', type: 'success' }
        ]
        if (s.status !== 'pending') {
             timeline.value.push({ time: '-', title: getStatusText(s.status), desc: '订单状态变更', type: 'primary' })
        }
    } catch (error) {
        console.error(error)
        ElMessage.error('获取需求详情失败')
    }
}

const fetchProviders = async () => {
    try {
        const res = await usersApi.getAll({ role: 'provider', status: 'active', size: 50 })
        availableProviders.value = res.users.map(u => ({
            id: u.id,
            name: u.name || u.email,
            rating: 5.0
        }))
    } catch (error) {
         console.error(error)
    }
}

const getStatusText = (status: string) => {
    const map: Record<string, string> = {
        pending: '待处理',
        assigned: '已分配',
        processing: '进行中',
        completed: '已完成',
        cancelled: '已取消'
    }
    return map[status] || status
}

const getStatusType = (status: string): 'warning' | 'primary' | 'success' | 'info' | 'danger' | undefined => {
  const map: Record<string, 'warning' | 'primary' | 'success' | 'info' | 'danger'> = {
    pending: 'warning',
    assigned: 'primary',
    in_progress: 'primary',
    processing: 'primary',
    completed: 'success',
    cancelled: 'info'
  }
  return map[status] ?? undefined
}

const confirmAssign = async () => {
    if (!selectedProvider.value) return
    try {
        await submissionsApi.updateStatus(requestId as string, 'assigned', selectedProvider.value) 
        ElMessage.success('已成功指派服务商')
        showAssignDialog.value = false
        fetchRequest()
    } catch (error: any) {
        ElMessage.error(error.message || '操作失败')
    }
}

const contactUser = () => ElMessage.info('功能开发中')
const addNote = () => ElMessage.info('功能开发中')

onMounted(() => {
    fetchRequest()
    fetchProviders()
})
</script>
