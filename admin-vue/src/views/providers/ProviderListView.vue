<template>
  <div class="p-6">
    <!-- Page Header -->
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">服务商管理</h1>
        <p class="text-gray-500 mt-1">管理平台所有服务商</p>
      </div>
      <div class="flex gap-3">
        <el-button type="success" @click="handleBatchCredit" :disabled="selectedProviders.length === 0">
          <el-icon class="mr-1"><Wallet /></el-icon>
          批量充值
        </el-button>
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon class="mr-1"><Plus /></el-icon>
          添加服务商
        </el-button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-gray-500 text-sm">总服务商</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ stats.total }}</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-gray-500 text-sm">已认证</p>
        <p class="text-2xl font-bold text-emerald-500 mt-1">{{ stats.verified }}</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-gray-500 text-sm">待审核</p>
        <p class="text-2xl font-bold text-orange-500 mt-1">{{ stats.pending }}</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-gray-500 text-sm">已冻结</p>
        <p class="text-2xl font-bold text-red-500 mt-1">{{ stats.frozen }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <el-input v-model="filters.keyword" placeholder="搜索名称/手机号" clearable>
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filters.category" placeholder="服务类型" clearable>
          <el-option label="搬家服务" value="moving" />
          <el-option label="家庭清洁" value="cleaning" />
          <el-option label="家电维修" value="repair" />
          <el-option label="装修服务" value="renovation" />
        </el-select>
        <el-select v-model="filters.status" placeholder="状态" clearable>
          <el-option label="已认证" value="approved" />
          <el-option label="待审核" value="pending" />
          <el-option label="已冻结" value="frozen" />
        </el-select>
        <el-select v-model="filters.rating" placeholder="评分" clearable>
          <el-option label="5星" value="5" />
          <el-option label="4星及以上" value="4" />
          <el-option label="3星及以上" value="3" />
        </el-select>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <el-table 
        :data="providers" 
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="服务商" width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <el-avatar :size="40" :src="row.avatar" class="bg-blue-500">{{ row.name.charAt(0) }}</el-avatar>
              <div>
                <p class="font-medium text-gray-800">{{ row.name }}</p>
                <p class="text-gray-400 text-xs">{{ row.phone }}</p>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="服务类型" width="120" />
        <el-table-column label="评分" width="100">
          <template #default="{ row }">
            <div class="flex items-center gap-1 text-yellow-500">
              <el-icon><Star /></el-icon>
              <span>{{ row.rating }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="积分" width="100">
          <template #default="{ row }">
            <span class="font-bold text-gray-700">{{ row.credits || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="orders" label="完成订单" width="100" />
        <el-table-column prop="joinDate" label="加入时间" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ row.statusText }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="180">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">查看</el-button>
            <el-button type="warning" link size="small" @click="handleManageCredit(row)">积分</el-button>
            <el-button type="success" link size="small" v-if="row.status === 'pending'" @click="approve(row)">通过</el-button>
            <el-button type="danger" link size="small" v-if="row.status === 'verified'" @click="freeze(row)">冻结</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="p-4 flex justify-end border-t border-gray-100">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          layout="total, prev, pager, next"
          background
        />
      </div>
    </div>

    <!-- Add Provider Dialog -->
    <el-dialog v-model="showAddDialog" title="添加服务商" width="600px">
      <el-form :model="newProvider" label-width="100px">
        <el-form-item label="服务商名称" required>
          <el-input v-model="newProvider.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="联系电话" required>
          <el-input v-model="newProvider.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="服务类型" required>
          <el-select v-model="newProvider.category" placeholder="请选择" style="width: 100%">
            <el-option label="搬家服务" value="搬家服务" />
            <el-option label="家庭清洁" value="家庭清洁" />
            <el-option label="家电维修" value="家电维修" />
            <el-option label="装修服务" value="装修服务" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务区域">
          <el-input v-model="newProvider.area" placeholder="如: Toronto, Markham" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="newProvider.intro" type="textarea" rows="3" placeholder="服务商简介" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="addProvider">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- Credit Management Dialog -->
    <el-dialog v-model="showCreditDialog" :title="creditForm.isBatch ? '批量积分管理' : '积分管理'" width="500px">
      <el-form :model="creditForm" label-width="100px">
        <div v-if="creditForm.isBatch" class="mb-4 p-3 bg-blue-50 text-blue-600 rounded-lg text-sm">
          已选择 {{ selectedProviders.length }} 位服务商进行批量操作
        </div>
        <div v-else class="mb-4 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
           <el-avatar :size="32" :src="creditForm.targetUser?.avatar" class="bg-blue-500">{{ creditForm.targetUser?.name?.charAt(0) }}</el-avatar>
           <div>
             <p class="text-sm font-bold">{{ creditForm.targetUser?.name }}</p>
             <p class="text-xs text-gray-500">当前积分: {{ creditForm.targetUser?.credits || 0 }}</p>
           </div>
        </div>

        <el-form-item label="操作类型">
          <el-radio-group v-model="creditForm.type">
            <el-radio-button value="add">充值/奖励</el-radio-button>
            <el-radio-button value="deduct">扣除/惩罚</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="变动数量" required>
          <el-input-number v-model="creditForm.amount" :min="1" :step="10" />
        </el-form-item>

        <el-form-item label="备注说明" required>
          <el-input v-model="creditForm.reason" placeholder="请输入原因，如：新用户奖励、违规扣除" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreditDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCreditUpdate" :loading="creditLoading">确认{{ creditForm.type === 'add' ? '充值' : '扣除' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Plus, Star, Wallet } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { providersApi } from '../../services/api'

const router = useRouter()

const stats = ref({
  total: 0,
  verified: 0,
  pending: 0,
  frozen: 0
})

const filters = reactive({
  keyword: '',
  category: '',
  status: 'approved', // Default to approved to hide pending
  rating: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 156
})

const providers = ref<any[]>([])

const fetchProviders = async () => {
  try {
    const response = await providersApi.getProvidersList({
        page: pagination.page,
        size: pagination.size,
        status: filters.status,
        keyword: filters.keyword
    })
    providers.value = response.providers
    pagination.total = response.total
  } catch (error) {
    console.error(error)
  }
}

const fetchStats = async () => {
  try {
    const res = await providersApi.getStats()
    stats.value = res.stats
  } catch (error) {
    console.error('Fetch stats failed:', error)
  }
}

// Watch filters to refresh
// basic watch for pagination is usually in template or handled by change events, but let's leave it simple


onMounted(() => {
    fetchProviders()
    fetchStats()
})

// Keep existing refs/vars below but verify imports

const showAddDialog = ref(false)
const newProvider = reactive({
  name: '',
  phone: '',
  category: '',
  area: '',
  intro: ''
})

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    approved: 'success', // Backend uses 'approved'
    verified: 'success', // Legacy support
    pending: 'warning',
    frozen: 'danger',
    rejected: 'danger'
  }
  return map[status] || 'info'
}

const viewDetail = (row: any) => {
  router.push(`/dashboard/providers/${row.id}`)
}

const approve = (row: any) => {
  ElMessageBox.confirm('确定通过该服务商的认证申请吗？', '确认审核', {
    confirmButtonText: '通过',
    cancelButtonText: '取消',
    type: 'success'
  }).then(async () => {
    try {
        await providersApi.verifyProvider(row.id, 'approved')
        ElMessage.success('已通过认证')
        fetchProviders()
    } catch (error: any) {
        ElMessage.error(error.message || '审核失败')
    }
  })
}

const freeze = (row: any) => {
  ElMessageBox.confirm(`确定冻结服务商 ${row.name || row.id} 吗？冻结后将无法接单。`, '确认冻结', {
    confirmButtonText: '冻结',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // TODO: Implement freeze API
    ElMessage.warning('冻结功能正在开发中')
  })
}

const addProvider = () => {
  // TODO: Implement actual add API
  ElMessage.success('暂不支持手动添加，请让用户通过App申请')
  showAddDialog.value = false
}

// ============ Credit Management Logic ============
const showCreditDialog = ref(false)
const creditLoading = ref(false)
const selectedProviders = ref<any[]>([])

const creditForm = reactive({
  isBatch: false,
  targetUser: null as any,
  type: 'add',
  amount: 100,
  reason: ''
})

const handleSelectionChange = (val: any[]) => {
  selectedProviders.value = val
}

const handleManageCredit = (row: any) => {
  creditForm.isBatch = false
  creditForm.targetUser = row
  creditForm.type = 'add'
  creditForm.amount = 100
  creditForm.reason = ''
  showCreditDialog.value = true
}

const handleBatchCredit = () => {
  if (selectedProviders.value.length === 0) return
  creditForm.isBatch = true
  creditForm.targetUser = null
  creditForm.type = 'add'
  creditForm.amount = 100
  creditForm.reason = ''
  showCreditDialog.value = true
}

const submitCreditUpdate = async () => {
  if (!creditForm.reason) {
    ElMessage.warning('请输入备注说明')
    return
  }

  creditLoading.value = true
  try {
    const finalAmount = creditForm.type === 'add' ? creditForm.amount : -creditForm.amount
    
    if (creditForm.isBatch) {
      // Mock batch update by looping (in real refined backend, should be one API call)
      const promises = selectedProviders.value.map(provider => 
        providersApi.updateCredits(provider.id, finalAmount, creditForm.reason)
      )
      await Promise.all(promises)
      ElMessage.success(`成功为 ${selectedProviders.value.length} 位服务商调整积分`)
    } else {
      await providersApi.updateCredits(creditForm.targetUser.id, finalAmount, creditForm.reason)
      ElMessage.success('积分调整成功')
    }
    
    showCreditDialog.value = false
    fetchProviders() // Refresh list
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    creditLoading.value = false
  }
}
</script>
