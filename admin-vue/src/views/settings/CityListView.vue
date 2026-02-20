<template>
  <div class="city-list p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">城市管理</h2>
      <el-button type="primary" @click="openDialog()">
        <el-icon class="mr-1"><Plus /></el-icon> 新增城市
      </el-button>
    </div>

    <el-card shadow="never" class="border-0">
      <el-table :data="cities" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="城市名称" />
        <el-table-column prop="province" label="省份" />
        <el-table-column prop="code" label="城市代码 (Code)" width="150" />
        <el-table-column prop="sort_order" label="排序" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'">{{ row.is_active ? '启用' : '禁用' }}</el-tag>
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

    <el-dialog :title="form.id ? '编辑城市' : '新增城市'" v-model="dialogVisible" width="500px">
      <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="城市名称" prop="name">
          <el-input v-model="form.name" placeholder="例如: 多伦多" />
        </el-form-item>
        <el-form-item label="所属省份" prop="province">
          <el-select v-model="form.province" placeholder="选择省份" filterable allow-create>
            <el-option label="Ontario (ON)" value="Ontario (ON)" />
            <el-option label="British Columbia (BC)" value="British Columbia (BC)" />
            <el-option label="Alberta (AB)" value="Alberta (AB)" />
            <el-option label="Quebec (QC)" value="Quebec (QC)" />
            <el-option label="Manitoba (MB)" value="Manitoba (MB)" />
            <el-option label="Saskatchewan (SK)" value="Saskatchewan (SK)" />
            <el-option label="Nova Scotia (NS)" value="Nova Scotia (NS)" />
            <el-option label="New Brunswick (NB)" value="New Brunswick (NB)" />
            <el-option label="PEI (PE)" value="PEI (PE)" />
            <el-option label="Newfoundland (NL)" value="Newfoundland (NL)" />
          </el-select>
        </el-form-item>
        <el-form-item label="代码 Code" prop="code">
          <el-input v-model="form.code" placeholder="例如: toronto (仅小写字母)" />
        </el-form-item>
        <el-form-item label="排序权重">
          <el-input-number v-model="form.sort_order" :min="0" />
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
import { ref, reactive, onMounted } from 'vue';
import { citiesApi } from '../../services/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

const cities = ref<any[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const submitting = ref(false);
const formRef = ref();

const form = reactive({
  id: '',
  name: '',
  province: '',
  code: '',
  sort_order: 0,
  is_active: true
});

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入代码', trigger: 'blur' }]
};

const fetchCities = async () => {
    loading.value = true;
    try {
        const res = await citiesApi.getAll();
        cities.value = res;
    } catch {
        ElMessage.error('加载列表失败');
    } finally {
        loading.value = false;
    }
};

const openDialog = (row?: any) => {
    if (row) {
        Object.assign(form, {
            id: row.id || '',
            name: row.name || '',
            province: row.province || '',
            code: row.code || '',
            sort_order: row.sort_order || 0,
            is_active: row.is_active ?? true
        });
    } else {
        form.id = '';
        form.name = '';
        form.province = '';
        form.code = '';
        form.sort_order = 0;
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
                await citiesApi.update(form.id, { ...form });
            } else {
                const { id, ...data } = form; // eslint-disable-line
                await citiesApi.create(data);
            }
            ElMessage.success('保存成功');
            dialogVisible.value = false;
            fetchCities();
        } catch (e: any) {
            ElMessage.error(e.message || '保存失败');
        } finally {
            submitting.value = false;
        }
    });
};

const handleDelete = (row: any) => {
    ElMessageBox.confirm('确认删除该城市吗？', '提示', { type: 'warning' }).then(async () => {
        try {
            await citiesApi.delete(row.id);
            ElMessage.success('已删除');
            fetchCities();
        } catch {
            ElMessage.error('删除失败');
        }
    });
};

onMounted(() => fetchCities());
</script>
