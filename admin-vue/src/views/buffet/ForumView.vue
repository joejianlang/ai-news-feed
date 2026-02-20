<template>
  <div class="p-6">

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
      <div class="flex items-center gap-3">
        <el-icon :size="26" color="#8b5cf6"><ChatDotRound /></el-icon>
        <div>
          <h2 class="text-2xl font-bold">社区内容治理</h2>
          <p class="text-gray-400 text-sm mt-0.5">审核并管理社区帖子，维护良好社区秩序</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <el-input v-model="keyword" placeholder="搜索标题、内容..." clearable style="width:220px" :prefix-icon="Search" @input="doFilter" />
        <el-select v-model="statusFilter" style="width:110px" @change="loadPosts">
          <el-option label="全部状态" value="" />
          <el-option label="正常" value="active" />
          <el-option label="已置顶" value="pinned" />
          <el-option label="已隐藏" value="hidden" />
        </el-select>
        <el-button :icon="Refresh" :loading="loading" @click="loadPosts">刷新</el-button>
      </div>
    </div>

    <!-- Post list -->
    <div v-loading="loading" class="space-y-3">
      <div
        v-for="post in filteredPosts"
        :key="post.id"
        class="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:border-violet-300 transition-all group"
      >
        <div class="flex items-start justify-between gap-4">
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="text-[10px] text-gray-300 font-mono uppercase">{{ post.id }}</span>
              <el-tag v-if="post.status === 'pinned'" type="warning" size="small">置顶</el-tag>
              <el-tag v-if="post.status === 'hidden'" type="danger" size="small">已隐藏</el-tag>
            </div>
            <h3 class="text-base font-bold text-gray-800 mb-1.5 group-hover:text-violet-600 transition-colors truncate">{{ post.title }}</h3>
            <p class="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-3">{{ post.content }}</p>
            <div class="flex items-center gap-5 text-xs text-gray-400">
              <span class="flex items-center gap-1">
                <el-icon><UserFilled /></el-icon>
                {{ post.author_name || post.users?.email || '匿名' }}
              </span>
              <span class="flex items-center gap-1">
                <el-icon><ChatDotRound /></el-icon>
                {{ post.comment_count || 0 }} 评论
              </span>
              <span>{{ formatTime(post.created_at) }}</span>
            </div>
          </div>

          <!-- Action buttons -->
          <div class="flex flex-col gap-2 flex-shrink-0">
            <!-- Pin toggle -->
            <el-tooltip :content="post.is_pinned || post.status === 'pinned' ? '取消置顶' : '置顶帖子'" placement="left">
              <el-button
                circle
                size="small"
                :type="post.is_pinned || post.status === 'pinned' ? 'warning' : ''"
                :icon="Top"
                @click="handleTogglePin(post)"
                :loading="post._loading"
              />
            </el-tooltip>
            <!-- Hide/Show toggle -->
            <el-tooltip :content="post.status === 'hidden' ? '恢复显示' : '隐藏帖子'" placement="left">
              <el-button
                circle
                size="small"
                :type="post.status === 'hidden' ? 'info' : ''"
                :icon="post.status === 'hidden' ? View : Hide"
                @click="handleToggleHide(post)"
                :loading="post._loading"
              />
            </el-tooltip>
            <!-- Delete -->
            <el-popconfirm title="确定永久删除这条帖子吗？" @confirm="handleDelete(post)">
              <template #reference>
                <el-button circle size="small" type="danger" :icon="Delete" :loading="post._loading" />
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>

      <el-empty v-if="!loading && filteredPosts.length === 0" description="暂无帖子" />
    </div>

    <!-- Pagination -->
    <div v-if="total > pageSize" class="mt-6 flex justify-center">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="loadPosts"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { forumApi } from '@/services/api'
import { ChatDotRound, Refresh, Search, UserFilled, Top, View, Hide, Delete } from '@element-plus/icons-vue'

const loading      = ref(false)
const posts        = ref<any[]>([])
const total        = ref(0)
const page         = ref(1)
const pageSize     = ref(50)
const keyword      = ref('')
const statusFilter = ref('')

const filteredPosts = computed(() => {
  if (!keyword.value) return posts.value
  const kw = keyword.value.toLowerCase()
  return posts.value.filter(p =>
    p.title?.toLowerCase().includes(kw) ||
    p.content?.toLowerCase().includes(kw)
  )
})

const formatTime = (ts: string) => {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const doFilter = () => { /* computed handles it */ }

const loadPosts = async () => {
  loading.value = true
  try {
    const res = await forumApi.getPosts({
      status: statusFilter.value || undefined,
      page: page.value,
      limit: pageSize.value,
    })
    posts.value = (res.posts || []).map((p: any) => ({ ...p, _loading: false }))
    total.value = res.total || 0
  } catch (e: any) {
    ElMessage.error(e.message || '加载帖子失败')
  } finally {
    loading.value = false
  }
}

const handleTogglePin = async (post: any) => {
  post._loading = true
  const nowPinned = post.is_pinned || post.status === 'pinned'
  try {
    await forumApi.updatePost(post.id, {
      is_pinned: !nowPinned,
      status: !nowPinned ? 'pinned' : 'active',
    })
    post.is_pinned = !nowPinned
    post.status = !nowPinned ? 'pinned' : 'active'
    ElMessage.success(!nowPinned ? '已置顶' : '已取消置顶')
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    post._loading = false
  }
}

const handleToggleHide = async (post: any) => {
  post._loading = true
  const nowHidden = post.status === 'hidden'
  try {
    await forumApi.updatePost(post.id, { status: nowHidden ? 'active' : 'hidden' })
    post.status = nowHidden ? 'active' : 'hidden'
    ElMessage.success(nowHidden ? '已恢复显示' : '帖子已隐藏')
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    post._loading = false
  }
}

const handleDelete = async (post: any) => {
  post._loading = true
  try {
    await forumApi.deletePost(post.id)
    posts.value = posts.value.filter(p => p.id !== post.id)
    ElMessage.success('帖子已删除')
  } catch (e: any) {
    ElMessage.error(e.message || '删除失败')
  } finally {
    post._loading = false
  }
}

onMounted(loadPosts)
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
