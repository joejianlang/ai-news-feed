<template>
  <div class="p-6">
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">用户管理</h1>
      <p class="text-gray-500 mt-1">管理平台注册用户</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-gray-500 text-sm">总用户数</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ stats.total }}</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-gray-500 text-sm">活跃用户</p>
        <p class="text-2xl font-bold text-emerald-500 mt-1">{{ stats.active }}</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-gray-500 text-sm">今日新增</p>
        <p class="text-2xl font-bold text-blue-500 mt-1">{{ stats.todayNew }}</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-gray-500 text-sm">本月新增</p>
        <p class="text-2xl font-bold text-purple-500 mt-1">{{ stats.monthNew }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <el-input v-model="filters.keyword" placeholder="搜索用户名/手机号" clearable>
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="filters.status" placeholder="状态" clearable>
          <el-option label="正常" value="active" />
          <el-option label="已禁用" value="disabled" />
        </el-select>
        <el-date-picker 
          v-model="filters.dateRange" 
          type="daterange" 
          start-placeholder="注册开始日期"
          end-placeholder="注册结束日期"
          style="width: 100%"
        />
        <el-button type="primary" @click="search">搜索</el-button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <el-table :data="users" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户" width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <el-avatar :size="36" class="bg-blue-500">{{ row.name.charAt(0) }}</el-avatar>
              <div>
                <p class="font-medium text-gray-800">{{ row.name }}</p>
                <p class="text-gray-400 text-xs">{{ row.phone }}</p>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'provider' ? 'warning' : 'info'" effect="plain" size="small">
              {{ row.role === 'provider' ? '服务商' : '用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orders" label="订单数" width="80" />
        <el-table-column prop="totalSpent" label="消费金额" width="120" />
        <el-table-column prop="registerDate" label="注册时间" width="120" />
        <el-table-column prop="lastLogin" label="最后登录" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '正常' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="150">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewUser(row)">查看</el-button>
            <el-button 
              :type="row.status === 'active' ? 'danger' : 'success'" 
              link 
              size="small" 
              @click="toggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="p-4 flex justify-end border-t border-gray-100">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          layout="total, prev, pager, next"
          background
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usersApi } from '../../services/api'

const router = useRouter()
const loading = ref(false)

const stats = ref({
  total: 0,
  active: 0,
  todayNew: 0,
  monthNew: 0
})

const filters = reactive({
  keyword: '',
  status: '',
  dateRange: null as any
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const users = ref<any[]>([])

// Fetch users from API
const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await usersApi.getAll({
      page: pagination.page,
      size: pagination.size,
      keyword: filters.keyword || undefined,
      status: filters.status || undefined,
      role: 'user' // Only show regular users
    })
    users.value = response.users.map((u: any) => ({
      ...u,
      registerDate: u.created_at ? new Date(u.created_at).toLocaleDateString() : '-',
      lastLogin: u.last_login ? new Date(u.last_login).toLocaleDateString() : '-',
      orders: 0,
      totalSpent: '$0'
    }))
    pagination.total = response.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// Fetch stats from API
const fetchStats = async () => {
  try {
    const response = await usersApi.getStats()
    stats.value = response
  } catch (error: any) {
    console.error('Failed to fetch stats:', error)
  }
}

const search = () => {
  pagination.page = 1
  fetchUsers()
}

const viewUser = (row: any) => {
  router.push(`/dashboard/users/${row.id}`)
}

const toggleStatus = async (row: any) => {
  const action = row.status === 'active' ? '禁用' : '启用'
  const newStatus = row.status === 'active' ? 'disabled' : 'active'
  
  try {
    await ElMessageBox.confirm(`确定要${action}该用户吗？`, `确认${action}`, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await usersApi.updateStatus(row.id, newStatus)
    ElMessage.success(`已${action}`)
    row.status = newStatus
    fetchStats()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败')
    }
  }
}

onMounted(() => {
  fetchUsers()
  fetchStats()
})
</script>

