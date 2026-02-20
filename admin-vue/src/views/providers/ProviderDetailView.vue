<template>
  <div class="p-6">
    <el-breadcrumb separator="/" class="mb-4">
      <el-breadcrumb-item :to="{ path: '/dashboard' }">控制台</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/dashboard/providers' }">服务商管理</el-breadcrumb-item>
      <el-breadcrumb-item>服务商详情</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Profile Card -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-start gap-6">
            <el-avatar :size="80" class="bg-blue-500 text-2xl">{{ provider.name ? provider.name.charAt(0) : '' }}</el-avatar>
            <div class="flex-1">
              <div class="flex justify-between items-start">
                <div>
                  <h2 class="text-2xl font-bold text-gray-800">{{ provider.name }}</h2>
                  <p class="text-gray-500 mt-1">{{ provider.category }}</p>
                </div>
                <el-tag :type="provider.status === 'verified' ? 'success' : 'warning'" size="large">
                  {{ provider.statusText }}
                </el-tag>
              </div>
              <div class="flex items-center gap-6 mt-4 text-sm">
                <div class="flex items-center gap-1">
                  <el-icon class="text-yellow-500"><Star /></el-icon>
                  <span class="font-bold">{{ provider.rating }}</span>
                  <span class="text-gray-400">({{ provider.reviews }} 评价)</span>
                </div>
                <div class="text-gray-600">
                  完成 <span class="font-bold text-gray-800">{{ provider.orders }}</span> 单
                </div>
                <div class="text-gray-600">
                  加入于 <span class="text-gray-800">{{ provider.joinDate }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Basic Info -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">基本信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="联系电话">{{ provider.phone }}</el-descriptions-item>
            <el-descriptions-item label="电子邮箱">{{ provider.email }}</el-descriptions-item>
            <el-descriptions-item label="服务类别" :span="2">
              <template v-if="provider.category && provider.category !== '-'">
                <el-tag v-for="cat in provider.category?.split(', ')" :key="cat" size="small" class="mr-2">{{ cat }}</el-tag>
              </template>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="服务区域" :span="2">{{ Array.isArray(provider.serviceArea) ? provider.serviceArea.join(', ') : provider.serviceArea }}</el-descriptions-item>
            <el-descriptions-item label="营业执照" :span="2">
              <el-tag :type="provider.license_url ? 'success' : 'info'" size="small">
                {{ provider.license_url ? '已上传' : '未上传' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="简介" :span="2">{{ provider.intro }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- Extra Registration Info (Dynamic) -->
        <div v-if="provider.extra_data && Object.keys(provider.extra_data).length > 0" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">入驻增补信息</h3>
          <el-descriptions :column="2" border>
            <template v-for="(val, key) in provider.extra_data" :key="key">
                <el-descriptions-item :label="getFieldLabel(key)">
                    <template v-if="isAnyImage(val)">
                         <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                             <el-image 
                                v-for="(img, idx) in toImageArray(val)" 
                                :key="idx"
                                :src="String(img)" 
                                :preview-src-list="[String(img)]"
                                class="w-20 h-20 rounded-lg object-cover border"
                                fit="cover"
                              />
                         </div>
                    </template>
                    <span v-else class="whitespace-pre-wrap break-all">{{ formatValue(val) }}</span>
                </el-descriptions-item>
            </template>
          </el-descriptions>
        </div>

        <!-- Qualification Materials -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6" v-if="hasMaterials">
          <h3 class="text-lg font-bold text-gray-800 mb-4">资质材料</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <!-- Profile Documents -->
            <div v-if="provider.license_url" class="space-y-2">
              <p class="text-xs text-gray-500">营业执照</p>
              <el-image 
                :src="provider.license_url" 
                :preview-src-list="[provider.license_url]"
                class="w-full h-32 rounded-lg object-cover border"
                fit="cover"
              />
            </div>
            <div v-if="provider.id_front_url" class="space-y-2">
              <p class="text-xs text-gray-500">身份证正面</p>
              <el-image 
                :src="provider.id_front_url" 
                :preview-src-list="[provider.id_front_url]"
                class="w-full h-32 rounded-lg object-cover border"
                fit="cover"
              />
            </div>
            <div v-if="provider.id_back_url" class="space-y-2">
              <p class="text-xs text-gray-500">身份证反面</p>
              <el-image 
                :src="provider.id_back_url" 
                :preview-src-list="[provider.id_back_url]"
                class="w-full h-32 rounded-lg object-cover border"
                fit="cover"
              />
            </div>
            
            <!-- Application Specific Documents -->
            <template v-for="app in userApplications" :key="app.id">
              <template v-if="app.documents">
                 <div v-for="(doc, idx) in app.documents" :key="idx" class="space-y-2">
                    <p class="text-xs text-gray-500">{{ app.service_type }} - 附件{{ Number(idx) + 1 }}</p>
                    <el-image 
                      :src="doc" 
                      :preview-src-list="[doc]"
                      class="w-full h-32 rounded-lg object-cover border"
                      fit="cover"
                    />
                 </div>
              </template>
            </template>
          </div>
        </div>

        <!-- Recent Orders -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-gray-800">最近订单</h3>
            <el-button text type="primary">查看全部</el-button>
          </div>
          <el-table :data="recentOrders" size="small">
            <el-table-column prop="id" label="订单编号" width="150" />
            <el-table-column prop="service" label="服务" width="100" />
            <el-table-column prop="user" label="用户" width="100" />
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="amount" label="金额" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === '已完成' ? 'success' : ''" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- Side Panel -->
      <div class="space-y-6">
        <!-- Stats -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">服务数据</h3>
          <div class="space-y-4">
            <div class="flex justify-between">
              <span class="text-gray-500">本月订单</span>
              <span class="font-bold text-gray-800">{{ provider.monthlyOrders }} 单</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">当前积分</span>
              <span class="font-bold text-blue-600">{{ provider.credits }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">本月收入</span>
              <span class="font-bold text-emerald-500">${{ provider.monthlyRevenue }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">好评率</span>
              <span class="font-bold text-gray-800">{{ provider.positiveRate }}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">回复率</span>
              <span class="font-bold text-gray-800">{{ provider.responseRate }}%</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">操作</h3>
          <div class="space-y-3">
            <el-button class="w-full" @click="contactProvider">联系服务商</el-button>
            <el-button class="w-full">查看评价</el-button>
            <el-button class="w-full">编辑信息</el-button>
            <!-- Show Demote button if user is a provider (either by role or by having approved profile) -->
            <el-button type="danger" class="w-full" plain v-if="provider.role === 'provider' || provider.profileStatus === 'approved'" @click="demoteProvider">降级为普通用户</el-button>
            <!-- Show Restore button ONLY if user was demoted (has profile but role is user and profile is NOT approved) -->
            <el-button type="warning" class="w-full" plain v-if="provider.role === 'user' && provider.hasProfile && provider.profileStatus !== 'approved'" @click="restoreProvider">恢复服务商身份</el-button>
            <el-button type="danger" class="w-full" plain v-if="provider.status === 'verified'">冻结账户</el-button>
            <el-button type="success" class="w-full" v-if="provider.status === 'pending'">通过审核</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Star } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usersApi, formTemplatesApi } from '../../services/api'

const route = useRoute()
const providerId = route.params.id

const provider = ref<any>({})
const recentOrders = ref<any[]>([])
const fieldLabelMap = ref<Record<string, string>>({})

const userApplications = ref<any[]>([])
const hasMaterials = ref(false)

const fetchProvider = async () => {
  try {
    const res = await usersApi.getById(providerId as string)
    const user = res.user
    const profile = user.provider_profile || {}
    userApplications.value = user.applications || []
    
    // Merge extra_data from applications to ensure all submitted info is visible
    let mergedExtraData = { ...(profile.extra_data || {}) }
    if (Array.isArray(userApplications.value)) {
        userApplications.value.forEach((app: any) => {
            if (app.extra_data) {
                Object.assign(mergedExtraData, app.extra_data)
            }
        })
    }
    
    // Fetch ALL provider_reg templates to ensure we find the matching keys (ignores category mismatch)
    try {
        const tplRes = await formTemplatesApi.getAll({ type: 'provider_reg' });
        if (tplRes.templates && tplRes.templates.length > 0) {
            tplRes.templates.forEach((template: any) => {
                if (template.steps) {
                    template.steps.forEach((step: any) => {
                        if (step.fields) {
                            step.fields.forEach((field: any) => {
                                fieldLabelMap.value[field.key] = field.label;
                            });
                        }
                    });
                }
            });
        }
    } catch (e) {
        console.error('Failed to fetch form templates for labels:', e);
    }

    provider.value = {
      id: user.id,
      name: user.name || user.email,
      category: profile.service_categories?.join(', ') || '-',
      status: user.status === 'active' ? 'verified' : 'pending',
      statusText: user.status === 'active' ? '已认证' : (user.status === 'disabled' ? '已冻结' : '待审核'),
      role: user.role,
      hasProfile: !!user.provider_profile && !!user.provider_profile.id, // Ensure profile exists
      profileStatus: user.provider_profile?.status || null, // Track actual profile approval status
      rating: profile.rating || 5.0,
      reviews: 0,
      orders: 0,
      joinDate: new Date(user.created_at).toLocaleDateString(),
      phone: user.phone || profile.contact_phone || '-',
      email: user.email,
      serviceArea: profile.service_city || profile.service_area || '-',
      intro: profile.description || profile.intro || profile.bio || '暂无简介',
      license_url: profile.license_url || profile.business_license_url,
      id_front_url: profile.id_front_url || profile.id_card_front_url,
      id_back_url: profile.id_back_url || profile.id_card_back_url,
      extra_data: mergedExtraData,
      monthlyOrders: 0,
      monthlyRevenue: 0,
      positiveRate: 100,
      responseRate: 100,
      credits: user.credits || 0
    }

    // Check if any materials exist
    hasMaterials.value = !!(provider.value.license_url || provider.value.id_front_url || provider.value.id_back_url || userApplications.value.some((a: any) => a.documents?.length > 0))

    if (user.recent_orders) {
      recentOrders.value = user.recent_orders.map((o: any) => ({
        id: o.id.substring(0, 8).toUpperCase(),
        service: '服务订单', // Could fetch template name if we had it joined or mapped
        user: o.user_email || '未知用户',
        date: new Date(o.created_at).toLocaleDateString(),
        amount: o.form_data?.price || o.form_data?.estimated_price || '-',
        status: o.status === 'completed' ? '已完成' : (o.status === 'processing' ? '进行中' : o.status)
      }))
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('获取服务商详情失败')
  }
}

onMounted(() => {
  fetchProvider()
})

const contactProvider = () => {
  ElMessage.info('拨打电话: ' + provider.value.phone)
}

const demoteProvider = async () => {
  try {
    await ElMessageBox.confirm(
      '确定将该服务商降级为普通用户吗？降级后该用户将失去服务商权限。',
      '降级确认',
      {
        confirmButtonText: '确定降级',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await usersApi.updateRole(providerId as string, 'user')
    ElMessage.success('已成功降级为普通用户')
    
    // Refresh data or redirect
    fetchProvider()
    // Alternatively redirect to user list if they are no longer considered a "provider" contextually
    // router.push('/dashboard/providers') 
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

    await usersApi.updateRole(providerId as string, 'provider')
    ElMessage.success('已成功恢复服务商身份')
    
    // Refresh data
    fetchProvider()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
      ElMessage.error('操作失败')
    }
  }
}
const getFieldLabel = (key: string | number) => {
    const k = String(key);
    
    // Check dynamic map first
    if (fieldLabelMap.value[k]) {
        return fieldLabelMap.value[k];
    }

    const labelMap: Record<string, string> = {
        'team_size': '团队人数',
        'truck_count': '货车数量',
        'moving_exp': '从业经验',
        'has_insurance': '商业保险',
        'certifications': '资质证书',
        'equipment': '专业设备',
        'car_brand': '车辆品牌',
        'car_model': '车辆型号',
        'plate_number': '车牌号',
        'license_image': '驾照照片',
        'insurance_image': '保险单照片',
        'registration_image': '车主证照片'
    };
    return labelMap[k] || k;
}

const isAnyImage = (val: any) => {
    if (!val) return false;
    let items = Array.isArray(val) ? val : [val];
    
    // If it's a string, it might be a JSON string of an array
    if (typeof val === 'string' && val.trim().startsWith('[') && (val.includes('data:image') || val.includes('http'))) {
        try { items = JSON.parse(val); } catch(e) {}
    }

    if (!Array.isArray(items)) items = [items];
    
    // Check if any item is an image
    return items.some(item => typeof item === 'string' && (
        item.startsWith('data:image') || 
        item.startsWith('http') || 
        item.match(/\.(jpeg|jpg|gif|png|webp)/i)
    ));
}

const toImageArray = (val: any) => {
    if (!val) return [];
    let items = Array.isArray(val) ? val : [val];
    if (typeof val === 'string' && val.trim().startsWith('[') && (val.includes('data:image') || val.includes('http'))) {
        try { items = JSON.parse(val); } catch(e) {}
    }
    if (!Array.isArray(items)) items = [items];
    return items.filter(item => typeof item === 'string' && (item.startsWith('data:image') || item.startsWith('http') || item.match(/\.(jpeg|jpg|gif|png|webp)/i)));
}

const formatValue = (val: any) => {
    if (val === null || val === undefined) return '-';
    // If it's that giant JSON string but NOT matched as an image (edge case), try to parse it
    if (typeof val === 'string' && val.startsWith('[') && val.includes('{')) {
        try { val = JSON.parse(val); } catch(e) {}
    }

    if (typeof val === 'object') {
        try { return JSON.stringify(val, null, 2); } catch(e) { return String(val); }
    }
    return String(val);
}
</script>
