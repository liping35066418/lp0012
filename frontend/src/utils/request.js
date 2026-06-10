import axios from 'axios';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import router from '@/router';

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
});

request.interceptors.request.use(config => {
  const store = useUserStore();
  if (store.token) {
    config.headers.Authorization = `Bearer ${store.token}`;
  }
  return config;
});

request.interceptors.response.use(
  res => {
    const data = res.data;
    if (data.code === 200) {
      return data;
    }
    if (data.code === 401) {
      ElMessage.error(data.message || '登录已过期');
      const store = useUserStore();
      store.logout();
      router.push('/login');
      return Promise.reject(data);
    }
    ElMessage.error(data.message || '请求失败');
    return Promise.reject(data);
  },
  err => {
    ElMessage.error(err.message || '网络错误');
    return Promise.reject(err);
  }
);

export default request;
