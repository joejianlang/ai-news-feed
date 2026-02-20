<template>
  <div class="banner-list p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">广告管理</h2>
      <el-button type="primary" @click="openDialog()">
        <el-icon class="mr-1"><Plus /></el-icon> 新增广告
      </el-button>
    </div>

    <el-card shadow="never" class="border-0">
      <el-table :data="banners" v-loading="loading" style="width: 100%">
        <el-table-column prop="title" label="广告标题" />
        <el-table-column label="预览" width="120">
            <template #default="{ row }">
                <el-image :src="row.image_url" fit="cover" class="w-20 h-10 rounded" :preview-src-list="[row.image_url]" />
            </template>
        </el-table-column>
        <el-table-column label="投放周期" width="220">
             <template #default="{ row }">
                 <div class="text-xs">
                     <div>起: {{ formatDate(row.start_date) }}</div>
                     <div>止: {{ formatDate(row.end_date) }}</div>
                 </div>
             </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="80" align="center" />
        <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
                <el-tag :type="row.is_active ? 'success' : 'info'">{{ row.is_active ? '生效中' : '已下架' }}</el-tag>
            </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDialog(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Dialog -->
    <el-dialog :title="form.id ? '编辑广告' : '新增广告'" v-model="dialogVisible" width="600px">
      <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="广告标题" prop="title">
          <el-input v-model="form.title" placeholder="例如: 春季大促" />
        </el-form-item>
        
        <el-form-item label="广告图片" prop="image_url">
          <div v-if="form.image_url" class="relative w-64 h-32 rounded overflow-hidden group border border-gray-200 mb-2">
              <el-image :src="form.image_url" fit="cover" class="w-full h-full" />
              <div class="absolute inset-0 bg-black bg-opacity-40 hidden group-hover:flex items-center justify-center cursor-pointer transition-all" @click="form.image_url = ''">
                  <el-icon class="text-white text-xl"><Delete /></el-icon>
              </div>
          </div>
          
          <el-upload
            v-else
            class="avatar-uploader border border-dashed border-gray-300 rounded p-4 hover:border-blue-400 transition-colors flex justify-center items-center w-64 h-32"
            action="#"
            :show-file-list="false"
            :http-request="uploadImage"
          >
            <el-icon v-if="uploading" class="text-2xl text-blue-500 animate-spin"><Loading /></el-icon>
            <el-icon v-else class="text-2xl text-gray-400"><Plus /></el-icon>
          </el-upload>
          
          <div class="mt-2 text-xs text-gray-400">支持拖拽上传，建议尺寸 800x400</div>
          <el-input v-model="form.image_url" placeholder="或者直接输入图片链接" class="mt-2" size="small" />
        </el-form-item>

        <el-form-item label="跳转链接" prop="link_url">
           <el-input v-model="form.link_url" placeholder="/pages/detail?id=1" />
           <div class="mt-2 text-xs text-gray-400">可以是应用内路径或外部链接</div>
        </el-form-item>

        <el-form-item label="投放城市">
             <el-checkbox-group v-model="form.target_cities">
                <el-checkbox v-for="city in cityOptions" :key="city" :label="city">
                    {{ city === 'all' ? '所有城市' : city }}
                </el-checkbox>
             </el-checkbox-group>
        </el-form-item>

        <el-form-item label="投放时间" required>
            <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
            />
        </el-form-item>

        <el-form-item label="排序权重">
             <el-input-number v-model="form.sort_order" :min="0" />
             <span class="ml-2 text-gray-400 text-xs">数值越小越靠前</span>
        </el-form-item>

        <el-form-item label="是否启用">
            <el-switch v-model="form.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { bannersApi, citiesApi } from '../../services/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, Loading } from '@element-plus/icons-vue';

const banners = ref<any[]>([]);
const cityOptions = ref<string[]>(['all']);
const uploading = ref(false);
const loading = ref(false);
const dialogVisible = ref(false);
const submitting = ref(false);
const formRef = ref();

const form = reactive({
    id: '',
    title: '',
    image_url: '',
    link_url: '',
    start_date: '',
    end_date: '',
    sort_order: 0,
    is_active: true,
    target_cities: ['all']
});

// Helper for date range picker
const dateRange = computed({
    get: () => [form.start_date, form.end_date],
    set: (val) => {
        if (val) {
            form.start_date = val[0];
            form.end_date = val[1];
        } else {
            form.start_date = '';
            form.end_date = '';
        }
    }
});

const rules = {
    title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
    image_url: [{ required: true, message: '请输入图片链接', trigger: 'blur' }]
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    // Handle YYYY-MM-DD format
    if (dateStr.length === 10) return dateStr;
    return new Date(dateStr).toLocaleDateString();
};

const fetchCities = async () => {
    try {
        const res = await citiesApi.getActive();
        if (res && res.length > 0) {
            const names = res.map((c: any) => c.name);
            cityOptions.value = ['all', ...names];
        }
    } catch (e) {
        console.error('Failed to load cities for options', e);
        // Fallback to static common ones if API fails
        cityOptions.value = ['all', '多伦多', '温哥华', '万锦', '列治文'];
    }
};

const fetchBanners = async () => {
    loading.value = true;
    try {
        const res = await bannersApi.getAll();
        banners.value = res;
    } catch (e) {
        ElMessage.error('加载列表失败');
    } finally {
        loading.value = false;
    }
};

const openDialog = (row?: any) => {
    if (row) {
        Object.assign(form, row);
        // Ensure legacy data has target_cities
        if (!form.target_cities) form.target_cities = ['all'];
    } else {
        // Reset
        form.id = '';
        form.title = '';
        form.image_url = '';
        form.link_url = '';
        form.sort_order = 0;
        form.is_active = true;
        form.target_cities = ['all'];
        // Default dates: Now to +30 days
        const now = new Date();
        const future = new Date();
        future.setDate(future.getDate() + 30);
        form.start_date = now.toISOString().split('T')[0];
        form.end_date = future.toISOString().split('T')[0];
    }
    dialogVisible.value = true;
};

const handleSubmit = async () => {
    if (!formRef.value) return;
    await formRef.value.validate(async (valid: boolean) => {
        if (!valid) return;
        
        submitting.value = true;
        try {
            if (form.id) {
                await bannersApi.update(form.id, { ...form });
            } else {
                const { id, ...data } = form; // eslint-disable-line
                await bannersApi.create(data);
            }
            ElMessage.success('保存成功');
            dialogVisible.value = false;
            fetchBanners();
        } catch (e: any) {
            ElMessage.error(e.message || '保存失败');
        } finally {
            submitting.value = false;
        }
    });
};

const handleDelete = (row: any) => {
    ElMessageBox.confirm('确认删除该广告吗？', '提示', { type: 'warning' }).then(async () => {
        try {
            await bannersApi.delete(row.id);
            ElMessage.success('已删除');
            fetchBanners();
        } catch (e) {
            ElMessage.error('删除失败');
        }
    });
};

const uploadImage = async (options: any) => {
    uploading.value = true;
    const formData = new FormData();
    formData.append('file', options.file);
    
    try {
        const API_BASE = (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
          ? 'https://fongbeev1-backe-end.onrender.com/api'
          : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');
        const token = localStorage.getItem('admin_token');
        
        const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData,
            headers: {
                 ...(token && { Authorization: `Bearer ${token}` }),
            }
        });
        
        if (!res.ok) throw new Error('上传失败');
        const data = await res.json();
        
        // Check if returned URL is already complete (starts with http/https)
        if (data.url.startsWith('http://') || data.url.startsWith('https://')) {
            // Already a complete URL, use as-is
            form.image_url = data.url;
        } else {
            // Relative URL, construct full URL
            const SERVER_URL = API_BASE.replace('/api', ''); 
            form.image_url = `${SERVER_URL}${data.url}`;
        }
        ElMessage.success('上传成功');
    } catch (e) {
        ElMessage.error('上传失败，请重试');
        console.error(e);
    } finally {
        uploading.value = false;
    }
};

onMounted(() => {
    fetchCities();
    fetchBanners();
});
</script>
