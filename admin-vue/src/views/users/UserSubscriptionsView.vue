<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold">用户订阅管理</h2>
        <p class="text-gray-500 text-sm mt-1">查看和管理所有用户的订阅状态</p>
      </div>
    </div>

    <!-- Filters -->
    <el-card shadow="never" class="mb-4">
      <el-form :inline="true" :model="filters">
        <el-form-item label="订阅状态">
          <el-select v-model="filters.status" placeholder="全部" clearable @change="fetchSubscriptions">
            <el-option label="全部" value="" />
            <el-option label="活跃" value="active" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="已过期" value="expired" />
            <el-option label="待支付" value="pending" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="fetchSubscriptions">
            <el-icon class="mr-1"><Search /></el-icon>
            查询
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Subscriptions Table -->
    <el-card shadow="never">
      <el-table :data="subscriptions" v-loading="loading" stripe>
        <el-table-column prop="user_email" label="用户邮箱" width="200">
          <template #default="{ row }">
            <div class="font-medium">{{ row.user_email }}</div>
          </template>
        </el-table-column>
        
        <el-table-column prop="provider_name" label="服务商名称" width="180">
          <template #default="{ row }">
            <div class="text-gray-600">{{ row.provider_name || '-' }}</div>
          </template>
        </el-table-column>
        
        <el-table-column prop="plan_name" label="订阅套餐" width="150">
          <template #default="{ row }">
            <el-tag :type="getPlanTagType(row.plan_tier)">
              {{ row.plan_name }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="剩余配额" width="200">
          <template #default="{ row }">
            <div class="text-sm">
              <div class="mb-1">
                <span class="text-gray-500">积分:</span>
                <span class="font-medium ml-1">{{ row.remaining_credits }}</span>
                <span class="text-gray-400 text-xs ml-1">/ {{ row.included_credits }}</span>
              </div>
              <div>
                <span class="text-gray-500">上架:</span>
                <span class="font-medium ml-1">{{ row.remaining_listings }}</span>
                <span class="text-gray-400 text-xs ml-1">/ {{ row.included_standard_listings }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="start_date" label="开始日期" width="120">
          <template #default="{ row }">
            <div class="text-sm text-gray-600">
              {{ formatDate(row.start_date) }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="end_date" label="到期日期" width="120">
          <template #default="{ row }">
            <div class="text-sm" :class="isExpiringSoon(row.end_date) ? 'text-red-600 font-medium' : 'text-gray-600'">
              {{ formatDate(row.end_date) }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="auto_renew" label="自动续费" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.auto_renew ? 'success' : 'info'" size="small">
              {{ row.auto_renew ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              调整
            </el-button>
            <el-button link type="info" size="small" @click="handleViewDetails(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- Pagination -->
      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchSubscriptions"
          @current-change="fetchSubscriptions"
        />
      </div>
    </el-card>

    <!-- Edit Dialog -->
    <el-dialog 
      v-model="editDialogVisible" 
      title="调整订阅"
      width="500px"
    >
      <el-form :model="editForm" label-width="120px">
        <el-form-item label="剩余积分">
          <el-input-number v-model="editForm.remaining_credits" :min="0" :max="10000" />
        </el-form-item>
        
        <el-form-item label="剩余上架次数">
          <el-input-number v-model="editForm.remaining_listings" :min="0" :max="1000" />
        </el-form-item>
        
        <el-form-item label="到期日期">
          <el-date-picker
            v-model="editForm.end_date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="订阅状态">
          <el-select v-model="editForm.status">
            <el-option label="活跃" value="active" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="已过期" value="expired" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitEdit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- Details Dialog -->
    <el-dialog 
      v-model="detailsDialogVisible" 
      title="订阅详情"
      width="600px"
    >
      <el-descriptions :column="2" border v-if="selectedSubscription">
        <el-descriptions-item label="用户邮箱">{{ selectedSubscription.user_email }}</el-descriptions-item>
        <el-descriptions-item label="服务商名称">{{ selectedSubscription.provider_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订阅套餐">{{ selectedSubscription.plan_name }}</el-descriptions-item>
        <el-descriptions-item label="套餐级别">{{ selectedSubscription.plan_tier }}</el-descriptions-item>
        <el-descriptions-item label="剩余积分">{{ selectedSubscription.remaining_credits }}</el-descriptions-item>
        <el-descriptions-item label="包含积分">{{ selectedSubscription.included_credits }}</el-descriptions-item>
        <el-descriptions-item label="剩余上架次数">{{ selectedSubscription.remaining_listings }}</el-descriptions-item>
        <el-descriptions-item label="包含上架次数">{{ selectedSubscription.included_standard_listings }}</el-descriptions-item>
        <el-descriptions-item label="开始日期">{{ formatDate(selectedSubscription.start_date) }}</el-descriptions-item>
        <el-descriptions-item label="到期日期">{{ formatDate(selectedSubscription.end_date) }}</el-descriptions-item>
        <el-descriptions-item label="订阅状态">
          <el-tag :type="getStatusTagType(selectedSubscription.status)">
            {{ getStatusText(selectedSubscription.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="自动续费">
          <el-tag :type="selectedSubscription.auto_renew ? 'success' : 'info'">
            {{ selectedSubscription.auto_renew ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(selectedSubscription.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDateTime(selectedSubscription.updated_at) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { userSubscriptionsApi } from '../../services/api';

interface Subscription {
  id: string;
  user_id: string;
  user_email: string;
  provider_name: string;
  plan_id: string;
  plan_name: string;
  plan_tier: string;
  status: string;
  start_date: string;
  end_date: string;
  remaining_credits: number;
  remaining_listings: number;
  included_credits: number;
  included_standard_listings: number;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

const loading = ref(false);
const submitting = ref(false);
const editDialogVisible = ref(false);
const detailsDialogVisible = ref(false);
const subscriptions = ref<Subscription[]>([]);
const selectedSubscription = ref<Subscription | null>(null);

const filters = reactive({
  status: ''
});

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
});

const editForm = reactive({
  id: '',
  remaining_credits: 0,
  remaining_listings: 0,
  end_date: '',
  status: 'active'
});

const fetchSubscriptions = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: pagination.page,
      size: pagination.limit
    };
    
    if (filters.status) {
      params.status = filters.status;
    }
    
    const res = await userSubscriptionsApi.getAll(params);
    
    subscriptions.value = res.subscriptions || [];
    pagination.total = res.total || 0;
  } catch (error: any) {
    ElMessage.error(error.message || '获取订阅列表失败');
  } finally {
    loading.value = false;
  }
};

const getPlanTagType = (tier: string) => {
  const types: Record<string, any> = {
    basic: 'info',
    professional: 'warning',
    premium: 'danger'
  };
  return types[tier] || 'info';
};

const getStatusTagType = (status: string) => {
  const types: Record<string, any> = {
    active: 'success',
    cancelled: 'warning',
    expired: 'info',
    pending: 'warning'
  };
  return types[status] || 'info';
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    active: '活跃',
    cancelled: '已取消',
    expired: '已过期',
    pending: '待支付'
  };
  return texts[status] || status;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('zh-CN');
};

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
};

const isExpiringSoon = (endDate: string) => {
  if (!endDate) return false;
  const daysUntilExpiry = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
};

const handleEdit = (row: Subscription) => {
  editForm.id = row.id;
  editForm.remaining_credits = row.remaining_credits;
  editForm.remaining_listings = row.remaining_listings;
  editForm.end_date = row.end_date.split('T')[0];
  editForm.status = row.status;
  editDialogVisible.value = true;
};

const handleViewDetails = (row: Subscription) => {
  selectedSubscription.value = row;
  detailsDialogVisible.value = true;
};

const handleSubmitEdit = async () => {
  submitting.value = true;
  try {
    await userSubscriptionsApi.update(editForm.id, {
      remaining_credits: editForm.remaining_credits,
      remaining_listings: editForm.remaining_listings,
      end_date: editForm.end_date,
      status: editForm.status
    });
    
    ElMessage.success('订阅更新成功');
    editDialogVisible.value = false;
    fetchSubscriptions();
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败');
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  fetchSubscriptions();
});
</script>

<style scoped>
.el-table {
  font-size: 14px;
}
</style>
