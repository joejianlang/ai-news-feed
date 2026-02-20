<template>
  <div class="p-6">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
      <div class="flex items-center gap-3">
        <el-icon :size="26" color="#6366f1"><Files /></el-icon>
        <div>
          <h2 class="text-2xl font-bold">协议文档管理</h2>
          <p class="text-gray-400 text-sm mt-0.5">管理注册、隐私及广告服务的法律合规文档</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <el-button :icon="previewMode ? EditPen : View" @click="previewMode = !previewMode">
          {{ previewMode ? '返回编辑' : '实时预览' }}
        </el-button>
        <el-button type="primary" :loading="saving" :icon="Check" @click="handleSave">保 存</el-button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6" v-loading="loading">
      <!-- Sidebar -->
      <div class="lg:col-span-1 space-y-2">
        <div class="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-3">协议清单</div>
        <div
          v-for="(ag, key) in agreements"
          :key="key"
          class="p-3 rounded-xl cursor-pointer border-2 transition-all flex items-center gap-3"
          :class="activeKey === key
            ? 'bg-indigo-50 border-indigo-400 text-indigo-600'
            : 'bg-white border-transparent hover:border-gray-200 text-gray-500'"
          @click="activeKey = key; previewMode = false"
        >
          <div class="p-2 rounded-lg flex-shrink-0" :class="activeKey === key ? 'bg-indigo-500 text-white' : 'bg-gray-100'">
            <el-icon><Document /></el-icon>
          </div>
          <span class="font-semibold text-sm">{{ ag.title }}</span>
        </div>

        <!-- Info tip -->
        <div class="mt-6 p-3 bg-teal-50 border border-teal-100 rounded-xl text-xs text-teal-700 leading-relaxed">
          <div class="font-bold mb-1 flex items-center gap-1"><el-icon><InfoFilled /></el-icon> 排版说明</div>
          支持 Markdown 语法。# 代表一级标题，** 代表加粗。修改将实时同步到用户端弹窗中。
        </div>
      </div>

      <!-- Editor / Preview -->
      <div class="lg:col-span-3">
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col" style="height: 680px;">
          <!-- Title bar -->
          <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div class="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">协议显示名称</div>
            <el-input
              v-model="agreements[activeKey].title"
              variant="underline"
              class="text-xl font-bold"
              placeholder="输入协议标题..."
            />
          </div>

          <!-- Content area -->
          <div class="flex-1 overflow-hidden">
            <!-- Preview mode -->
            <div
              v-if="previewMode"
              class="h-full overflow-y-auto p-8 prose max-w-none text-sm leading-relaxed"
              v-html="renderMd(agreements[activeKey].content)"
            />
            <!-- Edit mode -->
            <el-input
              v-else
              v-model="agreements[activeKey].content"
              type="textarea"
              :rows="999"
              placeholder="在此输入协议正文内容，支持 Markdown..."
              class="agreement-editor h-full"
            />
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { agreementsApi } from '@/services/api'
import { Files, Document, InfoFilled, Check, View, EditPen } from '@element-plus/icons-vue'

interface Agreement { title: string; content: string }

const loading     = ref(false)
const saving      = ref(false)
const previewMode = ref(false)
const activeKey   = ref('agreement_registration')

const agreements = reactive<Record<string, Agreement>>({
  agreement_registration: { title: '用户注册协议', content: '' },
  agreement_privacy:      { title: '隐私政策/保密协议', content: '' },
  agreement_ad_service:   { title: '广告发布服务协议', content: '' },
})

// Simple Markdown renderer (headings, bold, lists, line breaks)
const renderMd = (text: string): string => {
  if (!text) return '<p class="text-gray-400 italic">（空白内容）</p>'
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-black mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$2</li>')
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br/>')
}

const fetchAgreements = async () => {
  loading.value = true
  try {
    const data = await agreementsApi.getAll()
    Object.keys(agreements).forEach(key => {
      if (data[key]) {
        if (typeof data[key] === 'object') {
          agreements[key] = data[key]
        } else {
          agreements[key].content = data[key]
        }
      }
    })
  } catch (e: any) {
    ElMessage.error(e.message || '加载协议失败')
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    await agreementsApi.save(activeKey.value, agreements[activeKey.value])
    ElMessage.success('协议已成功保存并立即生效')
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败，请检查网络')
  } finally {
    saving.value = false
  }
}

onMounted(fetchAgreements)
</script>

<style scoped>
.agreement-editor :deep(.el-textarea__inner) {
  height: 100% !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.7;
  resize: none;
}
</style>
