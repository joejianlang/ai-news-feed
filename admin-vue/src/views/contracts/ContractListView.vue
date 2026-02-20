<template>
  <div class="p-6">
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">合同模板管理</h1>
        <p class="text-gray-500 mt-1">管理用于复杂定制服务的合同模板</p>
      </div>
      <el-button type="primary" @click="createContract">
        <el-icon class="mr-1"><Plus /></el-icon>
        新建合同
      </el-button>
    </div>

    <!-- Contract List -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="contract in contracts" 
        :key="contract.id"
        class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow relative"
      >
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <el-icon :size="24" class="text-purple-500"><Document /></el-icon>
            </div>
            <el-tag :type="contract.status === 'published' ? 'success' : 'info'" size="small">
              {{ contract.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </div>
          <h3 class="text-lg font-bold text-gray-800 mb-2">{{ contract.name }}</h3>
          <p class="text-xs text-gray-400 mb-4">创建于 {{ new Date(contract.created_at).toLocaleDateString() }}</p>
          
          <div class="border-t border-gray-100 pt-4 flex justify-end gap-2">
            <el-button type="primary" link @click="editContract(contract)">编辑</el-button>
            <el-button type="danger" link @click="deleteContract(contract)">删除</el-button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="contracts.length === 0 && !loading" class="text-center py-20 text-gray-400">
      <el-icon :size="48" class="mb-4 opacity-20"><Document /></el-icon>
      <p>暂无合同模板</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Document } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { contractsApi } from '../../services/api'

const router = useRouter()
const contracts = ref<any[]>([])
const loading = ref(false)

const fetchContracts = async () => {
  loading.value = true
  try {
    const res = await contractsApi.getAll()
    contracts.value = res.templates || []
  } catch (error: any) {
    ElMessage.error(error.message || '获取合同模板失败')
  } finally {
    loading.value = false
  }
}

const createContract = () => {
  router.push('/dashboard/contracts/new')
}

const editContract = (contract: any) => {
  router.push(`/dashboard/contracts/${contract.id}`)
}

const deleteContract = async (contract: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该合同模板吗？', '确认删除', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    
    await contractsApi.delete(contract.id)
    ElMessage.success('删除成功')
    fetchContracts()
  } catch (error: any) {
    if (error !== 'cancel') {
       ElMessage.error(error.message || '删除失败')
    }
  }
}

onMounted(() => {
  fetchContracts()
})
</script>
