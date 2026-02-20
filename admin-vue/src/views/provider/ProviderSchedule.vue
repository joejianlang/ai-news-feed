<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="bg-white p-6 border-b border-gray-100 mb-6">
      <h2 class="text-lg font-bold text-gray-800">服务时间管理</h2>
      <p class="text-sm text-gray-500 mt-1">设置您的常规工作时间，以及节假日的接单偏好。</p>
    </div>

    <!-- Content -->
    <div class="flex-1 px-6 overflow-y-auto">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Weekly Schedule -->
          <div class="bg-white rounded-xl shadow-sm p-6">
              <div class="flex items-center justify-between mb-6">
                  <h3 class="text-base font-bold text-gray-800 flex items-center gap-2">
                      <el-icon class="text-blue-500"><Calendar /></el-icon>
                      每周常规时间
                  </h3>
                  <el-button link type="primary" size="small" @click="applyMonToFri">
                    一键应用周一至周五
                  </el-button>
              </div>

              <div class="space-y-4">
                  <div v-for="day in weekDays" :key="day.key" class="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-100 transition-colors" :class="day.isActive ? 'bg-white' : 'bg-gray-50'">
                      
                      <!-- Day & Toggle -->
                      <div class="flex items-center gap-4 w-32">
                          <el-checkbox v-model="day.isActive">
                             <span :class="day.isActive ? 'text-gray-900 font-medium' : 'text-gray-400'">{{ day.label }}</span>
                          </el-checkbox>
                      </div>

                      <!-- Time Range -->
                      <div class="flex-1 flex justify-end">
                          <div v-if="day.isActive" class="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                             <el-time-select
                                v-model="day.startTime"
                                start="06:00"
                                step="00:30"
                                end="22:00"
                                placeholder="上班"
                                class="!w-28"
                                size="small"
                             />
                             <span class="text-gray-400">-</span>
                             <el-time-select
                                v-model="day.endTime"
                                start="06:00"
                                step="00:30"
                                end="23:00"
                                placeholder="下班"
                                class="!w-28"
                                size="small"
                                :min-time="day.startTime"
                             />
                          </div>
                          <div v-else class="text-sm text-gray-400 py-1.5 px-2 bg-gray-100 rounded">
                              休息中
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Holiday Settings -->
          <div>
            <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 class="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <el-icon class="text-red-500"><CoffeeCup /></el-icon>
                    节假日偏好 (加拿大)
                </h3>
                
                <div class="bg-orange-50 rounded-lg p-4 mb-6">
                    <el-checkbox v-model="restOnStatHolidays" label="法定节假日自动休假" class="!font-bold !text-gray-800" />
                    <p class="text-xs text-gray-500 ml-6 mt-1">开启后，将在下列加拿大法定节假日自动关闭接单。</p>
                </div>

                <div class="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    <div v-for="holiday in holidays" :key="holiday.date" class="flex items-center justify-between p-3 border-b border-gray-50">
                        <div>
                            <div class="text-sm font-medium text-gray-800">{{ holiday.name }}</div>
                            <div class="text-xs text-gray-500">{{ holiday.date }}</div>
                        </div>
                        <el-tag v-if="restOnStatHolidays" type="info" size="small">休假</el-tag>
                        <el-switch v-else v-model="holiday.isWork" active-text="工作" inactive-text="休假" inline-prompt />
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-end">
                <el-button size="large" @click="reset">重置</el-button>
                <el-button type="primary" size="large" @click="save">保存设置</el-button>
            </div>
          </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Calendar, CoffeeCup } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const restOnStatHolidays = ref(true)

interface DaySchedule {
    key: string;
    label: string;
    isActive: boolean;
    startTime: string;
    endTime: string;
}

const defaultTime = { start: '09:00', end: '18:00' }

const weekDays = ref<DaySchedule[]>([
    { key: 'M', label: '周一', isActive: true, startTime: '09:00', endTime: '18:00' },
    { key: 'T', label: '周二', isActive: true, startTime: '09:00', endTime: '18:00' },
    { key: 'W', label: '周三', isActive: true, startTime: '09:00', endTime: '18:00' },
    { key: 'T2', label: '周四', isActive: true, startTime: '09:00', endTime: '18:00' },
    { key: 'F', label: '周五', isActive: true, startTime: '09:00', endTime: '18:00' },
    { key: 'S', label: '周六', isActive: false, startTime: '10:00', endTime: '16:00' },
    { key: 'S2', label: '周日', isActive: false, startTime: '10:00', endTime: '16:00' },
])

const holidays = ref([
    { name: 'New Year\'s Day (元旦)', date: '2025-01-01', isWork: false },
    { name: 'Family Day (家庭日)', date: '2025-02-17', isWork: false },
    { name: 'Good Friday (耶稣受难日)', date: '2025-04-18', isWork: false },
    { name: 'Victoria Day (维多利亚日)', date: '2025-05-19', isWork: false },
    { name: 'Canada Day (加拿大国庆日)', date: '2025-07-01', isWork: false },
    { name: 'Civic Holiday (公民日)', date: '2025-08-04', isWork: false },
    { name: 'Labour Day (劳动节)', date: '2025-09-01', isWork: false },
    { name: 'Thanksgiving (感恩节)', date: '2025-10-13', isWork: false },
    { name: 'Christmas Day (圣诞节)', date: '2025-12-25', isWork: false },
    { name: 'Boxing Day (节礼日)', date: '2025-12-26', isWork: false }
])

const applyMonToFri = () => {
    const firstActive = weekDays.value.find(d => d.isActive)
    const timeToApply = firstActive ? { start: firstActive.startTime, end: firstActive.endTime } : defaultTime
    
    // Apply to Mon-Fri (first 5)
    for(let i=0; i<5; i++) {
        weekDays.value[i].isActive = true
        weekDays.value[i].startTime = timeToApply.start
        weekDays.value[i].endTime = timeToApply.end
    }
    ElMessage.success('已应用到周一至周五')
}

const save = () => {
    // In real app, send to backend
    ElMessage.success('服务时间设置已保存')
}

const reset = () => {
    ElMessage.info('已重置为默认设置')
}
</script>
