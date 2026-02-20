<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="bg-white p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <h2 class="text-lg font-bold text-gray-800">任务大厅</h2>
      
      <div class="flex flex-col md:flex-row md:items-center gap-4 text-sm">
        <div class="text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
          当前服务区域: <span class="font-medium text-gray-700">明月街206号</span>
          <span class="mx-2">|</span>
          服务范围: <span class="font-medium text-gray-700">10公里</span>
          <button class="ml-3 text-red-500 hover:text-red-600 hover:underline">修改区域</button>
        </div>
        
        <el-select v-model="categoryFilter" placeholder="项目类别筛选" class="w-40">
          <el-option label="全部" value="all" />
          <el-option label="家庭清洁" value="cleaning" />
          <el-option label="维修服务" value="repair" />
        </el-select>
      </div>
    </div>

    <!-- Task List -->
    <div class="flex-1 overflow-y-auto bg-white p-6">
      <div class="max-w-5xl mx-auto divide-y divide-gray-100">
        
        <!-- Task Item -->
        <div v-for="task in tasks" :key="task.id" class="py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50 transition-colors px-4 rounded-lg -mx-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-blue-600 font-bold truncate cursor-pointer hover:underline" @click="openDetails(task)">{{ task.title }}</span>
              <span 
                class="px-2 py-0.5 text-xs rounded"
                :class="task.type === 'simple' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'"
              >
                {{ task.type === 'simple' ? '简单任务' : '复杂任务' }}
              </span>
            </div>
            
            <div class="flex items-center gap-6 text-sm text-gray-500 mb-2">
              <span>发布时间: {{ task.time }}</span>
              <span class="truncate">所在位置: {{ task.location }}</span>
            </div>
            
            <div class="text-sm text-gray-600 truncate">
              客户留言: {{ task.message }}
            </div>
          </div>

          <div class="flex md:flex-col items-center justify-between md:items-end gap-4 md:w-48 whitespace-nowrap">
            <div class="text-orange-500 text-sm font-medium">
                {{ task.statusText }}
            </div>
            
            <div class="flex flex-col items-end gap-2">
                <span v-if="task.hasQuoted" class="text-xs text-blue-600 font-medium">我已报价</span>
                <el-button type="primary" size="small" @click="openDetails(task)">查看详情</el-button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="tasks.length === 0" class="text-center py-20 text-gray-400">
           暂无匹配的任务
        </div>
      </div>
    </div>

    <!-- Task Details Drawer -->
    <el-drawer v-model="drawerVisible" title="需求详情" size="500px">
        <div v-if="selectedTask" class="h-full flex flex-col">
            <div class="flex-1 overflow-y-auto pr-2 space-y-6">
                 <!-- Basic Info -->
                 <div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">{{ selectedTask.title }}</h3>
                    <div class="flex gap-2 mb-4">
                        <el-tag :type="selectedTask.type === 'simple' ? '' : 'warning'">{{ selectedTask.type === 'simple' ? '简单任务' : '复杂任务' }}</el-tag>
                        <el-tag type="info">{{ selectedTask.time }}</el-tag>
                    </div>
                    <div class="text-gray-600 text-sm mb-4 bg-gray-50 p-4 rounded-lg">
                         <div class="mb-2"><span class="font-bold">地点:</span> {{ selectedTask.location }}</div>
                         <div><span class="font-bold">描述:</span> {{ selectedTask.message }}</div>
                         <div class="mt-2 text-gray-500 text-xs">此处可展示更多详细需求说明，如具体的房间面积、特殊要求等。</div>
                    </div>
                 </div>
                 
                 <!-- Quote Section -->
                 <div class="border-t border-gray-100 pt-6">
                    <h4 class="text-lg font-bold text-gray-900 mb-2 flex items-center justify-between">
                         <div class="flex items-center gap-2">
                            <el-icon class="text-blue-500"><Money /></el-icon> 参与报价
                         </div>
                         <div class="text-sm font-normal text-gray-500">
                             消耗: <span class="text-orange-500 font-bold">{{ quoteCost }} 积分</span>
                             <span class="mx-2 text-gray-300">|</span>
                             余额: <span class="text-gray-900 font-bold">{{ providerCredits }} 积分</span>
                         </div>
                    </h4>
                    
                    <div v-if="selectedTask.hasQuoted" class="bg-green-50 p-4 rounded-md text-green-700 text-sm">
                        <el-icon class="mr-1"><Check /></el-icon> 您已参与报价，请等待客户回应。
                    </div>

                    <el-form v-else label-position="top">
                        <el-form-item label="您的报价金额 (¥)">
                             <el-input-number v-model="quoteForm.price" :min="1" :precision="2" class="w-full" :controls="false" placeholder="0.00"></el-input-number>
                        </el-form-item>
                        <el-form-item label="留言回复 (可选)">
                            <el-input 
                                v-model="quoteForm.message" 
                                type="textarea" 
                                :rows="3" 
                                placeholder="您好，我可以承接此服务，我将在..." 
                            />
                        </el-form-item>
                    </el-form>
                 </div>
            </div>

            <div class="pt-6 border-t border-gray-100 flex gap-4">
                <el-button class="flex-1" @click="handleReply">仅回复询问</el-button>
                <el-button 
                    type="primary" 
                    class="flex-1" 
                    @click="handleSubmitQuote" 
                    :disabled="selectedTask.hasQuoted || !quoteForm.price"
                >
                    {{ selectedTask.hasQuoted ? '已报价' : '立即报价' }}
                </el-button>
            </div>
        </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Money, Check } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const categoryFilter = ref('all')
const drawerVisible = ref(false)
const selectedTask = ref<any>(null)
const providerCredits = ref(50) // Mock Credits
const quoteCost = 5 // Cost per quote

const quoteForm = reactive({
    price: 0,
    message: ''
})

const tasks = ref([
    {
        id: 1,
        title: '家庭日常保洁服务',
        type: 'simple',
        time: '2025/07/28 17:40',
        location: '世博路1131号门市',
        message: '寻找一名清洁工，每周打扫一次出租屋，4间卧室, 3间浴室。需要自带清洁工具。',
        statusText: '寻找服务商中',
        hasQuoted: false
    },
    {
        id: 2,
        title: '老房电路改造',
        type: 'complex',
        time: '2025/07/28 17:40',
        location: '世博路1131号门市',
        message: '20年老房子，需要重新规划电路，安装新的开关插座。需要持证电工。',
        statusText: '寻找服务商中',
        hasQuoted: true
    }
])

const openDetails = (task: any) => {
    selectedTask.value = task
    quoteForm.price = 0
    quoteForm.message = ''
    drawerVisible.value = true
}

const handleSubmitQuote = () => {
    if (!quoteForm.price) {
        ElMessage.warning('请输入报价金额')
        return
    }

    if (providerCredits.value < quoteCost) {
        ElMessageBox.alert('您的积分不足，无法报价。请前往充值。', '积分不足', {
            confirmButtonText: '去充值',
            callback: () => {
                // Redirect logic would go here
            }
        })
        return
    }
    
    ElMessageBox.confirm(
        `本次报价将消耗 ${quoteCost} 积分，您的当前余额为 ${providerCredits.value} 积分。确定继续吗？`,
        '确认报价',
        {
            confirmButtonText: '确定扣费并报价',
            cancelButtonText: '取消',
            type: 'warning'
        }
    ).then(() => {
        // Deduction logic
        providerCredits.value -= quoteCost
        
        // Simulate API call
        setTimeout(() => {
            if (selectedTask.value) {
                selectedTask.value.hasQuoted = true
                ElMessage.success(`报价成功！已扣除 ${quoteCost} 积分`)
                drawerVisible.value = false
            }
        }, 500)
    }).catch(() => {})
}

const handleReply = () => {
    if (!quoteForm.message) {
         ElMessage.warning('请输入回复内容')
         return
    }
    ElMessage.success('回复信息已发送')
}
</script>
