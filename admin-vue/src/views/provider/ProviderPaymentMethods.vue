<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="bg-white p-6 border-b border-gray-100 flex items-center justify-between mb-6">
      <h2 class="text-lg font-bold text-gray-800">收款方式</h2>
      
      <button class="text-red-500 font-bold hover:text-red-600 flex items-center gap-1" @click="handleAddCard">
        添加银行卡
      </button>
    </div>

    <!-- Cards List -->
    <div class="flex-1 px-6 overflow-y-auto">
        <div class="space-y-4">
            <div v-for="card in cards" :key="card.id" class="bg-white rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm border border-transparent hover:border-gray-200 transition-colors">
                <!-- Left: Info -->
                <div class="flex items-start gap-4">
                    <div class="text-orange-500 mt-1">
                        <el-icon :size="24"><CreditCard /></el-icon>
                    </div>
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span v-if="card.isDefault" class="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded font-bold">默认卡片</span>
                            <span class="font-bold text-lg text-gray-800">{{ card.cardNumber }}</span>
                        </div>
                        <div class="text-sm text-gray-500">所属人: {{ card.holderName }}</div>
                    </div>
                </div>

                <!-- Right: Actions -->
                <div class="flex items-center gap-6 text-sm font-medium">
                    <span v-if="card.isDefault" class="text-gray-400">默认卡片</span>
                    <button v-else class="text-blue-500 hover:text-blue-700" @click="setAsDefault(card.id)">设为默认</button>
                    
                    <button class="text-gray-600 hover:text-gray-900" @click="manageCard(card.id)">管理卡片</button>
                    <button class="text-gray-600 hover:text-red-600" @click="deleteCard(card.id)">删除</button>
                </div>
            </div>

            <!-- Empty State -->
             <div v-if="cards.length === 0" class="bg-white rounded-xl p-12 text-center text-gray-400">
                <el-icon :size="48" class="mb-4"><CreditCard /></el-icon>
                <div>暂无银行卡</div>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CreditCard } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const cards = ref([
    {
        id: 1,
        cardNumber: '1234567890123456',
        holderName: '持卡人姓名',
        isDefault: true
    },
    {
        id: 2,
        cardNumber: '9876543210987654',
        holderName: '持卡人姓名',
        isDefault: false
    }
])

const handleAddCard = () => {
    ElMessage.info('添加银行卡功能开发中')
}

const setAsDefault = (id: number) => {
    cards.value.forEach(c => c.isDefault = (c.id === id))
    ElMessage.success('设置成功')
}

const manageCard = (id: number) => {
    ElMessage.info(`管理卡片 ${id}`)
}

const deleteCard = (id: number) => {
    ElMessageBox.confirm('确定删除该银行卡吗？', '提示', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
        .then(() => {
            cards.value = cards.value.filter(c => c.id !== id)
            ElMessage.success('已删除')
        })
        .catch(() => {})
}
</script>
