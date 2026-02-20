<template>
  <div class="h-full flex flex-col">
    <!-- Header / Tabs -->
    <div class="bg-white p-4 border-b border-gray-100 flex items-center justify-between">
      <div class="flex space-x-8">
        <button 
          class="font-bold pb-2 transition-colors relative"
          :class="activeTab === 'credits' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'"
          @click="activeTab = 'credits'"
        >
          购买积分
          <span v-if="activeTab === 'credits'" class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></span>
        </button>
        <button 
          class="font-bold pb-2 transition-colors relative"
          :class="activeTab === 'membership' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'"
          @click="activeTab = 'membership'"
        >
          成为会员
          <span v-if="activeTab === 'membership'" class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></span>
        </button>
      </div>
    </div>

    <div class="flex-1 p-6 overflow-y-auto">
      <div class="bg-white rounded-xl shadow-sm p-6 max-w-5xl mx-auto min-h-[500px]">
        
        <!-- Tab 1: Buy Credits -->
        <div v-if="activeTab === 'credits'" class="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <!-- Credits Summary Card -->
            <div class="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-8 text-white mb-8">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <div class="text-white/80 mb-2">我的积分</div>
                        <div class="flex items-baseline gap-4">
                            <span class="text-5xl font-bold">{{ creditsBalance.total || 0 }}</span>
                            <el-button 
                                size="small" 
                                circle 
                                @click="refreshBalance"
                                :loading="loadingBalance"
                                class="!bg-white/20 !border-white/30 !text-white hover:!bg-white/30"
                            >
                                <el-icon><Refresh /></el-icon>
                            </el-button>
                        </div>
                    </div>
                    <el-button type="primary" size="large" @click="handleBuyCredits" class="!bg-white !text-blue-600 hover:!bg-blue-50">
                        购买积分
                    </el-button>
                </div>
                
                <!-- Subscription Info -->
                <div v-if="creditsBalance.subscriptionInfo" class="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
                    <div>
                        <div class="text-white/70 text-sm mb-1">订阅积分</div>
                        <div class="text-2xl font-semibold">{{ creditsBalance.subscription || 0 }}</div>
                    </div>
                    <div>
                        <div class="text-white/70 text-sm mb-1">剩余上架次数</div>
                        <div class="text-2xl font-semibold">{{ creditsBalance.listings || 0 }}</div>
                    </div>
                    <div>
                        <div class="text-white/70 text-sm mb-1">购买积分</div>
                        <div class="text-2xl font-semibold">{{ creditsBalance.purchased || 0 }}</div>
                    </div>
                </div>
            </div>

            <!-- Settings / History Tabs -->
            <div class="mb-6">
                <div class="flex gap-6 border-b border-gray-100 mb-6">
                    <button 
                        class="pb-2 text-sm font-medium transition-colors relative"
                        :class="subTab === 'settings' ? 'text-blue-600' : 'text-gray-500'"
                        @click="subTab = 'settings'"
                    >
                        自动设置
                        <span v-if="subTab === 'settings'" class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></span>
                    </button>
                    <button 
                        class="pb-2 text-sm font-medium transition-colors relative"
                        :class="subTab === 'history' ? 'text-blue-600' : 'text-gray-500'"
                        @click="subTab = 'history'"
                    >
                        积分记录
                        <span v-if="subTab === 'history'" class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></span>
                    </button>
                </div>

                <!-- Auto Settings Form -->
                <div v-if="subTab === 'settings'" class="max-w-3xl space-y-8 pl-4">
                    <!-- Auto Recharge -->
                    <div class="flex items-center gap-4">
                        <div class="w-24 text-sm font-bold text-gray-700">自动购买积分</div>
                        <el-switch v-model="autoRecharge" active-text="开启" inactive-text="关闭" />
                    </div>
                    
                    <div class="flex items-center gap-4 pl-28">
                        <el-input v-model="rechargeAmount" placeholder="请输入充值积分100的整数倍" class="w-64" :disabled="!autoRecharge" />
                        <span class="text-xs text-gray-400">积分低于100时自动充值</span>
                    </div>

                    <!-- Credit Gifting -->
                    <div class="flex items-center gap-4 pt-4">
                        <div class="w-24 text-sm font-bold text-gray-700">积分赠送</div>
                        <el-switch v-model="autoGift" active-text="开启" inactive-text="关闭" />
                    </div>

                    <div class="flex items-center gap-4 pl-28">
                        <el-input v-model="giftAmount" placeholder="请输入赠送积分" class="w-64" :disabled="!autoGift" />
                        <span class="text-xs text-gray-400">用户分享并成功下单后，可赠送积分</span>
                    </div>

                    <div class="pl-28 pt-8">
                        <el-button type="primary" class="w-40" @click="saveSettings">保存</el-button>
                    </div>
                </div>

                <!-- History Table (Placeholder) -->
                <div v-else class="text-center py-10 text-gray-400 text-sm">
                    暂无积分变动记录
                </div>
            </div>
        </div>

        <!-- Tab 2: Membership (Existing Content) -->
        <div v-if="activeTab === 'membership'" class="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <!-- Current Status -->
            <div class="mb-8 flex items-center">
            <span class="text-gray-600 mr-2">我的会员等级:</span>
            <span class="font-bold text-gray-800">未开通</span>
            </div>

            <!-- Membership Levels -->
            <div class="mb-8">
            <h3 class="text-lg font-bold text-gray-800 mb-4">选择会员</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Level 1: Junior -->
                <div 
                class="relative rounded-xl p-6 text-white cursor-pointer transition-transform hover:scale-105"
                :class="selectedLevel === 'junior' ? 'ring-4 ring-blue-200' : ''"
                @click="selectLevel('junior')"
                style="background: linear-gradient(135deg, #E4C09E 0%, #B68D68 100%)"
                >
                <div class="flex justify-between items-start mb-4">
                    <h4 class="text-xl font-bold">初级会员</h4>
                    <div class="bg-white/20 p-1 rounded-full">
                    <el-icon><Trophy /></el-icon>
                    </div>
                </div>
                <div class="space-y-2 text-sm opacity-90">
                    <p>积分数量: 每月赠送300</p>
                    <p>报价次数: 每月5次</p>
                    <p>等级权益:</p>
                    <ul class="list-disc list-inside pl-1 text-xs">
                    <li>基础接单权益</li>
                    <li>标准客服支持</li>
                    </ul>
                </div>
                </div>

                <!-- Level 2: Intermediate -->
                <div 
                class="relative rounded-xl p-6 text-white cursor-pointer transition-transform hover:scale-105"
                :class="selectedLevel === 'intermediate' ? 'ring-4 ring-blue-200' : ''"
                @click="selectLevel('intermediate')"
                style="background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)"
                >
                <div class="flex justify-between items-start mb-4">
                    <h4 class="text-xl font-bold">中级会员</h4>
                    <div class="bg-white/20 p-1 rounded-full">
                    <el-icon><Star /></el-icon>
                    </div>
                </div>
                <div class="space-y-2 text-sm opacity-90">
                    <p>积分数量: 每月赠送500</p>
                    <p>报价次数: 每月10次</p>
                    <p>等级权益:</p>
                    <ul class="list-disc list-inside pl-1 text-xs">
                    <li>优先接单权益</li>
                    <li>专属客服支持</li>
                    </ul>
                </div>
                
                <!-- Selected Indicator Example -->
                <div v-if="selectedLevel === 'intermediate'" class="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 border-2 border-white">
                    <el-icon><Check /></el-icon>
                </div>
                </div>

                <!-- Level 3: Senior -->
                <div 
                class="relative rounded-xl p-6 text-white cursor-pointer transition-transform hover:scale-105"
                :class="selectedLevel === 'senior' ? 'ring-4 ring-blue-200' : ''"
                @click="selectLevel('senior')"
                style="background: linear-gradient(135deg, #374151 0%, #111827 100%)"
                >
                <div class="flex justify-between items-start mb-4">
                    <h4 class="text-xl font-bold">高级会员</h4>
                    <div class="bg-white/20 p-1 rounded-full">
                    <el-icon><Medal /></el-icon>
                    </div>
                </div>
                <div class="space-y-2 text-sm opacity-90">
                    <p>积分数量: 每月赠送800</p>
                    <p>报价次数: 不限次数</p>
                    <p>等级权益:</p>
                    <ul class="list-disc list-inside pl-1 text-xs">
                    <li>最高接单优先级</li>
                    <li>1对1专属管家</li>
                    <li>平台费率优惠</li>
                    </ul>
                </div>
                </div>
            </div>
            </div>

            <!-- Duration Selection -->
            <div class="mb-8">
            <h3 class="text-lg font-bold text-gray-800 mb-4">选择开通时长</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div 
                v-for="plan in currentPlans" 
                :key="plan.id"
                class="border rounded-lg p-6 text-center cursor-pointer transition-all hover:border-blue-400 relative"
                :class="selectedPlanId === plan.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200'"
                @click="selectedPlanId = plan.id"
                >
                <div class="text-gray-600 mb-2">{{ plan.name }}</div>
                <div class="text-2xl font-bold text-orange-500">¥{{ plan.price }}</div>
                <div v-if="plan.discount" class="absolute top-0 right-0 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-bl-lg rounded-tr-lg">
                    {{ plan.discount }}
                </div>
                </div>
            </div>
            </div>

            <!-- Footer / Action -->
            <div class="border-t pt-6 flex flex-col md:flex-row items-center justify-end space-y-4 md:space-y-0 md:space-x-6">
                <div class="text-sm text-gray-500">
                    <el-checkbox v-model="agree" label="确认协议并支付" />
                    <span class="ml-1">
                        <a href="#" class="text-blue-600">《会员协议》</a>
                        <a href="#" class="text-blue-600">《续费协议》</a>
                    </span>
                </div>
                <div class="text-right">
                    <div class="text-sm text-gray-500 mb-1">确认支付</div>
                    <div class="text-3xl font-bold text-orange-500">¥{{ selectedPrice }}</div>
                </div>
                <el-button type="primary" size="large" class="w-full md:w-32" :disabled="!agree" @click="handlePurchase">
                    立即购买
                </el-button>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Trophy, Star, Medal, Check, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { api } from '@/services/api'

// API_BASE_URL is handled by the api service

// --- Tabs State ---
const activeTab = ref('credits') // Default to 'credits' as per request
const subTab = ref('settings')

// --- User Info ---
const adminUser = ref<any>({})

// --- Credits Balance State ---
const creditsBalance = ref({
    total: 0,
    purchased: 0,
    subscription: 0,
    listings: 0,
    subscriptionInfo: null as any
})
const loadingBalance = ref(false)

// Fetch credits balance
const fetchCreditsBalance = async () => {
    loadingBalance.value = true
    try {
        const response = await api.get('/credits/balance')
        
        if (response.data.success) {
            creditsBalance.value = response.data.data
        }
    } catch (error: any) {
        console.error('获取积分余额失败:', error)
        ElMessage.error(error.message || '获取积分余额失败')
    } finally {
        loadingBalance.value = false
    }
}

const refreshBalance = () => {
    fetchCreditsBalance()
}

onMounted(() => {
    try {
        const u = localStorage.getItem('admin_user')
        if (u) adminUser.value = JSON.parse(u)
    } catch {}
    
    // Fetch real credits balance
    fetchCreditsBalance()
})

// --- Credits Tab State ---
const autoRecharge = ref(true)
const rechargeAmount = ref('')
const autoGift = ref(false)
const giftAmount = ref('')

const handleBuyCredits = () => {
    ElMessage.info('即将在下个版本开放充值功能')
}
const saveSettings = () => {
    ElMessage.success('设置保存成功')
}

// --- Membership Tab State ---
const selectedLevel = ref('junior')
const selectedPlanId = ref('1_month')
const agree = ref(false)

const pricing = {
    junior: [
        { id: '1_month', name: '1个月', price: 200 },
        { id: '3_month', name: '3个月', price: 560, discount: '省40' },
        { id: '12_month', name: '12个月', price: 1600, discount: '省800' },
        { id: 'sub_1_month', name: '连续开通1个月', price: 190, discount: '订阅优惠' },
        { id: 'sub_3_month', name: '连续开通3个月', price: 530, discount: '订阅优惠' },
        { id: 'sub_12_month', name: '连续开通12个月', price: 1500, discount: '订阅优惠' },
    ],
    intermediate: [
        { id: '1_month', name: '1个月', price: 400 },
        { id: '3_month', name: '3个月', price: 1100, discount: '省100' },
        { id: '12_month', name: '12个月', price: 4000, discount: '省800' },
        { id: 'sub_1_month', name: '连续开通1个月', price: 380, discount: '订阅优惠' },
        { id: 'sub_3_month', name: '连续开通3个月', price: 1050, discount: '订阅优惠' },
        { id: 'sub_12_month', name: '连续开通12个月', price: 3800, discount: '订阅优惠' },
    ],
    senior: [
        { id: '1_month', name: '1个月', price: 800 },
        { id: '3_month', name: '3个月', price: 2300, discount: '省100' },
        { id: '12_month', name: '12个月', price: 8000, discount: '省1600' },
        { id: 'sub_1_month', name: '连续开通1个月', price: 750, discount: '订阅优惠' },
        { id: 'sub_3_month', name: '连续开通3个月', price: 2200, discount: '订阅优惠' },
        { id: 'sub_12_month', name: '连续开通12个月', price: 7800, discount: '订阅优惠' },
    ]
}

const currentPlans = computed(() => {
    return pricing[selectedLevel.value as keyof typeof pricing]
})

const selectedPrice = computed(() => {
    const plan = currentPlans.value.find(p => p.id === selectedPlanId.value)
    return plan ? plan.price : 0
})

const selectLevel = (level: string) => {
    selectedLevel.value = level
    selectedPlanId.value = '1_month'
}

const handlePurchase = () => {
    ElMessage.success('正在跳转支付页面...')
}
</script>

<style scoped>
/* Custom scrollbar if needed */
</style>
