<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="bg-white p-6 border-b border-gray-100 flex items-center justify-between mb-6">
      <div>
        <h2 class="text-lg font-bold text-gray-800">定制服务订单管理</h2>
        <p class="text-sm text-gray-500 mt-1">管理已成交的定制服务订单，跟进服务进度。</p>
      </div>
      
      <div class="flex items-center gap-4">
        <el-input prefix-icon="Search" placeholder="搜索订单号" class="w-64" />
        <el-select v-model="statusFilter" placeholder="订单状态" class="w-32">
            <el-option label="全部" value="all" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
        </el-select>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 px-6 overflow-y-auto">
      <div v-for="order in orders" :key="order.id" class="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
          <!-- Order Header -->
          <div class="bg-gray-50 px-6 py-3 flex items-center justify-between text-sm">
              <div class="flex items-center gap-4 text-gray-500">
                  <span class="font-mono">订单号: {{ order.orderId }}</span>
                  <span>创建时间: {{ order.createTime }}</span>
              </div>
              <div class="font-bold" :class="order.status === 'completed' ? 'text-green-600' : 'text-blue-600'">
                  {{ order.status === 'completed' ? '已完成' : '进行中' }}
              </div>
          </div>

          <!-- Order Body -->
          <div class="p-6 flex flex-col md:flex-row gap-6">
              <!-- Info -->
              <div class="flex-1">
                  <h3 class="text-lg font-bold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer">{{ order.title }}</h3>
                  <div class="grid grid-cols-2 gap-y-2 text-sm text-gray-600 mb-4">
                      <div>客户: {{ order.customerName }}</div>
                      <div>联系电话: {{ order.customerPhone }}</div>
                      <div class="col-span-2">服务地址: {{ order.address }}</div>
                  </div>
                  <div class="flex gap-2">
                       <el-tag size="small" type="info">定制服务</el-tag>
                       <el-tag size="small">全款: ¥{{ order.amount }}</el-tag>
                  </div>
              </div>

              <!-- Actions -->
              <div class="flex flex-col items-end justify-center min-w-[150px] space-y-2 border-l border-gray-100 pl-6 border-dashed md:border-solid">
                  <div class="text-xl font-bold text-orange-500 mb-2">¥ {{ order.amount.toFixed(2) }}</div>
                  <div class="flex flex-col gap-2 w-full">
                    <el-button type="primary" size="small" v-if="order.status !== 'completed'" @click="completeOrder(order)">完成订单</el-button>
                    <el-button size="small" @click="viewDetails(order)">查看详情</el-button>
                    <el-button size="small" text @click="contactCustomer(order)">联系客户</el-button>
                  </div>
              </div>
          </div>
      </div>
      
       <!-- Empty State -->
       <div v-if="orders.length === 0" class="flex flex-col items-center justify-center h-96 text-gray-400 bg-white rounded-xl shadow-sm">
            <el-icon :size="48" class="mb-4"><Document /></el-icon>
            <div>暂无定制订单</div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Search, Document } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const statusFilter = ref('all')

const orders = ref([
    {
        id: 1,
        orderId: 'ORD-20250812-777',
        title: '定制实木家具制作 (衣柜+书桌)',
        createTime: '2025-08-12 10:00',
        customerName: '李先生',
        customerPhone: '138****0000',
        address: '上海市浦东新区张江高科园区...',
        amount: 20000.00,
        status: 'in_progress'
    },
    {
        id: 2,
        orderId: 'ORD-20250720-888',
        title: '小庭院景观改造',
        createTime: '2025-07-20 09:00',
        customerName: '王女士',
        customerPhone: '139****1111',
        address: '上海市徐汇区衡山路...',
        amount: 8500.00,
        status: 'completed'
    }
])

const completeOrder = (order: any) => {
    ElMessageBox.confirm('确定要根据合同约定完成此订单吗？', '确认完成', { type: 'success' })
        .then(() => {
            order.status = 'completed'
            ElMessage.success('订单已标记完成')
        })
        .catch(() => {})
}

const viewDetails = (order: any) => {
    ElMessage.info(`查看订单详情: ${order.orderId}`)
}

const contactCustomer = (order: any) => {
     ElMessage.info(`联系客户: ${order.customerPhone}`)
}
</script>
