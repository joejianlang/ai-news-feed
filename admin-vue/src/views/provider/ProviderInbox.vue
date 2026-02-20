<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="bg-white p-6 border-b border-gray-100 flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <h2 class="text-lg font-bold text-gray-800">收件箱</h2>
        <span class="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full" v-if="unreadCount > 0">{{ unreadCount }}</span>
      </div>
      
      <div class="flex items-center gap-4">
        <el-input
            v-model="searchQuery"
            placeholder="搜索消息..."
            prefix-icon="Search"
            class="w-64"
        />
        <el-select v-model="filterType" placeholder="消息类型" class="w-32">
          <el-option label="全部" value="all" />
          <el-option label="系统通知" value="system" />
          <el-option label="订单消息" value="order" />
        </el-select>
        <button class="text-gray-500 hover:text-blue-600 text-sm" @click="handleMarkAllRead">全部已读</button>
      </div>
    </div>

    <!-- Message List -->
    <div class="flex-1 px-6 overflow-y-auto">
      <div class="bg-white rounded-xl shadow-sm min-h-[500px]">
        <div v-if="messages.length > 0" class="divide-y divide-gray-100">
            <div 
                v-for="msg in messages" 
                :key="msg.id" 
                class="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-4 group"
                :class="{'bg-blue-50/50': !msg.read}"
                @click="openMessage(msg)"
            >
                <!-- Icon -->
                <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    :class="msg.type === 'system' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'"
                >
                    <el-icon v-if="msg.type === 'system'"><Bell /></el-icon>
                    <el-icon v-else><ChatDotRound /></el-icon>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                        <span class="font-bold text-gray-900 truncate" :class="{'text-black': !msg.read, 'text-gray-600': msg.read}">{{ msg.title }}</span>
                        <span class="text-xs text-gray-400 shrink-0">{{ msg.time }}</span>
                    </div>
                    <div class="text-sm text-gray-500 truncate group-hover:text-gray-700">
                        {{ msg.preview }}
                    </div>
                </div>

                <!-- Unread Dot -->
                <div v-if="!msg.read" class="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-96 text-gray-400">
            <el-icon :size="48" class="mb-4"><Message /></el-icon>
            <div>暂无消息</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Bell, ChatDotRound, Message, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const searchQuery = ref('')
const filterType = ref('all')

const messages = ref([
    {
        id: 1,
        type: 'system',
        title: '系统通知：您的会员等级已升级',
        preview: '恭喜您，您的服务商等级已升级为中级会员，享受更多特权...',
        time: '10分钟前',
        read: false
    },
    {
        id: 2,
        type: 'order',
        title: '新订单提醒：全屋保洁服务',
        preview: '您收到了一个新的全屋保洁服务订单，请尽快确认接单...',
        time: '1小时前',
        read: false
    },
    {
        id: 3,
        type: 'system',
        title: '积分变动通知',
        preview: '您的账户积分增加了 50 分，当前积分总额为 150 分。',
        time: '昨天',
        read: true
    },
    {
        id: 4,
        type: 'order',
        title: '订单完成确认',
        preview: '客户已确认订单 12345678 为完成状态，款项将于 24 小时内结算。',
        time: '2天前',
        read: true
    }
])

const unreadCount = computed(() => messages.value.filter(m => !m.read).length)

const handleMarkAllRead = () => {
    messages.value.forEach(m => m.read = true)
    ElMessage.success('已全部标记为已读')
}

const openMessage = (msg: any) => {
    msg.read = true
    ElMessage.info(`查看详情: ${msg.title}`)
    // Future: Open detail modal or route
}
</script>
