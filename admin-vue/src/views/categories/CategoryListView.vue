<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">服务分类管理</h1>
        <p class="text-gray-500 mt-1">管理系统中的所有服务大类及其图标</p>
      </div>
      <el-button type="primary" size="large" @click="handleCreate">
        <el-icon class="mr-1"><Plus /></el-icon>
        新建分类
      </el-button>
    </div>

    <el-card shadow="never" class="border-0 !rounded-xl">
      <el-table :data="sortedCategories" v-loading="loading" style="width: 100%" row-key="id" :tree-props="{ children: 'children', hasChildren: 'hasChildren' }">
        <el-table-column prop="sort_order" label="排序" width="80" sortable />
        <el-table-column label="图标" width="80">
          <template #default="scope">
            <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
               <img v-if="scope.row.icon?.startsWith('http')" :src="scope.row.icon" class="w-full h-full rounded-full object-cover" />
               <span v-else class="text-gray-600 font-bold text-xs">{{ (scope.row.icon || '').slice(0,2) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="分类名称" min-width="150">
          <template #default="scope">
            <span :class="scope.row.parent_id ? 'ml-4 text-gray-600' : 'font-bold'">
              {{ scope.row.parent_id ? '└ ' : '' }}{{ scope.row.name }}
            </span>
            <el-tag v-if="!scope.row.parent_id && getChildCount(scope.row.id) > 0" size="small" type="info" class="ml-2">
              {{ getChildCount(scope.row.id) }}个子分类
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="标准服务" width="100">
          <template #default="scope">
            <el-switch
              v-model="scope.row.standard_enabled"
              :disabled="scope.row.parent_id != null"
              @change="handleToggle(scope.row, 'standard_enabled', $event)"
            />
          </template>
        </el-table-column>
        <el-table-column label="定制服务" width="100">
          <template #default="scope">
            <el-switch
              v-model="scope.row.custom_enabled"
              :disabled="scope.row.parent_id != null"
              @change="handleToggle(scope.row, 'custom_enabled', $event)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ new Date(scope.row.created_at).toLocaleDateString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-popconfirm title="确定要删除这个分类吗？这可能会影响关联的表单。" @confirm="handleDelete(scope.row)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : '新建分类'"
      width="500px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="mt-4">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="例如：房屋保养" @input="onNameChange" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <div class="flex items-center gap-2 w-full">
            <el-input v-model="form.icon" placeholder="输入图标名 (如: home) 或图片URL" class="flex-1" />
            <el-button 
              v-if="suggestedIcon && suggestedIcon !== form.icon" 
              type="success" 
              size="small"
              @click="form.icon = suggestedIcon"
            >
              使用推荐: {{ suggestedIcon }}
            </el-button>
          </div>
          <div class="mt-2 text-xs text-gray-400">
            支持 FontAwesome/ElementPlus 图标名，或者完整的 https:// 图片链接。
            <span v-if="suggestedIcon" class="text-emerald-500 ml-1">🤖 AI 推荐: {{ suggestedIcon }}</span>
          </div>
        </el-form-item>
        <el-form-item label="父分类">
          <el-select v-model="form.parent_id" placeholder="无（作为顶级分类）" clearable class="w-full">
            <el-option 
              v-for="cat in parentCategoryOptions" 
              :key="cat.id" 
              :label="cat.name" 
              :value="cat.id"
              :disabled="cat.id === form.id"
            />
          </el-select>
          <div class="mt-1 text-xs text-gray-400">选择父分类后，此分类将作为子分类显示</div>
        </el-form-item>
        <el-form-item label="排序权重" prop="sort_order">
          <el-input-number v-model="form.sort_order" :min="0" :max="9999" />
          <span class="ml-2 text-xs text-gray-400">数字越小越靠前</span>
        </el-form-item>
        <el-form-item label="引用积分" v-if="form.custom_enabled">
          <el-input-number v-model="form.quote_credit_cost" :min="0" :step="1" />
          <div class="ml-2 text-xs text-gray-400">服务商对此类定制需求报价时需消耗的积分</div>
        </el-form-item>
        <el-form-item label="启用状态" prop="is_active">
          <el-switch v-model="form.is_active" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm(formRef)" :loading="submitting">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { categoriesApi } from '../../services/api'

const loading = ref(false)
const categories = ref<any[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const suggestedIcon = ref('')

const form = reactive({
  id: '',
  name: '',
  icon: '',
  sort_order: 0,
  description: '',
  is_active: true,
  parent_id: null as string | null,
  standard_enabled: true,
  custom_enabled: true,
  quote_credit_cost: 0
})

// 计算父分类选项（只显示顶级分类）
const parentCategoryOptions = computed(() => {
  return categories.value.filter(c => !c.parent_id)
})

// 排序后的分类列表（父分类后跟着子分类）
const sortedCategories = computed(() => {
  const parents = categories.value.filter(c => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order)
  const result: any[] = []
  
  parents.forEach(parent => {
    result.push(parent)
    const children = categories.value
      .filter(c => c.parent_id === parent.id)
      .sort((a, b) => a.sort_order - b.sort_order)
    result.push(...children)
  })
  
  // 添加没有有效父分类的孤儿分类
  const orphans = categories.value.filter(c => c.parent_id && !parents.find(p => p.id === c.parent_id))
  result.push(...orphans)
  
  return result
})

// 获取子分类数量
const getChildCount = (parentId: string) => {
  return categories.value.filter(c => c.parent_id === parentId).length
}

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  icon: [{ required: true, message: '请输入或上传图标', trigger: 'blur' }],
}

// 🤖 智能图标推荐映射表
const ICON_MAPPING: Record<string, string> = {
  // 接送/交通类
  '接送': 'car',
  '用车': 'car',
  '打车': 'car',
  '机场': 'plane',
  '接机': 'plane',
  '出行': 'car',
  '司机': 'car',
  '代驾': 'car',
  
  // 搬家类
  '搬家': 'truck',
  '搬运': 'truck',
  '运输': 'truck',
  '货运': 'truck',
  
  // 清洁类
  '清洁': 'sparkles',
  '保洁': 'sparkles',
  '打扫': 'sparkles',
  '洗': 'droplet',
  
  // 维修类
  '维修': 'wrench',
  '修理': 'wrench',
  '安装': 'wrench',
  '水管': 'droplet',
  '电工': 'zap',
  '电器': 'zap',
  
  // 家政类
  '保姆': 'heart',
  '月嫂': 'heart',
  '护理': 'heart',
  '看护': 'heart',
  '家政': 'home',
  
  // 房屋类
  '房屋': 'home',
  '装修': 'home',
  '房产': 'building',
  
  // 其他
  '宠物': 'paw-print',
  '美容': 'scissors',
  '理发': 'scissors',
  '教育': 'book',
  '培训': 'book',
  '健身': 'dumbbell',
  '餐饮': 'utensils',
  '外卖': 'package',
  '快递': 'package',
  '医疗': 'stethoscope',
  '法律': 'scale',
  '财务': 'calculator',
  '翻译': 'languages',
  '摄影': 'camera',
}

// 根据分类名称智能推荐图标
const suggestIconFromName = (name: string): string => {
  if (!name) return 'grid' // 默认图标
  
  // 遍历映射表寻找匹配
  for (const [keyword, icon] of Object.entries(ICON_MAPPING)) {
    if (name.includes(keyword)) {
      return icon
    }
  }
  
  return 'grid' // 未匹配则返回默认
}

// 当名称改变时自动推荐图标
const onNameChange = () => {
  const suggested = suggestIconFromName(form.name)
  suggestedIcon.value = suggested
  
  // 如果当前图标为空或是默认的 grid，自动应用推荐
  if (!form.icon || form.icon === 'grid') {
    form.icon = suggested
  }
}

const fetchCategories = async () => {
  loading.value = true
  try {
    const res = await categoriesApi.getAll()
    categories.value = res.categories
  } catch (error) {
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  isEdit.value = false
  form.id = ''
  form.name = ''
  form.icon = 'grid'
  form.sort_order = 100
  form.description = ''
  form.is_active = true
  form.parent_id = null
  form.standard_enabled = true
  form.custom_enabled = true
  form.quote_credit_cost = 0 // Default cost
  suggestedIcon.value = ''
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

// Handle toggle switch for standard/custom visibility
const handleToggle = async (row: any, field: string, value: boolean) => {
  try {
    await categoriesApi.update(row.id, { [field]: value })
    ElMessage.success('更新成功')
  } catch (error) {
    ElMessage.error('更新失败')
    // Revert the value
    row[field] = !value
  }
}

const handleDelete = async (row: any) => {
  try {
    await categoriesApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchCategories()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (isEdit.value) {
          await categoriesApi.update(form.id, form)
          ElMessage.success('更新成功')
        } else {
          await categoriesApi.create(form)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        fetchCategories()
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  fetchCategories()
})
</script>
