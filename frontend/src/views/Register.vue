<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-left">
        <div class="brand-wrap">
          <el-icon :size="52" color="#fff"><UserFilled /></el-icon>
          <h1>注册新账号</h1>
          <p class="brand-slogan">加入我们，开启你的社团生活新旅程</p>
        </div>
        <div class="reg-tips">
          <h4>注册流程：</h4>
          <ol>
            <li>填写基本信息完成账号注册</li>
            <li>前往招新报名选择心仪社团</li>
            <li>等待社团审核通过后正式加入</li>
          </ol>
        </div>
      </div>
      <div class="login-right">
        <h2 class="form-title">创建账号</h2>
        <p class="form-sub">仅需几步，精彩内容等你探索</p>
        <el-form :model="form" :rules="rules" ref="formRef" size="large" class="login-form">
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="用户名（4-20位字母数字）" :prefix-icon="User" />
          </el-form-item>
          <el-form-item prop="real_name">
            <el-input v-model="form.real_name" placeholder="真实姓名" :prefix-icon="Avatar" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="请设置密码（至少6位）" :prefix-icon="Lock" show-password />
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input v-model="form.confirmPassword" type="password" placeholder="确认密码" :prefix-icon="Lock" show-password />
          </el-form-item>
          <el-row :gutter="12">
            <el-col :span="12">
              <el-form-item prop="phone">
                <el-input v-model="form.phone" placeholder="手机号（选填）" :prefix-icon="Phone" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item prop="email">
                <el-input v-model="form.email" placeholder="邮箱（选填）" :prefix-icon="Message" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-button type="primary" :loading="loading" style="width: 100%; height: 44px; font-size: 15px; border-radius: 10px;" @click="handleRegister">
            立即注册
          </el-button>
        </el-form>
        <div class="form-footer">
          已有账号？
          <router-link to="/login" class="link">立即登录</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock, Phone, Message, Avatar } from '@element-plus/icons-vue';
import request from '@/utils/request';

const router = useRouter();
const formRef = ref();
const loading = ref(false);

const form = reactive({
  username: '',
  real_name: '',
  password: '',
  confirmPassword: '',
  phone: '',
  email: ''
});

const validatePass = (rule, value, cb) => {
  if (value !== form.password) cb(new Error('两次密码输入不一致'));
  else cb();
};

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]{4,20}$/, message: '4-20位字母、数字或下划线', trigger: 'blur' }
  ],
  real_name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validatePass, trigger: 'blur' }
  ],
  email: [{ type: 'email', message: '邮箱格式错误', trigger: 'blur' }]
};

const handleRegister = async () => {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    await request.post('/auth/register', form);
    ElMessage.success('注册成功！请登录');
    router.push('/login');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.login-box {
  width: 980px;
  max-width: 100%;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1fr;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.login-left {
  background: linear-gradient(135deg, #36d399 0%, #409eff 100%);
  padding: 50px 40px;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
}
.login-left::before {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  bottom: -120px;
  left: -80px;
}
.brand-wrap h1 {
  font-size: 28px;
  margin: 16px 0 10px;
  font-weight: 700;
}
.brand-slogan { font-size: 14px; opacity: 0.9; }
.reg-tips {
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  padding: 20px;
  border-radius: 14px;
  position: relative;
  z-index: 1;
}
.reg-tips h4 { margin-bottom: 10px; font-size: 15px; }
.reg-tips ol { padding-left: 20px; font-size: 13px; line-height: 2; }

.login-right { padding: 40px 48px; }
.form-title { font-size: 24px; font-weight: 700; color: #303133; margin-bottom: 6px; }
.form-sub { color: #909399; margin-bottom: 24px; font-size: 14px; }
.login-form :deep(.el-form-item) { margin-bottom: 16px; }
.login-form :deep(.el-input__wrapper) { padding: 4px 12px; border-radius: 10px; box-shadow: 0 0 0 1px #e4e7ed; }
.form-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #909399;
}
.link { color: #409eff; font-weight: 500; }
</style>
