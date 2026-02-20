<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="bg-white p-6 border-b border-gray-100 flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <h2 class="text-lg font-bold text-gray-800">合同管理</h2>
        <span class="text-gray-500 font-normal">({{ contracts.length }})</span>
      </div>
      
      <div class="flex items-center gap-4">
        <el-select v-model="filterType" placeholder="全部" class="w-32">
          <el-option label="全部" value="all" />
          <el-option label="进行中" value="active" />
          <el-option label="已完成" value="completed" />
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

    <!-- Contract List -->
    <div class="flex-1 px-6 overflow-y-auto">
      <div class="bg-white rounded-xl shadow-sm p-6 min-h-[500px]">
        <div class="space-y-6">
            <div v-for="contract in contracts" :key="contract.id" class="border-b border-gray-100 pb-6 last:border-0 hover:bg-gray-50 transition-colors p-4 rounded-lg -mx-4">
                <div class="text-xs text-gray-400 mb-2">合同编号: {{ contract.code }}</div>
                
                <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <!-- Left: Icon + Info -->
                    <div class="flex items-start gap-4 flex-1">
                        <div class="bg-orange-100 p-2.5 rounded-lg text-orange-500 shrink-0">
                            <el-icon :size="24"><DocumentIcon /></el-icon>
                        </div>
                        <div>
                            <div class="font-bold text-gray-800 mb-1 line-clamp-1">{{ contract.name }}</div>
                            <div class="text-xs text-gray-400">{{ contract.time }}</div>
                        </div>
                    </div>

                    <!-- Middle: Amount -->
                    <div class="w-48 md:text-center text-sm font-bold text-gray-700">
                        合同金额: ¥ {{ contract.amount.toLocaleString() }}
                    </div>

                    <!-- Right: Actions -->
                    <div class="flex items-center gap-6 shrink-0">
                        <button class="text-gray-500 hover:text-blue-600 text-sm">项目详情</button>
                        <button class="text-gray-500 hover:text-blue-600 text-sm">下载</button>
                        <el-button type="primary" size="default">查看合同</el-button>
                    </div>
                </div>
            </div>
            
            <div v-if="contracts.length === 0" class="text-center py-20 text-gray-400">
                暂无合同记录
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Document as DocumentIcon } from '@element-plus/icons-vue'

const filterType = ref('all')
const dateRange = ref('')

const contracts = ref([
    {
        id: 1,
        code: '123453454864545645',
        name: '合同名称合同名称',
        time: '2025/07/12 17:40:00',
        amount: 200000,
        status: 'active'
    },
    {
        id: 2,
        code: '987654321356454555',
        name: '合同名称合同名称合同名称',
        time: '2025/07/12 17:40:00',
        amount: 20000,
        status: 'active'
    },
    {
        id: 3,
        code: '456789123456789123',
        name: '年度服务协议-合同',
        time: '2025/07/10 14:20:00',
        amount: 55000,
        status: 'approved'
    }
])
</script>
