<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="bg-white p-6 border-b border-gray-100 flex items-center justify-between mb-6">
      <div>
        <h2 class="text-lg font-bold text-gray-800">服务区域管理</h2>
        <p class="text-sm text-gray-500 mt-1">设置您的服务覆盖范围，只有在这些区域的用户才能看到您的服务。</p>
      </div>
      
      <el-button type="primary" @click="dialogVisible = true">
        <el-icon class="mr-1"><Plus /></el-icon> 添加服务城市
      </el-button>
    </div>

    <!-- Areas List -->
    <div class="flex-1 px-6 overflow-y-auto">
        <div v-if="selectedCities.length > 0" class="bg-white rounded-xl shadow-sm p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div v-for="(city, index) in selectedCities" :key="city.id" class="border border-gray-200 rounded-lg p-4 flex items-center justify-between group hover:border-blue-500 transition-colors bg-gray-50 hover:bg-white">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <el-icon><Location /></el-icon>
                        </div>
                        <div>
                            <div class="font-bold text-gray-800">{{ city.name }}</div>
                            <div class="text-xs text-gray-500">{{ city.province }}</div>
                        </div>
                    </div>
                    
                    <el-button type="danger" link size="small" class="opacity-0 group-hover:opacity-100 transition-opacity" @click="removeCity(index)">
                        删除
                    </el-button>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex flex-col items-center justify-center h-96 text-gray-400 bg-white rounded-xl shadow-sm">
            <el-icon :size="64" class="mb-4 text-gray-300"><MapLocation /></el-icon>
            <div class="mb-4">暂未配置服务区域</div>
            <el-button type="primary" plain @click="dialogVisible = true">立即添加</el-button>
        </div>
    </div>

    <!-- Add City Dialog -->
    <el-dialog v-model="dialogVisible" title="添加服务城市" width="500px">
        <div class="py-4">
            <el-form label-position="top">
                <el-form-item label="选择城市">
                    <el-select v-model="newCityId" placeholder="请选择城市" class="w-full" filterable>
                        <!-- Updated to flat list -->
                        <el-option
                            v-for="item in activeCityOptions"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                            :disabled="isCitySelected(item.value)"
                        />
                    </el-select>
                </el-form-item>
            </el-form>
            <div class="bg-blue-50 text-blue-600 text-xs p-3 rounded mt-2">
                <el-icon class="mr-1 relative top-0.5"><InfoFilled /></el-icon>
                添加城市后，该城市下的所有行政区默认支持服务。
            </div>
        </div>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="addCity" :disabled="!newCityId">
                    确认添加
                </el-button>
            </span>
        </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Location, MapLocation, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { citiesApi } from '../../services/api'

const dialogVisible = ref(false)
const newCityId = ref('')

// Data
const selectedCities = ref<any[]>([])
const activeCityOptions = ref<any[]>([])

const fetchActiveCities = async () => {
    try {
        const res = await citiesApi.getActive()
        // Map API response to options
        activeCityOptions.value = res.map((c: any) => ({
            value: c.id,
            label: `${c.name} (${c.code})`
        }))
    } catch (e) {
        console.error('Failed to load cities', e)
    }
}

onMounted(() => {
    fetchActiveCities()
})

const isCitySelected = (value: string) => {
    return selectedCities.value.some(c => c.id === value)
}

const addCity = () => {
    const found = activeCityOptions.value.find(opt => opt.value === newCityId.value)
    if (found) {
        selectedCities.value.push({
            id: found.value,
            name: found.label.split(' (')[0],
            province: '已开通' 
        })
        ElMessage.success(`已添加 ${found.label}`)
        dialogVisible.value = false
        newCityId.value = ''
    }
}

const removeCity = (index: number) => {
    ElMessageBox.confirm('确定移除该服务城市吗？', '提示', { type: 'warning' })
        .then(() => {
            selectedCities.value.splice(index, 1)
            ElMessage.success('已移除')
        })
        .catch(() => {})
}
</script>
