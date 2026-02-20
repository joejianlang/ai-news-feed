<template>
  <div class="article-list">
    <div class="header">
      <h2>内容管理</h2>
      <el-button type="primary" @click="$router.push('/dashboard/cms/create')">
        发布新内容
      </el-button>
    </div>

    <!-- Filters -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="类型">
          <el-select v-model="filters.type" placeholder="全部类型" clearable @change="fetchArticles">
            <el-option label="文章资讯" value="article" />
            <el-option label="协议政策" value="policy" />
            <el-option label="系统公告" value="announcement" />
            <el-option label="常见问题" value="faq" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
            <el-select v-model="filters.status" placeholder="全部状态" clearable @change="fetchArticles">
              <el-option label="已发布" value="published" />
              <el-option label="草稿" value="draft" />
              <el-option label="已归档" value="archived" />
            </el-select>
        </el-form-item>
        <el-form-item>
           <el-button @click="fetchArticles">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Table -->
    <el-table :data="articles" v-loading="loading" style="width: 100%; margin-top: 20px;" border>
      <el-table-column prop="id" label="ID" width="80" />
      
      <el-table-column label="封面" width="100">
        <template #default="{ row }">
          <el-image 
            v-if="row.cover_image"
            :src="row.cover_image" 
            style="width: 60px; height: 40px; border-radius: 4px;"
            fit="cover"
            :preview-src-list="[row.cover_image]"
          />
          <span v-else class="text-gray-400 text-xs">无封面</span>
        </template>
      </el-table-column>

      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip>
         <template #default="{ row }">
             <span class="font-bold">{{ row.title }}</span>
             <br/>
             <el-tag size="small" type="info" v-if="row.slug">{{ row.slug }}</el-tag>
         </template>
      </el-table-column>

      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getTypeTag(row.type)">{{ getTypeLabel(row.type) }}</el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="category" label="分类" width="100">
         <template #default="{ row }">
             {{ row.category || '-' }}
         </template>
      </el-table-column>

      <el-table-column prop="views" label="阅读量" width="100" />
      
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'warning'">
                {{ row.status === 'published' ? '已发布' : (row.status === 'draft' ? '草稿' : '归档') }}
            </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="updated_at" label="最后更新" width="180">
        <template #default="{ row }">
          {{ new Date(row.updated_at).toLocaleString() }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="$router.push(`/dashboard/cms/edit/${row.id}`)">编辑</el-button>
          <el-popconfirm title="确定删除吗？" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button link type="danger" size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { cmsApi } from '@/services/api'

const loading = ref(false)
const articles = ref([])
const filters = ref({
  type: '',
  status: ''
})

const fetchArticles = async () => {
  loading.value = true
  try {
    const res = await cmsApi.getAll({
      type: filters.value.type || undefined,
      status: filters.value.status || 'all',
    })
    articles.value = res.articles || []
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleDelete = async (id: number) => {
    try {
        await cmsApi.delete(id)
        ElMessage.success('删除成功')
        fetchArticles()
    } catch (e: any) {
        ElMessage.error(e.message || '删除失败')
    }
}

const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
        'article': '文章资讯',
        'policy': '协议政策',
        'announcement': '系统公告',
        'faq': '常见问题'
    }
    return map[type] || type
}

const getTypeTag = (type: string): string | undefined => {
    const map: Record<string, string | undefined> = {
        'article': undefined,
        'policy': 'warning',
        'announcement': 'danger',
        'faq': 'info'
    }
    // Return undefined (not empty string) so el-tag uses its default style
    return Object.prototype.hasOwnProperty.call(map, type) ? map[type] : undefined
}

onMounted(() => {
  fetchArticles()
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.filter-card {
    margin-bottom: 20px;
}
</style>
