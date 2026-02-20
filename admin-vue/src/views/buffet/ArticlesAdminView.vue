<template>
  <div class="p-6">

    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold">文章管理</h2>
        <p class="text-gray-400 text-sm mt-1">管理站内发布的数位 Buffet 原创深度文章</p>
      </div>
      <el-button type="primary" @click="openDialog()">
        <el-icon class="mr-1"><Plus /></el-icon>
        发布新文章
      </el-button>
    </div>

    <!-- Search bar -->
    <el-card shadow="never" class="mb-4 border-0">
      <el-input
        v-model="keyword"
        placeholder="搜索文章标题..."
        clearable
        @input="handleSearch"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
        <template #suffix>
          <span class="text-gray-400 text-xs pr-2">共 {{ filteredArticles.length }} 篇文章</span>
        </template>
      </el-input>
    </el-card>

    <!-- Table -->
    <el-card shadow="never" class="border-0">
      <el-table :data="filteredArticles" v-loading="loading" style="width: 100%">

        <!-- Article info -->
        <el-table-column label="文章信息" min-width="340">
          <template #default="{ row }">
            <div class="flex gap-3 items-start py-1">
              <el-image
                v-if="row.image_url"
                :src="row.image_url"
                style="width:60px;height:42px;border-radius:6px;flex-shrink:0;"
                fit="cover"
                :preview-src-list="[row.image_url]"
                preview-teleported
              />
              <div v-else class="w-15 h-10 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center text-gray-300 text-xs" style="width:60px;height:42px;">无图</div>
              <div class="min-w-0">
                <div class="font-semibold text-gray-800 truncate leading-snug">{{ row.title }}</div>
                <div class="text-xs text-gray-400 mt-1 line-clamp-1">{{ row.ai_summary || '暂无摘要' }}</div>
                <div class="flex gap-2 mt-1 flex-wrap">
                  <el-tag v-if="row.author_name" size="small" type="info">{{ row.author_name }}</el-tag>
                  <el-tag v-if="row.is_pinned" size="small" type="warning">已置顶</el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Status -->
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.is_published"
              :loading="row._updating"
              active-text="已发布"
              inactive-text="已下架"
              inline-prompt
              @change="(val: boolean) => handleTogglePublish(row, val)"
            />
          </template>
        </el-table-column>

        <!-- Pin -->
        <el-table-column label="置顶" width="80" align="center">
          <template #default="{ row }">
            <el-tooltip :content="row.is_pinned ? '取消置顶' : '设为置顶'" placement="top">
              <el-icon
                :size="20"
                :color="row.is_pinned ? '#f59e0b' : '#d1d5db'"
                class="cursor-pointer hover:opacity-70"
                @click="handleTogglePin(row)"
              >
                <TopRight />
              </el-icon>
            </el-tooltip>
          </template>
        </el-table-column>

        <!-- Time -->
        <el-table-column label="发布时间" width="150">
          <template #default="{ row }">
            <span class="text-gray-500 text-sm">{{ formatTime(row.created_at) }}</span>
          </template>
        </el-table-column>

        <!-- Actions -->
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDialog(row)">
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-divider direction="vertical" />
            <el-popconfirm title="确定永久删除这篇文章吗？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button link type="danger" size="small">
                  <el-icon><Delete /></el-icon> 删除
                </el-button>
              </template>
            </el-popconfirm>
            <el-divider direction="vertical" />
            <el-tooltip content="查看原文" placement="top">
              <el-button link type="info" size="small" @click="openOriginal(row)">
                <el-icon><Link /></el-icon>
              </el-button>
            </el-tooltip>
          </template>
        </el-table-column>

      </el-table>
    </el-card>

    <!-- Create / Edit Dialog -->
    <el-dialog
      :title="form.id ? '编辑文章' : '发布新文章'"
      v-model="dialogVisible"
      width="860px"
      :close-on-click-modal="false"
      top="5vh"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item label="文章标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入文章标题" maxlength="200" show-word-limit />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="作者署名">
              <el-input v-model="form.authorName" placeholder="留空则不显示作者" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="封面图URL">
              <el-input v-model="form.imageUrl" placeholder="https://..." />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="摘要">
          <el-input
            v-model="form.summary"
            type="textarea"
            :rows="2"
            placeholder="简短描述文章核心内容（可选）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <!-- Editor toolbar -->
        <el-form-item label="正文内容" prop="content">
          <div class="editor-wrap">
            <!-- Toolbar -->
            <div class="editor-toolbar">
              <!-- Image URL insert -->
              <div class="toolbar-group">
                <el-icon class="toolbar-icon"><Picture /></el-icon>
                <el-input
                  v-model="insertImageUrl"
                  placeholder="粘贴图片 URL..."
                  size="small"
                  class="toolbar-input"
                  @keydown.enter.prevent="insertImage"
                />
                <el-button size="small" type="primary" plain @click="insertImage" :disabled="!insertImageUrl.trim()">
                  插入图片
                </el-button>
              </div>

              <el-divider direction="vertical" style="height:28px;margin:0 4px;" />

              <!-- YouTube / Video URL insert -->
              <div class="toolbar-group">
                <el-icon class="toolbar-icon"><VideoPlay /></el-icon>
                <el-input
                  v-model="insertVideoUrl"
                  placeholder="YouTube 或视频 URL..."
                  size="small"
                  class="toolbar-input"
                  @keydown.enter.prevent="insertVideo"
                />
                <el-button size="small" type="primary" plain @click="insertVideo" :disabled="!insertVideoUrl.trim()">
                  插入视频
                </el-button>
              </div>
            </div>

            <!-- Textarea -->
            <el-input
              ref="contentInputRef"
              v-model="form.content"
              type="textarea"
              :rows="16"
              placeholder="支持 Markdown 格式，图片使用 ![描述](图片URL) 语法"
              class="article-editor"
              @click="saveSelection"
              @keyup="saveSelection"
            />
          </div>
        </el-form-item>

        <el-form-item label="发布状态">
          <el-radio-group v-model="form.isPublished">
            <el-radio :value="true">立即发布</el-radio>
            <el-radio :value="false">保存草稿</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ form.id ? '保存修改' : '发布文章' }}
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { buffetArticlesApi } from '@/services/api'
import { Plus, Search, Edit, Delete, Link, TopRight, Picture, VideoPlay } from '@element-plus/icons-vue'

// ── State ──────────────────────────────────────────
const loading = ref(false)
const articles = ref<any[]>([])
const keyword = ref('')

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref()
const contentInputRef = ref()

// Insert toolbar state
const insertImageUrl = ref('')
const insertVideoUrl = ref('')
let cursorStart = 0
let cursorEnd = 0

const form = reactive({
  id: '',
  title: '',
  content: '',
  summary: '',
  imageUrl: '',
  authorName: '',
  isPublished: true,
})

const rules = {
  title:   [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入文章正文', trigger: 'blur' }],
}

// ── Computed ───────────────────────────────────────
const filteredArticles = computed(() => {
  if (!keyword.value) return articles.value
  const kw = keyword.value.toLowerCase()
  return articles.value.filter(a => a.title?.toLowerCase().includes(kw))
})

// ── Helpers ────────────────────────────────────────
const formatTime = (ts: string) => {
  if (!ts) return '-'
  const d = new Date(ts)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 3600)   return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400)  return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`
  return d.toLocaleDateString()
}

const handleSearch = () => { /* reactively filtered via computed */ }

// ── Cursor tracking ────────────────────────────────
const saveSelection = () => {
  const textarea = contentInputRef.value?.$el?.querySelector('textarea')
  if (textarea) {
    cursorStart = textarea.selectionStart ?? form.content.length
    cursorEnd   = textarea.selectionEnd   ?? form.content.length
  }
}

// Insert markdown snippet at last cursor position
const insertAtCursor = (snippet: string) => {
  const before = form.content.slice(0, cursorStart)
  const after  = form.content.slice(cursorEnd)
  const needsNewlineBefore = before.length > 0 && !before.endsWith('\n')
  const needsNewlineAfter  = after.length  > 0 && !after.startsWith('\n')
  const inserted = (needsNewlineBefore ? '\n' : '') + snippet + (needsNewlineAfter ? '\n' : '')
  form.content = before + inserted + after

  // Move cursor to end of inserted text
  const newPos = cursorStart + inserted.length
  cursorStart = newPos
  cursorEnd   = newPos

  // Restore focus + cursor after Vue updates DOM
  nextTick(() => {
    const textarea = contentInputRef.value?.$el?.querySelector('textarea')
    if (textarea) {
      textarea.focus()
      textarea.setSelectionRange(newPos, newPos)
    }
  })
}

// ── Image insert ───────────────────────────────────
const insertImage = () => {
  const url = insertImageUrl.value.trim()
  if (!url) return
  insertAtCursor(`![图片](${url})`)
  insertImageUrl.value = ''
  ElMessage.success('图片已插入')
}

// ── Video insert ───────────────────────────────────
const getYoutubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

const insertVideo = () => {
  const url = insertVideoUrl.value.trim()
  if (!url) return

  const ytId = getYoutubeId(url)
  if (ytId) {
    // YouTube embed as HTML iframe (renders in most Markdown renderers)
    insertAtCursor(
      `<iframe width="560" height="315" src="https://www.youtube.com/embed/${ytId}" ` +
      `frameborder="0" allowfullscreen></iframe>`
    )
    ElMessage.success('YouTube 视频已插入')
  } else {
    // Generic video link as Markdown
    insertAtCursor(`[视频链接](${url})`)
    ElMessage.success('视频链接已插入')
  }
  insertVideoUrl.value = ''
}

// ── Data Fetching ──────────────────────────────────
const fetchArticles = async () => {
  loading.value = true
  try {
    const res = await buffetArticlesApi.getAll()
    articles.value = (res.articles || []).map((a: any) => ({ ...a, _updating: false }))
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// ── Dialog ─────────────────────────────────────────
const openDialog = (row?: any) => {
  if (row) {
    form.id          = row.id
    form.title       = row.title || ''
    form.content     = row.content || ''
    form.summary     = row.ai_summary || ''
    form.imageUrl    = row.image_url || ''
    form.authorName  = row.author_name || ''
    form.isPublished = row.is_published ?? true
  } else {
    form.id          = ''
    form.title       = ''
    form.content     = ''
    form.summary     = ''
    form.imageUrl    = ''
    form.authorName  = ''
    form.isPublished = true
  }
  insertImageUrl.value = ''
  insertVideoUrl.value = ''
  cursorStart = 0
  cursorEnd   = 0
  dialogVisible.value = true
}

// ── Submit ─────────────────────────────────────────
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    submitting.value = true
    try {
      if (form.id) {
        await buffetArticlesApi.update({
          id:          form.id,
          title:       form.title,
          content:     form.content,
          summary:     form.summary || undefined,
          imageUrl:    form.imageUrl || undefined,
          authorName:  form.authorName || undefined,
          isPublished: form.isPublished,
        })
        ElMessage.success('文章已更新')
      } else {
        await buffetArticlesApi.create({
          title:      form.title,
          content:    form.content,
          summary:    form.summary || undefined,
          imageUrl:   form.imageUrl || undefined,
          authorName: form.authorName || undefined,
        })
        ElMessage.success('文章已发布')
      }
      dialogVisible.value = false
      fetchArticles()
    } catch (e: any) {
      ElMessage.error(e.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// ── Toggle publish ─────────────────────────────────
const handleTogglePublish = async (row: any, val: boolean) => {
  row._updating = true
  try {
    await buffetArticlesApi.update({ id: row.id, isPublished: val })
    ElMessage.success(val ? '已发布' : '已下架')
  } catch (e: any) {
    row.is_published = !val
    ElMessage.error(e.message || '操作失败')
  } finally {
    row._updating = false
  }
}

// ── Toggle pin ─────────────────────────────────────
const handleTogglePin = async (row: any) => {
  const newVal = !row.is_pinned
  try {
    await buffetArticlesApi.update({ id: row.id, isPinned: newVal })
    row.is_pinned = newVal
    ElMessage.success(newVal ? '已置顶' : '已取消置顶')
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

// ── Delete ─────────────────────────────────────────
const handleDelete = async (id: string) => {
  try {
    await buffetArticlesApi.delete(id)
    ElMessage.success('已删除')
    fetchArticles()
  } catch (e: any) {
    ElMessage.error(e.message || '删除失败')
  }
}

// ── Open original ──────────────────────────────────
const openOriginal = (row: any) => {
  if (row.original_url) window.open(row.original_url, '_blank')
}

onMounted(fetchArticles)
</script>

<style scoped>
.editor-wrap {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: #f8f9fb;
  border-bottom: 1px solid #e4e7ed;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toolbar-icon {
  color: #606266;
  font-size: 16px;
  flex-shrink: 0;
}

.toolbar-input {
  width: 220px;
}

/* Remove inner border from textarea since wrapper has border */
.editor-wrap :deep(.el-textarea__inner) {
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.article-editor :deep(textarea) {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
