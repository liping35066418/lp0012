<template>
  <div class="admin-members">
    <el-card>
      <template #header>
        <div class="card-head flex-between">
          <div class="card-title">
            <el-icon><UserFilled /></el-icon>
            成员名单管理
            <el-tag type="success" effect="plain" style="margin-left: 10px;">共 {{ stats.total || 0 }} 人</el-tag>
          </div>
          <div>
            <el-button type="primary" @click="openNotifyDialog" :disabled="!selectedIds.length">
              <el-icon><Bell /></el-icon>
              推送通知 ({{ selectedIds.length }})
            </el-button>
            <el-button type="success" plain @click="exportCSV">
              <el-icon><Download /></el-icon>
              导出名单
            </el-button>
          </div>
        </div>
      </template>

      <div class="filter-bar">
        <el-select v-model="filters.club_id" placeholder="按社团筛选" clearable style="width: 180px;" @change="fetchList">
          <el-option v-for="c in clubs" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-select v-model="filters.position" placeholder="按职位筛选" clearable style="width: 160px;" @change="fetchList">
          <el-option label="社长" value="president" />
          <el-option label="副社长" value="vice_president" />
          <el-option label="干事" value="officer" />
          <el-option label="普通成员" value="member" />
        </el-select>
        <el-input v-model="filters.keyword" placeholder="搜索姓名/用户名/手机号" clearable style="width: 240px;" @keyup.enter="fetchList">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" @click="fetchList">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
        <el-button type="success" plain @click="fetchList" :icon="Refresh">实时刷新</el-button>
      </div>

      <div class="pos-stats" v-if="Object.keys(stats.byPosition || {}).length">
        <el-tag v-for="(v, k) in stats.byPosition" :key="k" style="margin-right: 8px;">
          {{ positionLabel(k) }}: {{ v }}人
        </el-tag>
      </div>

      <el-table :data="list" v-loading="loading" stripe style="width: 100%; margin-top: 12px;" @selection-change="handleSelection">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="成员信息" width="220">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 10px;">
              <el-avatar :size="36" :src="row.avatar">{{ row.real_name?.charAt(0) }}</el-avatar>
              <div>
                <div style="font-weight: 600;">{{ row.real_name }}</div>
                <div style="font-size: 12px; color: #909399;">@{{ row.username }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="club_name" label="所属社团" width="130">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain">{{ row.club_name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="职位" width="110">
          <template #default="{ row }">
            <el-select v-model="row.position" size="small" @change="updatePosition(row)" style="width: 100px;">
              <el-option label="社长" value="president" />
              <el-option label="副社长" value="vice_president" />
              <el-option label="干事" value="officer" />
              <el-option label="普通成员" value="member" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="email" label="邮箱" width="170" show-overflow-tooltip />
        <el-table-column prop="join_date" label="加入时间" width="170" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="notifyOne(row)">通知</el-button>
            <el-button size="small" type="danger" link @click="removeMember(row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="notifyVisible" title="推送通知" width="560px">
      <el-form :model="notifyForm" label-width="80px">
        <el-form-item label="接收对象">
          <el-tag v-if="notifyForm.targetUsers.length" type="primary" effect="plain">
            已选择 {{ notifyForm.targetUsers.length }} 人
          </el-tag>
          <span v-else style="color: #909399;">全体成员</span>
        </el-form-item>
        <el-form-item label="推送范围" v-if="store.isAdmin">
          <el-radio-group v-model="notifyForm.scope">
            <el-radio value="selected">已选成员</el-radio>
            <el-radio value="club">指定社团</el-radio>
            <el-radio value="all">全部用户</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="选择社团" v-if="store.isAdmin && notifyForm.scope === 'club'">
          <el-select v-model="notifyForm.club_id" placeholder="选择社团" style="width: 100%;">
            <el-option v-for="c in clubs" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="通知标题" required>
          <el-input v-model="notifyForm.title" placeholder="请输入通知标题" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="通知内容" required>
          <el-input v-model="notifyForm.content" type="textarea" :rows="5" placeholder="请输入通知内容" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="notifyVisible = false">取消</el-button>
        <el-button type="primary" :loading="notifyLoading" @click="sendNotify">确认推送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';
import { useUserStore } from '@/stores/user';

const store = useUserStore();
const loading = ref(false);
const notifyLoading = ref(false);
const list = ref([]);
const clubs = ref([]);
const stats = ref({});
const filters = reactive({ club_id: '', position: '', keyword: '' });
const selectedIds = ref([]);
const selectedRows = ref([]);
const notifyVisible = ref(false);
const Refresh = 'Refresh';
const notifyForm = reactive({
  title: '',
  content: '',
  targetUsers: [],
  scope: 'selected',
  club_id: ''
});

const positionLabel = (p) => {
  const map = { president: '社长', vice_president: '副社长', officer: '干事', member: '普通成员' };
  return map[p] || p;
};

const fetchClubs = async () => {
  const res = await request.get('/clubs');
  clubs.value = res.data || [];
};

const fetchList = async () => {
  loading.value = true;
  try {
    const params = {};
    if (filters.club_id) params.club_id = filters.club_id;
    if (filters.position) params.position = filters.position;
    if (filters.keyword) params.keyword = filters.keyword;
    const res = await request.get('/members', { params });
    list.value = res.data?.list || [];
    stats.value = res.data?.stats || {};
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filters.club_id = '';
  filters.position = '';
  filters.keyword = '';
  fetchList();
};

const handleSelection = (rows) => {
  selectedRows.value = rows;
  selectedIds.value = rows.map(r => r.user_id);
};

const updatePosition = async (row) => {
  try {
    await request.put(`/members/${row.id}`, { position: row.position });
    ElMessage.success('职位更新成功');
  } catch (e) {}
};

const removeMember = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要将「${row.real_name}」从「${row.club_name}」移除吗？`, '移除确认', { type: 'warning' });
    await request.delete(`/members/${row.id}`);
    ElMessage.success('移除成功');
    fetchList();
  } catch (e) {}
};

const openNotifyDialog = () => {
  notifyForm.targetUsers = selectedIds.value;
  notifyForm.title = '';
  notifyForm.content = '';
  notifyForm.scope = selectedIds.value.length ? 'selected' : 'all';
  notifyVisible.value = true;
};

const notifyOne = (row) => {
  notifyForm.targetUsers = [row.user_id];
  notifyForm.title = '';
  notifyForm.content = '';
  notifyForm.scope = 'selected';
  notifyVisible.value = true;
};

const sendNotify = async () => {
  if (!notifyForm.title || !notifyForm.content) {
    ElMessage.warning('请填写标题和内容');
    return;
  }
  notifyLoading.value = true;
  try {
    const payload = {
      title: notifyForm.title,
      content: notifyForm.content,
      type: 'system'
    };
    if (notifyForm.scope === 'club') {
      if (!notifyForm.club_id) {
        ElMessage.warning('请选择社团');
        return;
      }
      payload.club_id = notifyForm.club_id;
    } else if (notifyForm.scope === 'selected') {
      if (!notifyForm.targetUsers.length) {
        ElMessage.warning('请选择接收成员');
        return;
      }
      payload.user_ids = notifyForm.targetUsers;
    }
    await request.post('/notifications/push', payload);
    ElMessage.success('通知推送成功');
    notifyVisible.value = false;
  } finally {
    notifyLoading.value = false;
  }
};

const exportCSV = async () => {
  try {
    const params = {};
    if (filters.club_id) params.club_id = filters.club_id;
    const res = await request.get('/members/export', { params, responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members.csv';
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success('导出成功');
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
.pos-stats { padding: 10px 0; }
</style>
