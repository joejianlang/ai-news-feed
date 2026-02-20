<template>
  <div class="article-edit">
    <div class="header">
      <h2>{{ isEdit ? '编辑内容' : '发布新内容' }}</h2>
      <el-button @click="$router.push('/dashboard/cms')">返回</el-button>
    </div>

    <el-card class="form-card" v-loading="loading">
      <el-form label-width="120px" :model="form" ref="formRef" :rules="rules">
        
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>

        <el-form-item label="别名 (Slug)" prop="slug">
           <el-input v-model="form.slug" placeholder="例如: privacy-policy (用于URL，可选)" />
        </el-form-item>

        <el-form-item label="内容类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="文章资讯" value="article" />
            <el-option label="协议政策" value="policy" />
            <el-option label="系统公告" value="announcement" />
            <el-option label="常见问题" value="faq" />
          </el-select>
        </el-form-item>

        <el-form-item label="子分类" prop="category" v-if="form.type === 'article'">
           <el-select v-model="form.category" placeholder="请选择" style="width: 100%">
             <el-option label="避坑指南" value="guide" />
             <el-option label="健康生活" value="health" />
             <el-option label="房产百科" value="real_estate" />
             <el-option label="行业新闻" value="news" />
           </el-select>
        </el-form-item>

        <el-form-item label="封面图片" prop="cover_image">
           <el-input v-model="form.cover_image" placeholder="图片URL" />
           <!-- In a real app, integrate an upload component here -->
           <div v-if="form.cover_image" style="margin-top: 10px;">
              <img :src="form.cover_image" style="max-height: 150px; border-radius: 8px;" />
           </div>
        </el-form-item>

        <el-form-item label="摘要" prop="summary">
           <el-input type="textarea" v-model="form.summary" placeholder="简短描述，用于列表展示 (可选)" :rows="3" />
        </el-form-item>

        <el-form-item label="排序权重" prop="sort_order">
           <el-input-number v-model="form.sort_order" :min="0" />
           <span class="ml-2 text-gray-400 text-xs">数值越大越靠前</span>
        </el-form-item>

        <el-form-item label="正文内容" prop="content">
          <div style="height: 400px; width: 100%; border: 1px solid #dcdfe6; border-radius: 4px;">
             <!-- Quill Editor -->
             <QuillEditor 
                v-model:content="form.content" 
                contentType="html" 
                theme="snow" 
                toolbar="full"
                style="height: 350px"
             />
          </div>
        </el-form-item>
        
        <el-form-item label="发布状态">
           <el-radio-group v-model="form.status">
              <el-radio value="published">立即发布</el-radio>
              <el-radio value="draft">存为草稿</el-radio>
              <el-radio value="archived">存档</el-radio>
           </el-radio-group>
        </el-form-item>

        <el-form-item>
           <el-button type="primary" @click="handleSubmit" :loading="saving">保存提交</el-button>
           <el-button @click="$router.push('/dashboard/cms')">取消</el-button>
        </el-form-item>

      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { cmsApi } from '@/services/api'

const route = useRoute()
const router = useRouter()

const isEdit = ref(false)
const loading = ref(false)
const saving = ref(false)
const formRef = ref()

const form = ref({
    title: '',
    slug: '',
    type: 'article',
    category: '',
    cover_image: '',
    summary: '',
    content: '', // HTML content
    status: 'published',
    sort_order: 0
})

const rules = {
    title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
    type: [{ required: true, message: '请选择类型', trigger: 'change' }],
    content: [{ required: true, message: '请输入正文内容', trigger: 'blur' }]
}

const fetchArticle = async (id: string) => {
    loading.value = true
    try {
        const data = await cmsApi.getById(id)
        form.value = { ...data.article }
    } catch (e: any) {
        ElMessage.error(e.message || '加载失败')
    } finally {
        loading.value = false
    }
}

const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate()

    saving.value = true
    try {
        if (isEdit.value) {
            await cmsApi.update(route.params.id as string, form.value)
        } else {
            await cmsApi.create(form.value)
        }
        ElMessage.success('保存成功')
        router.push('/dashboard/cms')
    } catch (e: any) {
        ElMessage.error(e.message || '保存失败')
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    if (route.params.id) {
        isEdit.value = true
        fetchArticle(route.params.id as string)
    }
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
