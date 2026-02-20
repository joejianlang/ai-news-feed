<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="bg-white p-6 border-b border-gray-100 flex items-center justify-between mb-6">
      <div>
        <h2 class="text-lg font-bold text-gray-800">定制服务报价记录</h2>
        <p class="text-sm text-gray-500 mt-1">查看您参与的所有定制需求报价及其状态。</p>
      </div>
      
      <div class="flex items-center gap-4">
        <el-input prefix-icon="Search" placeholder="搜索需求或单号" class="w-64" />
        <el-select v-model="statusFilter" placeholder="全部状态" class="w-32">
            <el-option label="全部" value="all" />
            <el-option label="待采纳" value="pending" />
            <el-option label="已采纳" value="accepted" />
            <el-option label="未采纳" value="rejected" />
        </el-select>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 px-6 overflow-y-auto">
      <div class="bg-white rounded-xl shadow-sm min-h-[500px]">
        <el-table :data="quotes" style="width: 100%" :header-cell-style="{ background: '#f9fafb', color: '#6b7280' }">
            <el-table-column prop="requestTitle" label="需求标题" min-width="200" show-overflow-tooltip>
                <template #default="{ row }">
                    <div class="font-medium text-gray-900">{{ row.requestTitle }}</div>
                    <div class="text-xs text-gray-500">ID: {{ row.requestId }}</div>
                </template>
            </el-table-column>
            
            <el-table-column prop="quotedPrice" label="我的报价" width="150" align="right">
                <template #default="{ row }">
                    <span class="font-bold text-orange-500">¥ {{ row.quotedPrice.toFixed(2) }}</span>
                </template>
            </el-table-column>

            <el-table-column prop="quoteTime" label="报价时间" width="180" />
            
            <el-table-column prop="status" label="状态" width="120">
                <template #default="{ row }">
                    <el-tag v-if="row.status === 'pending'" type="warning">待采纳</el-tag>
                    <el-tag v-else-if="row.status === 'accepted'" type="success">已采纳</el-tag>
                    <el-tag v-else type="info">未采纳</el-tag>
                </template>
            </el-table-column>

            <el-table-column label="操作" width="120" fixed="right">
                <template #default="{ row }">
                    <el-button link type="primary" size="small" @click="viewDetails(row)">查看需求</el-button>
                </template>
            </el-table-column>
        </el-table>
        
        <!-- Pagination -->
        <div class="flex justify-end p-4 border-t border-gray-100">
            <el-pagination background layout="prev, pager, next" :total="10" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const statusFilter = ref('all')

const quotes = ref([
    {
        id: 1,
        requestId: 'REQ-20250810-001',
        requestTitle: '别墅全屋翻新装修需求',
        quotedPrice: 150000.00,
        quoteTime: '2025-08-10 14:30',
        status: 'pending'
    },
    {
        id: 2,
        requestId: 'REQ-20250809-005',
        requestTitle: '定制实木家具制作',
        quotedPrice: 20000.00,
        quoteTime: '2025-08-09 09:15',
        status: 'accepted'
    },
    {
        id: 3,
        requestId: 'REQ-20250808-123',
        requestTitle: '庭院景观设计',
        quotedPrice: 5000.00,
        quoteTime: '2025-08-08 18:00',
        status: 'rejected'
    }
])

const viewDetails = (row: any) => {
    ElMessage.info(`查看需求详情: ${row.requestId}`)
}
</script>
