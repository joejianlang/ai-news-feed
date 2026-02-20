<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="bg-white p-6 border-b border-gray-100 mb-6">
      <h2 class="text-lg font-bold text-gray-800">修改密码</h2>
    </div>

    <div class="flex-1 px-6">
      <div class="bg-white rounded-xl shadow-sm p-8 min-h-[500px]">
        <el-form 
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="120px"
            label-position="left"
            class="max-w-2xl"
        >
            <el-form-item label="原密码" prop="oldPassword">
                <el-input 
                    v-model="form.oldPassword" 
                    type="password" 
                    placeholder="填写原密码"
                    show-password
                />
            </el-form-item>

            <el-form-item label="新密码" prop="newPassword">
                <el-input 
                    v-model="form.newPassword" 
                    type="password" 
                    placeholder="填写新密码"
                    show-password
                />
                <div class="text-xs text-gray-400 mt-1">
                    8-20个字符，需包含至少一个大写字母、一个小写字母、一个数字组成
                </div>
            </el-form-item>

            <el-form-item label="确认密码" prop="confirmPassword">
                <el-input 
                    v-model="form.confirmPassword" 
                    type="password" 
                    placeholder="确认密码"
                    show-password
                />
            </el-form-item>

            <el-form-item>
                <div class="flex flex-col gap-4 w-full max-w-xs mt-4">
                    <el-button type="primary" size="large" @click="handleSubmit" :loading="loading" class="w-full">
                        保存
                    </el-button>
                    <el-button size="large" @click="handleForgotPassword" class="w-full !ml-0">
                        忘记密码
                    </el-button>
                </div>
            </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { authApi } from '../../services/api'
import { ElMessage, type FormInstance } from 'element-plus'

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
})

const validatePass = (rule: any, value: string, callback: any) => {
    if (value === '') {
        callback(new Error('请输入密码'))
    } else {
        if (form.confirmPassword !== '') {
            if (!formRef.value) return
            formRef.value.validateField('confirmPassword')
        }
        callback()
    }
}

const validatePass2 = (rule: any, value: string, callback: any) => {
    if (value === '') {
        callback(new Error('请再次输入密码'))
    } else if (value !== form.newPassword) {
        callback(new Error('两次输入密码不一致!'))
    } else {
        callback()
    }
}

const rules = {
    oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
    newPassword: [
        { validator: validatePass, trigger: 'blur' },
        { min: 8, max: 20, message: '长度在 8 到 20 个字符', trigger: 'blur' },
        // Regex for complexity check if strict
        // { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, message: '需包含至少一个大写字母、一个小写字母、一个数字', trigger: 'blur' }
    ],
    confirmPassword: [{ validator: validatePass2, trigger: 'blur' }]
}

const handleSubmit = async () => {
    if (!formRef.value) return
    
    await formRef.value.validate(async (valid: boolean) => {
        if (valid) {
            loading.value = true
            try {
                await authApi.changePassword(form.oldPassword, form.newPassword)
                ElMessage.success('密码修改成功')
                form.oldPassword = ''
                form.newPassword = ''
                form.confirmPassword = ''
            } catch (error: any) {
                console.error(error)
                ElMessage.error(error.message || '修改失败')
            } finally {
                loading.value = false
            }
        }
    })
}

const handleForgotPassword = () => {
    ElMessage.info('请联系客服重置密码')
}
</script>
