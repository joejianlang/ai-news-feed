<template>
  <div class="provider-reports">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="flex justify-between items-center">
              <span>总收入</span>
              <el-tag type="success">累计</el-tag>
            </div>
          </template>
          <div class="text-3xl font-bold text-gray-900">$12,450.00</div>
          <div class="text-xs text-gray-500 mt-2">包含所有已完成订单的收入</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="flex justify-between items-center">
              <span>待结算</span>
              <el-tag type="warning">处理中</el-tag>
            </div>
          </template>
          <div class="text-3xl font-bold text-orange-500">$850.00</div>
          <div class="text-xs text-gray-500 mt-2">服务完成后7天内自动结算</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="flex justify-between items-center">
              <span>可提现余额</span>
              <el-button type="primary" size="small" @click="handleWithdraw" :loading="withdrawing">
                立即提现
              </el-button>
            </div>
          </template>
          <div class="text-3xl font-bold text-emerald-600">$3,200.00</div>
          <div class="text-xs text-gray-500 mt-2">资金由 Stripe Connect 安全托管</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Recent Transactions -->
    <el-card class="mt-6" shadow="never">
      <template #header>
        <div class="font-bold">最近交易记录</div>
      </template>
      <el-table :data="transactions" stripe style="width: 100%">
        <el-table-column prop="date" label="日期" width="180" />
        <el-table-column prop="orderId" label="关联订单号" width="180" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.type === 'income'" type="success">收入</el-tag>
            <el-tag v-else type="info">提现</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额">
          <template #default="{ row }">
            <span :class="row.type === 'income' ? 'text-green-600' : 'text-gray-900'">
              {{ row.type === 'income' ? '+' : '-' }}${{ row.amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'completed'" type="success" size="small">已完成</el-tag>
            <el-tag v-else type="warning" size="small">处理中</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const withdrawing = ref(false)

const transactions = ref([
  { date: '2024-03-20', orderId: 'ORD-20240320-001', type: 'income', amount: '150.00', status: 'completed' },
  { date: '2024-03-19', orderId: 'ORD-20240319-003', type: 'income', amount: '80.00', status: 'completed' },
  { date: '2024-03-18', orderId: '-', type: 'withdraw', amount: '500.00', status: 'processing' },
  { date: '2024-03-15', orderId: 'ORD-20240315-009', type: 'income', amount: '220.00', status: 'completed' },
])

const handleWithdraw = () => {
  withdrawing.value = true
  setTimeout(() => {
    withdrawing.value = false
    ElMessage.success('提现申请已提交，预计1-2个工作日到账')
  }, 1500)
}
</script>
