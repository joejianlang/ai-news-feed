<template>
  <div class="h-full flex flex-col">
    <!-- Header / Tools -->
    <div class="bg-white p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <!-- Tabs -->
      <el-tabs v-model="activeTab" class="provider-tabs" @tab-click="handleTabClick">
        <el-tab-pane :label="`全部(${counts.total})`" name="all" />
        <el-tab-pane :label="`编辑中(${counts.draft})`" name="draft" />
        <el-tab-pane :label="`审核中(${counts.pending})`" name="pending" />
        <el-tab-pane :label="`已上架(${counts.published})`" name="published" />
        <el-tab-pane :label="`审核未通过(${counts.rejected})`" name="rejected" />
      </el-tabs>

      <!-- Right Actions -->
      <div class="flex items-center gap-4">
        <el-button type="primary" link @click="handleCreate">
            <el-icon class="mr-1"><Plus /></el-icon> 创建标准服务
        </el-button>
        <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
            class="!w-60"
        />
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 px-6 overflow-y-auto bg-white m-4 rounded-xl shadow-sm relative">
        <!-- Loading -->
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
            <el-icon class="is-loading text-2xl text-gray-400"><Loading /></el-icon>
        </div>

        <!-- Empty State -->
        <div v-else-if="services.length === 0" class="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <el-icon :size="64" class="mb-4 text-gray-300"><Box /></el-icon>
            <div class="text-sm">暂无服务数据</div>
        </div>

        <!-- Service Table -->
        <el-table v-else :data="services" class="w-full">
            <el-table-column label="服务ID" width="180">
                <template #default="{ row }">
                    <div class="font-mono text-xs bg-gray-100 px-2 py-1 rounded inline-block">
                        {{ row.service_identity_id || '-' }}
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="服务名称" min-width="200">
                <template #default="{ row }">
                    <div class="font-medium">{{ row.title }}</div>
                    <div class="text-xs text-gray-400">{{ row.category }}</div>
                </template>
            </el-table-column>
            <el-table-column label="价格" width="120">
                <template #default="{ row }">
                    <span class="text-emerald-600 font-medium">¥{{ row.price }}</span>
                </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
                <template #default="{ row }">
                    <el-tag :type="getStatusType(row.status)" size="small">
                        {{ getStatusLabel(row.status) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="创建时间" width="120">
                <template #default="{ row }">
                    {{ formatDate(row.created_at) }}
                </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" link @click="viewService(row)">查看</el-button>
                    <el-button size="small" link @click="editService(row)">编辑</el-button>
                    
                    <!-- Unpublish button for published/approved services -->
                    <el-button 
                        v-if="row.status === 'approved' || row.status === 'published'" 
                        size="small" 
                        link 
                        type="warning"
                        @click="handleUnpublish(row)"
                    >
                        下架
                    </el-button>
                    
                    <!-- Delete button for unpublished/rejected/draft/pending services -->
                    <el-button 
                        v-if="canDelete(row.status)" 
                        size="small" 
                        link 
                        type="danger"
                        @click="handleDelete(row)"
                    >
                        删除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- Pagination -->
        <div v-if="total > pageSize" class="flex justify-end py-4">
            <el-pagination
                v-model:current-page="page"
                :page-size="pageSize"
                :total="total"
                layout="prev, pager, next"
                @current-change="fetchServices"
            />
        </div>
    </div>

    <!-- Create Service Dialog - New Template Selection Flow -->
    <el-dialog
        v-model="createDialogVisible"
        title="创建标准服务"
        width="700px"
        destroy-on-close
    >
        <el-steps :active="activeStep" finish-status="success" simple style="margin-bottom: 20px;">
            <el-step title="选择服务模板" />
            <el-step title="填写服务信息" />
        </el-steps>

        <div v-loading="createLoading" class="min-h-[300px]">
            <!-- Step 1: Select Template from provider's approved categories -->
            <div v-if="activeStep === 0">
                <div v-if="availableTemplates.length === 0" class="text-center py-10 text-gray-400">
                    <el-icon :size="48" class="mb-3 text-gray-300"><Box /></el-icon>
                    <div class="text-lg mb-2">暂无可用模板</div>
                    <div class="text-sm">{{ templatesMessage || '您已开通的服务类别下没有发布的模板' }}</div>
                </div>
                <div v-else class="space-y-3">
                    <div class="text-sm text-gray-500 mb-4">
                        您已开通：<el-tag v-for="cat in myCategories" :key="cat" size="small" class="mr-2">{{ cat }}</el-tag>
                    </div>
                    <div 
                        v-for="tmpl in availableTemplates"
                        :key="tmpl.id"
                        class="border p-4 rounded-lg cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all flex justify-between items-center"
                        @click="handleTemplateSelect(tmpl)"
                    >
                        <div>
                            <div class="font-bold mb-1">{{ tmpl.name }}</div>
                            <div class="text-xs text-gray-500">{{ tmpl.description }}</div>
                            <el-tag size="small" type="info" class="mt-2">{{ tmpl.category_name }}</el-tag>
                        </div>
                        <el-icon class="text-gray-400"><ArrowRight /></el-icon>
                    </div>
                </div>
            </div>

            <!-- Step 2: Fill Form -->
            <div v-if="activeStep === 1">
                <div class="mb-4 p-3 bg-emerald-50 rounded-lg">
                    <div class="text-sm text-gray-600">已选模板：<span class="font-bold text-emerald-700">{{ selectedTemplate?.name }}</span></div>
                    <div class="text-xs text-gray-500">{{ selectedTemplate?.category_name }}</div>
                </div>

                <el-form label-position="top">
                    <template v-if="selectedTemplate?.steps">
                        <div v-for="(step, sIdx) in selectedTemplate.steps" :key="sIdx" class="mb-6">
                            <h4 v-if="step.title" class="font-bold text-gray-800 mb-3">{{ step.title }}</h4>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <template v-for="field in step.fields" :key="field.key">
                                    <div :class="{ 'col-span-2': ['address', 'textarea', 'radio', 'checkbox', 'image'].includes(field.type) || field.key === 'title' }">
                                        <el-form-item :label="field.label" :required="field.required">
                                            <el-input 
                                                v-if="['text', 'number'].includes(field.type)"
                                                v-model="formData[field.key]" 
                                                :type="field.type === 'number' ? 'number' : 'text'"
                                                :placeholder="field.fill_by === 'customer' ? '由用户填写' : field.placeholder"
                                                :disabled="field.fill_by === 'customer'"
                                            />
                                            <el-input 
                                                v-if="field.type === 'textarea'"
                                                v-model="formData[field.key]" 
                                                type="textarea"
                                                :rows="3"
                                                :placeholder="field.fill_by === 'customer' ? '由用户填写' : field.placeholder"
                                                :disabled="field.fill_by === 'customer'"
                                            />
                                            <el-select 
                                                v-if="field.type === 'select'"
                                                v-model="formData[field.key]" 
                                                :placeholder="field.fill_by === 'customer' ? '由用户填写' : (field.placeholder || '请选择')"
                                                class="w-full"
                                                :disabled="field.fill_by === 'customer'"
                                            >
                                                <el-option 
                                                    v-for="opt in field.options" 
                                                    :key="typeof opt === 'string' ? opt : opt.value" 
                                                    :label="typeof opt === 'string' ? opt : opt.label" 
                                                    :value="typeof opt === 'string' ? opt : opt.value" 
                                                />
                                            </el-select>
                                            <el-select 
                                                v-if="field.type === 'city_select'"
                                                v-model="formData[field.key]" 
                                                multiple
                                                :placeholder="field.fill_by === 'customer' ? '由用户填写' : '请选择服务城市'"
                                                class="w-full"
                                                :disabled="field.fill_by === 'customer'"
                                            >
                                                <el-option 
                                                    v-for="city in cities" 
                                                    :key="city.id" 
                                                    :label="city.name" 
                                                    :value="city.id" 
                                                />
                                            </el-select>
                                        </el-form-item>
                                    </div>
                                </template>
                            </div>
                        </div>
                    </template>
                    <div v-else class="text-center text-gray-400 py-10">
                        模板未定义字段
                    </div>
                </el-form>
                <div class="mt-4">
                    <el-button link @click="activeStep = 0">
                        <el-icon class="mr-1"><ArrowLeft /></el-icon>返回选择模板
                    </el-button>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-3">
                <el-button @click="createDialogVisible = false">取消</el-button>
                <el-button v-if="activeStep === 1" type="primary" @click="handleSubmit" :loading="submitting">提交审核</el-button>
            </div>
        </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Box, Plus, ArrowRight, ArrowLeft, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { citiesApi, submissionsApi, providersApi } from '../../services/api'

// Main View State
const activeTab = ref('all')
const dateRange = ref('')
const services = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = 20
const total = ref(0)

// Status counts
const counts = ref({
    total: 0,
    draft: 0,
    pending: 0,
    published: 0,
    rejected: 0
})

// Create Modal State
const createDialogVisible = ref(false)
const activeStep = ref(0)
const createLoading = ref(false)
const submitting = ref(false)

const availableTemplates = ref<any[]>([])
const myCategories = ref<string[]>([])
const templatesMessage = ref('')
const cities = ref<any[]>([])
const selectedTemplate = ref<any>(null)
const formData = ref<any>({})

// Fetch services on mount
onMounted(() => {
    fetchServices()
})

const fetchServices = async () => {
    loading.value = true
    try {
        const statusParam = activeTab.value === 'all' ? undefined : activeTab.value
        const res = await providersApi.getMyServices({ 
            status: statusParam, 
            page: page.value, 
            size: pageSize 
        })
        services.value = res.services || []
        total.value = res.total || 0
        
        // Update counts (simple approach - fetch all to count)
        if (activeTab.value === 'all') {
            updateCounts(res.services || [])
        }
    } catch (e: any) {
        console.error('Fetch services error:', e)
        ElMessage.error(e.message || '获取服务列表失败')
    } finally {
        loading.value = false
    }
}

const updateCounts = (allServices: any[]) => {
    counts.value = {
        total: allServices.length,
        draft: allServices.filter(s => s.status === 'draft').length,
        pending: allServices.filter(s => s.status === 'pending').length,
        published: allServices.filter(s => s.status === 'approved' || s.status === 'published').length,
        rejected: allServices.filter(s => s.status === 'rejected').length
    }
}

const handleTabClick = () => {
    page.value = 1
    fetchServices()
}

// Status helpers
const getStatusType = (status: string) => {
    const map: Record<string, string> = {
        draft: 'info',
        pending: 'warning',
        approved: 'success',
        published: 'success',
        rejected: 'danger',
        unpublished: 'info'
    }
    return map[status] || 'info'
}

const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
        draft: '草稿',
        pending: '审核中',
        approved: '已上架',
        published: '已上架',
        rejected: '审核未通过',
        unpublished: '已下架'
    }
    return map[status] || status
}

const formatDate = (date: string) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('zh-CN')
}

const canDelete = (status: string) => {
    return ['unpublished', 'rejected', 'draft', 'pending'].includes(status)
}

// Actions
const viewService = (row: any) => {
    ElMessage.info('查看服务详情功能开发中')
}

const editService = (row: any) => {
    ElMessage.info('编辑服务功能开发中')
}

const handleUnpublish = async (row: any) => {
    try {
        await ElMessageBox.confirm(
            '下架后，用户将无法看到此服务。确定要下架吗？',
            '确认下架',
            { type: 'warning' }
        )
        
        await providersApi.unpublishService(row.id, '服务商主动下架')
        ElMessage.success('服务已下架')
        fetchServices()
    } catch (e: any) {
        if (e !== 'cancel') {
            ElMessage.error(e.message || '下架失败')
        }
    }
}

const handleDelete = async (row: any) => {
    try {
        await ElMessageBox.confirm(
            '删除后，此服务将被归档，无法恢复。确定要删除吗？',
            '确认删除',
            { type: 'error', confirmButtonText: '确认删除', confirmButtonClass: 'el-button--danger' }
        )
        
        await providersApi.deleteService(row.id)
        ElMessage.success('服务已删除')
        fetchServices()
    } catch (e: any) {
        if (e !== 'cancel') {
            ElMessage.error(e.message || '删除失败')
        }
    }
}

// Create service flow - NEW: Template-based selection
const handleCreate = async () => {
    createDialogVisible.value = true
    activeStep.value = 0
    formData.value = {}
    selectedTemplate.value = null
    createLoading.value = true
    
    try {
        // Fetch templates based on provider's approved categories
        const [templatesRes, citiesRes] = await Promise.all([
            providersApi.getMyTemplates(),
            citiesApi.getActive()
        ])
        
        availableTemplates.value = templatesRes.templates || []
        myCategories.value = templatesRes.categories || []
        templatesMessage.value = (templatesRes as any).message || ''
        cities.value = citiesRes || []
    } catch (e: any) {
        console.error('Load templates error:', e)
        ElMessage.error(e.message || '加载模板失败')
        availableTemplates.value = []
    } finally {
        createLoading.value = false
    }
}

const handleTemplateSelect = (tmpl: any) => {
    selectedTemplate.value = tmpl
    formData.value = {}
    activeStep.value = 1
}

const handleSubmit = async () => {
    if (!formData.value.title || !formData.value.price) {
        ElMessage.warning('请填写完整信息')
        return
    }
    
    submitting.value = true
    try {
        // Construct the payload for creating a service
        const payload = {
            ...formData.value,
            category: selectedTemplate.value.category_name, // Pass category name
            categoryId: selectedTemplate.value.category_id, // Pass category ID
            // Ensure numeric conversions if needed (though backend handles some)
            price: Number(formData.value.price),
        }

        await providersApi.createService(payload)
        
        ElMessage.success('提交成功，等待审核')
        createDialogVisible.value = false
        fetchServices() // Refresh list
    } catch (e: any) {
        console.error(e)
        ElMessage.error(e.message || '提交失败')
    } finally {
        submitting.value = false
    }
}
</script>

<style scoped>
:deep(.el-tabs__nav-wrap::after) {
    height: 1px;
    background-color: transparent;
}
:deep(.el-tabs__item) {
    font-size: 14px;
    color: #6b7280;
    font-weight: normal;
}
:deep(.el-tabs__item.is-active) {
    color: #2563eb;
    font-weight: bold;
}
:deep(.el-tabs__active-bar) {
    background-color: #2563eb;
}
</style>
