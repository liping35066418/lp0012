<template>
  <div class="admin-news">
    <el-card>
      <template #header>
        <div class="card-head flex-between">
          <div class="card-title">
            <el-icon><Promotion /></el-icon>
            动态管理
          </div>
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Edit /></el-icon>
            发布动态
          </el-button>
        </div>
      </template>

      <div class="filter-bar">
        <el-select v-model="filters.club_id" placeholder="按社团筛选" clearable style="width: 180px;" @change="fetchList">
          <el-option v-for="c in clubs" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-select v-model="filters.status" placeholder="按状态筛选" clearable style="width: 140px;" @change="fetchList">
          <el-option label="待审核" :value="0" />
          <el-option label="已发布" :value="1" />
          <el-option label="已拒绝" :value="2" />
        </el-select>
        <el-input v-model="filters.keyword" placeholder="搜索标题" clearable style="width: 240px;" @keyup.enter="fetchList">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" @click="fetchList">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table :data="list" v-loading="loading" stripe style="width: 100%; margin-top: 16px;">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="动态内容" min-width="320">
          <template #default="{ row }">
            <div style="display: flex; gap: 12px;">
              <el-image v-if="row.cover_image" :src="row.cover_image" fit="cover" style="width: 100px; height: 70px; border-radius: 6px; flex-shrink: 0;" />
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; margin-bottom: 6px;">{{ row.title }}</div>
                <div style="font-size: 12px; color: #909399; margin-bottom: 4px;">
                  <el-tag v-if="row.club_name" type="primary" effect="plain" size="small">{{ row.club_name }}</el-tag>
                  <span style="margin-left: 8px;">作者：{{ row.author_name || '未知' }}</span>
                  <span style="margin-left: 8px;">{{ row.created_at }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'warning'" effect="dark" size="small">
              {{ row.status === 1 ? '已发布' : row.status === 2 ? '已拒绝' : '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="row?.reviewed_at" label="审核时间" width="170">
          <template #default="{ row }">{{ row.reviewed_at || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewDetail(row)">查看</el-button>
            <template v-if="row.status === 0 && store.isAdmin">
              <el-button size="small" type="success" link @click="review(row, 1)">通过</el-button>
              <el-button size="small" type="danger" link @click="review(row, 2)">拒绝</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="total > pageSize" class="pagination-wrap mt-20">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="prev, pager, next, total"
          background
          @current-change="fetchList"
        />
      </div>
    </el-card>

    <el-dialog v-model="newsDialogVisible" :title="editingId ? '编辑动态' : '发布动态'" width="680px">
      <el-form :model="newsForm" :rules="newsRules" ref="newsFormRef" label-width="90px">
        <el-form-item label="所属社团" prop="club_id">
          <el-select v-model="newsForm.club_id" placeholder="选择社团（选填）" clearable style="width: 100%;">
            <el-option v-for="c in clubs" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="动态标题" prop="title">
          <el-input v-model="newsForm.title" placeholder="请输入动态标题" maxlength="80" show-word-limit />
        </el-form-item>
        <el-form-item label="封面图片" prop="cover_image">
          <el-input v-model="newsForm.cover_image" placeholder="请输入封面图片URL（选填）" />
        </el-form-item>
        <el-form-item label="动态内容" prop="content">
          <el-input v-model="newsForm.content" type="textarea" :rows="10" placeholder="请输入动态详细内容" maxlength="3000" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="newsDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitNews">
          {{ editingId ? '保存' : (store.isAdmin ? '发布' : '提交审核') }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="动态详情" width="720px">
      <div v-if="current" class="news-detail">
        <h2 class="detail-title">{{ current.title }}</h2>
        <div class="detail-meta">
          <el-tag v-if="current.club_name" type="primary" effect="plain">{{ current.club_name }}</el-tag>
          <span>作者：{{ current.author_name }}</span>
          <span>{{ current.created_at }}</span>
          <el-tag :type="current.status === 1 ? 'success' : current.status === 2 ? 'danger' : 'warning'" size="small">
            {{ current.status === 1 ? '已发布' : current.status === 2 ? '已拒绝' : '待审核' }}
          </el-tag>
        </div>
        <el-image v-if="current.cover_image" :src="current.cover_image" fit="cover" class="detail-cover" />
        <div class="detail-content">{{ current.content }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';
import { useUserStore } from '@/stores/user';

const store = useUserStore();
const loading = ref(false);
const submitLoading = ref(false);
const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const clubs = ref([]);
const filters = reactive({ club_id: '', status: '', keyword: '' });

const newsDialogVisible = ref(false);
const editingId = ref(null);
const newsFormRef = ref();
const newsForm = reactive({
  club_id: '',
  title: '',
  content: '',
  cover_image: ''
});
const newsRules = {
  title: [{ required: true, message: '请输入动态标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入动态内容', trigger: 'blur' }]
};

const detailVisible = ref(false);
const current = ref(null);

const fetchClubs = async () => {
  const res = await request.get('/clubs');
  clubs.value = res.data || [];
};

const fetchList = async () => {
  loading.value = true;
  try {
    const params = { page: page.value, pageSize: pageSize.value };
    if (filters.club_id) params.club_id = filters.club_id;
    if (filters.status !== '') params.status = filters.status;
    if (filters.keyword) params.keyword = filters.keyword;
    const res = await request.get('/news', { params });
    list.value = res.data?.list || [];
    total.value = res.data?.total || 0;
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.club_id = '';
  filters.status = '';
  filters.keyword = '';
  page.value = 1;
  fetchList();
};

const openCreateDialog = () => {
  editingId.value = null;
  Object.assign(newsForm, { club_id: '', title: '', content: '', cover_image: '' });
  newsDialogVisible.value = true;
};

const submitNews = async () => {
  const valid = await newsFormRef.value.validate().catch(() => false);
  if (!valid) return;
  submitLoading.value = true;
  try {
    const payload = { ...newsForm };
    if (!payload.club_id) delete payload.club_id;
    await request.post('/news', payload);
    ElMessage.success(store.isAdmin ? '发布成功' : '提交成功，等待审核');
    newsDialogVisible.value = false;
    fetchList();
  } finally {
    submitLoading.value = false;
  }
};

const viewDetail = (row) => {
  current.value = row;
  detailVisible.value = true;
};

const review = async (row, status) => {
  try {
    await ElMessageBox.confirm(`确定要${status === 1 ? '通过并发布' : '拒绝'}该动态吗？`, '审核确认', { type: 'warning' });
    await request.post(`/news/${row.id}/review`, { status });
    ElMessage.success('审核完成');
    fetchList();
  } catch (e) {}
};

onMounted(() => {
  fetchClubs();
  fetchList();
});
</script>

<style scoped>
.card-head { display: flex; align-items: center; gap: 8px; }
.card-title { font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.filter-bar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; padding: 8px 0; }
.pagination-wrap { display: flex; justify-content: center; }

.news-detail .detail-title { font-size: 24px; font-weight: 700; margin-bottom: 14px; }
.news-detail .detail-meta {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  padding-bottom: 14px; border-bottom: 1px solid #ebeef5; margin-bottom: 16px;
  font-size: 13px; color: #606266;
}
.news-detail .detail-cover { width: 100%; max-height: 300px; border-radius: 10px; margin-bottom: 16px; }
.news-detail .detail-content { font-size: 15px; line-height: 1.9; color: #2c3e50; white-space: pre-wrap; }
</style>
