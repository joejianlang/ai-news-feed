<template>
  <div class="sales-partner-detail p-6" v-loading="loading">
    <div class="mb-6 flex items-center gap-4">
      <el-button @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h1 class="text-2xl font-bold text-gray-900">销售合伙人详情: {{ partner?.name }}</h1>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
       <el-card shadow="hover" class="bg-blue-50 border-blue-100">
          <div class="text-gray-500 text-sm">关联服务商</div>
          <div class="text-2xl font-bold text-blue-600 mt-2">{{ providers.length }}</div>
       </el-card>
       <el-card shadow="hover" class="bg-emerald-50 border-emerald-100">
          <div class="text-gray-500 text-sm">累计获得佣金</div>
          <div class="text-2xl font-bold text-emerald-600 mt-2">${{ partner?.profile?.total_earnings || 0 }}</div>
       </el-card>
       <el-card shadow="hover" class="bg-orange-50 border-orange-100">
          <div class="text-gray-500 text-sm">当前余额</div>
          <div class="text-2xl font-bold text-orange-600 mt-2">${{ partner?.profile?.current_balance || 0 }}</div>
       </el-card>
       <el-card shadow="hover">
          <div class="text-gray-500 text-sm">邀请码</div>
          <div class="text-xl font-bold text-gray-800 mt-2 tracking-wider">{{ partner?.profile?.referral_code || '-' }}</div>
       </el-card>
    </div>

    <!-- Providers List -->
    <el-card shadow="never">
       <template #header>
         <div class="flex justify-between items-center">
            <h3 class="font-bold">关联服务商业绩表</h3>
         </div>
       </template>
       
       <el-table :data="providers" style="width: 100%" stripe border>
          <el-table-column prop="name" label="服务商姓名" width="150" />
          <el-table-column prop="email" label="联系方式" min-width="200">
              <template #default="{ row }">
                  <div>{{ row.email }}</div>
                  <div class="text-xs text-gray-400">{{ row.phone }}</div>
              </template>
          </el-table-column>
          <el-table-column prop="created_at" label="加入时间" width="160">
              <template #default="{ row }">
                  {{ new Date(row.created_at).toLocaleDateString() }}
              </template>
          </el-table-column>
          
          <el-table-column label="业绩表现" header-align="center">
             <el-table-column prop="stats.order_count" label="订单数" width="100" align="center" sortable />
             <el-table-column prop="stats.total_sales" label="总流水" width="150" align="right" sortable>
                 <template #default="{ row }">
                     ${{ row.stats?.total_sales || 0 }}
                 </template>
             </el-table-column>
          </el-table-column>
          
          <el-table-column prop="stats.contribution" label="贡献佣金" width="150" align="right" sortable>
              <template #default="{ row }">
                  <span class="font-bold text-emerald-600">+${{ row.stats?.contribution || 0 }}</span>
              </template>
          </el-table-column>
          
          <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                  <el-button link type="primary" @click="$router.push(`/dashboard/providers/${row.id}`)">
                      查看详情
                  </el-button>
              </template>
          </el-table-column>
       </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { usersApi } from '../../services/api'

const route = useRoute()
const loading = ref(false)
const partner = ref<any>({})
const providers = ref<any[]>([])

onMounted(() => {
    fetchDetail()
})

const fetchDetail = async () => {
    const id = route.params.id as string
    if (!id) return;
    
    loading.value = true
    try {
        const res = await usersApi.getSalesPartnerDetail(id)
        if (res.partner) {
            partner.value = res.partner
            providers.value = res.providers || []
        }
    } catch (e) {
        console.error(e)
    } finally {
        loading.value = false
    }
}
</script>
