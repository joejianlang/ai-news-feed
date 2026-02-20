<template>
  <div class="source-admin p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">抓取源配置</h2>
      <el-button type="primary" @click="openDialog()">
        <el-icon class="mr-1"><Plus /></el-icon> 新增配置
      </el-button>
    </div>

    <el-card shadow="never" class="border-0">
      <el-table :data="sources" v-loading="loading" style="width: 100%" border stripe>
        <el-table-column prop="name" label="源名称" min-width="150" />
        <el-table-column prop="type" label="类型" width="100">
           <template #default="{ row }">
             <el-tag :type="row.type === 'rss' ? 'success' : (row.type === 'api' ? 'warning' : 'info')">
               {{ (row.type || '').toUpperCase() }}
             </el-tag>
           </template>
        </el-table-column>
        <el-table-column prop="home_url" label="地址" min-width="200" show-overflow-tooltip>
           <template #default="{ row }">
             <a :href="row.home_url" target="_blank" class="text-blue-500 hover:underline">{{ row.home_url }}</a>
           </template>
        </el-table-column>
        <el-table-column prop="fetch_frequency" label="频率(分)" width="100" align="center" />
        <el-table-column prop="last_fetched_at" label="上次抓取" width="180">
          <template #default="{ row }">
            {{ row.last_fetched_at ? new Date(row.last_fetched_at).toLocaleString() : '从未抓取' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'">{{ row.is_active ? '启用中' : '已停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDialog(row)">编辑</el-button>
            <el-divider direction="vertical" />
            <el-button link type="warning" size="small" @click="handleManualFetch(row)">立即抓取</el-button>
            <el-divider direction="vertical" />
            <el-popconfirm title="确定删除该配置吗？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button link type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Form Dialog -->
    <el-dialog :title="form.id ? '编辑配置' : '新增配置'" v-model="dialogVisible" width="650px">
      <el-form :model="form" label-width="120px" :rules="rules" ref="formRef">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="例如: 机器之心 RSS" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio value="rss">RSS</el-radio>
            <el-radio value="html">HTML Crawl</el-radio>
            <el-radio value="api">API</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="主页/RSS地址" prop="home_url">
          <el-input v-model="form.home_url" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="抓取选择器" v-if="form.type === 'html'">
          <el-input v-model="form.fetch_selector" placeholder=".article-list-item" />
          <div class="text-xs text-gray-400 mt-1">CSS Selector，用于定位列表条目</div>
        </el-form-item>
        <el-form-item label="抓取频率" prop="fetch_frequency">
          <el-input-number v-model="form.fetch_frequency" :min="1" />
          <span class="ml-2 text-gray-400">单位：分钟</span>
        </el-form-item>
        <el-form-item label="图标 URL">
          <el-input v-model="form.logo_url" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="抓取规则简述..." />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.is_active" active-text="启用" inactive-text="禁用" />
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
import { ref, reactive, onMounted } from 'vue';
import { buffetApi } from '@/services/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

const sources = ref<any[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const submitting = ref(false);
const formRef = ref();

const form = reactive({
  id: '',
  name: '',
  type: 'rss',
  home_url: '',
  fetch_selector: '',
  fetch_frequency: 60,
  logo_url: '',
  description: '',
  is_active: true
});

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  home_url: [{ required: true, message: '请输入地址', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
};

const fetchSources = async () => {
  loading.value = true;
  try {
    const res = await buffetApi.getSources();
    sources.value = res.sources;
  } catch (e: any) {
    ElMessage.error(e.message || '加载列表失败');
  } finally {
    loading.value = false;
  }
};

const openDialog = (row?: any) => {
  if (row) {
    Object.assign(form, row);
  } else {
    // Reset
    form.id = '';
    form.name = '';
    form.type = 'rss';
    form.home_url = '';
    form.fetch_selector = '';
    form.fetch_frequency = 60;
    form.logo_url = '';
    form.description = '';
    form.is_active = true;
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
        await buffetApi.updateSource(form.id, { ...form });
      } else {
        const { id, ...data } = form; // eslint-disable-line
        await buffetApi.createSource(data);
      }
      ElMessage.success('保存成功');
      dialogVisible.value = false;
      fetchSources();
    } catch (e: any) {
      ElMessage.error(e.message || '保存失败');
    } finally {
      submitting.value = false;
    }
  });
};

const handleDelete = async (id: string) => {
  try {
    await buffetApi.deleteSource(id);
    ElMessage.success('已删除');
    fetchSources();
  } catch (e: any) {
    ElMessage.error(e.message || '删除失败');
  }
};

const handleManualFetch = (row: any) => {
  ElMessage.info(`已对 ${row.name} 触发即时抓取任务...`);
  // Real trigger would call a crawler service
};

onMounted(() => {
  fetchSources();
});
</script>

<style scoped>
.source-admin {
}
</style>
