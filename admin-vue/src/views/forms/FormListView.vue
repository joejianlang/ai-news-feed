<template>
  <div class="p-6">
    <!-- Page Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">{{ pageTitle }}</h1>
        <p class="text-gray-500 mt-1">{{ pageDescription }}</p>
      </div>
      <el-button type="primary" size="large" @click="showCreateDialog">
        <el-icon class="mr-1"><Plus /></el-icon>
        新建模板
      </el-button>
    </div>

    <!-- Type Tabs -->
    <el-tabs v-model="activeTab" class="mb-6">
      <el-tab-pane label="全部" name="all" v-if="viewContext === 'admin'"/>
      <el-tab-pane label="服务商入驻" name="provider_reg" v-if="viewContext === 'provider' || viewContext === 'admin'"/>
      <el-tab-pane label="标准服务" name="standard" v-if="viewContext === 'standard' || viewContext === 'admin'"/>
      <el-tab-pane label="简单定制" name="custom" v-if="viewContext === 'custom' || viewContext === 'admin'"/>
      <el-tab-pane label="复杂定制" name="complex" v-if="viewContext === 'custom' || viewContext === 'admin'"/>
    </el-tabs>

    <!-- Template Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="template in filteredTemplates" 
        :key="template.id"
        class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
      >
        <div class="p-6">
          <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center" :style="{ backgroundColor: template.color + '20' }">
              <el-icon :size="24" :style="{ color: template.color }"><Document /></el-icon>
            </div>
            <div class="flex flex-col items-end gap-1">
              <el-tag :type="template.type === 'standard' ? 'primary' : (template.type === 'provider_reg' ? 'success' : (template.type === 'complex' ? 'danger' : 'warning'))" size="small">
                {{ template.type === 'standard' ? '标准服务' : (template.type === 'provider_reg' ? '入驻申请' : (template.type === 'complex' ? '复杂定制' : '简单定制')) }}
              </el-tag>
              <el-tag :type="template.status === 'published' ? 'success' : 'info'" size="small">
                {{ template.status === 'published' ? '已发布' : '草稿' }}
              </el-tag>
            </div>
          </div>
          <h3 class="text-lg font-bold text-gray-800 mb-2">{{ template.name }}</h3>
          <p class="text-gray-500 text-sm mb-2 line-clamp-2">{{ template.description }}</p>
          <p class="text-xs text-gray-400 mb-4">
            {{ template.type === 'provider_reg' ? '适用于: 申请入驻的服务商' : (template.type === 'standard' ? '适用于: 服务商日常发布' : '适用于: 普通用户需求') }}
          </p>
          <div class="flex items-center gap-4 text-sm text-gray-400">
            <span>{{ template.fieldsCount }} 个字段</span>
            <span>{{ template.stepsCount }} 个步骤</span>
          </div>
        </div>
        <div class="border-t border-gray-100 px-6 py-3 flex justify-between items-center bg-gray-50">
          <span class="text-xs text-gray-400">更新于 {{ template.updatedAt }}</span>
          <div>
            <div class="inline-flex items-center mr-4" @click.stop>
              <span class="text-xs text-gray-500 mr-2">热门</span>
              <el-switch 
                v-model="template.is_popular" 
                size="small"
                @change="(val: boolean) => togglePopular(template, val)"
                :loading="template.toggling"
              />
            </div>
            <el-button type="primary" link size="small" @click="editTemplate(template)">编辑</el-button>
            <el-button type="warning" link size="small" @click="copyTemplate(template)">复制</el-button>
            <el-button type="info" link size="small" @click="previewTemplate(template)">预览</el-button>
            <el-button type="danger" link size="small" @click="deleteTemplate(template)">删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Template Dialog -->
    <el-dialog
      v-model="createDialogVisible"
      title="新建表单模板"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="space-y-6">
        <p class="text-gray-600 mb-4">请选择要创建的表单类型：</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Standard Service Form Option -->
          <div 
            v-if="viewContext === 'standard' || viewContext === 'admin'"
            class="type-option p-6 rounded-xl border-2 cursor-pointer transition-all"
            :class="selectedFormType === 'standard' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'"
            @click="selectedFormType = 'standard'"
          >
            <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 mx-auto">
              <el-icon :size="24" class="text-blue-500"><Briefcase /></el-icon>
            </div>
            <h4 class="font-bold text-gray-800 mb-2">标准服务表单</h4>
            <p class="text-sm text-gray-500">用于服务商发布标准化服务</p>
            <div class="mt-3 flex items-center justify-center text-xs text-blue-600">
              <el-icon class="mr-1"><User /></el-icon>
              <span>服务商专用</span>
            </div>
          </div>

          <!-- Simple Custom Service Form Option -->
          <div 
            v-if="viewContext === 'custom' || viewContext === 'admin'"
            class="type-option p-6 rounded-xl border-2 cursor-pointer transition-all"
            :class="selectedFormType === 'custom' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'"
            @click="selectedFormType = 'custom'"
          >
            <div class="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4 mx-auto">
              <el-icon :size="24" class="text-orange-500"><Edit /></el-icon>
            </div>
            <h4 class="font-bold text-gray-800 mb-2">简单定制表单</h4>
            <p class="text-sm text-gray-500">用于用户提交简单的定制需求</p>
            <div class="mt-3 flex items-center justify-center text-xs text-orange-600">
              <el-icon class="mr-1"><UserFilled /></el-icon>
              <span>普通用户专用</span>
            </div>
          </div>

          <!-- Complex Custom Service Form Option -->
          <div 
            v-if="viewContext === 'custom' || viewContext === 'admin'"
            class="type-option p-6 rounded-xl border-2 cursor-pointer transition-all"
            :class="selectedFormType === 'complex' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'"
            @click="selectedFormType = 'complex'"
          >
            <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4 mx-auto">
              <el-icon :size="24" class="text-purple-500"><Document /></el-icon>
            </div>
            <h4 class="font-bold text-gray-800 mb-2">复杂定制表单</h4>
            <p class="text-sm text-gray-500">包含合同模板，支持草稿保存</p>
            <div class="mt-3 flex items-center justify-center text-xs text-purple-600">
              <el-icon class="mr-1"><UserFilled /></el-icon>
              <span>普通用户专用</span>
            </div>
          </div>

          <!-- Provider Registration Form Option -->
          <div 
            v-if="viewContext === 'provider' || viewContext === 'admin'"
            class="type-option p-6 rounded-xl border-2 cursor-pointer transition-all"
            :class="selectedFormType === 'provider_reg' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'"
            @click="selectedFormType = 'provider_reg'"
          >
            <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4 mx-auto">
              <el-icon :size="24" class="text-emerald-500"><Coordinate /></el-icon>
            </div>
            <h4 class="font-bold text-gray-800 mb-2">服务商类别注册表单</h4>
            <p class="text-sm text-gray-500">服务商申请开通新服务类别</p>
            <div class="mt-3 flex items-center justify-center text-xs text-emerald-600">
              <el-icon class="mr-1"><Management /></el-icon>
              <span>新服务商入驻</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreateTemplate" :disabled="!selectedFormType">
          下一步
        </el-button>
      </template>
    </el-dialog>

    <!-- Preview Template Dialog -->
    <el-dialog
      v-model="previewDialogVisible"
      :title="'预览: ' + (previewData?.name || '')"
      width="400px"
      custom-class="preview-dialog"
    >
      <div v-if="previewData" class="preview-content bg-gray-50 rounded-xl p-4 border border-gray-100 min-h-[500px] overflow-y-auto max-h-[70vh]">
        <!-- Phone Header Mock -->
        <div class="w-full h-6 bg-gray-200 rounded-t-lg mb-4 flex items-center px-3 gap-1">
          <div class="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
          <div class="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
        </div>

        <div v-if="!previewData.steps || previewData.steps.length === 0" class="text-center py-20 text-gray-400">
          <el-icon :size="48" class="mb-2 opacity-20"><View /></el-icon>
          <p>该模板暂无步骤内容</p>
        </div>

        <div v-else class="space-y-6">
          <!-- Step Indicator (Mock) -->
          <div v-if="previewData.steps.length > 1" class="flex items-center justify-between px-2 mb-6">
            <div v-for="(s, i) in previewData.steps" :key="i" class="flex flex-col items-center gap-1">
              <div 
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                :class="i === 0 ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'"
              >
                {{ Number(i) + 1 }}
              </div>
              <text style="font-size: 10px; color: #9ca3af;">{{ s.title }}</text>
            </div>
          </div>

          <!-- Current Step Preview (Step 1) -->
          <div class="space-y-5">
            <div class="mb-2">
              <h4 class="font-bold text-gray-900">{{ previewData.steps[0].title }}</h4>
              <p v-if="previewData.steps[0].description" class="text-xs text-gray-500 mt-1">{{ previewData.steps[0].description }}</p>
            </div>

            <div v-for="(field, fIdx) in previewData.steps[0].fields" :key="fIdx" class="preview-field mb-4">
              <label class="block text-sm font-bold text-gray-700 mb-2">
                {{ field.label }}
                <span v-if="field.required" class="text-red-500 ml-1">*</span>
              </label>

              <!-- Text/Number Input -->
              <div v-if="['text', 'number', 'date'].includes(field.type)" class="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 flex items-center text-gray-400 text-sm">
                {{ field.placeholder || '请输入' + field.label }}
              </div>

              <!-- Textarea -->
              <div v-else-if="field.type === 'textarea'" class="w-full h-20 bg-white border border-gray-200 rounded-lg p-3 text-gray-400 text-sm">
                {{ field.placeholder || '请输入内容' }}
              </div>

              <!-- Select -->
              <div v-else-if="field.type === 'select'" class="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 flex items-center justify-between text-gray-400 text-sm">
                <span>{{ field.placeholder || '请选择' }}</span>
                <el-icon><ArrowDown /></el-icon>
              </div>

              <!-- Radio/Checkbox -->
              <div v-else-if="['radio', 'checkbox'].includes(field.type)" class="flex flex-wrap gap-2">
                <div 
                  v-for="(opt, oIdx) in field.options" 
                  :key="oIdx"
                  class="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 bg-white"
                >
                  {{ opt.label }}
                </div>
              </div>

              <!-- Image -->
              <div v-else-if="field.type === 'image'" class="w-full h-32 bg-gray-100 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
                <el-icon :size="24" class="mb-1"><Picture /></el-icon>
                <span class="text-xs">点击上传图片</span>
              </div>

              <!-- Address -->
              <div v-else-if="field.type === 'address'" class="space-y-2">
                <div class="w-full h-10 bg-white border border-gray-200 rounded-lg px-3 flex items-center text-gray-400 text-sm">详细地址</div>
                <div class="flex gap-2">
                  <div class="flex-1 h-10 bg-white border border-gray-200 rounded-lg px-3 flex items-center text-gray-400 text-sm">城市</div>
                  <div class="flex-1 h-10 bg-white border border-gray-200 rounded-lg px-3 flex items-center text-gray-400 text-sm">省份</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Button Mock -->
          <div class="pt-6">
            <div 
              class="w-full h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-lg"
              :style="{ backgroundColor: previewData.color || '#10b981' }"
            >
              {{ previewData.steps.length > 1 ? '下一步' : '提交' }}
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="previewDialogVisible = false">关闭预览</el-button>
        <el-button type="primary" @click="editTemplate(previewData)">进入编辑</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, Document, Briefcase, Edit, User, UserFilled, Coordinate, Management, View, ArrowDown, Picture, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formTemplatesApi } from '../../services/api'

const router = useRouter()
const route = useRoute()
const loading = ref(false)

// Filter state
const activeTab = ref('all')

// Create dialog state
const createDialogVisible = ref(false)
const selectedFormType = ref<'standard' | 'custom' | 'complex' | 'provider_reg' | ''>('')

const templates = ref<any[]>([])

// Fetch templates from API
const fetchTemplates = async () => {
  loading.value = true
  try {
    // Fetch all templates (backend supports filtering, but we'll fetch all and filter locally for tabs or filter via API if list grows)
    // For now, let's fetch all
    const response = await formTemplatesApi.getAll({ 
      includeSteps: true
    })
    templates.value = response.templates.map((t: any) => ({
      ...t,
      fieldsCount: t.fieldsCount || (t.steps?.reduce((sum: number, s: any) => sum + (s.fields?.length || 0), 0) || 0),
      stepsCount: t.stepsCount || (t.steps?.length || 0),
      updatedAt: t.updated_at ? new Date(t.updated_at).toLocaleDateString() : '-'
    }))
  } catch (error: any) {
    ElMessage.error(error.message || '获取表单模板失败')
  } finally {
    loading.value = false
  }
}

// Compute view context based on route query tab
const viewContext = computed(() => {
  const tab = route.query.tab as string
  if (tab === 'provider_reg') return 'provider'
  if (tab === 'standard') return 'standard'
  if (tab === 'custom' || tab === 'complex') return 'custom'
  return 'admin' // Default to showing all
})

// Compute page title and description - Updated for context
const pageTitle = computed(() => {
  if (viewContext.value === 'custom') {
      return activeTab.value === 'complex' ? '复杂定制表单' : '简单定制表单'
  }
  if (viewContext.value === 'provider') return '入驻申请表单'
  if (viewContext.value === 'standard') return '标准服务模版'
  return '业务表单中心'
})

const pageDescription = computed(() => {
  if (viewContext.value === 'custom') {
      return activeTab.value === 'complex' ? '为用户提供的复杂定制需求表单' : '为用户提供的简单定制需求表单'
  }
  if (viewContext.value === 'provider') return '管理服务商入驻和类别申请的表单'
  if (viewContext.value === 'standard') return '为服务商提供的标准上架服务模版'
  return '集中管理平台各类业务表单'
})

// Filter templates based on active tab
const filteredTemplates = computed(() => {
  if (activeTab.value === 'all') return templates.value
  if (activeTab.value === 'provider_reg') return templates.value.filter(t => t.type === 'provider_reg')
  if (activeTab.value === 'standard') return templates.value.filter(t => t.type === 'standard')
  if (activeTab.value === 'custom') return templates.value.filter(t => t.type === 'custom')
  if (activeTab.value === 'complex') return templates.value.filter(t => t.type === 'complex')
  return templates.value
})

const showCreateDialog = () => {
  selectedFormType.value = ''
  createDialogVisible.value = true
}

const confirmCreateTemplate = () => {
  if (!selectedFormType.value) {
    ElMessage.warning('请选择表单类型')
    return
  }
  createDialogVisible.value = false
  router.push(`/dashboard/forms/new?type=${selectedFormType.value}`)
}

const editTemplate = (template: any) => {
  router.push(`/dashboard/forms/${template.id}`)
}

const previewDialogVisible = ref(false)
const previewData = ref<any>(null)

const previewTemplate = (template: any) => {
  previewData.value = template
  previewDialogVisible.value = true
}

const deleteTemplate = async (template: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该模板吗？此操作不可恢复。', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await formTemplatesApi.delete(template.id)
    ElMessage.success('已删除')
    fetchTemplates()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// Toggle popular status
const togglePopular = async (template: any, val: boolean) => {
  // Optimistic update already happened via v-model
  // But we set a loading state
  template.toggling = true
  try {
    await formTemplatesApi.update(template.id, { is_popular: val })
    ElMessage.success(val ? '已设为热门' : '已取消热门')
  } catch (error: any) {
    // Revert on failure
    template.is_popular = !val
    ElMessage.error(error.message || '操作失败')
  } finally {
    template.toggling = false
  }
}

// Copy template
const copyTemplate = async (template: any) => {
  try {
    await ElMessageBox.confirm(`确定要复制模板 "${template.name}" 吗？`, '复制模板', {
      confirmButtonText: '确定复制',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    // Create a copy with modified name
    const copyData = {
      name: template.name + ' - 副本',
      description: template.description,
      type: template.type,
      category: template.category,
      color: template.color,
      steps: template.steps,
      contract_template_id: template.contract_template_id
    }
    
    const response = await formTemplatesApi.create(copyData)
    ElMessage.success('复制成功')
    
    // Navigate to edit the new copy
    router.push(`/dashboard/forms/${response.template.id}`)
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '复制失败')
    }
  }
}

onMounted(() => {
  if (route.query.tab) {
    activeTab.value = route.query.tab as string
  }
  fetchTemplates()
})

// Watch for route changes to update tab
// Watch for route changes to update tab or context
watch(() => route.query.tab, (newTab) => {
  if (newTab) {
    activeTab.value = newTab as string
  } else {
    // If no tab in query (e.g. cleared), default to 'all'
    activeTab.value = 'all'
  }
})

// Watch viewContext to ensure activeTab is valid
watch(viewContext, (newCtx) => {
    if (newCtx === 'custom' && (activeTab.value !== 'custom' && activeTab.value !== 'complex')) {
        activeTab.value = 'custom'
    } else if (newCtx === 'provider' && activeTab.value !== 'provider_reg') {
        activeTab.value = 'provider_reg'
    } else if (newCtx === 'standard' && activeTab.value !== 'standard') {
        activeTab.value = 'standard'
    }
}, { immediate: true })
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.type-option {
  text-align: center;
}

.type-option:hover {
  transform: translateY(-2px);
}
</style>
