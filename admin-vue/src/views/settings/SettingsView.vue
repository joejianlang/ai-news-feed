<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">系统设置</h1>
      <p class="text-gray-500 mt-1">配置平台基本设置</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <!-- General Settings -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">基本设置</h3>
          <el-form :model="settings" label-width="120px">
            <el-form-item label="平台名称">
              <el-input v-model="settings.siteName" />
            </el-form-item>
            <el-form-item label="联系电话">
              <el-input v-model="settings.phone" />
            </el-form-item>
            <el-form-item label="联系邮箱">
              <el-input v-model="settings.email" />
            </el-form-item>
            <el-form-item label="服务区域">
              <el-input v-model="settings.serviceArea" type="textarea" rows="2" />
            </el-form-item>
          </el-form>
        </div>

        <!-- Commission Settings -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">💰 佣金与支付设置</h3>
          <el-form :model="commissionSettings" label-width="180px">
            <el-form-item label="定金比例">
              <el-input-number v-model="commissionSettings.deposit_ratio" :min="20" :max="100" />
              <span class="text-gray-400 text-sm ml-2">% (最低20%)</span>
            </el-form-item>
            <el-form-item label="平台佣金(有合伙人)">
              <el-input-number v-model="commissionSettings.platform_commission_with_partner" :min="3" :max="50" />
              <span class="text-gray-400 text-sm ml-2">%</span>
            </el-form-item>
            <el-form-item label="平台佣金(无合伙人)">
              <el-input-number v-model="commissionSettings.platform_commission_no_partner" :min="3" :max="50" />
              <span class="text-gray-400 text-sm ml-2">%</span>
            </el-form-item>
            <el-form-item label="销售合伙人佣金">
              <el-input-number v-model="commissionSettings.sales_partner_commission" :min="0" :max="30" />
              <span class="text-gray-400 text-sm ml-2">%</span>
            </el-form-item>
            <el-form-item label="自动确认时间">
              <el-input-number v-model="commissionSettings.auto_complete_hours" :min="1" :max="168" />
              <span class="text-gray-400 text-sm ml-2">小时 (用户无响应后自动完成)</span>
            </el-form-item>
          </el-form>
          <el-button type="primary" @click="saveCommissionSettings" :loading="savingCommission">
            保存佣金设置
          </el-button>
        </div>

        <!-- Bonus Settings -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">🎁 奖励设置</h3>
          <el-form :model="bonusSettings" label-width="180px">
            <el-form-item label="开启新服务商奖励">
              <el-switch v-model="bonusSettings.enable_provider_signup_bonus" />
              <span class="text-gray-400 text-sm ml-2">勾选后，新服务商审核通过时将自动赠送积分</span>
            </el-form-item>
            <el-form-item label="赠送积分数" v-if="bonusSettings.enable_provider_signup_bonus">
              <el-input-number v-model="bonusSettings.provider_signup_bonus_amount" :min="1" />
              <span class="text-gray-400 text-sm ml-2">分 (发放至服务商账户)</span>
            </el-form-item>
          </el-form>
          <el-button type="primary" @click="saveBonusSettings" :loading="savingBonus">
            保存奖励设置
          </el-button>
        </div>

        <!-- Notification Settings -->

        <!-- Account Security -->
        <ChangePasswordForm />
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Quick Stats -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">系统信息</h3>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">系统版本</span>
              <span class="text-gray-800">v1.0.0</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">最后更新</span>
              <span class="text-gray-800">2024-12-17</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">数据库状态</span>
              <el-tag type="success" size="small">正常</el-tag>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">存储空间</span>
              <span class="text-gray-800">12.5 GB / 50 GB</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">操作</h3>
          <div class="space-y-3">
            <el-button type="primary" class="w-full" @click="saveSettings" :loading="savingSettings">保存设置</el-button>
            <el-button class="w-full" @click="clearCache">清除缓存</el-button>
            <el-button class="w-full" @click="backupData">备份数据</el-button>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="bg-red-50 rounded-xl border border-red-100 p-6">
          <h3 class="text-lg font-bold text-red-800 mb-4">⚠️ 危险操作</h3>
          <p class="text-sm text-red-600 mb-6 font-medium">警告：以下操作将直接清除数据库中的测试数据，操作不可撤销！</p>
          <div class="space-y-4">
            <el-button 
              type="danger" 
              class="w-full flex items-center justify-center h-11" 
              plain 
              @click="handleDatabaseReset('orders')" 
              :loading="resettingOrders"
            >
              仅清理订单交易数据 (保留账号)
            </el-button>
            <el-button 
              type="danger" 
              class="w-full flex items-center justify-center h-11" 
              @click="handleDatabaseReset('all')" 
              :loading="resettingAll"
            >
              全量重置测试数据 (仅留管理员)
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ChangePasswordForm from '../../components/ChangePasswordForm.vue'
import { api, pricingConfigApi } from '@/services/api'

const settings = reactive({
  siteName: '优服佳',
  phone: '1-888-888-8888',
  email: 'support@youfujia.com',
  serviceArea: 'Greater Toronto Area (GTA), including Toronto, Markham, Richmond Hill, Vaughan, Mississauga, etc.',
  notifyNewRequest: true,
  smsNotify: false,
  wechatNotify: true
})

const savingSettings = ref(false)

const commissionSettings = reactive({
  deposit_ratio: 20,
  platform_commission_with_partner: 5,
  platform_commission_no_partner: 10,
  sales_partner_commission: 5,
  auto_complete_hours: 48
})

const savingCommission = ref(false)

const bonusSettings = reactive({
  enable_provider_signup_bonus: false,
  provider_signup_bonus_amount: 50
})

const savingBonus = ref(false)

onMounted(async () => {
  try {
    const res = await api.get('/system-settings')
    if (res.data.success && res.data.settings) {
      const s = res.data.settings
      // General settings
      if (s.site_name) settings.siteName = s.site_name
      if (s.site_phone) settings.phone = s.site_phone
      if (s.site_email) settings.email = s.site_email
      if (s.service_area) settings.serviceArea = s.service_area
      if (s.notify_new_request) settings.notifyNewRequest = s.notify_new_request === 'true'
      if (s.sms_notify) settings.smsNotify = s.sms_notify === 'true'
      if (s.wechat_notify) settings.wechatNotify = s.wechat_notify === 'true'

      // Commission settings
      if (s.deposit_ratio) commissionSettings.deposit_ratio = parseInt(s.deposit_ratio)
      if (s.platform_commission_with_partner) commissionSettings.platform_commission_with_partner = parseInt(s.platform_commission_with_partner)
      if (s.platform_commission_no_partner) commissionSettings.platform_commission_no_partner = parseInt(s.platform_commission_no_partner)
      if (s.sales_partner_commission) commissionSettings.sales_partner_commission = parseInt(s.sales_partner_commission)
      if (s.auto_complete_hours) commissionSettings.auto_complete_hours = parseInt(s.auto_complete_hours)
    }

    // Load pricing/bonus settings
    const pricingRes = await pricingConfigApi.getAll('credits')
    if (pricingRes && pricingRes.configs) {
      const configs = pricingRes.configs
      const bonusEnable = configs.find((c: any) => c.config_key === 'enable_provider_signup_bonus')
      const bonusAmount = configs.find((c: any) => c.config_key === 'provider_signup_bonus_amount')
      
      if (bonusEnable) bonusSettings.enable_provider_signup_bonus = bonusEnable.config_value === 'true'
      if (bonusAmount) bonusSettings.provider_signup_bonus_amount = parseInt(bonusAmount.config_value)
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
})

const saveCommissionSettings = async () => {
  savingCommission.value = true
  try {
    await api.post('/system-settings', {
      settings: [
        { key: 'deposit_ratio', value: String(commissionSettings.deposit_ratio) },
        { key: 'platform_commission_with_partner', value: String(commissionSettings.platform_commission_with_partner) },
        { key: 'platform_commission_no_partner', value: String(commissionSettings.platform_commission_no_partner) },
        { key: 'sales_partner_commission', value: String(commissionSettings.sales_partner_commission) },
        { key: 'auto_complete_hours', value: String(commissionSettings.auto_complete_hours) }
      ]
    })
    ElMessage.success('佣金设置保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    savingCommission.value = false
  }
}

const saveBonusSettings = async () => {
  savingBonus.value = true
  try {
    await api.put('/admin/pricing-config', {
      configs: [
        { config_key: 'enable_provider_signup_bonus', config_value: String(bonusSettings.enable_provider_signup_bonus) },
        { config_key: 'provider_signup_bonus_amount', config_value: String(bonusSettings.provider_signup_bonus_amount) }
      ]
    })
    ElMessage.success('奖励设置保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    savingBonus.value = false
  }
}

const saveSettings = async () => {
  savingSettings.value = true
  try {
    await api.post('/system-settings', {
      settings: [
        { key: 'site_name', value: settings.siteName },
        { key: 'site_phone', value: settings.phone },
        { key: 'site_email', value: settings.email },
        { key: 'service_area', value: settings.serviceArea },
        { key: 'notify_new_request', value: String(settings.notifyNewRequest) },
        { key: 'sms_notify', value: String(settings.smsNotify) },
        { key: 'wechat_notify', value: String(settings.wechatNotify) }
      ]
    })
    ElMessage.success('系统设置保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    savingSettings.value = false
  }
}

const clearCache = () => {
  ElMessage.success('缓存已清除')
}

const backupData = () => {
  ElMessage.info('正在备份数据...')
}

const resettingOrders = ref(false)
const resettingAll = ref(false)

import { financeApi } from '@/services/api'

const handleDatabaseReset = async (type: 'all' | 'orders') => {
  const confirmTitle = type === 'all' ? '全量重置数据库' : '清理订单交易数据'
  const confirmMsg = type === 'all' 
    ? '此操作将删除所有用户账号（除管理员外）、所有订单、所有服务项目和供应商资料。这是一个极度危险的操作，确定要从头开始系统测试吗？' 
    : '此操作将删除所有订单记录、聊天信息、评价和财务流水，但会保留用户账号和已发布的标准服务。确定要清除交易测试数据吗？'

  try {
    await ElMessageBox.confirm(confirmMsg, confirmTitle, {
      confirmButtonText: '确定重置',
      cancelButtonText: '点错了',
      confirmButtonClass: 'el-button--danger',
      type: 'warning'
    })

    // Second double confirm for 'all'
    if (type === 'all') {
      await ElMessageBox.prompt('请输入 "RESET-ALL" 以确认全量清空操作', '再次确认', {
        confirmButtonText: '最终确认',
        cancelButtonText: '取消',
        inputPattern: /^RESET-ALL$/,
        inputErrorMessage: '输入不正确'
      })
    }

    if (type === 'all') resettingAll.value = true
    else resettingOrders.value = true

    const res = await financeApi.resetDatabase(type)
    if (res.success) {
      ElMessage.success(res.message)
    } else {
      ElMessage.error(res.message || '操作失败')
    }
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') {
      console.error('Reset error:', e)
      ElMessage.error(e instanceof Error ? e.message : '服务器内部错误')
    }
  } finally {
    resettingAll.value = false
    resettingOrders.value = false
  }
}
</script>

