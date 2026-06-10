<template>
  <div class="dashboard-page">
    <el-row :gutter="16">
      <el-col :span="6" v-for="(c, i) in cards" :key="i">
        <el-card class="stat-card card-hover" shadow="hover">
          <div class="stat-inner" :style="{ borderColor: c.color }">
            <div class="stat-icon" :style="{ background: c.bg }">
              <el-icon :size="24"><component :is="c.icon" /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-num">{{ c.num }}</div>
              <div class="stat-label">{{ c.label }}</div>
              <div class="stat-trend" v-if="c.trend">
                <el-icon :size="12" color="#67c23a"><Top /></el-icon>
                <span>{{ c.trend }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-20">
      <el-col :span="14">
        <el-card>
          <template #header>
            <div class="card-head">
              <el-icon><TrendCharts /></el-icon>
              社团成员统计
            </div>
          </template>
          <div class="club-stat-list">
            <div v-for="c in clubStats" :key="c.id" class="club-stat-item">
              <div class="cs-head">
                <el-image :src="c.logo" fit="cover" class="cs-logo" />
                <div class="cs-info">
                  <h4>{{ c.name }}</h4>
                  <span>社长：{{ c.president }}</span>
                </div>
                <div class="cs-num">{{ c.current_members }}/{{ c.max_members }}</div>
              </div>
              <el-progress
                :percentage="Math.round(c.current_members / c.max_members * 100)"
                :stroke-width="8"
                :status="c.current_members / c.max_members > 0.8 ? 'exception' : c.current_members / c.max_members > 0.5 ? 'warning' : 'success'"
              />
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card class="mb-16">
          <template #header>
            <div class="card-head">
              <el-icon><Warning /></el-icon>
              待处理事项
            </div>
          </template>
          <div class="todo-list">
            <div v-if="pendingStats.pending > 0" class="todo-item">
              <el-badge :value="pendingStats.pending" type="warning" class="item">
                <div class="todo-content" @click="$router.push('/admin/enrollments')">
                  <el-icon color="#e6a23c"><Document /></el-icon>
                  <div>
                    <div class="todo-title">待审核报名</div>
                    <div class="todo-desc">有 {{ pendingStats.pending }} 份报名申请待处理</div>
                  </div>
                  <el-button type="primary" link>去处理 →</el-button>
                </div>
              </el-badge>
            </div>
            <div v-if="pendingNews > 0" class="todo-item">
              <el-badge :value="pendingNews" type="danger" class="item">
                <div class="todo-content" @click="$router.push('/admin/news')">
                  <el-icon color="#f56c6c"><Promotion /></el-icon>
                  <div>
                    <div class="todo-title">待审核动态</div>
                    <div class="todo-desc">有 {{ pendingNews }} 篇动态待审核</div>
                  </div>
                  <el-button type="primary" link>去审核 →</el-button>
                </div>
              </el-badge>
            </div>
            <div v-if="pendingStats.pending === 0 && pendingNews === 0" class="empty-todo">
              <el-empty description="暂无待处理事项" :image-size="80" />
            </div>
          </div>
        </el-card>

        <el-card>
          <template #header>
            <div class="card-head">
              <el-icon><DataLine /></el-icon>
              报名审核概览
            </div>
          </template>
          <div class="overview-grid">
            <div class="ov-item">
              <div class="ov-num" style="color: #409eff;">{{ pendingStats.total || 0 }}</div>
              <div class="ov-label">总报名数</div>
            </div>
            <div class="ov-item">
              <div class="ov-num" style="color: #e6a23c;">{{ pendingStats.pending || 0 }}</div>
              <div class="ov-label">待审核</div>
            </div>
            <div class="ov-item">
              <div class="ov-num" style="color: #67c23a;">{{ pendingStats.approved || 0 }}</div>
              <div class="ov-label">已通过</div>
            </div>
            <div class="ov-item">
              <div class="ov-num" style="color: #f56c6c;">{{ pendingStats.rejected || 0 }}</div>
              <div class="ov-label">已拒绝</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import request from '@/utils/request';

const clubStats = ref([]);
const pendingStats = ref({});
const pendingNews = ref(0);
const membersTotal = ref(0);
const activitiesTotal = ref(0);

const fetchData = async () => {
  const [cRes, eRes, nRes, aRes, mRes] = await Promise.all([
    request.get('/clubs'),
    request.get('/enrollments'),
    request.get('/news?status=0&pageSize=1'),
    request.get('/activities'),
    request.get('/members')
  ]).catch(() => []);
  clubStats.value = cRes?.data || [];
  pendingStats.value = eRes?.data?.stats || {};
  pendingNews.value = nRes?.data?.total || 0;
  activitiesTotal.value = aRes?.data?.length || 0;
  membersTotal.value = mRes?.data?.stats?.total || 0;
};

const cards = computed(() => [
  { num: clubStats.value.length, label: '入驻社团', icon: 'OfficeBuilding', color: '#409eff', bg: 'linear-gradient(135deg,#667eea,#764ba2)', trend: '' },
  { num: membersTotal.value, label: '社团成员', icon: 'User', color: '#67c23a', bg: 'linear-gradient(135deg,#43e97b,#38f9d7)', trend: '' },
  { num: pendingStats.value.total || 0, label: '招新报名', icon: 'EditPen', color: '#e6a23c', bg: 'linear-gradient(135deg,#f093fb,#f5576c)', trend: '' },
  { num: activitiesTotal.value, label: '开展活动', icon: 'Calendar', color: '#f56c6c', bg: 'linear-gradient(135deg,#4facfe,#00f2fe)', trend: '' }
]);

onMounted(fetchData);
</script>

<style scoped>
.stat-card { border-radius: 12px; }
.stat-card :deep(.el-card__body) { padding: 18px; }
.stat-inner {
  display: flex;
  align-items: center;
  gap: 14px;
  border-left: 4px solid;
  padding-left: 12px;
}
.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-content { flex: 1; }
.stat-num { font-size: 26px; font-weight: 700; color: #303133; }
.stat-label { font-size: 13px; color: #909399; margin-top: 2px; }
.stat-trend { font-size: 12px; color: #67c23a; margin-top: 4px; display: inline-flex; align-items: center; gap: 2px; }

.card-head { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.mb-16 { margin-bottom: 16px; }

.club-stat-list { display: flex; flex-direction: column; gap: 18px; max-height: 420px; overflow: auto; }
.club-stat-item { padding: 4px; }
.cs-head { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.cs-logo { width: 40px; height: 40px; border-radius: 8px; flex-shrink: 0; }
.cs-info { flex: 1; }
.cs-info h4 { font-size: 15px; font-weight: 600; margin-bottom: 2px; }
.cs-info span { font-size: 12px; color: #909399; }
.cs-num { font-size: 15px; font-weight: 600; color: #409eff; }

.todo-list { display: flex; flex-direction: column; gap: 10px; }
.todo-item {
  border: 1px solid #ebeef5;
  border-radius: 10px;
  overflow: hidden;
}
.todo-item .item { width: 100%; }
.todo-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  cursor: pointer;
  transition: background 0.2s;
}
.todo-content:hover { background: #f5f9ff; }
.todo-title { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
.todo-desc { font-size: 12px; color: #909399; }
.empty-todo { padding: 10px 0; }

.overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ov-item { padding: 14px; background: #f5f7fa; border-radius: 10px; text-align: center; }
.ov-num { font-size: 24px; font-weight: 700; }
.ov-label { font-size: 12px; color: #909399; margin-top: 4px; }
</style>
