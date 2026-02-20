<template>
  <div class="h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center">
    <el-card class="w-96 shadow-xl rounded-2xl border-0">
      <template #header>
        <div class="text-center">
          <div class="text-2xl font-bold text-gray-800 mb-1">优服佳管理后台</div>
          <div class="text-sm text-gray-500">统一登录入口</div>
        </div>
      </template>
      <el-form 
        ref="formRef"
        :model="form" 
        :rules="rules"
        label-position="top"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="账号/邮箱" prop="email">
          <el-input 
            v-model="form.email" 
            placeholder="请输入管理员或服务商邮箱"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="form.password"
            type="password" 
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item v-if="show2FA" label="验证码" prop="code">
          <el-input 
            v-model="form.code" 
            placeholder="为安全起见，请输入邮箱验证码"
            :prefix-icon="Lock"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-button 
          type="primary" 
          class="w-full mt-4" 
          :loading="loading"
          @click="handleLogin"
        >
          {{ loading ? '登录中...' : '登录' }}
        </el-button>
      </el-form>
      <div class="mt-4 text-center text-xs text-gray-400">
        提示：管理员和服务商均在此登录，系统将自动跳转
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { authApi } from '../services/api'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)
const show2FA = ref(false)

const form = reactive({
  email: 'joelyan00@gmail.com',
  password: 'admin123',
  code: ''
})

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      // Use generic login to support both Admin and Provider
      const response: any = await authApi.login(form.email, form.password, form.code)

      if (response.require2fa) {
          show2FA.value = true
          ElMessage.warning(response.message)
          loading.value = false
          return
      }
      
      const user = response.user
      if (user.role !== 'admin' && user.role !== 'provider') {
        throw new Error('此账号无权访问管理后台')
      }
      
      // Save token and user info
      localStorage.setItem('admin_token', response.token)
      localStorage.setItem('admin_user', JSON.stringify(user))
      
      ElMessage.success('登录成功')
      
      if (user.role === 'provider') {
        router.push('/provider')
      } else {
        router.push('/dashboard')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '登录失败，请检查账号密码')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.el-card {
  --el-card-padding: 30px;
}
</style>
