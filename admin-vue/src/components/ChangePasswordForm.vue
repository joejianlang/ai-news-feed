<template>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <h3 class="text-lg font-bold text-gray-800 mb-4">账号安全</h3>
    <el-form 
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item label="当前密码" prop="oldPassword">
        <el-input 
            v-model="form.oldPassword" 
            type="password" 
            show-password 
            placeholder="请输入当前使用的密码"
        />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input 
            v-model="form.newPassword" 
            type="password" 
            show-password 
            placeholder="8-20字符，建议包含大小写字母"
        />
      </el-form-item>
      <el-form-item label="确认新密码" prop="confirmPassword">
        <el-input 
            v-model="form.confirmPassword" 
            type="password" 
            show-password 
            placeholder="请再次输入新密码"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="handleSubmit">保存新密码</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { authApi } from '../services/api'

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validatePass2 = (rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'));
  } else if (value !== form.newPassword) {
    callback(new Error('两次输入密码不一致!'));
  } else {
    callback();
  }
}

const rules = reactive<FormRules>({
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [{ validator: validatePass2, trigger: 'blur' }]
})

const handleSubmit = async () => {
    if (!formRef.value) return
    
    await formRef.value.validate(async (valid) => {
        if (valid) {
            loading.value = true
            try {
                await authApi.changePassword(form.oldPassword, form.newPassword)
                ElMessage.success('密码修改成功')
                // Reset form
                form.oldPassword = ''
                form.newPassword = ''
                form.confirmPassword = ''
            } catch (error: any) {
                ElMessage.error(error.message || '修改失败')
            } finally {
                loading.value = false
            }
        }
    })
}
</script>
