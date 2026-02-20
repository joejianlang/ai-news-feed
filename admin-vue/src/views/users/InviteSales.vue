<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">邀请销售合伙人</h1>
        <p class="text-sm text-gray-500 mt-1">生成专属链接邀请新的销售合伙人注册。</p>
      </div>
    </div>

    <el-card class="max-w-xl">
      <el-form :model="form" @submit.prevent="handleInvite" label-position="top">
        <el-form-item label="对方邮箱或手机号" required>
          <el-input 
            v-model="form.contact" 
            placeholder="请输入邮箱或手机号码" 
            size="large"
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>

      <el-button 
          type="primary" 
          size="large" 
          class="w-full" 
          :loading="loading" 
          @click="handleInvite"
        >
          发送邀请
        </el-button>
      </el-form>

      <div v-if="generatedLink" class="mt-8 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
        <div class="flex items-center gap-2 mb-2 text-emerald-700 font-bold">
          <el-icon><CircleCheckFilled /></el-icon>
          <span>邀请已发送</span>
        </div>
        <div class="text-sm text-emerald-600 mb-2">
           系统已自动向目标发送了包含以下链接的邀请通知：
        </div>
        <div class="bg-white p-3 border border-emerald-200 rounded text-sm font-mono break-all text-gray-600 mb-4">
          {{ generatedLink }}
        </div>
        <el-button @click="copyLink" plain size="default" class="w-full">
          <el-icon class="mr-1"><CopyDocument /></el-icon>
          {{ copied ? '已复制' : '复制链接' }}
        </el-button>
      </div>

      <div v-if="error" class="mt-4 p-3 bg-red-50 text-red-600 rounded text-sm">
        {{ error }}
      </div>
    </el-card>

    <div class="text-xs text-gray-400 max-w-xl">
      <p>提示：接收者点击链接后，注册页面将自动开启“销售合伙人”注册选项，并自动填入联系方式。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { usersApi } from '../../services/api'
import { Message, CircleCheckFilled, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const form = reactive({
  contact: ''
})

const loading = ref(false)
const generatedLink = ref('')
const error = ref('')
const copied = ref(false)

const handleInvite = async () => {
  if (!form.contact) {
    ElMessage.warning('请输入联系方式')
    return
  }
  
  loading.value = true
  error.value = ''
  generatedLink.value = ''
  copied.value = false

  try {
    const res = await usersApi.inviteSales(form.contact)
    generatedLink.value = res.link
    ElMessage.success('生成成功')
  } catch (err: any) {
    error.value = err.message || '生成失败'
  } finally {
    loading.value = false
  }
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(generatedLink.value)
    copied.value = true
    ElMessage.success('已复制到剪贴板')
    setTimeout(() => copied.value = false, 2000)
  } catch (err) {
    ElMessage.error('复制失败')
  }
}
</script>
