<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">邮件模板配置</h2>
    </div>

    <el-card shadow="never" class="border-0">
      <el-table :data="templates" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="模板名称" width="180" />
        <el-table-column prop="key" label="唯一标识 (Key)" width="180">
             <template #default="{ row }">
                 <el-tag type="info" size="small">{{ row.key }}</el-tag>
             </template>
        </el-table-column>
        <el-table-column prop="subject" label="邮件标题" show-overflow-tooltip>
             <template #default="{ row }">
                 <span class="text-gray-500">{{ row.subject }}</span>
             </template>
        </el-table-column>
        <el-table-column prop="from_name" label="发件人名称" width="150" />
        <el-table-column prop="description" label="用途描述" width="200" show-overflow-tooltip />
        <el-table-column prop="updated_at" label="更新时间" width="180">
            <template #default="{ row }">
                {{ formatDate(row.updated_at) }}
            </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDialog(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Edit Dialog -->
    <el-dialog title="编辑邮件模板" v-model="dialogVisible" width="800px" :close-on-click-modal="false">
      <el-form :model="form" label-width="100px" ref="formRef" :rules="rules">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        
        <el-form-item label="唯一标识">
           <el-input v-model="form.key" disabled />
           <div class="text-xs text-gray-400 mt-1">系统内部标识，不可修改</div>
        </el-form-item>

        <el-form-item label="发件人名称" prop="from_name">
          <el-input v-model="form.from_name" placeholder="如：优服佳订单中心" />
        </el-form-item>

        <el-form-item label="邮件标题" prop="subject">
            <el-input v-model="form.subject" placeholder="可使用变量如 {{orderNo}}" />
        </el-form-item>

        <el-form-item label="邮件内容" prop="html_content">
            <el-input 
                v-model="form.html_content" 
                type="textarea" 
                :rows="12" 
                placeholder="HTML格式的邮件内容"
            />
            <div class="mt-2 w-full">
                <div class="text-xs text-gray-500 mb-2">可用变量 (点击插入):</div>
                <div class="flex flex-wrap gap-2">
                    <el-tag 
                        v-for="v in currentVariables" 
                        :key="v" 
                        class="cursor-pointer hover:bg-emerald-100 select-none"
                        type="success"
                        size="small"
                        effect="plain"
                        @click="insertVariable(v)"
                    >
                        {{ '{' + '{' + v + '}' + '}' }}
                    </el-tag>
                    <span v-if="currentVariables.length === 0" class="text-xs text-gray-300">无可用变量</span>
                </div>
            </div>
        </el-form-item>

        <el-form-item label="用途描述" prop="description">
           <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>

        <!-- Preview Section -->
        <el-form-item label="预览效果">
            <div class="border rounded-lg p-4 bg-gray-50 w-full max-h-60 overflow-auto">
                <div class="text-sm text-gray-600 mb-2"><strong>标题:</strong> {{ form.subject }}</div>
                <div class="text-sm text-gray-600 mb-2"><strong>发件人:</strong> {{ form.from_name }}</div>
                <div class="border-t pt-2 mt-2">
                    <div v-html="form.html_content" class="email-preview"></div>
                </div>
            </div>
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
import { emailTemplatesApi } from '../../services/api';
import { ElMessage } from 'element-plus';

const templates = ref<any[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const submitting = ref(false);
const formRef = ref();

const form = reactive({
    id: '',
    key: '',
    name: '',
    subject: '',
    html_content: '',
    from_name: '',
    description: '',
    variables: [] as string[]
});

const rules = {
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    subject: [{ required: true, message: '请输入邮件标题', trigger: 'blur' }],
    html_content: [{ required: true, message: '请输入邮件内容', trigger: 'blur' }]
};

const currentVariables = computed(() => {
    return form.variables || [];
});

const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
};

const fetchTemplates = async () => {
    loading.value = true;
    try {
        const res = await emailTemplatesApi.getAll();
        templates.value = res.templates || [];
    } catch (e) {
        ElMessage.error('加载失败');
    } finally {
        loading.value = false;
    }
};

const openDialog = (row: any) => {
    Object.assign(form, JSON.parse(JSON.stringify(row))); // Deep copy
    // Ensure variables is array
    if (typeof form.variables === 'string') {
         try { 
             form.variables = JSON.parse(form.variables); 
         } catch { 
             form.variables = []; 
         }
    } else if (!Array.isArray(form.variables)) {
        form.variables = [];
    }
    dialogVisible.value = true;
};

const insertVariable = (v: string) => {
    form.html_content += `{{${v}}}`;
};

const handleSubmit = async () => {
    if (!formRef.value) return;
    await formRef.value.validate(async (valid: boolean) => {
         if (!valid) return;
         submitting.value = true;
         try {
             await emailTemplatesApi.update(form.id, {
                 name: form.name,
                 subject: form.subject,
                 html_content: form.html_content,
                 from_name: form.from_name,
                 description: form.description
             });
             ElMessage.success('更新成功');
             dialogVisible.value = false;
             fetchTemplates();
         } catch (e: any) {
             ElMessage.error(e.message || '更新失败');
         } finally {
             submitting.value = false;
         }
    });
};

onMounted(() => {
    fetchTemplates();
});
</script>

<style scoped>
.email-preview {
    font-family: Arial, sans-serif;
}
.email-preview img {
    max-width: 100%;
}
</style>
