<template>
  <div class="p-6">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <el-icon :size="28" color="#0d9488"><TrendCharts /></el-icon>
        <div>
          <h2 class="text-2xl font-bold">抓取质量分析面板</h2>
          <p class="text-gray-400 text-sm mt-0.5">监控内容抓取流水线性能与失败原因</p>
        </div>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="loadStats">刷新</el-button>
    </div>

    <!-- Summary cards -->
    <div v-if="stats" class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <el-card shadow="never" class="border-0 bg-teal-50">
        <div class="text-xs text-gray-400 uppercase font-semibold mb-1">今日发布</div>
        <div class="text-3xl font-black text-teal-600">{{ stats.summary?.today?.count ?? 0 }}</div>
      </el-card>
      <el-card shadow="never" class="border-0 bg-blue-50">
        <div class="text-xs text-gray-400 uppercase font-semibold mb-1">本月累计</div>
        <div class="text-3xl font-black text-blue-600">{{ stats.summary?.month?.count ?? 0 }}</div>
      </el-card>
      <el-card shadow="never" class="border-0 bg-gray-50">
        <div class="text-xs text-gray-400 uppercase font-semibold mb-1">最近批次抓取数</div>
        <div class="text-3xl font-black text-gray-700">{{ stats.recentLogs?.[0]?.total_scraped ?? 0 }}</div>
      </el-card>
      <el-card shadow="never" class="border-0 bg-green-50">
        <div class="text-xs text-gray-400 uppercase font-semibold mb-1">最近批次成功率</div>
        <div class="text-3xl font-black text-green-600">{{ latestSuccessRate }}</div>
      </el-card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: daily stats + batch logs -->
      <div class="lg:col-span-2 space-y-5">

        <!-- 7-day table -->
        <el-card shadow="never" class="border border-gray-100">
          <template #header>
            <div class="flex items-center gap-2 text-sm font-semibold">
              <el-icon><Calendar /></el-icon>
              最近 7 天统计
            </div>
          </template>
          <el-table :data="stats?.dailyStats || []" v-loading="loading" size="small" stripe>
            <el-table-column prop="date" label="日期" width="110" />
            <el-table-column prop="total_scraped" label="总抓取" align="center" />
            <el-table-column prop="published" label="已发布" align="center">
              <template #default="{ row }">
                <span class="text-teal-600 font-semibold">{{ row.published }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="duplicates" label="去重过滤" align="center">
              <template #default="{ row }"><span class="text-gray-400">{{ row.duplicates }}</span></template>
            </el-table-column>
            <el-table-column prop="ai_skipped" label="AI过滤" align="center">
              <template #default="{ row }"><span class="text-gray-400">{{ row.ai_skipped }}</span></template>
            </el-table-column>
            <el-table-column prop="ai_failed" label="失败" align="center">
              <template #default="{ row }"><span class="text-red-400">{{ row.ai_failed }}</span></template>
            </el-table-column>
            <el-table-column label="成功率" align="center" width="90">
              <template #default="{ row }">
                <el-tag type="success" size="small">{{ row.successRate }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- Batch log list -->
        <el-card shadow="never" class="border border-gray-100">
          <template #header>
            <div class="flex items-center gap-2 text-sm font-semibold">
              <el-icon><Clock /></el-icon>
              抓取历史明细（前 30 次）
            </div>
          </template>
          <div class="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            <div
              v-for="log in stats?.recentLogs || []"
              :key="log.id"
              class="border border-gray-100 rounded-xl p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              @click="toggleLog(log.id)"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs text-gray-400">{{ formatTime(log.started_at) }}</span>
                  <el-tag :type="logStatusType(log)" size="small">{{ logStatusLabel(log) }}</el-tag>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-gray-500">成功率 <b>{{ log.total_scraped > 0 ? ((log.published_count / log.total_scraped) * 100).toFixed(0) : 0 }}%</b></span>
                  <el-icon :class="expandedLog === log.id ? 'rotate-90' : ''" class="text-gray-300 transition-transform"><ArrowRight /></el-icon>
                </div>
              </div>
              <div class="grid grid-cols-4 gap-2 text-xs">
                <div class="bg-gray-50 rounded p-2">
                  <div class="text-gray-400 uppercase text-[10px]">抓取总数</div>
                  <div class="font-bold">{{ log.total_scraped }}</div>
                </div>
                <div class="bg-gray-50 rounded p-2">
                  <div class="text-gray-400 uppercase text-[10px]">已发布</div>
                  <div class="font-bold text-teal-600">{{ log.published_count }}</div>
                </div>
                <div class="bg-gray-50 rounded p-2">
                  <div class="text-gray-400 uppercase text-[10px]">去重/AI过滤</div>
                  <div class="font-bold text-orange-500">{{ (log.skipped_duplicate || 0) + (log.ai_skipped || 0) }}</div>
                </div>
                <div class="bg-gray-50 rounded p-2">
                  <div class="text-gray-400 uppercase text-[10px]">系统失败</div>
                  <div class="font-bold text-red-500">{{ log.ai_failed || 0 }}</div>
                </div>
              </div>
              <!-- Expanded failure reasons -->
              <div v-if="expandedLog === log.id && log.failure_reasons && Object.keys(log.failure_reasons).length > 0" class="mt-3 pt-3 border-t border-gray-100">
                <div class="text-[10px] font-bold text-gray-400 uppercase mb-2">失败原因分析</div>
                <div v-for="(count, reason) in log.failure_reasons" :key="reason" class="flex justify-between items-center text-xs bg-gray-50 px-3 py-1.5 rounded mb-1">
                  <span class="text-gray-600">{{ reason }}</span>
                  <el-tag size="small" type="danger">{{ count }} 条</el-tag>
                </div>
              </div>
              <div v-else-if="expandedLog === log.id" class="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 italic">没有记录到失败项</div>
            </div>
            <el-empty v-if="!loading && !stats?.recentLogs?.length" description="暂无抓取日志" />
          </div>
        </el-card>
      </div>

      <!-- Right: health + reason legend -->
      <div class="space-y-5">

        <!-- Pipeline health -->
        <el-card shadow="never" class="border-0 bg-teal-600 text-white overflow-hidden">
          <div class="relative">
            <div class="text-xs uppercase font-bold opacity-80 mb-1">流水线健康值</div>
            <p class="text-xs opacity-70 mb-3">基于最近 5 次抓取任务的综合成功率</p>
            <div class="text-5xl font-black mb-2">{{ pipelineHealth }}%</div>
            <div class="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
              <div class="bg-white h-full rounded-full transition-all duration-700" :style="{ width: pipelineHealth + '%' }" />
            </div>
          </div>
        </el-card>

        <!-- Reason legend -->
        <el-card shadow="never" class="border border-gray-100">
          <template #header>
            <div class="text-sm font-semibold flex items-center gap-2">
              <el-icon color="#f97316"><Warning /></el-icon>
              无法显示的原因分类
            </div>
          </template>
          <div class="space-y-4 text-sm">
            <div class="flex gap-3">
              <div class="w-2 h-2 bg-orange-400 rounded-full mt-1.5 flex-shrink-0" />
              <div>
                <p class="font-semibold">Duplicate (Similarity Check)</p>
                <p class="text-xs text-gray-400">内容与 48 小时内已存在的新闻相似度超过 80%，被系统自动过滤。</p>
              </div>
            </div>
            <el-divider style="margin:4px 0;" />
            <div class="flex gap-3">
              <div class="w-2 h-2 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
              <div>
                <p class="font-semibold">AI Filtered (Quality)</p>
                <p class="text-xs text-gray-400">Gemini 判定内容为广告促销、天气预报、路况或纯信息罗列。</p>
              </div>
            </div>
            <el-divider style="margin:4px 0;" />
            <div class="flex gap-3">
              <div class="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
              <div>
                <p class="font-semibold">AI Process Crash / DB Error</p>
                <p class="text-xs text-gray-400">API 超时、额度不足或数据库插入失败。通常意味着系统不稳定。</p>
              </div>
            </div>
            <el-divider style="margin:4px 0;" />
            <div class="flex gap-3">
              <div class="w-2 h-2 bg-yellow-400 rounded-full mt-1.5 flex-shrink-0" />
              <div>
                <p class="font-semibold">Scrape Failed</p>
                <p class="text-xs text-gray-400">RSS 链接失效或 YouTube 频道暂无新内容。如多次出现，请检查采集源 URL。</p>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchStatsApi } from '@/services/api'
import { TrendCharts, Refresh, Calendar, Clock, ArrowRight, Warning } from '@element-plus/icons-vue'

const loading   = ref(false)
const stats     = ref<any>(null)
const expandedLog = ref<string | null>(null)

const latestSuccessRate = computed(() => {
  const log = stats.value?.recentLogs?.[0]
  if (!log || !log.total_scraped) return '0%'
  return ((log.published_count / log.total_scraped) * 100).toFixed(1) + '%'
})

const pipelineHealth = computed(() => {
  const logs = stats.value?.recentLogs?.slice(0, 5) || []
  if (!logs.length) return 0
  const avg = logs.reduce((acc: number, log: any) => acc + (log.published_count / (log.total_scraped || 1)), 0) / logs.length
  return Math.round(avg * 100)
})

const formatTime = (ts: string) => {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const logStatusLabel = (log: any) => {
  if (log.status === 'completed') return 'completed'
  if (log.status === 'running') {
    const mins = (Date.now() - new Date(log.started_at).getTime()) / 60000
    return mins > 30 ? 'STUCK / TIMEOUT' : 'running'
  }
  return log.status || 'unknown'
}

const logStatusType = (log: any): '' | 'success' | 'warning' | 'danger' | 'info' => {
  if (log.status === 'completed') return 'success'
  if (log.status === 'running') {
    const mins = (Date.now() - new Date(log.started_at).getTime()) / 60000
    return mins > 30 ? 'danger' : 'warning'
  }
  return 'danger'
}

const toggleLog = (id: string) => {
  expandedLog.value = expandedLog.value === id ? null : id
}

const loadStats = async () => {
  loading.value = true
  try {
    stats.value = await fetchStatsApi.getStats()
  } catch (e: any) {
    ElMessage.error(e.message || '加载统计失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)
</script>
