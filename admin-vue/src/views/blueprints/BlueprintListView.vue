<template>
  <div class="p-6">
    <!-- Page Header -->
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">服务模版 (Service Templates)</h1>
        <p class="text-gray-500 mt-1">管理和编辑服务蓝图模版，提供给服务商克隆使用</p>
      </div>
      <el-button type="primary" @click="showCreateDialog">
        <el-icon class="mr-1"><Plus /></el-icon>
        新建模版
      </el-button>
    </div>

    <!-- Filter Tabs -->
    <div class="mb-6">
      <el-radio-group v-model="filterTemplateType" size="default" @change="fetchBlueprints">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button value="standard_service">标准服务</el-radio-button>
        <el-radio-button value="simple_custom">简单定制</el-radio-button>
        <el-radio-button value="complex_custom">复杂定制</el-radio-button>
      </el-radio-group>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
    </div>

    <!-- Empty State -->
    <div v-else-if="blueprints.length === 0" class="text-center py-20">
      <el-icon :size="64" class="text-gray-300 mb-4"><DocumentCopy /></el-icon>
      <p class="text-gray-400 text-lg">暂无模版</p>
      <p class="text-gray-400 text-sm mt-2">点击右上角"新建模版"按钮创建第一个蓝图</p>
    </div>

    <!-- Blueprint Cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="blueprint in blueprints" 
        :key="blueprint.id"
        class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
      >
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <el-icon :size="24" class="text-emerald-600"><Document /></el-icon>
            </div>
            <div class="flex flex-col items-end gap-1">
              <el-tag :type="getCategoryType(blueprint.category)" size="small">
                {{ getCategoryLabel(blueprint.category) }}
              </el-tag>
              <el-tag :type="blueprint.status === 'published' ? 'success' : 'info'" size="small">
                {{ blueprint.status === 'published' ? '已发布' : '草稿' }}
              </el-tag>
            </div>
          </div>
          <h3 class="text-lg font-bold text-gray-800 mb-2">{{ blueprint.name }}</h3>
          <p class="text-gray-500 text-sm mb-4 line-clamp-2">{{ blueprint.description || '暂无描述' }}</p>
          <div class="flex items-center gap-4 text-sm text-gray-400">
            <span v-if="blueprint.faq_content?.length">{{ blueprint.faq_content.length }} 个FAQ</span>
            <span v-if="blueprint.sop_content">包含SOP流程</span>
          </div>
        </div>
        <div class="border-t border-gray-100 px-6 py-3 flex justify-between items-center bg-gray-50">
          <span class="text-xs text-gray-400">更新于 {{ formatDate(blueprint.updated_at) }}</span>
          <div>
            <el-button type="primary" link size="small" @click="editBlueprint(blueprint)">编辑</el-button>
            <el-button type="warning" link size="small" @click="cloneBlueprint(blueprint)">克隆</el-button>
            <el-button type="danger" link size="small" @click="deleteBlueprint(blueprint)">删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Dialog -->
    <el-dialog
      v-model="createDialogVisible"
      title="新建服务模版"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="模版名称" required>
          <el-input v-model="createForm.name" placeholder="例如：深度清洁服务" />
        </el-form-item>
        <el-form-item label="模版描述">
          <el-input 
            v-model="createForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="简要描述该模版的用途和特点"
          />
        </el-form-item>
        <el-form-item label="模版类型" required>
          <el-select v-model="createForm.template_type" placeholder="请选择模版类型" style="width: 100%">
            <el-option label="标准服务模版" value="standard_service" />
            <el-option label="简单定制模版" value="simple_custom" />
            <el-option label="复杂定制模版" value="complex_custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务类别" required>
          <el-select v-model="createForm.category" placeholder="请选择服务类别" style="width: 100%">
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.name"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreate" :disabled="!createForm.name || !createForm.category">
          创建并编辑
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Document, DocumentCopy, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { blueprintsApi, categoriesApi } from '../../services/api' // Import categoriesApi

const router = useRouter()
const loading = ref(false)
const filterTemplateType = ref('')
const blueprints = ref<any[]>([])
const categories = ref<any[]>([]) // Store categories

const createDialogVisible = ref(false)
const createForm = ref({
  name: '',
  description: '',
  category: '',
  template_type: 'standard_service' // Default
})

// Fetch blueprints from API
const fetchBlueprints = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (filterTemplateType.value) {
      params.template_type = filterTemplateType.value
    }
    const response = await blueprintsApi.getAll(params)
    blueprints.value = response.blueprints || []
  } catch (error: any) {
    ElMessage.error(error.message || '获取模版失败')
  } finally {
    loading.value = false
  }
}

// Fetch categories from API
const fetchCategories = async () => {
    try {
        const res = await categoriesApi.getAll()
        categories.value = res.categories || []
    } catch (error) {
        console.error('Failed to fetch categories:', error)
    }
}

const getCategoryType = (category: string) => {
  const types: Record<string, any> = {
    'standard_service': 'primary',
    'simple_custom': 'warning',
    'complex_custom': 'danger'
  }
  return types[category] || 'info'
}

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    'standard_service': '标准服务',
    'simple_custom': '简单定制',
    'complex_custom': '复杂定制'
  }
  return labels[category] || category
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const showCreateDialog = () => {
  createForm.value = { 
    name: '', 
    description: '', 
    category: '', 
    template_type: 'standard_service' 
  }
  createDialogVisible.value = true
}

const confirmCreate = async () => {
  if (!createForm.value.name || !createForm.value.category) {
    ElMessage.warning('请填写必填项')
    return
  }
  
  try {
    const response = await blueprintsApi.create({
      name: createForm.value.name,
      description: createForm.value.description,
      category: createForm.value.category,
      template_type: createForm.value.template_type,
      status: 'draft'
    })
    
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    
    // Navigate to edit page
    router.push(`/dashboard/blueprints/${response.blueprint.id}`)
  } catch (error: any) {
    ElMessage.error(error.message || '创建失败')
  }
}

const editBlueprint = (blueprint: any) => {
  router.push(`/dashboard/blueprints/${blueprint.id}`)
}

const cloneBlueprint = async (blueprint: any) => {
  try {
    const { value: name } = await ElMessageBox.prompt('请输入新模版的名称', '克隆模版', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: blueprint.name + ' - 副本',
      inputPattern: /.+/,
      inputErrorMessage: '名称不能为空'
    })
    
    const response = await blueprintsApi.clone(blueprint.id, { name })
    ElMessage.success('克隆成功')
    
    // Navigate to edit the cloned blueprint
    router.push(`/dashboard/blueprints/${response.blueprint.id}`)
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '克隆失败')
    }
  }
}

const deleteBlueprint = async (blueprint: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除模版 "${blueprint.name}" 吗？此操作不可恢复。`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await blueprintsApi.delete(blueprint.id)
    ElMessage.success('已删除')
    fetchBlueprints()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

onMounted(() => {
  // Check if there's a category filter in query params
  const urlParams = new URLSearchParams(window.location.search)
  const templateType = urlParams.get('template_type')
  if (templateType) {
    filterTemplateType.value = templateType
  }
  fetchBlueprints()
  fetchCategories() // Load categories on mount
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
