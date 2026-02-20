<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">服务商套餐配置</h2>
      <el-button type="primary" :loading="saving" @click="handleSaveAll">
        保存所有更改
      </el-button>
    </div>

    <el-tabs v-model="activeTab" v-loading="loading">
      <!-- Credits Settings -->
      <el-tab-pane label="积分用户设置" name="credits">
        <el-card shadow="never" class="mb-4">
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-medium">积分购买与消耗</span>
            </div>
          </template>
          
          <el-form label-width="200px">
            <el-form-item label="1加币可购买积分数">
              <el-input-number v-model="form.credits_per_cad" :min="1" :max="1000" />
              <span class="ml-2 text-gray-500 text-sm">积分</span>
            </el-form-item>
            
            <el-form-item label="上架标准服务消耗">
              <el-input-number v-model="form.credits_per_service_listing" :min="0" :max="100" />
              <span class="ml-2 text-gray-500 text-sm">积分</span>
            </el-form-item>
            
            <el-form-item label="响应订单/报价消耗">
              <el-input-number v-model="form.credits_per_quote" :min="0" :max="100" />
              <span class="ml-2 text-gray-500 text-sm">积分</span>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- SMS Settings -->
      <el-tab-pane label="短信配置" name="sms">
        <el-card shadow="never" class="mb-4">
          <template #header>
            <span class="font-medium">短信额度设置</span>
          </template>
          
          <el-form label-width="200px">
            <el-form-item label="积分用户每月免费短信">
              <el-input-number v-model="form.free_sms_quota_credits_user" :min="0" :max="1000" />
              <span class="ml-2 text-gray-500 text-sm">条</span>
            </el-form-item>
            
            <el-form-item label="超额短信单价">
              <el-input-number v-model="form.sms_price_per_msg" :min="0" :max="1" :step="0.01" :precision="2" />
              <span class="ml-2 text-gray-500 text-sm">加币/条</span>
            </el-form-item>
            
            <el-form-item label="低余额提醒阈值">
              <el-input-number v-model="form.sms_low_balance_threshold" :min="1" :max="50" />
              <span class="ml-2 text-gray-500 text-sm">剩余条数时提醒</span>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- Subscription Settings (Phase 2) -->
      <el-tab-pane label="订阅套餐设置" name="subscription">
        <el-alert 
          title="订阅套餐功能将在阶段2实现" 
          type="info" 
          :closable="false" 
          class="mb-4"
        />
        
        <!-- Basic Tier -->
        <el-card shadow="never" class="mb-4">
          <template #header>
            <span class="font-medium">💡 初级会员</span>
          </template>
          <el-form label-width="180px">
            <el-form-item label="月费">
              <el-input-number v-model="form.sub_basic_monthly_price" :min="0" :step="0.01" :precision="2" />
              <span class="ml-2 text-gray-500 text-sm">加币</span>
            </el-form-item>
            <el-form-item label="年费">
              <el-input-number v-model="form.sub_basic_yearly_price" :min="0" :step="0.01" :precision="2" />
              <span class="ml-2 text-gray-500 text-sm">加币</span>
            </el-form-item>
            <el-form-item label="每月赠送积分">
              <el-input-number v-model="form.sub_basic_monthly_credits" :min="0" />
            </el-form-item>
            <el-form-item label="标准服务上架次数">
              <el-input-number v-model="form.sub_basic_listing_quota" :min="0" />
              <span class="ml-2 text-gray-500 text-sm">次/月</span>
            </el-form-item>
            <el-form-item label="免费短信额度">
              <el-input-number v-model="form.sub_basic_sms_quota" :min="0" />
              <span class="ml-2 text-gray-500 text-sm">条/月</span>
            </el-form-item>
            <el-form-item label="可上架服务数">
              <el-input-number v-model="form.sub_basic_service_limit" :min="-1" />
              <span class="ml-2 text-gray-500 text-sm">(-1 表示无限)</span>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- Premium Tier -->
        <el-card shadow="never" class="mb-4">
          <template #header>
            <span class="font-medium">⭐ 高级会员</span>
          </template>
          <el-form label-width="180px">
            <el-form-item label="月费">
              <el-input-number v-model="form.sub_premium_monthly_price" :min="0" :step="0.01" :precision="2" />
              <span class="ml-2 text-gray-500 text-sm">加币</span>
            </el-form-item>
            <el-form-item label="年费">
              <el-input-number v-model="form.sub_premium_yearly_price" :min="0" :step="0.01" :precision="2" />
              <span class="ml-2 text-gray-500 text-sm">加币</span>
            </el-form-item>
            <el-form-item label="每月赠送积分">
              <el-input-number v-model="form.sub_premium_monthly_credits" :min="0" />
            </el-form-item>
            <el-form-item label="标准服务上架次数">
              <el-input-number v-model="form.sub_premium_listing_quota" :min="0" />
              <span class="ml-2 text-gray-500 text-sm">次/月</span>
            </el-form-item>
            <el-form-item label="免费短信额度">
              <el-input-number v-model="form.sub_premium_sms_quota" :min="0" />
              <span class="ml-2 text-gray-500 text-sm">条/月</span>
            </el-form-item>
            <el-form-item label="可上架服务数">
              <el-input-number v-model="form.sub_premium_service_limit" :min="-1" />
              <span class="ml-2 text-gray-500 text-sm">(-1 表示无限)</span>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- VIP Tier -->
        <el-card shadow="never" class="mb-4">
          <template #header>
            <span class="font-medium">👑 VIP会员</span>
          </template>
          <el-form label-width="180px">
            <el-form-item label="月费">
              <el-input-number v-model="form.sub_vip_monthly_price" :min="0" :step="0.01" :precision="2" />
              <span class="ml-2 text-gray-500 text-sm">加币</span>
            </el-form-item>
            <el-form-item label="年费">
              <el-input-number v-model="form.sub_vip_yearly_price" :min="0" :step="0.01" :precision="2" />
              <span class="ml-2 text-gray-500 text-sm">加币</span>
            </el-form-item>
            <el-form-item label="每月赠送积分">
              <el-input-number v-model="form.sub_vip_monthly_credits" :min="0" />
            </el-form-item>
            <el-form-item label="标准服务上架次数">
              <el-input-number v-model="form.sub_vip_listing_quota" :min="-1" />
              <span class="ml-2 text-gray-500 text-sm">次/月 (-1表示无限)</span>
            </el-form-item>
            <el-form-item label="免费短信额度">
              <el-input-number v-model="form.sub_vip_sms_quota" :min="-1" />
              <span class="ml-2 text-gray-500 text-sm">(-1 表示无限)</span>
            </el-form-item>
            <el-form-item label="可上架服务数">
              <el-input-number v-model="form.sub_vip_service_limit" :min="-1" />
              <span class="ml-2 text-gray-500 text-sm">(-1 表示无限)</span>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { pricingConfigApi } from '../../services/api';
import { ElMessage } from 'element-plus';

const loading = ref(false);
const saving = ref(false);
const activeTab = ref('credits');

const form = reactive<Record<string, number>>({
  // Credits
  credits_per_cad: 100,
  credits_per_service_listing: 10,
  credits_per_quote: 5,
  // SMS
  free_sms_quota_credits_user: 50,
  sms_price_per_msg: 0.02,
  sms_low_balance_threshold: 10,
  // Subscription - Basic
  sub_basic_monthly_price: 29.99,
  sub_basic_yearly_price: 299.99,
  sub_basic_monthly_credits: 100,
  sub_basic_listing_quota: 5,
  sub_basic_sms_quota: 100,
  sub_basic_service_limit: 5,
  // Subscription - Premium
  sub_premium_monthly_price: 99.99,
  sub_premium_yearly_price: 999.99,
  sub_premium_monthly_credits: 500,
  sub_premium_listing_quota: 20,
  sub_premium_sms_quota: 300,
  sub_premium_service_limit: 20,
  // Subscription - VIP
  sub_vip_monthly_price: 299.99,
  sub_vip_yearly_price: 2999.99,
  sub_vip_monthly_credits: 2000,
  sub_vip_listing_quota: -1,
  sub_vip_sms_quota: -1,
  sub_vip_service_limit: -1,
});

const fetchConfigs = async () => {
  loading.value = true;
  try {
    const res = await pricingConfigApi.getAll();
    // Map configs to form
    (res.configs || []).forEach((cfg: any) => {
      if (cfg.config_key in form) {
        form[cfg.config_key] = parseFloat(cfg.config_value);
      }
    });
  } catch (e) {
    ElMessage.error('加载配置失败');
  } finally {
    loading.value = false;
  }
};

const handleSaveAll = async () => {
  saving.value = true;
  try {
    const configs = Object.keys(form).map(key => ({
      config_key: key,
      config_value: String(form[key])
    }));
    await pricingConfigApi.batchUpdate(configs);
    ElMessage.success('配置已保存');
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  fetchConfigs();
});
</script>
