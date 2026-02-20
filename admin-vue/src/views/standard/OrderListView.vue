<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-xl font-bold text-gray-800">标准服务订单</h1>
      <el-button @click="fetchData" :icon="Refresh">刷新</el-button>
    </div>

    <el-card>
      <!-- Filters -->
      <div class="flex gap-4 mb-4">
        <el-select v-model="filters.status" placeholder="订单状态" clearable @change="fetchData">
          <el-option label="全部" value="" />
          <el-option label="待确认" value="pending" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-input v-model="filters.keyword" placeholder="搜索订单号/用户" clearable @clear="fetchData" @keyup.enter="fetchData" style="width: 200px" />
        <el-button type="primary" @click="fetchData">搜索</el-button>
      </div>

      <el-table :data="orders" v-loading="loading" stripe>
        <el-table-column prop="order_no" label="订单号" width="160" />
        <el-table-column label="用户" min-width="150">
          <template #default="{ row }">
            <div>{{ row.user?.name || '-' }}</div>
            <div class="text-xs text-gray-400">{{ row.user?.email }}</div>
          </template>
        </el-table-column>
        <el-table-column label="服务商" min-width="150">
          <template #default="{ row }">
            <div>{{ row.provider?.company_name || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="service_name" label="服务名称" min-width="150" />
        <el-table-column prop="total_amount" label="订单金额" width="100">
          <template #default="{ row }">
            ¥{{ row.total_amount || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { adminSubmissionsApi } from '../../services/api'

const router = useRouter()
const loading = ref(false)
const orders = ref<any[]>([])
const page = ref(1)
const pageSize = 20
const total = ref(0)
const filters = reactive({
  status: '',
  keyword: ''
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await adminSubmissionsApi.getStandardOrders({
      page: page.value,
      size: pageSize,
      status: filters.status,
      keyword: filters.keyword
    })
    orders.value = res.orders || []
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
    confirmed: 'info',
    in_progress: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const viewDetail = (row: any) => {
  router.push(`/dashboard/requests/${row.id}`)
}
</script>
