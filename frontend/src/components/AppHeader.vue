<template>
  <header class="site-header">
    <div class="header-inner">
      <div class="logo" @click="$router.push('/home')">
        <el-icon :size="28" color="#409eff"><School /></el-icon>
        <span class="logo-text">社团管理系统</span>
      </div>
      <nav class="nav-menu">
        <router-link :to="'/home'" class="nav-item" :class="{ active: $route.path === '/home' }">首页</router-link>
        <router-link :to="'/clubs'" class="nav-item" :class="{ active: $route.path.startsWith('/club') }">社团展示</router-link>
        <router-link :to="'/activities'" class="nav-item" :class="{ active: $route.path.startsWith('/activit') }">活动中心</router-link>
        <router-link :to="'/news'" class="nav-item" :class="{ active: $route.path.startsWith('/news') }">校园动态</router-link>
        <router-link :to="'/enroll'" class="nav-item enroll-btn" :class="{ active: $route.path === '/enroll' }">
          <el-icon><EditPen /></el-icon>
          招新报名
        </router-link>
      </nav>
      <div class="user-area">
        <el-dropdown v-if="store.isLogin" @command="handleCommand">
          <span class="user-info">
            <el-avatar :size="32" :src="store.user?.avatar">
              {{ store.user?.real_name?.charAt(0) || store.user?.username?.charAt(0) }}
            </el-avatar>
            <span class="user-name">{{ store.user?.real_name || store.user?.username }}</span>
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99" class="msg-badge">
              <el-icon :size="18" class="msg-icon"><Bell /></el-icon>
            </el-badge>
            <el-icon><CaretBottom /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="notifications">
                <el-icon><Bell /></el-icon>消息通知
                <el-badge v-if="unreadCount > 0" type="danger" :value="unreadCount" class="float-right" />
              </el-dropdown-item>
              <el-dropdown-item command="my">
                <el-icon><User /></el-icon>我的报名
              </el-dropdown-item>
              <el-dropdown-item v-if="store.isOfficer" command="admin" divided>
                <el-icon><Setting /></el-icon>管理后台
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <el-icon><SwitchButton /></el-icon>退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <template v-else>
          <el-button type="primary" @click="$router.push('/login')">登录</el-button>
          <el-button @click="$router.push('/register')">注册</el-button>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import request from '@/utils/request';

const store = useUserStore();
const router = useRouter();
const unreadCount = ref(0);

const fetchUnread = async () => {
  if (!store.isLogin) return;
  try {
    const res = await request.get('/notifications/my');
    unreadCount.value = res.data?.unreadCount || 0;
  } catch (e) {}
};

onMounted(() => {
  fetchUnread();
  setInterval(fetchUnread, 15000);
});

const handleCommand = async (cmd) => {
  if (cmd === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' });
      store.logout();
      ElMessage.success('已退出登录');
      router.push('/home');
    } catch (e) {}
  } else if (cmd === 'admin') {
    router.push('/admin');
  } else if (cmd === 'my') {
    router.push('/my-enrollments');
  } else if (cmd === 'notifications') {
    ElMessageBox({
      title: '消息通知',
      dangerouslyUseHTMLString: true,
      showCancelButton: false,
      confirmButtonText: '全部已读',
      message: async (h) => {
        const res = await request.get('/notifications/my');
        const list = res.data?.list || [];
        return h('div', { style: { maxHeight: '400px', overflow: 'auto' } }, list.length === 0 ? [h('p', { class: 'text-center', style: { color: '#999' } }, '暂无消息')] : list.map(n => h('div', {
          key: n.id,
          style: { padding: '12px', borderBottom: '1px solid #f0f0f0', background: n.is_read ? '' : '#f0f9ff', borderRadius: '6px', marginBottom: '8px' }
        }, [
          h('div', { style: { fontWeight: 600, marginBottom: '4px' } }, n.title),
          h('div', { style: { fontSize: '13px', color: '#666' } }, n.content),
          h('div', { style: { fontSize: '12px', color: '#999', marginTop: '6px' } }, n.created_at)
        ])));
      },
      callback: async () => {
        await request.post('/notifications/read-all');
        unreadCount.value = 0;
        ElMessage.success('已全部标记为已读');
      }
    }).catch(() => {});
  }
};
</script>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid #ebeef5;
}
.header-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.logo-text {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #409eff, #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.nav-menu {
  display: flex;
  gap: 8px;
  flex: 1;
  justify-content: center;
}
.nav-item {
  padding: 8px 18px;
  border-radius: 8px;
  color: #606266;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.nav-item:hover {
  background: #ecf5ff;
  color: #409eff;
}
.nav-item.active {
  background: #409eff;
  color: #fff;
}
.enroll-btn {
  background: linear-gradient(135deg, #ff6b6b, #feca57);
  color: #fff !important;
  font-weight: 600;
}
.enroll-btn.active {
  background: linear-gradient(135deg, #ee5253, #ff9f43);
  color: #fff;
}
.user-area {
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}
.user-info:hover {
  background: #f5f7fa;
}
.user-name {
  font-size: 14px;
  color: #303133;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.msg-icon {
  color: #606266;
  margin: 0 4px;
}
.msg-badge {
  margin-left: -8px;
  margin-top: -4px;
}
.float-right {
  float: right;
  margin-left: 16px;
}
</style>
