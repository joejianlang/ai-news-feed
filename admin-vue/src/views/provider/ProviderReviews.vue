<template>
  <div class="h-full flex flex-col">
    <!-- Header / Tabs -->
    <div class="bg-white p-4 border-b border-gray-100 flex items-center justify-between">
      <div class="flex space-x-8">
        <button 
          class="font-bold pb-2 transition-colors relative"
          :class="activeTab === 'standard' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'"
          @click="activeTab = 'standard'"
        >
          标准服务评价(5)
          <span v-if="activeTab === 'standard'" class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></span>
        </button>
        <button 
          class="font-bold pb-2 transition-colors relative"
          :class="activeTab === 'custom' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'"
          @click="activeTab = 'custom'"
        >
          定制服务评价(5)
          <span v-if="activeTab === 'custom'" class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></span>
        </button>
      </div>

      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2 text-sm text-gray-600">
            总体评价: 
            <el-rate v-model="overallRate" disabled text-color="#ff9900" show-score score-template="{value}" />
        </div>
        <el-date-picker
            v-model="dateFilter"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
            class="!w-60"
        />
      </div>
    </div>

    <!-- Reviews List -->
    <div class="flex-1 px-6 overflow-y-auto">
      <div class="bg-white rounded-xl shadow-sm p-6 min-h-[500px]">
        <div class="space-y-8 divide-y divide-gray-100">
            <div v-for="review in currentReviews" :key="review.id" class="pt-8 first:pt-0">
                <!-- Metadata Row -->
                <div class="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500 mb-4">
                    <div class="flex items-center gap-6">
                        <div class="flex items-center gap-2">
                            <span>评价星级:</span>
                            <el-rate v-model="review.rate" disabled size="small" />
                        </div>
                        <div>来自客户: <span class="text-gray-900 font-medium">{{ review.clientName }}</span></div>
                        <div>{{ review.time }}</div>
                    </div>
                    <div class="max-w-md truncate" title="点击查看订单详情">
                        服务订单: {{ review.orderName }}
                    </div>
                </div>

                <!-- Content Row -->
                <div class="flex gap-4">
                    <div class="flex-1">
                        <div class="flex gap-2">
                            <span class="text-gray-500 shrink-0">评价内容:</span>
                            <p class="text-gray-800 leading-relaxed">{{ review.content }}</p>
                        </div>
                    </div>
                    
                    <!-- Photos -->
                    <div v-if="review.images && review.images.length" class="flex gap-2 shrink-0">
                        <span class="text-gray-500 text-sm mt-1">评价照片:</span>
                        <div class="flex gap-2">
                            <div v-for="(img, idx) in review.images" :key="idx" class="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                <img :src="img" class="w-full h-full object-cover" alt="Review Image" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="currentReviews.length === 0" class="text-center py-20 text-gray-400">
                暂无评价
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const activeTab = ref('standard')
const overallRate = ref(4.6)
const dateFilter = ref('')

// Mock Data
const mockReviewsStandard = [
    {
        id: 1,
        rate: 5,
        clientName: '客户名称',
        time: '2025/07/12 17:40:00',
        orderName: '清洁打扫3小时清洁打扫3小时清洁打扫3小时上门服务深度清洁...',
        content: '服务很周到，打扫的很干净！服务很周到，打扫的很干净！服务很周到，打扫的很干净！服务很周到，打扫的很干净！',
        images: [
            'https://placehold.co/100x100?text=Image1',
            'https://placehold.co/100x100?text=Image2',
            'https://placehold.co/100x100?text=Image3',
            'https://placehold.co/100x100?text=Image4'
        ]
    },
    {
        id: 2,
        rate: 4,
        clientName: '客户名称',
        time: '2025/07/12 17:40:00',
        orderName: '清洁打扫3小时清洁打扫3小时清洁打扫',
        content: '服务很周到，打扫的很干净！服务很周到，打扫的很干净！',
        images: [
            'https://placehold.co/100x100?text=Image1',
            'https://placehold.co/100x100?text=Image2'
        ]
    }
]

const mockReviewsCustom = [
    {
        id: 3,
        rate: 5,
        clientName: '李先生',
        time: '2025/07/10 12:00:00',
        orderName: '全屋新房开荒保洁',
        content: '非常专业，由于是新房，很多死角都处理干净了。',
        images: []
    }
]

const currentReviews = computed(() => {
    return activeTab.value === 'standard' ? mockReviewsStandard : mockReviewsCustom
})
</script>
