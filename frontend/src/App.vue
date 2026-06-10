<template>
  <el-config-provider :locale="zhCn">
    <AppHeader v-if="!isAdminPage" />
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <AppFooter v-if="!isAdminPage" />
    <el-backtop :visibility-height="200" />
  </el-config-provider>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import AppHeader from '@/components/AppHeader.vue';
import AppFooter from '@/components/AppFooter.vue';
import { useUserStore } from '@/stores/user';
import request from '@/utils/request';

const route = useRoute();
const store = useUserStore();
const unreadCount = ref(0);

const isAdminPage = computed(() => route.path.startsWith('/admin'));

const fetchUnread = async () => {
  if (!store.isLogin) return;
  try {
    const res = await request.get('/notifications/my');
    unreadCount.value = res.data?.unreadCount || 0;
  } catch (e) {}
};

onMounted(() => {
  fetchUnread();
  setInterval(fetchUnread, 30000);
});

defineExpose({ unreadCount });
</script>

<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
