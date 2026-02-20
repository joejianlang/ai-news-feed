<template>
  <div class="provider-orders">
    <el-tabs v-model="activeTab" class="bg-white p-4 rounded-lg shadow-sm">
      <!-- Tab 1: Order Hall -->
      <el-tab-pane label="接单大厅" name="hall">
        <div class="flex justify-between items-center mb-4">
          <div class="text-sm text-gray-500">发现附近的优质需求，即刻接单赚钱。</div>
          <el-button type="primary" plain @click="refreshList">刷新列表</el-button>
        </div>
        
        <el-table :data="availableOrders" v-loading="loading" style="width: 100%">
          <el-table-column prop="title" label="服务需求" min-width="200">
            <template #default="{ row }">
              <div class="font-bold">{{ row.title }}</div>
              <div class="text-xs text-gray-500">{{ row.category }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="location" label="地点" width="180" />
          <el-table-column prop="date" label="预约时间" width="180" />
          <el-table-column prop="price" label="预计收入" width="120">
            <template #default="{ row }">
              <span class="text-orange-500 font-bold">${{ row.price }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleAccept(row)">抢单</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Tab 2: My Orders -->
      <el-tab-pane label="我的订单" name="mine">
        <el-table :data="myOrders" style="width: 100%">
          <el-table-column prop="id" label="订单号" width="160" />
          <el-table-column prop="title" label="服务内容" min-width="200" />
          <el-table-column prop="customer" label="客户" width="120" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === 'pending'" type="success" text size="small">开始服务</el-button>
              <el-button v-if="row.status === 'in_progress'" type="primary" text size="small">完成订单</el-button>
              <el-button link size="small">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('hall')
const loading = ref(false)

// Mock Data for Order Hall
const availableOrders = ref([
  { id: 1, title: '全屋深度保洁 (3室2卫)', category: '家庭保洁', location: 'Markham, ON', date: '2024-03-22 14:00', price: '180.00' },
  { id: 2, title: '紧急水管维修', category: '管道疏通', location: 'Scarborough, ON', date: '2024-03-21 19:00', price: '120.00' },
  { id: 3, title: '草坪修剪服务', category: '庭院维护', location: 'Richmond Hill, ON', date: '2024-03-23 10:00', price: '90.00' },
])

// Mock Data for My Orders
const myOrders = ref([
  { id: 'ORD-001', title: '厨房油烟机清洗', customer: '张女士', status: 'pending' },
  { id: 'ORD-002', title: '搬家服务 (小型)', customer: 'Mike', status: 'in_progress' },
  { id: 'ORD-003', title: '定期保洁 (双周)', customer: '李先生', status: 'completed' },
])

const refreshList = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('列表已刷新')
  }, 800)
}

const handleAccept = (order: any) => {
  ElMessageBox.confirm(
    `确认接取 "${order.title}" 订单吗？\n预计收入: $${order.price}`,
    '抢单确认',
    {
      confirmButtonText: '立即抢单',
      cancelButtonText: '再看看',
      type: 'warning',
    }
  ).then(() => {
    ElMessage.success('抢单成功！请尽快联系客户。')
    // Remove from available, add to mine (logic omitted for mock)
    availableOrders.value = availableOrders.value.filter(o => o.id !== order.id)
    activeTab.value = 'mine'
  })
}

const getStatusType = (status: string) => {
  const map: any = { pending: 'warning', in_progress: 'primary', completed: 'success' }
  return map[status] || 'info'
}

const getStatusLabel = (status: string) => {
  const map: any = { pending: '待服务', in_progress: '服务中', completed: '已完成' }
  return map[status] || status
}
</script>
