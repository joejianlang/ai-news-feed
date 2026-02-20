<template>
  <div class="p-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
    </div>

    <!-- Editor -->
    <div v-else-if="blueprint">
      <!-- Header -->
      <div class="mb-6 flex justify-between items-center">
        <div>
          <el-button link @click="$router.back()" class="mb-2">
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
          <h1 class="text-2xl font-bold text-gray-800">{{ isNew ? '新建模版' : '编辑模版' }}</h1>
          <p class="text-gray-500 mt-1">{{ blueprint.name || '未命名模版' }}</p>
        </div>
        <div class="flex gap-2">
          <el-button @click="saveBlueprint(false)">保存草稿</el-button>
          <el-button type="primary" @click="saveBlueprint(true)">
            {{ blueprint.status === 'published' ? '更新并发布' : '保存并发布' }}
          </el-button>
        </div>
      </div>

      <!-- Tabs -->
      <el-tabs v-model="activeTab" class="blueprint-tabs">
        <!-- Basic Info Tab -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form :model="blueprint" label-width="120px" class="max-w-3xl">
            <el-form-item label="模版名称" required>
              <el-input v-model="blueprint.name" placeholder="例如：深度清洁服务" />
            </el-form-item>
            <el-form-item label="模版描述">
              <el-input 
                v-model="blueprint.description" 
                type="textarea" 
                :rows="3"
                placeholder="简要描述该模版的用途和特点"
              />
            </el-form-item>
            <el-form-item label="模版类型" required>
              <el-select v-model="blueprint.template_type" placeholder="请选择模版类型" style="width: 100%">
                <el-option label="标准服务模版" value="standard_service" />
                <el-option label="简单定制模版" value="simple_custom" />
                <el-option label="复杂定制模版" value="complex_custom" />
              </el-select>
            </el-form-item>
            <el-form-item label="服务类别" required>
              <el-select v-model="blueprint.category" placeholder="请选择服务类别" style="width: 100%">
                <el-option
                  v-for="cat in categories"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.name"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-radio-group v-model="blueprint.status">
                <el-radio value="draft">草稿</el-radio>
                <el-radio value="published">已发布</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="推荐模版">
              <el-switch v-model="blueprint.is_featured" />
              <span class="text-sm text-gray-500 ml-2">推荐模版会优先展示给服务商</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Pre-filled Content Tab -->
        <el-tab-pane label="预填内容" name="content">
          <div class="max-w-3xl">
            <p class="text-gray-600 mb-4">设置服务商克隆此模版时的预填内容</p>
            <el-form :model="preFilledContent" label-width="120px">
              <el-form-item label="服务标题">
                <el-input v-model="preFilledContent.title" placeholder="例如：专业深度清洁服务" />
              </el-form-item>
              <el-form-item label="服务描述">
                <el-input 
                  v-model="preFilledContent.description" 
                  type="textarea" 
                  :rows="4"
                  placeholder="详细描述服务内容、流程、优势等"
                />
              </el-form-item>
              <el-form-item label="服务亮点">
                <div class="space-y-2">
                  <div v-for="(highlight, index) in preFilledContent.highlights" :key="index" class="flex gap-2">
                    <el-input v-model="preFilledContent.highlights[index]" placeholder="输入亮点" />
                    <el-button type="danger" text @click="removeHighlight(Number(index))">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                  <el-button @click="addHighlight" text>
                    <el-icon><Plus /></el-icon>
                    添加亮点
                  </el-button>
                </div>
              </el-form-item>
              <el-form-item label="参考价格">
                <el-input v-model="preFilledContent.price" placeholder="例如：¥299起" />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- SOP Tab -->
        <el-tab-pane label="SOP 流程" name="sop">
          <div class="max-w-4xl">
            <p class="text-gray-600 mb-4">编写标准操作流程，帮助服务商了解服务执行步骤</p>
            <el-input 
              v-model="blueprint.sop_content" 
              type="textarea" 
              :rows="20"
              placeholder="请输入 SOP 流程内容，支持 Markdown 格式&#10;&#10;示例：&#10;## 服务前准备&#10;1. 确认客户需求&#10;2. 准备清洁工具和用品&#10;&#10;## 服务执行&#10;1. 到达现场，与客户确认服务范围&#10;2. 开始清洁工作..."
            />
            <div class="mt-2 text-sm text-gray-500">
              <el-icon><InfoFilled /></el-icon>
              支持 Markdown 格式，可使用 # 标题、- 列表、**粗体** 等
            </div>
          </div>
        </el-tab-pane>

        <!-- FAQ Tab -->
        <el-tab-pane label="FAQ 问答" name="faq">
          <div class="max-w-3xl">
            <p class="text-gray-600 mb-4">添加常见问题和解答</p>
            <div class="space-y-4">
              <el-card v-for="(faq, index) in faqContent" :key="index" shadow="never">
                <div class="flex justify-between items-start mb-2">
                  <span class="text-sm font-bold text-gray-700">问题 {{ index + 1 }}</span>
                  <el-button type="danger" text size="small" @click="removeFaq(index)">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
                <el-form label-width="60px">
                  <el-form-item label="问题">
                    <el-input v-model="faq.question" placeholder="输入问题" />
                  </el-form-item>
                  <el-form-item label="回答">
                    <el-input 
                      v-model="faq.answer" 
                      type="textarea" 
                      :rows="3"
                      placeholder="输入回答"
                    />
                  </el-form-item>
                </el-form>
              </el-card>
              <el-button @click="addFaq" class="w-full">
                <el-icon><Plus /></el-icon>
                添加问题
              </el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- Pricing Guide Tab -->
        <el-tab-pane label="定价指南" name="pricing">
          <div class="max-w-3xl">
            <p class="text-gray-600 mb-4">设置定价参考和计费方式</p>
            <el-form :model="pricingGuide" label-width="120px">
              <el-form-item label="基础价格">
                <el-input v-model="pricingGuide.base_price" placeholder="例如：299" type="number">
                  <template #prepend>¥</template>
                </el-input>
              </el-form-item>
              <el-form-item label="计费单位">
                <el-input v-model="pricingGuide.unit" placeholder="例如：次、小时、平方米" />
              </el-form-item>
              <el-form-item label="价格说明">
                <el-input 
                  v-model="pricingGuide.description" 
                  type="textarea" 
                  :rows="3"
                  placeholder="说明价格包含的内容和计费方式"
                />
              </el-form-item>
              <el-form-item label="附加项目">
                <div class="space-y-2">
                  <div v-for="(addon, index) in pricingGuide.addons" :key="index" class="flex gap-2 items-center">
                    <el-input v-model="addon.name" placeholder="项目名称" style="flex: 2" />
                    <el-input v-model="addon.price" placeholder="价格" type="number" style="flex: 1">
                      <template #prepend>¥</template>
                    </el-input>
                    <el-button type="danger" text @click="removeAddon(Number(index))">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                  <el-button @click="addAddon" text>
                    <el-icon><Plus /></el-icon>
                    添加附加项目
                  </el-button>
                </div>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- Error State -->
    <div v-else class="text-center py-20">
      <el-icon :size="64" class="text-gray-300 mb-4"><WarningFilled /></el-icon>
      <p class="text-gray-400 text-lg">加载失败</p>
      <el-button @click="$router.back()" class="mt-4">返回列表</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ArrowLeft, Loading, Plus, Delete, InfoFilled, WarningFilled 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { blueprintsApi, categoriesApi } from '../../services/api'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const activeTab = ref('basic')
const isNew = ref(false)

const blueprint = ref<any>(null)
const preFilledContent = reactive<any>({
  title: '',
  description: '',
  highlights: [],
  price: ''
})
const faqContent = ref<any[]>([])
const pricingGuide = reactive<any>({
  base_price: '',
  unit: '',
  description: '',
  addons: []
})
const categories = ref<any[]>([]) // Store dynamic categories

// Fetch categories
const fetchCategories = async () => {
    try {
        const res = await categoriesApi.getAll()
        categories.value = res.categories || []
    } catch (error) {
        console.error('Failed to fetch categories:', error)
    }
}

// Load blueprint data
const loadBlueprint = async () => {
  await fetchCategories() // Load categories first

  const id = route.params.id as string
  
  if (id === 'new') {
    isNew.value = true
    blueprint.value = {
      name: '',
      description: '',
      category: '',
      template_type: 'standard_service', // Default
      status: 'draft',
      is_featured: false,
      sop_content: '',
      pre_filled_content: {},
      faq_content: [],
      pricing_guide: {}
    }
    return
  }

  loading.value = true
  try {
    const response = await blueprintsApi.getById(id)
    blueprint.value = response.blueprint
    
    // Parse JSON fields
    if (blueprint.value.pre_filled_content) {
      Object.assign(preFilledContent, blueprint.value.pre_filled_content)
      if (!preFilledContent.highlights) {
        preFilledContent.highlights = []
      }
    }
    if (blueprint.value.faq_content) {
      faqContent.value = blueprint.value.faq_content
    }
    if (blueprint.value.pricing_guide) {
      Object.assign(pricingGuide, blueprint.value.pricing_guide)
      if (!pricingGuide.addons) {
        pricingGuide.addons = []
      }
    }
  } catch (error: any) {
    ElMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// Save blueprint
const saveBlueprint = async (publish: boolean) => {
  if (!blueprint.value.name || !blueprint.value.category) {
    ElMessage.warning('请填写必填项')
    activeTab.value = 'basic'
    return
  }

  try {
    const data = {
      ...blueprint.value,
      status: publish ? 'published' : 'draft',
      pre_filled_content: preFilledContent,
      faq_content: faqContent.value,
      pricing_guide: pricingGuide
    }

    if (isNew.value) {
      const response = await blueprintsApi.create(data)
      ElMessage.success('创建成功')
      router.replace(`/dashboard/blueprints/${response.blueprint.id}`)
      isNew.value = false
    } else {
      await blueprintsApi.update(blueprint.value.id, data)
      ElMessage.success(publish ? '发布成功' : '保存成功')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败')
  }
}

// Highlights management
const addHighlight = () => {
  preFilledContent.highlights.push('')
}

const removeHighlight = (index: number) => {
  preFilledContent.highlights.splice(index, 1)
}

// FAQ management
const addFaq = () => {
  faqContent.value.push({ question: '', answer: '' })
}

const removeFaq = (index: number) => {
  faqContent.value.splice(index, 1)
}

// Pricing addons management
const addAddon = () => {
  pricingGuide.addons.push({ name: '', price: '' })
}

const removeAddon = (index: number) => {
  pricingGuide.addons.splice(index, 1)
}

onMounted(() => {
  loadBlueprint()
})
</script>

<style scoped>
.blueprint-tabs :deep(.el-tabs__content) {
  padding-top: 20px;
}
</style>
