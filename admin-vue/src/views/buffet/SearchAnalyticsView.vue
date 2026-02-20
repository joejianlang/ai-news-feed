<template>
  <div class="p-6">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold">搜索分析</h2>
        <p class="text-gray-400 text-sm mt-1">了解用户搜索习惯，优化内容策略</p>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="loadAnalytics">刷新</el-button>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <el-card shadow="never" class="border border-gray-100">
        <div class="text-xs text-gray-400 uppercase font-semibold tracking-widest mb-2">总搜索次数</div>
        <div class="text-4xl font-black text-gray-800">{{ analytics?.totalSearches ?? '-' }}</div>
      </el-card>
      <el-card shadow="never" class="border border-gray-100">
        <div class="text-xs text-gray-400 uppercase font-semibold tracking-widest mb-2">唯一关键字</div>
        <div class="text-4xl font-black text-gray-800">{{ analytics?.totalUniqueKeywords ?? '-' }}</div>
      </el-card>
      <el-card shadow="never" class="border border-red-100 bg-red-50/40">
        <div class="text-xs text-red-400 uppercase font-semibold tracking-widest mb-2">高频无结果</div>
        <div class="text-4xl font-black text-red-500">{{ analytics?.hotNoResults?.length ?? '-' }}</div>
        <div class="text-xs text-red-400 mt-1 uppercase tracking-tight">需要添加源</div>
      </el-card>
    </div>

    <!-- Tabs + table -->
    <el-card shadow="never" class="border border-gray-100" v-loading="loading">
      <template #header>
        <el-tabs v-model="activeTab" @tab-change="onTabChange">
          <el-tab-pane label="所有搜索" name="all" />
          <el-tab-pane :label="`高频无结果 (${analytics?.hotNoResults?.length ?? 0})`" name="no-results" />
        </el-tabs>
      </template>

      <el-table :data="tableData" stripe style="width:100%">
        <el-table-column label="排名" width="70" align="center">
          <template #default="{ $index }">
            <span class="text-gray-400 font-mono text-sm">#{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="搜索关键字" min-width="160">
          <template #default="{ row }">
            <span class="font-semibold text-blue-600">{{ row.keyword }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_searches" label="总搜索次数" align="center" width="110">
          <template #default="{ row }">
            <span class="font-bold">{{ row.total_searches }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="searches_with_results" label="有结果" align="center" width="90">
          <template #default="{ row }">
            <span class="text-green-600 font-semibold">{{ row.searches_with_results }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="searches_without_results" label="无结果" align="center" width="90">
          <template #default="{ row }">
            <span class="text-red-500 font-semibold">{{ row.searches_without_results }}</span>
          </template>
        </el-table-column>
        <el-table-column label="平均结果数" align="center" width="110">
          <template #default="{ row }">
            <span class="text-gray-600">{{ Number(row.avg_results).toFixed(1) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="最后搜索" width="130">
          <template #default="{ row }">
            <span class="text-gray-400 text-xs">{{ formatDate(row.last_searched) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- Hint for no-results tab -->
      <el-alert
        v-if="activeTab === 'no-results' && tableData.length > 0"
        class="mt-4"
        title="内容建议"
        description="以上关键字搜索频率高但结果少，建议添加相关新闻源以提升用户体验。"
        type="warning"
        :closable="false"
        show-icon
      />

      <el-empty v-if="!loading && tableData.length === 0" description="暂无数据" />
    </el-card>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { searchAnalyticsApi } from '@/services/api'
import { Refresh } from '@element-plus/icons-vue'

const loading   = ref(false)
const analytics = ref<any>(null)
const activeTab = ref<'all' | 'no-results'>('all')

const tableData = computed(() => {
  if (!analytics.value) return []
  return activeTab.value === 'all' ? analytics.value.topSearches : analytics.value.hotNoResults
})

const formatDate = (ts: string) => {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const onTabChange = () => { /* computed handles it */ }

const loadAnalytics = async () => {
  loading.value = true
  try {
    analytics.value = await searchAnalyticsApi.getAnalytics()
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadAnalytics)
</script>
