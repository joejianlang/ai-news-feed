<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="bg-white p-6 border-b border-gray-100 flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <h2 class="text-lg font-bold text-gray-800">已开发票</h2>
        <span class="text-gray-500 font-normal">({{ invoices.length }})</span>
      </div>
      
      <div class="flex items-center gap-4">
        <el-select v-model="filterType" placeholder="全部" class="w-32">
          <el-option label="全部" value="all" />
          <el-option label="已开具" value="issued" />
        </el-select>
        <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="!w-64"
        />
      </div>
    </div>

    <!-- Invoice List -->
    <div class="flex-1 px-6 overflow-y-auto">
      <div class="bg-white rounded-xl shadow-sm p-6 min-h-[500px]">
        
        <!-- Info Alert (optional based on design note, but good for UX) -->
        <el-alert
            title="备注：服务商无需手动生成发票信息，系统将自动生成 PDF。"
            type="warning"
            show-icon
            :closable="false"
            class="mb-6"
        />

        <div class="space-y-6">
            <div v-for="invoice in invoices" :key="invoice.id" class="border-b border-gray-100 pb-6 last:border-0 hover:bg-gray-50 transition-colors p-4 rounded-lg -mx-4">
                <div class="text-xs text-gray-400 mb-2">订单编号: {{ invoice.orderCode }}</div>
                
                <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <!-- Left: Icon + Info -->
                    <div class="flex items-start gap-4 flex-1">
                        <div class="bg-red-50 p-2.5 rounded-lg text-red-500 shrink-0">
                            <el-icon :size="24"><Tickets /></el-icon>
                        </div>
                        <div>
                            <div class="font-bold text-gray-800 mb-1 line-clamp-1">{{ invoice.serviceName }}</div>
                            <div class="text-xs text-gray-400">{{ invoice.time }}</div>
                        </div>
                    </div>

                    <!-- Middle: Amount -->
                    <div class="w-48 md:text-center text-sm font-bold text-gray-700">
                        开票金额: ¥ {{ invoice.amount.toLocaleString() }}
                    </div>

                    <!-- Right: Actions -->
                    <div class="flex items-center gap-6 shrink-0">
                        <button class="text-gray-500 hover:text-blue-600 text-sm">订单详情</button>
                        <button class="text-gray-500 hover:text-blue-600 text-sm">下载</button>
                        <el-button type="primary" size="default">查看发票</el-button>
                    </div>
                </div>
            </div>
            
            <div v-if="invoices.length === 0" class="text-center py-20 text-gray-400">
                暂无发票记录
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Tickets } from '@element-plus/icons-vue'

const filterType = ref('all')
const dateRange = ref('')

const invoices = ref([
    {
        id: 1,
        orderCode: '123453454864545645',
        serviceName: '服务名称服务名称服务名称服务名称',
        time: '2025/07/12 17:40:00',
        amount: 2000,
        status: 'issued'
    },
    {
        id: 2,
        orderCode: '987654321356454555',
        serviceName: '服务名称服务名称服务名称服务名称',
        time: '2025/07/12 17:40:00',
        amount: 2000,
        status: 'issued'
    }
])
</script>
