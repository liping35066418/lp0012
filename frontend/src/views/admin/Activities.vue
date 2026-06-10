<template>
  <div class="admin-activities">
    <el-card>
      <template #header>
        <div class="card-head flex-between">
          <div class="card-title">
            <el-icon><Calendar /></el-icon>
            活动管理
          </div>
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>
            发布活动
          </el-button>
        </div>
      </template>

      <div class="filter-bar">
        <el-select v-model="filters.club_id" placeholder="按社团筛选" clearable style="width: 180px;" @change="fetchList">
          <el-option v-for="c in clubs" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-input v-model="filters.keyword" placeholder="搜索活动标题" clearable style="width: 240px;" @keyup.enter="fetchList">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" @click="fetchList">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
        <el-button type="success" plain @click="fetchList" :icon="Refresh">刷新数据</el-button>
      </div>

      <el-table :data="list" v-loading="loading" stripe style="width: 100%; margin-top: 16px;">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="活动信息" min-width="260">
          <template #default="{ row }">
            <div style="display: flex; gap: 12px;">
              <el-image :src="row.poster" fit="cover" style="width: 90px; height: 60px; border-radius: 6px; flex-shrink: 0;" />
              <div>
                <div style="font-weight: 600; margin-bottom: 4px;">{{ row.title }}</div>
                <div style="font-size: 12px; color: #909399;">
                  <el-tag type="primary" effect="plain" size="small">{{ row.club_name }}</el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="时间地点" width="220">
          <template #default="{ row }">
            <div style="font-size: 13px; line-height: 1.7;">
              <div><el-icon><Location /></el-icon> {{ row.location }}</div>
              <div style="color: #909399;"><el-icon><Watch /></el-icon> {{ row.start_time }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="报名统计" width="160">
          <template #default="{ row }">
            <div>
              <div style="margin-bottom: 4px;">
                <el-tag :type="row.max_participants > 0 && row.current_participants >= row.max_participants ? 'danger' : 'success'" size="small">
                  {{ row.current_participants }} / {{ row.max_participants || '不限' }}
                </el-tag>
              </div>
              <el-progress v-if="row.max_participants > 0"
                :percentage="Math.round(row.current_participants / row.max_participants * 100)"
                :stroke-width="6"
                :status="row.current_participants / row.max_participants > 0.8 ? 'exception' : 'success'"
                :show-text="false"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="dark" size="small">
              {{ row.status === 1 ? '进行中' : '已结束' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewEnrollments(row)">报名名单</el-button>
            <el-button size="small" type="success" link @click="editActivity(row)">编辑</el-button>
            <el-button size="small" type="warning" link @click="toggleStatus(row)">
              {{ row.status === 1 ? '结束' : '开启' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="activityDialogVisible" :title="editingId ? '编辑活动' : '发布新活动'" width="720px">
      <el-form :model="activityForm" :rules="activityRules" ref="activityFormRef" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="16">
            <el-form-item label="活动标题" prop="title">
              <el-input v-model="activityForm.title" placeholder="请输入活动标题" maxlength="50" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="所属社团" prop="club_id">
              <el-select v-model="activityForm.club_id" placeholder="选择社团" style="width: 100%;">
                <el-option v-for="c in clubs" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="活动海报" prop="poster">
          <el-input v-model="activityForm.poster" placeholder="请输入海报图片URL" />
        </el-form-item>
        <el-form-item label="活动地点" prop="location">
          <el-input v-model="activityForm.location" placeholder="请输入活动地点" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="start_time">
              <el-date-picker v-model="activityForm.start_time" type="datetime" placeholder="选择开始时间" style="width: 100%;" value-format="YYYY-MM-DD HH:mm:ss" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="end_time">
              <el-date-picker v-model="activityForm.end_time" type="datetime" placeholder="选择结束时间" style="width: 100%;" value-format="YYYY-MM-DD HH:mm:ss" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="人数上限" prop="max_participants">
          <el-input-number v-model="activityForm.max_participants" :min="0" placeholder="0为不限" style="width: 200px;" />
          <span style="margin-left: 10px; color: #909399; font-size: 13px;">0表示不限人数</span>
        </el-form-item>
        <el-form-item label="活动介绍" prop="description">
          <el-input v-model="activityForm.description" type="textarea" :rows="5" placeholder="请输入活动详细介绍" maxlength="1000" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="activityDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitActivity">{{ editingId ? '保存修改' : '发布活动' }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="enrollmentsVisible" :title="`报名名单 - ${currentActivity?.title || ''}`" width="800px">
      <div v-if="currentActivity" class="enrollment-header">
        <el-descriptions :column="3" size="small" border>
          <el-descriptions-item label="报名总数">{{ enrollmentsStats.total }}</el-descriptions-item>
          <el-descriptions-item label="已确认">{{ enrollmentsStats.confirmed }}</el-descriptions-item>
          <el-descriptions-item label="名额">{{ currentActivity.max_participants || '不限' }}</el-descriptions-item>
        </el-descriptions>
        <div class="header-actions">
          <el-button type="success" plain @click="refreshEnrollments" :icon="Refresh">实时刷新</el-button>
        </div>
      </div>
      <el-table :data="enrollmentsList" v-loading="enrollmentsLoading" stripe style="width: 100%; margin-top: 12px;" max-height="400">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="用户信息" width="200">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 10px;">
              <el-avatar :size="32">{{ row.real_name?.charAt(0) }}</el-avatar>
              <div>
                <div style="font-weight: 500;">{{ row.real_name }}</div>
                <div style="font-size: 12px; color: #909399;">@{{ row.username }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip />
        <el-table-column label="报名状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '已确认' : '已取消' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="enrolled_at" label="报名时间" width="170" />
      </el-table>
      <el-empty v-if="!enrollmentsLoading && enrollmentsList.length === 0" description="暂无报名" :image-size="80" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';

const loading = ref(false);
const submitLoading = ref(false);
const list = ref([]);
const clubs = ref([]);
const filters = reactive({ club_id: '', keyword: '' });
const Refresh = 'Refresh';

const activityDialogVisible = ref(false);
const editingId = ref(null);
const activityFormRef = ref();
const activityForm = reactive({
  club_id: '',
  title: '',
  description: '',
  poster: '',
  location: '',
  start_time: '',
  end_time: '',
  max_participants: 0
});
const activityRules = {
  club_id: [{ required: true, message: '请选择社团', trigger: 'change' }],
  title: [{ required: true, message: '请输入活动标题', trigger: 'blur' }],
  location: [{ required: true, message: '请输入活动地点', trigger: 'blur' }],
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
};

const enrollmentsVisible = ref(false);
const enrollmentsLoading = ref(false);
const enrollmentsList = ref([]);
const enrollmentsStats = ref({});
const currentActivity = ref(null);

const fetchClubs = async () => {
  const res = await request.get('/clubs');
  clubs.value = res.data || [];
};

const fetchList = async () => {
  loading.value = true;
  try {
    const params = {};
    if (filters.club_id) params.club_id = filters.club_id;
    if (filters.keyword) params.keyword = filters.keyword;
    const res = await request.get('/activities', { params });
    list.value = res.data || [];
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.club_id = '';
  filters.keyword = '';
  fetchList();
};

const openCreateDialog = () => {
  editingId.value = null;
  Object.assign(activityForm, {
    club_id: '',
    title: '',
    description: '',
    poster: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=500&fit=crop',
    location: '',
    start_time: '',
    end_time: '',
    max_participants: 0
  });
  activityDialogVisible.value = true;
};

const editActivity = (row) => {
  editingId.value = row.id;
  Object.assign(activityForm, {
    club_id: row.club_id,
    title: row.title,
    description: row.description,
    poster: row.poster,
    location: row.location,
    start_time: row.start_time,
    end_time: row.end_time,
    max_participants: row.max_participants
  });
  activityDialogVisible.value = true;
};

const submitActivity = async () => {
  const valid = await activityFormRef.value.validate().catch(() => false);
  if (!valid) return;
  submitLoading.value = true;
  try {
    if (editingId.value) {
      await request.put(`/activities/${editingId.value}`, activityForm);
      ElMessage.success('活动修改成功');
    } else {
      await request.post('/activities', activityForm);
      ElMessage.success('活动发布成功');
    }
    activityDialogVisible.value = false;
    fetchList();
  } finally {
    submitLoading.value = false;
  }
};

const toggleStatus = async (row) => {
  const newStatus = row.status === 1 ? 0 : 1;
  try {
    await request.put(`/activities/${row.id}`, { status: newStatus });
    ElMessage.success(newStatus === 1 ? '活动已开启' : '活动已结束');
    fetchList();
  } catch (e) {}
};

const viewEnrollments = async (row) => {
  currentActivity.value = row;
  enrollmentsVisible.value = true;
  await refreshEnrollments();
};

const refreshEnrollments = async () => {
  if (!currentActivity.value) return;
  enrollmentsLoading.value = true;
  try {
    const res = await request.get(`/activities/${currentActivity.value.id}/enrollments`);
    enrollmentsList.value = res.data?.list || [];
    enrollmentsStats.value = res.data?.stats || {};
  } finally {
    enrollmentsLoading.value = false;
  }
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
.enrollment-header { display: flex; justify-content: space-between; align-items: center; }
.header-actions { display: flex; gap: 8px; }
</style>
