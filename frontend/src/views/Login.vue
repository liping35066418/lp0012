<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-left">
        <div class="brand-wrap">
          <el-icon :size="52" color="#fff"><School /></el-icon>
          <h1>社团管理系统</h1>
          <p class="brand-slogan">发现热爱，结交同好，成就精彩校园生活</p>
        </div>
        <div class="features">
          <div class="f-item"><el-icon><Star /></el-icon><span>5+特色社团</span></div>
          <div class="f-item"><el-icon><Calendar /></el-icon><span>精彩活动不停</span></div>
          <div class="f-item"><el-icon><Trophy /></el-icon><span>省级获奖荣誉</span></div>
        </div>
      </div>
      <div class="login-right">
        <h2 class="form-title">欢迎回来</h2>
        <p class="form-sub">登录账号开始你的社团之旅</p>
        <el-form :model="form" :rules="rules" ref="formRef" size="large" class="login-form">
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password @keyup.enter="handleLogin" />
          </el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%; height: 44px; font-size: 15px; border-radius: 10px;" @click="handleLogin">
            登 录
          </el-button>
        </el-form>
        <div class="quick-login">
          <span>测试账号：</span>
          <el-tag type="primary" @click="quickFill('admin', 'admin123')" class="clickable">管理员 admin/admin123</el-tag>
          <el-tag type="warning" @click="quickFill('officer', 'officer123')" class="clickable">干事 officer/officer123</el-tag>
          <el-tag type="success" @click="quickFill('member', 'member123')" class="clickable">成员 member/member123</el-tag>
        </div>
        <div class="form-footer">
          还没有账号？
          <router-link to="/register" class="link">立即注册</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import request from '@/utils/request';
import { useUserStore } from '@/stores/user';

const store = useUserStore();
const router = useRouter();
const route = useRoute();
const formRef = ref();
const loading = ref(false);

const form = reactive({
  username: '',
  password: ''
});

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

const quickFill = (u, p) => {
  form.username = u;
  form.password = p;
};

const handleLogin = async () => {
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    const res = await request.post('/auth/login', form);
    store.setLogin(res.data);
    ElMessage.success('登录成功！欢迎 ' + (res.data.user.real_name || res.data.user.username));
    const redirect = route.query.redirect || (store.isOfficer ? '/admin' : '/home');
    router.push(redirect);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.login-box {
  width: 920px;
  max-width: 100%;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1fr;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}
.login-left {
  background: linear-gradient(135deg, #409eff 0%, #36d399 100%);
  padding: 50px 40px;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
}
.login-left::before {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  top: -100px;
  right: -100px;
}
.login-left::after {
  content: '';
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
  bottom: -50px;
  left: -50px;
}
.brand-wrap { position: relative; z-index: 1; }
.brand-wrap h1 {
  font-size: 30px;
  margin: 16px 0 10px;
  font-weight: 700;
}
.brand-slogan { font-size: 14px; opacity: 0.9; line-height: 1.6; }
.features { display: flex; flex-direction: column; gap: 14px; position: relative; z-index: 1; }
.f-item { display: flex; align-items: center; gap: 10px; font-size: 14px; opacity: 0.95; }
.f-item .el-icon { font-size: 20px; }

.login-right { padding: 50px 48px; }
.form-title { font-size: 26px; font-weight: 700; color: #303133; margin-bottom: 6px; }
.form-sub { color: #909399; margin-bottom: 30px; font-size: 14px; }
.login-form :deep(.el-form-item) { margin-bottom: 20px; }
.login-form :deep(.el-input__wrapper) { padding: 4px 12px; border-radius: 10px; box-shadow: 0 0 0 1px #e4e7ed; }
.quick-login {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px dashed #ebeef5;
  font-size: 13px;
  color: #909399;
  line-height: 2.2;
}
.quick-login .clickable { margin: 0 4px; cursor: pointer; }
.form-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: #909399;
}
.link { color: #409eff; font-weight: 500; }
</style>
