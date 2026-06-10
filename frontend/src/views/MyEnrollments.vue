<template>
  <div class="page-container">
    <div class="page-header">
      <h1>我的报名记录</h1>
      <p>实时跟踪你的报名审核状态</p>
    </div>

    <el-table :data="list" v-loading="loading" stripe style="width: 100%">
      <el-table-column prop="club_name" label="社团名称" width="160">
        <template #default="{ row }">
          <div style="display: flex; align-items: center; gap: 10px;">
            <el-image :src="row.club_logo" fit="cover" style="width: 32px; height: 32px; border-radius: 6px;" />
            <span style="font-weight: 500;">{{ row.club_name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="real_name" label="姓名" width="100" />
      <el-table-column prop="student_id" label="学号" width="120" />
      <el-table-column prop="department" label="院系" width="140" />
      <el-table-column prop="phone" label="手机" width="130" />
      <el-table-column prop="status" label="审核状态" width="140">
        <template #default="{ row }">
          <span>
            <span class="badge-dot" :class="`status-${row.status}`" />
            <el-tag :type="row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'" effect="light" size="small">
              {{ row.status === 'pending' ? '待审核' : row.status === 'approved' ? '已通过' : '已拒绝' }}
            </el-tag>
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="review_note" label="审核备注" width="180">
        <template #default="{ row }">{{ row.review_note || '-' }}</template>
      </el-table-column>
      <el-table-column prop="created_at" label="报名时间" width="180" />
      <el-table-column label="操作" width="140">
        <template #default="{ row }">
          <el-button size="small" @click="$router.push(`/club/${row.club_id}`)" type="primary" link>查看社团</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && list.length === 0" description="暂无报名记录">
      <el-button type="primary" @click="$router.push('/enroll')">去报名</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import request from '@/utils/request';

const loading = ref(false);
const list = ref([]);

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await request.get('/enrollments/my');
    list.value = res.data || [];
  } finally {
    loading.value = false;
  }
};

const handleVisibility = () => {
  if (!document.hidden) {
    fetchList();
  }
};

onMounted(() => {
  fetchList();
  document.addEventListener('visibilitychange', handleVisibility);
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibility);
});
</script>

<style scoped>
.page-header { padding: 20px 0 24px; }
.page-header h1 { font-size: 28px; font-weight: 700; margin-bottom: 6px; }
.page-header p { color: #909399; }
</style>
