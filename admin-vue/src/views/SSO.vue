<template>
  <div class="h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <div class="text-gray-600">正在验证身份，请稍候...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authApi } from '../services/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

onMounted(async () => {
    const token = route.query.token as string
    
    if (!token) {
        // If no token in query, try local storage just in case? Or redirect.
        ElMessage.warning('未检测到登录令牌，请重新登录')
        return router.push('/login')
    }

    // Save token temporarily to make the request
    localStorage.setItem('admin_token', token)
    
    try {
        // Validation: Verify token by fetching user profile
        const { user } = await authApi.getMe()
        
        // Save user info
        localStorage.setItem('admin_user', JSON.stringify(user))
        
        ElMessage.success('欢迎回来')
        
        // Redirect based on role
        if (user.role === 'provider') {
            router.push('/provider')
        } else {
            router.push('/dashboard')
        }
    } catch (error) {
        console.error('SSO Failed:', error)
        localStorage.removeItem('admin_token')
        ElMessage.error('登录验证失效，请重新登录')
        router.push('/login')
    }
})
</script>
