<template>
  <div class="news-admin">
    <div class="header">
      <h2>AI 新闻管理</h2>
      <el-button type="primary" @click="handleBatchClean">
        清理旧数据
      </el-button>
    </div>

    <!-- Filters -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="搜索标题..." clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="filters.categoryId" placeholder="全部分类" clearable @change="handleSearch">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="显示全部" clearable @change="handleSearch">
            <el-option label="已发布" value="published" />
            <el-option label="草稿/隐藏" value="draft" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Table -->
    <el-table :data="items" v-loading="loading" style="width: 100%; margin-top: 20px;" border stripe>
      <el-table-column prop="id" label="ID" width="100" show-overflow-tooltip />
      
      <el-table-column label="预览图" width="100">
        <template #default="{ row }">
          <el-image 
            v-if="row.image_url"
            :src="row.image_url" 
            style="width: 60px; height: 40px; border-radius: 4px;"
            fit="cover"
            :preview-src-list="[row.image_url]"
            preview-teleported
          />
          <span v-else class="text-gray-400 text-xs">无图</span>
        </template>
      </el-table-column>

      <el-table-column prop="title" label="标题" min-width="250">
        <template #default="{ row }">
          <div class="flex flex-col">
            <span class="font-bold text-slate-800">{{ row.title }}</span>
            <div class="mt-1 flex items-center gap-2">
              <el-tag size="small" type="info">{{ row.source?.name || '未知来源' }}</el-tag>
              <el-tag size="small" v-if="row.is_pinned" type="warning">置顶</el-tag>
              <el-tag size="small" v-if="row.is_video" type="success">视频</el-tag>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="category" label="分类" width="120">
        <template #default="{ row }">
          {{ row.categories?.name || '未分类' }}
        </template>
      </el-table-column>

      <el-table-column label="摘要" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="text-xs text-slate-500">{{ row.summary || '无内容摘要' }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="is_published" label="状态" width="100">
        <template #default="{ row }">
          <el-switch 
            v-model="row.is_published" 
            :loading="row.updating"
            @change="(val) => handleStatusChange(row, val)" 
          />
        </template>
      </el-table-column>

      <el-table-column prop="created_at" label="抓取时间" width="160">
        <template #default="{ row }">
          {{ new Date(row.created_at).toLocaleString('zh-CN', { hour12: false }) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handlePreview(row)">详情</el-button>
          <el-divider direction="vertical" />
          <el-popconfirm title="确定彻底删除这条新闻吗？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button link type="danger" size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- Detail Dialog -->
    <el-drawer v-model="drawer.visible" title="新闻详情" size="50%">
      <div v-if="drawer.data" class="news-detail">
        <h3>{{ drawer.data.title }}</h3>
        <p class="mt-2 text-sm text-slate-400">
          来源: {{ drawer.data.source?.name }} | 
          时间: {{ new Date(drawer.data.created_at).toLocaleString() }}
        </p>
        <el-divider />
        <div class="summary-section">
          <h4>AI 摘要</h4>
          <p class="text-slate-600 leading-relaxed">{{ drawer.data.summary }}</p>
        </div>
        <el-divider />
        <div class="content-section">
          <h4>原文内容</h4>
          <div class="text-slate-500 text-sm whitespace-pre-wrap">{{ drawer.data.content }}</div>
        </div>
        <div class="mt-8 flex justify-end">
           <el-button type="primary" link :href="drawer.data.original_url" target="_blank">查看原文</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { buffetApi, categoriesApi } from '@/services/api'

const loading = ref(false)
const items = ref([])
const categories = ref([])
const filters = reactive({
  keyword: '',
  categoryId: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const drawer = reactive({
  visible: false,
  data: null as any
})

const fetchCategories = async () => {
    try {
        const res = await categoriesApi.getAll()
        categories.value = res.categories
    } catch (e) {}
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await buffetApi.getNews({
      page: pagination.page,
      size: pagination.size,
      keyword: filters.keyword,
      categoryId: filters.categoryId,
      status: filters.status
    })
    items.value = res.items.map(i => ({ ...i, updating: false }))
    pagination.total = res.total
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const resetFilters = () => {
  filters.keyword = ''
  filters.categoryId = ''
  filters.status = ''
  handleSearch()
}

const handleSizeChange = (val: number) => {
  pagination.size = val
  fetchData()
}

const handlePageChange = (val: number) => {
  pagination.page = val
  fetchData()
}

const handleStatusChange = async (row: any, val: boolean) => {
  row.updating = true
  try {
    await buffetApi.updateNews(row.id, { is_published: val })
    ElMessage.success(val ? '已发布' : '已隐藏')
  } catch (e: any) {
    row.is_published = !val
    ElMessage.error(e.message || '更新失败')
  } finally {
    row.updating = false
  }
}

const handleDelete = async (id: string) => {
  try {
    await buffetApi.deleteNews(id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (e: any) {
    ElMessage.error(e.message || '删除失败')
  }
}

const handlePreview = (row: any) => {
  drawer.data = row
  drawer.visible = true
}

const handleBatchClean = () => {
    ElMessage.info('功能开发中...')
}

onMounted(() => {
  fetchCategories()
  fetchData()
})
</script>

<style scoped>
.news-admin {
  padding: 20px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.filter-card {
  margin-bottom: 20px;
  background-color: #fff;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.news-detail h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 800;
}
.news-detail h4 {
    margin-bottom: 10px;
}
</style>
