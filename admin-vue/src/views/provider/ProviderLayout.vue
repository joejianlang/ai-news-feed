<template>
  <div class="provider-layout min-h-screen bg-gray-50 flex flex-col">
    <!-- Header -->
    <header class="bg-white h-16 shadow-sm flex items-center justify-between px-6 z-10 sticky top-0">
      <div class="flex items-center gap-4">
        <div class="text-2xl font-bold text-primary-600">优服佳</div>
        <div class="text-xs text-gray-500 mt-2">服务商工作台</div>
        <div class="ml-8 text-sm text-gray-500 cursor-pointer hover:text-primary-600">
          语言: 中文 <el-icon><ArrowDown /></el-icon>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="text-right mr-2 hidden md:block">
          <div class="text-sm font-bold text-gray-800">你好, {{ userInfo.name }}</div>
          <div class="text-xs text-green-500">初级会员</div>
        </div>
        <el-avatar :size="40" :src="userInfo.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
      </div>
    </header>

    <!-- Main Connectivity -->
    <div class="flex-1 max-w-[1600px] w-full mx-auto p-6 flex gap-6">
      
      <!-- Left Sidebar Menu -->
      <aside class="w-64 bg-white rounded-lg shadow-sm flex flex-col h-fit">
        <nav class="py-4">
          <template v-for="(group, gIndex) in menuGroups" :key="gIndex">
            <div v-if="group.title" class="px-6 py-2 text-xs text-gray-400 font-bold mt-2">{{ group.title }}</div>
            <router-link 
              v-for="item in group.items" 
              :key="item.path"
              :to="item.path"
              class="flex items-center px-6 py-3 text-sm text-gray-600 hover:bg-blue-50 hover:text-primary-600 transition-colors border-l-4 border-transparent"
              active-class="active-menu-item"
            >
              {{ item.label }}
            </router-link>
            <div v-if="gIndex < menuGroups.length - 1" class="my-2 border-b border-gray-100 mx-6"></div>
          </template>
        </nav>
      </aside>

      <!-- Center Content -->
      <main class="flex-1 flex flex-col min-w-0">
        <RouterView />
      </main>

      <!-- Right Sidebar -->
      <aside class="w-80 flex flex-col gap-4">
        <!-- User Card -->
        <div class="bg-white rounded-lg shadow-sm p-6 text-center">
            <div class="relative inline-block mb-4">
                <el-avatar :size="80" :src="userInfo.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" class="border-4 border-white shadow-md" />
                <div class="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div class="text-xl font-bold text-gray-900 mb-1">{{ userInfo.name }}</div>
            <div class="inline-block px-3 py-1 bg-blue-100 text-blue-600 text-xs rounded-full font-bold mb-4">初级会员</div>
            
            <div class="bg-orange-50 text-orange-600 py-3 rounded-lg font-bold mb-6 flex items-center justify-center gap-2">
                <el-icon><Coin /></el-icon> 我的积分: {{ userInfo.credits || 0 }}
            </div>

            <div class="text-left text-sm text-gray-500 space-y-3 mb-6 px-4">
                <div class="flex justify-between">
                    <span>手机号码:</span>
                    <span class="text-gray-900">{{ userInfo.phone || '未绑定' }}</span>
                </div>
                <div class="flex justify-between">
                    <span>邮箱:</span>
                    <span class="text-gray-900 truncate max-w-[150px]" :title="userInfo.email">{{ userInfo.email }}</span>
                </div>
            </div>

            <el-button @click="handleLogout" plain class="w-full">退出登录</el-button>
        </div>

        <!-- Help Center -->
        <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center gap-2 font-bold text-gray-800 mb-4">
                <el-icon class="text-blue-500"><Headset /></el-icon> 帮助中心
            </div>
            <div class="text-sm text-gray-500 mb-4">
                如有相关问题咨询，请联系客服
            </div>
            <div class="text-lg font-bold text-blue-600 flex items-center gap-2 justify-center bg-blue-50 py-3 rounded-lg">
                <el-icon><Phone /></el-icon> 400-888-8888
            </div>
        </div>
      </aside>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowDown, Coin, Headset, Phone } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()

const userInfo = computed(() => {
    try {
        const str = localStorage.getItem('admin_user')
        return str ? JSON.parse(str) : { name: '里约翰', email: 'guest@example.com' }
    } catch {
        return { name: 'Guest' }
    }
})

const currentRouteName = computed(() => {
    // Should return label based on path
    const path = route.path
    for(const group of menuGroups) {
        const found = group.items.find(i => i.path === path)
        if (found) return found.label
    }
    return '控制台'
})

const menuGroups = [
    {
        title: '业务统计',
        items: [
            { label: '任务大厅', path: '/provider/hall' },
        ]
    },
    {
        title: '标准服务',
        items: [
            { label: '标准服务管理', path: '/provider/services' },
            { label: '标准服务订单管理', path: '/provider/orders' }, // Reusing existing mock
        ]
    },
    {
        title: '定制服务',
        items: [
            { label: '定制服务报价记录', path: '/provider/quotes' },
            { label: '定制服务订单管理', path: '/provider/custom-orders' },
        ]
    },
    {
        title: '互动与记录',
        items: [
            { label: '收件箱', path: '/provider/inbox' },
            { label: '交易记录', path: '/provider/transactions' },
            { label: '等级与订阅机制', path: '/provider/subscription' },
            { label: '收到的评论', path: '/provider/reviews' },
        ]
    },
    {
        title: '账户与设置',
        items: [
            { label: '已开具发票', path: '/provider/invoices' },
            { label: '合同管理', path: '/provider/contracts' },
            { label: '账户信息', path: '/provider/profile' },
            { label: '修改密码', path: '/provider/password' },
            { label: '收款方式', path: '/provider/payment-methods' },
            { label: '服务区域管理', path: '/provider/areas' },
            { label: '服务时间管理', path: '/provider/schedule' },
        ]
    }
]

const handleLogout = () => {
    ElMessageBox.confirm('确定退出登录吗?', '提示').then(() => {
        localStorage.removeItem('admin_user')
        localStorage.removeItem('admin_token')
        // Redirect to PC Official Website
        window.location.href = 'https://fongbee-v1.vercel.app'
        ElMessage.success('已退出')
    })
}
</script>

<style scoped>
.active-menu-item {
    color: #2563eb; /* primary-600 */
    border-left-color: #2563eb;
    background-color: #eff6ff; /* blue-50 */
    font-weight: 500;
}
</style>
