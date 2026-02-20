<template>
  <div class="h-full flex flex-col">
    <!-- Header / Stats -->
    <div class="bg-white p-6 border-b border-gray-100 mb-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <h2 class="text-lg font-bold text-gray-800">交易记录</h2>
        
        <div class="flex gap-4">
            <el-select v-model="filterType" placeholder="交易类型" class="w-32">
                <el-option label="全部" value="all" />
                <el-option label="收入" value="income" />
                <el-option label="支出" value="expense" />
                <el-option label="提现" value="withdrawal" />
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

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-blue-50 rounded-lg p-4 flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <el-icon><Wallet /></el-icon>
              </div>
              <div>
                  <div class="text-xs text-gray-500">当前余额</div>
                  <div class="text-xl font-bold text-gray-900">¥ 12,580.00</div>
              </div>
          </div>
          <div class="bg-green-50 rounded-lg p-4 flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <el-icon><Money /></el-icon>
              </div>
              <div>
                  <div class="text-xs text-gray-500">本月收入</div>
                  <div class="text-xl font-bold text-gray-900">+ ¥ 3,200.00</div>
              </div>
          </div>
          <div class="bg-orange-50 rounded-lg p-4 flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <el-icon><Lock /></el-icon>
              </div>
              <div>
                  <div class="text-xs text-gray-500">冻结余额</div>
                  <div class="text-xl font-bold text-gray-900">¥ 500.00</div>
              </div>
          </div>
      </div>
    </div>

    <!-- Transactions List -->
    <div class="flex-1 px-6 overflow-y-auto">
      <div class="bg-white rounded-xl shadow-sm min-h-[500px] p-2">
        <el-table :data="transactions" style="width: 100%" :header-cell-style="{ background: '#f9fafb', color: '#6b7280' }">
            <el-table-column prop="time" label="交易时间" min-width="160" />
            <el-table-column prop="type" label="类型" width="120">
                <template #default="{ row }">
                   <el-tag :type="getTypeTag(row.type)">{{ row.typeName }}</el-tag> 
                </template>
            </el-table-column>
            <el-table-column prop="description" label="交易详情" min-width="200" show-overflow-tooltip />
            <el-table-column prop="orderId" label="关联单号" width="180">
                 <template #default="{ row }">
                    <span v-if="row.orderId" class="font-mono text-gray-500">{{ row.orderId }}</span>
                    <span v-else>-</span>
                 </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="150" align="right">
                <template #default="{ row }">
                    <span :class="row.amount >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'">
                        {{ row.amount >= 0 ? '+' : '' }} ¥ {{ Math.abs(row.amount).toFixed(2) }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column prop="balance" label="变动后余额" width="150" align="right" />
            <el-table-column prop="status" label="状态" width="100" align="center">
                <template #default="{ row }">
                    <span class="text-green-600 text-xs" v-if="row.status === 'success'">成功</span>
                    <span class="text-orange-600 text-xs" v-if="row.status === 'pending'">处理中</span>
                </template>
            </el-table-column>
        </el-table>
        
        <!-- Pagination -->
        <div class="flex justify-end mt-6 pb-4">
            <el-pagination background layout="prev, pager, next" :total="100" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Wallet, Money, Lock } from '@element-plus/icons-vue'

const filterType = ref('all')
const dateRange = ref('')

const transactions = ref([
    {
        id: 1,
        time: '2025-07-12 14:30:00',
        type: 'income',
        typeName: '服务收入',
        description: '全屋大扫除服务 - 完成结算',
        orderId: 'ORD-20250712-001',
        amount: 200.00,
        balance: '12,580.00',
        status: 'success'
    },
    {
        id: 2,
        time: '2025-07-11 09:15:00',
        type: 'item_expense',
        typeName: '积分购买',
        description: '购买服务商积分 (500 pts)',
        orderId: '',
        amount: -500.00,
        balance: '12,380.00',
        status: 'success'
    },
    {
        id: 3,
        time: '2025-07-10 18:20:00',
        type: 'withdrawal',
        typeName: '余额提现',
        description: '提现至招商银行 (尾号 1234)',
        orderId: 'TX-20250710-888',
        amount: -2000.00,
        balance: '12,880.00',
        status: 'success'
    },
    {
         id: 4,
        time: '2025-07-09 10:00:00',
        type: 'income',
        typeName: '服务收入',
        description: '管道疏通服务 - 完成结算',
        orderId: 'ORD-20250709-005',
        amount: 150.00,
        balance: '14,880.00',
        status: 'success'
    }
])

const getTypeTag = (type: string) => {
    switch(type) {
        case 'income': return 'success';
        case 'expense': return 'danger';
        case 'item_expense': return 'warning';
        case 'withdrawal': return 'info';
        default: return '';
    }
}
</script>
