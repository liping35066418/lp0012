<template>
  <div class="admin-enrollments">
    <el-card>
      <template #header>
        <div class="card-head flex-between">
          <div class="card-title">
            <el-icon><DocumentChecked /></el-icon>
            报名审核管理
          </div>
          <div class="stat-tags">
            <el-tag type="info">总计：{{ stats.total || 0 }}</el-tag>
            <el-tag type="warning" effect="dark">待审核：{{ stats.pending || 0 }}</el-tag>
            <el-tag type="success" effect="dark">已通过：{{ stats.approved || 0 }}</el-tag>
            <el-tag type="danger" effect="dark">已拒绝：{{ stats.rejected || 0 }}</el-tag>
          </div>
        </div>
      </template>

      <div class="filter-bar">
        <el-select v-model="filters.club_id" placeholder="按社团筛选" clearable style="width: 180px;">
          <el-option v-for="c in clubs" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-select v-model="filters.status" placeholder="按状态筛选" clearable style="width: 140px;">
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>
        <el-input v-model="filters.keyword" placeholder="搜索姓名/学号/手机号" clearable style="width: 240px;" @keyup.enter="fetchList">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" @click="fetchList">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
        <el-button type="success" plain @click="fetchList" :icon="Refresh">刷新</el-button>
      </div>

      <el-table :data="list" v-loading="loading" stripe style="width: 100%; margin-top: 16px;" @selection-change="handleSelection">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="club_name" label="社团" width="140">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain">{{ row.club_name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="real_name" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="70" />
        <el-table-column prop="student_id" label="学号" width="120" />
        <el-table-column prop="department" label="院系" width="140" />
        <el-table-column prop="grade" label="年级" width="80" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'" effect="dark" size="small">
              {{ row.status === 'pending' ? '待审核' : row.status === 'approved' ? '已通过' : '已拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="报名时间" width="170" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewDetail(row)">查看</el-button>
            <template v-if="row.status === 'pending'">
              <el-button size="small" type="success" link @click="review(row, 'approved')">通过</el-button>
              <el-button size="small" type="danger" link @click="review(row, 'rejected')">拒绝</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="selectedRows.length > 0" class="batch-actions">
        <span>已选择 {{ selectedRows.length }} 项</span>
        <el-button type="success" size="small" @click="batchReview('approved')" :disabled="!canBatchReview">批量通过</el-button>
        <el-button type="danger" size="small" @click="batchReview('rejected')" :disabled="!canBatchReview">批量拒绝</el-button>
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="报名详情" width="640px">
      <div v-if="current" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="社团">{{ current.club_name }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="current.status === 'approved' ? 'success' : current.status === 'rejected' ? 'danger' : 'warning'" effect="dark">
              {{ current.status === 'pending' ? '待审核' : current.status === 'approved' ? '已通过' : '已拒绝' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="姓名">{{ current.real_name }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ current.gender }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ current.student_id }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ current.phone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ current.email || '-' }}</el-descriptions-item>
          <el-descriptions-item label="院系">{{ current.department }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{ current.grade }}</el-descriptions-item>
          <el-descriptions-item label="报名时间">{{ current.created_at }}</el-descriptions-item>
          <el-descriptions-item label="报名理由" :span="2">{{ current.reason }}</el-descriptions-item>
          <el-descriptions-item label="特长技能" :span="2">{{ current.skills || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="current.reviewed_at" label="审核时间" :span="2">{{ current.reviewed_at }}</el-descriptions-item>
          <el-descriptions-item v-if="current.review_note" label="审核备注" :span="2">{{ current.review_note }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer v-if="current && current.status === 'pending'">
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="danger" @click="review(current, 'rejected')">拒绝</el-button>
        <el-button type="success" @click="review(current, 'approved')">审核通过</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reviewVisible" :title="reviewType === 'approved' ? '审核通过' : '审核拒绝'" width="480px">
      <el-form :model="reviewForm" label-width="80px">
        <el-form-item label="审核备注">
          <el-input v-model="reviewForm.review_note" type="textarea" :rows="4" :placeholder="reviewType === 'approved' ? '请输入审核意见（选填）' : '请输入拒绝原因'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReview">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';

const loading = ref(false);
const list = ref([]);
const clubs = ref([]);
const stats = ref({});
const filters = reactive({ club_id: '', status: '', keyword: '' });
const selectedRows = ref([]);
const detailVisible = ref(false);
const reviewVisible = ref(false);
const current = ref(null);
const reviewType = ref('approved');
const reviewForm = reactive({ review_note: '' });
const reviewTarget = ref(null);
const Refresh = 'Refresh';

const canBatchReview = computed(() => selectedRows.value.some(r => r.status === 'pending'));

const fetchClubs = async () => {
  const res = await request.get('/clubs');
  clubs.value = res.data || [];
};

const fetchList = async () => {
  loading.value = true;
  try {
    const params = {};
    if (filters.club_id) params.club_id = filters.club_id;
    if (filters.status) params.status = filters.status;
    if (filters.keyword) params.keyword = filters.keyword;
    const res = await request.get('/enrollments', { params });
    list.value = res.data?.list || [];
    stats.value = res.data?.stats || {};
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.club_id = '';
  filters.status = '';
  filters.keyword = '';
  fetchList();
};

const handleSelection = (rows) => {
  selectedRows.value = rows;
};

const viewDetail = (row) => {
  current.value = row;
  detailVisible.value = true;
};

const review = (row, type) => {
  reviewTarget.value = row;
  reviewType.value = type;
  reviewForm.review_note = '';
  reviewVisible.value = true;
};

const confirmReview = async () => {
  try {
    await request.post(`/enrollments/${reviewTarget.value.id}/review`, {
      status: reviewType.value,
      review_note: reviewForm.review_note
    });
    ElMessage.success(reviewType.value === 'approved' ? '审核通过成功' : '已拒绝');
    reviewVisible.value = false;
    detailVisible.value = false;
    fetchList();
  } catch (e) {}
};

const batchReview = async (type) => {
  const targets = selectedRows.value.filter(r => r.status === 'pending');
  if (!targets.length) {
    ElMessage.warning('请选择待审核的记录');
    return;
  }
  try {
    await ElMessageBox.confirm(`确定要${type === 'approved' ? '通过' : '拒绝'} ${targets.length} 条报名记录吗？`, '批量审核确认', { type: 'warning' });
  } catch (e) {
    return;
  }
  let success = 0, fail = 0;
  for (const t of targets) {
    try {
      await request.post(`/enrollments/${t.id}/review`, { status: type, review_note: '批量审核' });
      success++;
    } catch (e) {
      fail++;
    }
  }
  ElMessage.success(`处理完成：成功${success}条，失败${fail}条`);
  fetchList();
};

onMounted(() => {
  fetchClubs();
  fetchList();
});
</script>

<style scoped>
.card-head { display: flex; align-items: center; gap: 8px; }
.card-title { font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.stat-tags { display: flex; gap: 8px; }
.filter-bar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; padding: 8px 0; }
.batch-actions {
  margin-top: 16px;
  padding: 12px 16px;
  background: #f0f9ff;
  border: 1px solid #e6f7ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.detail-content :deep(.el-descriptions__label) { font-weight: 500; }
</style>
