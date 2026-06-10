<template>
  <el-container class="admin-layout">
    <el-aside :width="collapse ? '64px' : '220px'" class="admin-aside">
      <div class="logo-area" @click="$router.push('/admin')">
        <el-icon :size="26" color="#fff"><School /></el-icon>
        <span v-if="!collapse" class="logo-text">管理后台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="collapse"
        :collapse-transition="false"
        router
        background-color="#1f2d3d"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        class="admin-menu"
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>数据概览</template>
        </el-menu-item>
        <el-menu-item index="/admin/enrollments">
          <el-icon><DocumentChecked /></el-icon>
          <template #title>报名审核</template>
        </el-menu-item>
        <el-menu-item index="/admin/members">
          <el-icon><UserFilled /></el-icon>
          <template #title>成员管理</template>
        </el-menu-item>
        <el-menu-item index="/admin/activities">
          <el-icon><Calendar /></el-icon>
          <template #title>活动管理</template>
        </el-menu-item>
        <el-menu-item index="/admin/news">
          <el-icon><Promotion /></el-icon>
          <template #title>动态管理</template>
        </el-menu-item>
        <el-menu-item index="/admin/notifications">
          <el-icon><Bell /></el-icon>
          <template #title>通知推送</template>
        </el-menu-item>
        <el-menu-item v-if="store.isAdmin" index="/admin/clubs">
          <el-icon><OfficeBuilding /></el-icon>
          <template #title>社团管理</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="admin-header">
        <div class="header-left">
          <el-icon :size="20" class="collapse-btn" @click="collapse = !collapse">
            <Fold v-if="!collapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ $route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="store.user?.avatar">
                {{ store.user?.real_name?.charAt(0) }}
              </el-avatar>
              <span class="user-name">{{ store.user?.real_name }}</span>
              <el-tag size="small" :type="store.user?.role === 'admin' ? 'danger' : 'warning'" effect="dark">
                {{ store.user?.role === 'admin' ? '管理员' : '社团干事' }}
              </el-tag>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="home">
                  <el-icon><House /></el-icon>返回前台
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="admin-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const store = useUserStore();
const collapse = ref(false);

const activeMenu = computed(() => route.path);

const handleCommand = async (cmd) => {
  if (cmd === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' });
      store.logout();
      ElMessage.success('已退出登录');
      router.push('/login');
    } catch (e) {}
  } else if (cmd === 'home') {
    router.push('/home');
  }
};
</script>

<style scoped>
.admin-layout { min-height: 100vh; }
.admin-aside {
  background: #1f2d3d;
  transition: width 0.25s;
  overflow: hidden;
}
.logo-area {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  border-bottom: 1px solid #2d3a4b;
  cursor: pointer;
}
.logo-text { font-size: 18px; font-weight: 600; white-space: nowrap; }
.admin-menu {
  border-right: none;
  min-height: calc(100vh - 60px);
}
.admin-menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}
.admin-menu :deep(.el-menu-item.is-active) {
  background: #2d3a4b;
  border-left: 3px solid #409eff;
}
.admin-header {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
}
.header-left { display: flex; align-items: center; gap: 16px; }
.collapse-btn { cursor: pointer; color: #606266; padding: 6px; border-radius: 6px; }
.collapse-btn:hover { background: #f5f7fa; color: #409eff; }
.header-right .user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
}
.header-right .user-info:hover { background: #f5f7fa; }
.user-name { font-size: 14px; font-weight: 500; color: #303133; }
.admin-main { background: #f0f2f5; padding: 20px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
