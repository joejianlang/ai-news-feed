<template>
  <div class="p-6">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold">AI 配置</h2>
        <p class="text-gray-400 text-sm mt-1">系统神经元与逻辑模板配置，下次抓取时生效</p>
      </div>
      <el-button type="primary" :loading="saving" :icon="Check" @click="handleSave">保存配置</el-button>
    </div>

    <div v-loading="loading" class="space-y-6 max-w-4xl">

      <!-- 内容过滤规则 -->
      <el-card shadow="never" class="border border-gray-100">
        <template #header>
          <div class="flex items-center gap-2 font-semibold">
            <span class="text-lg">🚫</span> 内容过滤规则
          </div>
          <p class="text-xs text-gray-400 mt-1">AI 会自动跳过符合以下规则的内容，每行一条规则</p>
        </template>
        <el-input
          v-model="form.filter_rules"
          type="textarea"
          :rows="8"
          placeholder="每行一条过滤规则..."
          class="config-textarea"
        />
      </el-card>

      <!-- 新闻分类配置 -->
      <el-card shadow="never" class="border border-gray-100">
        <template #header>
          <div class="flex items-center gap-2 font-semibold">
            <span class="text-lg">🏷️</span> 新闻分类配置
          </div>
        </template>
        <div class="space-y-5">
          <div>
            <div class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">分类类别（每行一个）</div>
            <el-input v-model="form.classification_categories" type="textarea" :rows="4" placeholder="本地&#10;热点&#10;政治&#10;科技..." class="config-textarea" />
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">分类优先级规则</div>
            <el-input v-model="form.classification_rules" type="textarea" :rows="6" placeholder="1. 本地：提到加拿大城市...&#10;2. 热点：突发事件..." class="config-textarea" />
          </div>
          <div>
            <div class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">加拿大城市列表（用于本地新闻识别）</div>
            <el-input v-model="form.canadian_cities" type="textarea" :rows="5" placeholder="Ontario: Toronto, Mississauga...&#10;BC: Vancouver, Richmond..." class="config-textarea" />
          </div>
        </div>
      </el-card>

      <!-- 摘要要求 -->
      <el-card shadow="never" class="border border-gray-100">
        <template #header>
          <div class="flex items-center gap-2 font-semibold">
            <span class="text-lg">📝</span> 摘要生成要求
          </div>
          <p class="text-xs text-gray-400 mt-1">定义 AI 如何生成内容摘要</p>
        </template>
        <el-input v-model="form.summary_requirements" placeholder="例如：80-150字，概括核心内容..." />
      </el-card>

      <!-- 评论要求 -->
      <el-card shadow="never" class="border border-gray-100">
        <template #header>
          <div class="flex items-center gap-2 font-semibold">
            <span class="text-lg">💬</span> 评论生成要求
          </div>
          <p class="text-xs text-gray-400 mt-1">定义 AI 评论的风格和语言要求</p>
        </template>
        <el-input v-model="form.commentary_requirements" type="textarea" :rows="3" placeholder="例如：幽默犀利，有深度有趣味..." class="config-textarea" />
      </el-card>

      <!-- 评论字数 -->
      <el-card shadow="never" class="border border-gray-100">
        <template #header>
          <div class="flex items-center gap-2 font-semibold">
            <span class="text-lg">📏</span> 评论字数要求
          </div>
        </template>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="文章评论" label-position="top">
              <el-input v-model="form.commentary_length_article" placeholder="300-500字" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="视频评论" label-position="top">
              <el-input v-model="form.commentary_length_video" placeholder="150-250字" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="深度分析" label-position="top">
              <el-input v-model="form.commentary_length_deep_dive" placeholder="800-1000字" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- Last updated -->
      <p v-if="lastUpdated" class="text-center text-xs text-gray-400">最后更新：{{ lastUpdated }}</p>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { aiConfigApi } from '@/services/api'
import { Check } from '@element-plus/icons-vue'

const loading    = ref(false)
const saving     = ref(false)
const lastUpdated = ref('')

const form = reactive({
  filter_rules: '',
  summary_requirements: '',
  commentary_requirements: '',
  commentary_length_article: '',
  commentary_length_video: '',
  commentary_length_deep_dive: '',
  classification_categories: '',
  classification_rules: '',
  canadian_cities: '',
})

const loadConfig = async () => {
  loading.value = true
  try {
    const data = await aiConfigApi.getConfig()
    const keys = Object.keys(form) as (keyof typeof form)[]
    keys.forEach(k => {
      if (data[k]) form[k] = data[k].value
    })
    if (data.filter_rules?.updated_at) {
      lastUpdated.value = new Date(data.filter_rules.updated_at).toLocaleString('zh-CN')
    }
  } catch (e: any) {
    ElMessage.error(e.message || '加载配置失败')
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    const payload: Record<string, string> = {}
    const keys = Object.keys(form) as (keyof typeof form)[]
    keys.forEach(k => { payload[k] = form[k] })
    await aiConfigApi.saveConfig(payload)
    ElMessage.success('配置已保存，下次抓取时生效')
    loadConfig()
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败，请重试')
  } finally {
    saving.value = false
  }
}

onMounted(loadConfig)
</script>

<style scoped>
.config-textarea :deep(.el-textarea__inner) {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.7;
}
</style>
