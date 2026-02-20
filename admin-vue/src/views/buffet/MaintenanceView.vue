<template>
  <div class="maintenance-page">

    <!-- Page Header -->
    <div class="page-header">
      <div class="flex items-center gap-3">
        <div class="header-icon">
          <el-icon size="28" color="#34d399"><DataBoard /></el-icon>
        </div>
        <div>
          <h1 class="page-title">系统维护与数据清理</h1>
          <p class="page-subtitle">管理新闻数据库容量与内容保质期</p>
        </div>
      </div>
    </div>

    <!-- Stats Card -->
    <div class="stats-card">
      <div class="flex items-center gap-4">
        <div class="stats-icon">
          <el-icon size="32" color="#34d399"><DataBoard /></el-icon>
        </div>
        <div>
          <div class="stats-label">当前新闻总数</div>
          <div class="stats-value">
            <span v-if="statsLoading" class="loading-text">加载中...</span>
            <span v-else>{{ totalNews }} <span class="stats-unit">条</span></span>
          </div>
        </div>
      </div>
      <el-icon
        class="refresh-btn"
        size="20"
        :class="{ spinning: statsLoading }"
        @click="loadStats"
      ><Refresh /></el-icon>
    </div>

    <!-- Two-column content -->
    <div class="two-col">

      <!-- Left: Auto Cleanup -->
      <div class="panel">
        <div class="panel-title">
          <el-icon size="18" color="#f59e0b"><Clock /></el-icon>
          <span>定时自动清理</span>
        </div>

        <div class="form-row">
          <div class="form-label-col">
            <div class="field-label">启用自动清理</div>
            <div class="field-hint">启用后，系统将定期删除过期旧闻</div>
          </div>
          <el-switch v-model="autoEnabled" active-color="#34d399" />
        </div>

        <div class="form-row mt-6">
          <div class="field-label mb-2">内容保留时间 (小时)</div>
          <el-select v-model="retentionHours" class="w-full" :disabled="!autoEnabled">
            <el-option :value="24"   label="24 小时 (1 天)" />
            <el-option :value="48"   label="48 小时 (2 天)" />
            <el-option :value="72"   label="72 小时 (3 天)" />
            <el-option :value="168"  label="168 小时 (1 周)" />
            <el-option :value="336"  label="336 小时 (2 周)" />
            <el-option :value="720"  label="720 小时 (1 个月)" />
          </el-select>
          <div class="field-hint mt-2">
            提示：设置为 {{ retentionHours }} 小时表示系统会自动删除发布时间超过
            {{ Math.round(retentionHours / 24) }} 天的新闻。
          </div>
        </div>

        <el-button
          class="save-btn mt-6"
          :loading="savingSettings"
          @click="handleSaveSettings"
        >
          <el-icon class="mr-1"><Setting /></el-icon>
          保存自动清理配置
        </el-button>
      </div>

      <!-- Right: Manual Cleanup -->
      <div class="panel">
        <div class="panel-title">
          <el-icon size="18" color="#ef4444"><Delete /></el-icon>
          <span>手动按区间清除</span>
        </div>

        <div class="mb-4">
          <div class="field-label mb-2">起始日期时间</div>
          <el-date-picker
            v-model="startDate"
            type="datetime"
            placeholder="选择起始时间"
            class="w-full"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </div>

        <div class="mb-4">
          <div class="field-label mb-2">结束日期时间</div>
          <el-date-picker
            v-model="endDate"
            type="datetime"
            placeholder="选择结束时间"
            class="w-full"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </div>

        <!-- Warning -->
        <div class="warning-box">
          <el-icon size="16" color="#f97316" class="mt-0.5 shrink-0"><Warning /></el-icon>
          <span>
            <strong class="text-orange-400">高危操作</strong>：执行后所选时间段内的所有新闻及其
            AI 摘要、评论都将被持久性删除。
          </span>
        </div>

        <!-- Execute Button -->
        <el-popconfirm
          title="确认删除选定时间段内的所有新闻？此操作不可撤销！"
          confirm-button-text="确认执行"
          cancel-button-text="取消"
          confirm-button-type="danger"
          @confirm="handleManualCleanup"
        >
          <template #reference>
            <el-button
              class="delete-btn mt-4"
              :loading="cleaning"
              :disabled="!startDate || !endDate"
            >
              <el-icon class="mr-1"><Delete /></el-icon>
              立即执行区间清空
            </el-button>
          </template>
        </el-popconfirm>
      </div>
    </div>

    <!-- Info footer -->
    <div class="info-footer">
      <el-icon size="16" color="#38bdf8" class="shrink-0"><InfoFilled /></el-icon>
      <span>
        <strong class="text-sky-400">运行机制</strong>：自动清理接口路径为
        <code class="code-tag">/api/cron/cleanup</code>。
        请在您的服务器或 Supabase 控制台中配置每日定时访问该 URL 即可生效。
      </span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { maintenanceApi } from '@/services/api'
import { DataBoard, Refresh, Clock, Delete, Setting, Warning, InfoFilled } from '@element-plus/icons-vue'

const totalNews = ref(0)
const statsLoading = ref(false)

const autoEnabled = ref(false)
const retentionHours = ref(168)
const savingSettings = ref(false)

const startDate = ref('')
const endDate = ref('')
const cleaning = ref(false)

const loadStats = async () => {
  statsLoading.value = true
  try {
    const res = await maintenanceApi.getStats()
    totalNews.value = res.stats?.totalNews ?? 0
    if (res.settings) {
      autoEnabled.value = res.settings.auto_enabled ?? false
      retentionHours.value = res.settings.retention_hours ?? 168
    }
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    statsLoading.value = false
  }
}

const handleSaveSettings = async () => {
  savingSettings.value = true
  try {
    await maintenanceApi.saveSettings({
      auto_enabled: autoEnabled.value,
      retention_hours: retentionHours.value,
    })
    ElMessage.success('配置已保存')
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    savingSettings.value = false
  }
}

const handleManualCleanup = async () => {
  if (!startDate.value || !endDate.value) {
    ElMessage.warning('请选择起止时间范围')
    return
  }
  cleaning.value = true
  try {
    const res = await maintenanceApi.manualCleanup(startDate.value, endDate.value)
    ElMessage.success(res.message || `成功清理 ${res.deleted_count} 条新闻`)
    startDate.value = ''
    endDate.value = ''
    loadStats()
  } catch (e: any) {
    ElMessage.error(e.message || '清理失败')
  } finally {
    cleaning.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.maintenance-page {
  min-height: 100vh;
  background-color: #0f172a;
  padding: 32px;
  color: #e2e8f0;
}

/* Header */
.page-header {
  margin-bottom: 28px;
}
.header-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(52, 211, 153, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}
.page-title {
  font-size: 26px;
  font-weight: 800;
  color: #f1f5f9;
  margin: 0 0 4px;
}
.page-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

/* Stats Card */
.stats-card {
  background: #1e293b;
  border-radius: 16px;
  padding: 20px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  border: 1px solid #334155;
}
.stats-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: rgba(52, 211, 153, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}
.stats-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}
.stats-value {
  font-size: 28px;
  font-weight: 800;
  color: #f1f5f9;
}
.stats-unit {
  font-size: 16px;
  font-weight: 400;
  color: #94a3b8;
}
.loading-text {
  font-size: 16px;
  color: #94a3b8;
}
.refresh-btn {
  cursor: pointer;
  color: #475569;
  transition: color 0.2s, transform 0.5s;
}
.refresh-btn:hover { color: #94a3b8; }
.refresh-btn.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Two column */
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}
@media (max-width: 900px) {
  .two-col { grid-template-columns: 1fr; }
}

/* Panel */
.panel {
  background: #1e293b;
  border-radius: 16px;
  padding: 28px;
  border: 1px solid #334155;
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 24px;
}

/* Form elements */
.form-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
.form-label-col {
  flex: 1;
}
.field-label {
  font-size: 14px;
  font-weight: 500;
  color: #cbd5e1;
}
.field-hint {
  font-size: 12px;
  color: #475569;
  margin-top: 4px;
}

/* Save button */
.save-btn {
  width: 100%;
  background: #1e3a2f;
  border: 1px solid #34d399;
  color: #34d399;
  border-radius: 10px;
  height: 44px;
  font-weight: 600;
}
.save-btn:hover {
  background: #34d39922;
  border-color: #6ee7b7;
  color: #6ee7b7;
}

/* Warning box */
.warning-box {
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 13px;
  color: #cbd5e1;
  line-height: 1.5;
}

/* Delete button */
.delete-btn {
  width: 100%;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #ef4444;
  border-radius: 10px;
  height: 48px;
  font-weight: 700;
  font-size: 15px;
}
.delete-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
}
.delete-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Info footer */
.info-footer {
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 12px;
  padding: 14px 20px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.6;
}
.code-tag {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  padding: 1px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

/* Override Element Plus for dark theme */
:deep(.el-select .el-input__wrapper) {
  background: #0f172a;
  border-color: #334155;
  box-shadow: none !important;
}
:deep(.el-select .el-input__inner) {
  color: #e2e8f0;
  background: transparent;
}
:deep(.el-select .el-input__wrapper.is-focused),
:deep(.el-select .el-input__wrapper:hover) {
  border-color: #34d399 !important;
}
:deep(.el-date-editor.el-input),
:deep(.el-date-editor .el-input__wrapper) {
  background: #0f172a !important;
  border-color: #334155 !important;
  box-shadow: none !important;
  width: 100%;
}
:deep(.el-date-editor .el-input__inner) {
  color: #e2e8f0;
  background: transparent;
}
:deep(.el-date-editor .el-input__prefix),
:deep(.el-date-editor .el-input__suffix) {
  color: #475569;
}
</style>
