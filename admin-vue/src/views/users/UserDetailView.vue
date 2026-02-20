<template>
  <div class="p-6">
    <el-breadcrumb separator="/" class="mb-4">
      <el-breadcrumb-item :to="{ path: '/dashboard' }">控制台</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/dashboard/users' }">用户管理</el-breadcrumb-item>
      <el-breadcrumb-item>用户详情</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Profile Card -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-start gap-6">
            <el-avatar :size="80" class="bg-blue-500 text-2xl">{{ user.name ? user.name.charAt(0) : '' }}</el-avatar>
            <div class="flex-1">
              <div class="flex justify-between items-start">
                <div>
                  <h2 class="text-2xl font-bold text-gray-800">{{ user.name }}</h2>
                  <p class="text-gray-500 mt-1">{{ user.role === 'provider' ? '服务商' : '普通用户' }}</p>
                </div>
                <el-tag :type="user.status === 'active' ? 'success' : 'danger'" size="large">
                  {{ user.statusText }}
                </el-tag>
              </div>
              <div class="flex items-center gap-6 mt-4 text-sm">
                <div class="text-gray-600">
                  注册于 <span class="text-gray-800">{{ user.joinDate }}</span>
                </div>
                <div class="text-gray-600">
                  消费 <span class="text-gray-800">{{ user.totalSpent || '$0' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Basic Info -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">基本信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="ID">{{ user.id }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ user.phone }}</el-descriptions-item>
            <el-descriptions-item label="电子邮箱">{{ user.email }}</el-descriptions-item>
            <el-descriptions-item label="最后登录">TODO</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- Provider Info (If applicable or for restoration context) -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6" v-if="user.hasProfile">
          <h3 class="text-lg font-bold text-gray-800 mb-4">服务商档案 (已存档)</h3>
           <el-alert
            title="该用户曾是服务商，您可以将其恢复为服务商身份。"
            type="info"
            show-icon
            class="mb-4"
          />
          <el-descriptions :column="2" border>
            <el-descriptions-item label="公司名称">{{ user.providerProfile?.company_name }}</el-descriptions-item>
            <el-descriptions-item label="服务区域">{{ user.providerProfile?.service_area }}</el-descriptions-item>
            <el-descriptions-item label="服务类别" :span="2">
                 {{ user.providerProfile?.service_categories?.join(', ') }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- Recent Orders -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">最近订单</h3>
            <div class="text-gray-500 text-sm text-center py-4">暂无订单记录</div>
        </div>
      </div>

      <!-- Side Panel -->
      <div class="space-y-6">
        <!-- Actions -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">操作</h3>
          <div class="space-y-3">
            <el-button class="w-full" @click="contactUser">联系用户</el-button>
            <el-button class="w-full" @click="resetPassword">重置密码</el-button>
            
            <!-- Restore Provider Button -->
            <el-button 
                type="warning" 
                class="w-full" 
                plain 
                v-if="user.role === 'user' && user.hasProfile" 
                @click="restoreProvider"
            >
                恢复服务商身份
            </el-button>

            <!-- Status Toggle -->
            <el-button 
              :type="user.status === 'active' ? 'danger' : 'success'" 
              class="w-full" 
              plain
              @click="toggleStatus"
            >
              {{ user.status === 'active' ? '冻结账户' : '启用账户' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usersApi } from '../../services/api'

const route = useRoute()
const userId = route.params.id

const user = ref<any>({})

const fetchUser = async () => {
  try {
    const res = await usersApi.getById(userId as string)
    const u = res.user
    
    // Check if provider profile exists
    const hasProfile = !!u.provider_profile && !!u.provider_profile.id
    
    user.value = {
      id: u.id,
      name: u.name || u.email,
      email: u.email,
      phone: u.phone || '-',
      role: u.role,
      status: u.status || 'active',
      statusText: u.status === 'active' ? '正常' : '已冻结',
      joinDate: new Date(u.created_at).toLocaleDateString(),
      hasProfile: hasProfile,
      providerProfile: u.provider_profile
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('获取用户详情失败')
  }
}

onMounted(() => {
  fetchUser()
})

const contactUser = () => {
  ElMessage.info('拨打电话: ' + user.value.phone)
}

const resetPassword = async () => {
  try {
    const { value: newPassword } = await ElMessageBox.prompt('请输入该用户的新密码', '重置密码', {
      confirmButtonText: '确定重置',
      cancelButtonText: '取消',
      inputPattern: /^.{6,}$/,
      inputErrorMessage: '密码长度至少需要6位',
      inputType: 'password'
    })

    if (newPassword) {
      await usersApi.resetPassword(userId as string, newPassword)
      ElMessage.success('密码已成功重置')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
      ElMessage.error('重置密码失败')
    }
  }
}

const toggleStatus = async () => {
  const action = user.value.status === 'active' ? '冻结' : '启用'
  const newStatus = user.value.status === 'active' ? 'disabled' : 'active'
  
  try {
    await ElMessageBox.confirm(`确定要${action}该账户吗？`, '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await usersApi.updateStatus(userId as string, newStatus)
    ElMessage.success(`账户已${action}`)
    fetchUser()
  } catch (error) {
    if (error !== 'cancel') {
        console.error(error)
        ElMessage.error('操作失败')
    }
  }
}

const restoreProvider = async () => {
  try {
    await ElMessageBox.confirm(
      '确定恢复该用户的服务商身份吗？',
      '恢复确认',
      {
        confirmButtonText: '确定恢复',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await usersApi.updateRole(userId as string, 'provider')
    ElMessage.success('已成功恢复服务商身份')
    fetchUser()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
      ElMessage.error('操作失败')
    }
  }
}
</script>
