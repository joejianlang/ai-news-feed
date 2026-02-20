<template>
  <div class="finance-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="box-card mb-4" shadow="hover">
          <template #header>
            <div class="card-header flex justify-between items-center">
              <span class="font-bold text-lg">Stripe 账户总资金池</span>
              <el-tag type="success">实时</el-tag>
            </div>
          </template>
          <div class="text-3xl font-bold text-gray-900 mb-2">
            ${{ formatPrice(stats.stripe_balance) }}
          </div>
          <div class="text-sm text-gray-500">
            包含所有待结算和已结算资金，资金流安全托管中。
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="box-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="font-bold">平台净收入</span>
            </div>
          </template>
          <div class="text-2xl font-bold text-emerald-600 mb-2">
             ${{ formatPrice(stats.platform_revenue) }}
          </div>
          <div class="text-xs text-gray-500">
             来自积分/会员销售等平台自有业务的收入。
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="box-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="font-bold">代管资金 (负债)</span>
            </div>
          </template>
          <div class="text-2xl font-bold text-orange-500 mb-2">
             ${{ formatPrice(stats.escrow_balance) }}
          </div>
          <div class="text-xs text-gray-500">
             属于服务商的未提现余额 + 订单托管定金。
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="box-card mt-6" shadow="hover">
        <template #header>
            <div class="flex justify-between items-center">
                <span class="font-bold">平台提现账户设置</span>
                <el-button type="primary" size="small" @click="handleEditBank">
                    {{ bankInfo.accountNumber ? '修改账户' : '添加账户' }}
                </el-button>
            </div>
        </template>
        
        <div v-if="bankInfo.accountNumber" class="flex items-center gap-4 p-4 bg-gray-50 rounded border border-gray-100">
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                {{ bankInfo.bankName.substring(0, 1) }}
            </div>
            <div>
                <div class="font-bold text-gray-800">{{ bankInfo.bankName }}</div>
                <div class="text-sm text-gray-500">**** {{ bankInfo.accountNumber.slice(-4) }} ({{ bankInfo.holderName }})</div>
            </div>
        </div>
        <div v-else class="text-center py-8 text-gray-400 bg-gray-50 rounded border border-dashed border-gray-300">
            暂未绑定提现账户
        </div>

        <div class="mt-4 text-sm text-gray-400">
            说明：此账户仅用于接收“平台净收入”的提现。服务商资金将通过 Stripe Connect 直接分账，不经过此账户，确保合规。
        </div>
    </el-card>

    <!-- Platform Fee Setting -->
    <el-card class="box-card mt-6" shadow="hover">
        <template #header>
            <div class="flex justify-between items-center">
                <span class="font-bold">平台服务费设置 (抽成比例)</span>
                <el-button type="primary" size="small" @click="saveFeeConfig" :loading="savingFee">保存设置</el-button>
            </div>
        </template>
        <div class="flex items-center gap-4">
             <el-input-number v-model="feeConfig.percent" :min="0" :max="100" :precision="1" :step="1" />
             <span class="text-gray-600">%</span>
             <span class="text-sm text-gray-400 ml-2">
                 设置后，每一笔服务定金将自动扣除该比例作为平台收入，剩余部分转入服务商钱包。
             </span>
        </div>
        <div class="mt-2 text-sm text-gray-500 bg-blue-50 p-2 rounded">
            示例: 定金 $20.00，设置 {{ feeConfig.percent }}% 抽成 -> 平台收 ${{ (20 * feeConfig.percent / 100).toFixed(2) }}，服务商收 ${{ (20 * (1 - feeConfig.percent / 100)).toFixed(2) }}。
        </div>
    </el-card>

    <!-- Bank Account Edit Dialog -->
    <el-dialog v-model="showBankDialog" title="配置提现账户" width="500px">
        <el-form :model="bankForm" label-width="100px">
            <el-form-item label="银行名称">
                <el-input v-model="bankForm.bankName" placeholder="例如: Royal Bank of Canada" />
            </el-form-item>
            <el-form-item label="持卡人姓名">
                <el-input v-model="bankForm.holderName" placeholder="例如: YOUFUJIA INC" />
            </el-form-item>
            <el-form-item label="账号 (IBAN)">
                <el-input v-model="bankForm.accountNumber" placeholder="输入最后4位即可用于演示" />
            </el-form-item>
             <el-form-item label="SWIFT/BIC">
                <el-input v-model="bankForm.routing" placeholder="银行识别码" />
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="showBankDialog = false">取消</el-button>
                <el-button type="primary" @click="saveBank">保存</el-button>
            </span>
        </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import { financeApi } from '../../services/api';
import { ElMessage } from 'element-plus';

const stats = ref({
    stripe_balance: 0,
    escrow_balance: 0,
    platform_revenue: 0
});

// Bank Info State
const bankInfo = ref({
    bankName: 'Royal Bank of Canada',
    holderName: 'YOUFUJIA PLATFORM',
    accountNumber: '8888',
    routing: 'RBC123'
});

const showBankDialog = ref(false);
const bankForm = reactive({
    bankName: '',
    holderName: '',
    accountNumber: '',
    routing: ''
});

const feeConfig = reactive({ percent: 10 });
const savingFee = ref(false);

const saveFeeConfig = async () => {
    savingFee.value = true;
    try {
        await financeApi.updateSettings({ platform_fee_percent: feeConfig.percent });
        ElMessage.success('设置已保存');
    } catch (e) {
        ElMessage.error('保存失败');
    } finally {
        savingFee.value = false;
    }
};

onMounted(async () => {
    try {
        const res = await financeApi.getSummary();
        stats.value = res;
        
        // Load Settings
        try {
            const settings = await financeApi.getSettings();
            if (settings && settings.platform_fee_percent !== undefined) {
                feeConfig.percent = settings.platform_fee_percent;
            }
        } catch(e) { console.error('Failed to load settings', e); }

    } catch (e: any) {
        ElMessage.error(e.message || '加载财务数据失败');
    }
});

const formatPrice = (p: number) => (p || 0).toFixed(2);

const handleEditBank = () => {
    // Fill form with current data
    Object.assign(bankForm, bankInfo.value);
    showBankDialog.value = true;
};

const saveBank = async () => {
    try {
        await financeApi.updateBankAccount(); // Mock API call
        // Update local state
        bankInfo.value = { ...bankForm };
        showBankDialog.value = false;
        ElMessage.success('提现账户已更新');
    } catch (e) {
        ElMessage.error('保存失败');
    }
};
</script>

<style scoped>
.mb-4 { margin-bottom: 1rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mt-6 { margin-top: 1.5rem; }
.text-emerald-600 { color: #059669; }
.text-orange-500 { color: #f97316; }
.text-blue-600 { color: #2563eb; }
.bg-blue-100 { background-color: #dbeafe; }
</style>
