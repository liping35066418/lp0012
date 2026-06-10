import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/user';

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/clubs',
    name: 'Clubs',
    component: () => import('@/views/Clubs.vue'),
    meta: { title: '社团列表' }
  },
  {
    path: '/club/:id',
    name: 'ClubDetail',
    component: () => import('@/views/ClubDetail.vue'),
    meta: { title: '社团详情' }
  },
  {
    path: '/enroll/:clubId?',
    name: 'Enroll',
    component: () => import('@/views/Enroll.vue'),
    meta: { title: '招新报名' }
  },
  {
    path: '/activities',
    name: 'Activities',
    component: () => import('@/views/Activities.vue'),
    meta: { title: '活动中心' }
  },
  {
    path: '/activity/:id',
    name: 'ActivityDetail',
    component: () => import('@/views/ActivityDetail.vue'),
    meta: { title: '活动详情' }
  },
  {
    path: '/news',
    name: 'News',
    component: () => import('@/views/News.vue'),
    meta: { title: '校园动态' }
  },
  {
    path: '/news/:id',
    name: 'NewsDetail',
    component: () => import('@/views/NewsDetail.vue'),
    meta: { title: '动态详情' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册', public: true }
  },
  {
    path: '/my-enrollments',
    name: 'MyEnrollments',
    component: () => import('@/views/MyEnrollments.vue'),
    meta: { title: '我的报名', requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/admin/Layout.vue'),
    meta: { title: '管理后台', requiresAuth: true, requiresAdmin: true },
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '数据概览' }
      },
      {
        path: 'enrollments',
        name: 'AdminEnrollments',
        component: () => import('@/views/admin/Enrollments.vue'),
        meta: { title: '报名审核' }
      },
      {
        path: 'members',
        name: 'AdminMembers',
        component: () => import('@/views/admin/Members.vue'),
        meta: { title: '成员管理' }
      },
      {
        path: 'activities',
        name: 'AdminActivities',
        component: () => import('@/views/admin/Activities.vue'),
        meta: { title: '活动管理' }
      },
      {
        path: 'news',
        name: 'AdminNews',
        component: () => import('@/views/admin/News.vue'),
        meta: { title: '动态管理' }
      },
      {
        path: 'notifications',
        name: 'AdminNotifications',
        component: () => import('@/views/admin/Notifications.vue'),
        meta: { title: '通知推送' }
      },
      {
        path: 'clubs',
        name: 'AdminClubs',
        component: () => import('@/views/admin/Clubs.vue'),
        meta: { title: '社团管理', requiresSuper: true }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const store = useUserStore();
  document.title = to.meta.title ? `${to.meta.title} - 社团管理系统` : '社团管理系统';
  if (to.meta.requiresAuth && !store.isLogin) {
    next({ path: '/login', query: { redirect: to.fullPath } });
    return;
  }
  if (to.meta.requiresAdmin && !store.isOfficer) {
    next('/home');
    return;
  }
  if (to.meta.requiresSuper && !store.isAdmin) {
    next('/admin/dashboard');
    return;
  }
  next();
});

export default router;
