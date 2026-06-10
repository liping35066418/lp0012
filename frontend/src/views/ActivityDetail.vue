<template>
  <div v-loading="loading" class="page-container" v-if="activity">
    <el-page-header @back="$router.back()" class="mb-20">
      <template #content>活动详情</template>
    </el-page-header>

    <el-row :gutter="24">
      <el-col :span="16">
        <el-card class="detail-card">
          <div class="poster-wrap">
            <el-image :src="activity.poster" fit="cover" class="poster-img" />
          </div>
          <h1 class="act-title">{{ activity.title }}</h1>
          <div class="act-tags mb-20">
            <el-tag type="primary"><el-icon><OfficeBuilding /></el-icon> {{ activity.club_name }}</el-tag>
            <el-tag type="success"><el-icon><Location /></el-icon> {{ activity.location }}</el-tag>
            <el-tag type="warning"><el-icon><Calendar /></el-icon> {{ activity.start_time }} - {{ activity.end_time }}</el-tag>
            <el-tag v-if="activity.max_participants" :type="activity.current_participants >= activity.max_participants ? 'danger' : 'info'">
              <el-icon><User /></el-icon> {{ activity.current_participants }}/{{ activity.max_participants }} 人
            </el-tag>
          </div>
          <div class="section-block">
            <h3 class="s-title">活动介绍</h3>
            <div class="s-content">{{ activity.description || '暂无活动介绍' }}</div>
          </div>
          <div class="section-block mt-20">
            <h3 class="s-title">已报名名单（{{ activity.enrollments?.length || 0 }}）</h3>
            <div v-if="activity.enrollments?.length" class="enrollment-list">
              <div v-for="e in activity.enrollments" :key="e.id" class="e-item">
                <el-avatar :size="36" :src="e.avatar">{{ e.real_name?.charAt(0) }}</el-avatar>
                <span class="e-name">{{ e.real_name }}</span>
                <span class="e-time">{{ e.enrolled_at }}</span>
              </div>
            </div>
            <el-empty v-else description="暂无报名" :image-size="60" />
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="side-card sticky">
          <div class="enroll-box">
            <div class="eb-title">活动报名</div>
            <div v-if="activity.max_participants > 0" class="progress-wrap">
              <el-progress :percentage="enrollPct" :stroke-width="10" :status="enrollStatus" />
              <div class="pct-text">已报名 {{ activity.current_participants }} / 限 {{ activity.max_participants }} 人</div>
            </div>
            <div class="eb-tips">
              <p><el-icon><CircleCheckFilled /></el-icon> 报名后可查看活动详情</p>
              <p><el-icon><CircleCheckFilled /></el-icon> 凭报名信息现场签到</p>
            </div>
            <el-button type="primary" size="large" style="width: 100%; height: 48px; border-radius: 10px; margin-top: 8px;"
              :loading="enrolling"
              :disabled="activity.max_participants > 0 && activity.current_participants >= activity.max_participants || alreadyEnrolled"
              @click="handleEnroll">
              <template v-if="alreadyEnrolled">✓ 已报名</template>
              <template v-else-if="activity.max_participants > 0 && activity.current_participants >= activity.max_participants">名额已满</template>
              <template v-else>立即报名参与</template>
            </el-button>
          </div>
        </el-card>

        <el-card class="side-card mt-20">
          <template #header>
            <div style="display: flex; align-items: center; gap: 8px; font-weight: 600;">
              <el-icon><OfficeBuilding /></el-icon>主办方信息
            </div>
          </template>
          <div class="club-info">
            <el-image :src="activity.club_logo" fit="cover" class="club-logo" />
            <div>
              <h4>{{ activity.club_name }}</h4>
              <p>期待你的参与！</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const store = useUserStore();
const loading = ref(false);
const enrolling = ref(false);
const activity = ref(null);
const alreadyEnrolled = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    const res = await request.get(`/activities/${route.params.id}`);
    activity.value = res.data;
    if (store.isLogin && activity.value.enrollments) {
      alreadyEnrolled.value = activity.value.enrollments.some(e => e.user_id === store.user.id);
    }
  } finally {
    loading.value = false;
  }
});

const enrollPct = computed(() => activity.value?.max_participants ? Math.round(activity.value.current_participants / activity.value.max_participants * 100) : 0);
const enrollStatus = computed(() => enrollPct.value > 80 ? 'exception' : enrollPct.value > 50 ? 'warning' : 'success');

const handleEnroll = async () => {
  if (!store.isLogin) {
    try {
      await ElMessageBox.confirm('请先登录再报名活动，是否跳转登录页？', '提示', { type: 'warning' });
      router.push({ path: '/login', query: { redirect: route.fullPath } });
    } catch (e) {}
    return;
  }
  if (activity.value.max_participants > 0 && activity.value.current_participants >= activity.value.max_participants) {
    ElMessage.warning('名额已满');
    return;
  }
  enrolling.value = true;
  try {
    await request.post(`/activities/${activity.value.id}/enroll`, {
      real_name: store.user.real_name,
      phone: store.user.phone
    });
    alreadyEnrolled.value = true;
    activity.value.current_participants++;
    activity.value.enrollments.push({
      id: Date.now(),
      real_name: store.user.real_name,
      user_id: store.user.id,
      enrolled_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    });
    ElMessage.success('活动报名成功！');
  } finally {
    enrolling.value = false;
  }
};
</script>

<style scoped>
.sticky { position: sticky; top: 80px; }
.detail-card { border-radius: 14px; padding: 0; overflow: hidden; }
.poster-wrap { width: 100%; height: 340px; overflow: hidden; }
.poster-img { width: 100%; height: 100%; }
.detail-card :deep(.el-card__body) { padding: 0; }
.act-title { padding: 24px 28px 8px; font-size: 28px; font-weight: 700; }
.act-tags { padding: 0 28px; display: flex; gap: 10px; flex-wrap: wrap; }
.section-block { padding: 20px 28px; }
.s-title { font-size: 17px; font-weight: 600; margin-bottom: 12px; padding-left: 10px; border-left: 3px solid #409eff; }
.s-content { font-size: 15px; line-height: 1.8; color: #4a5568; }

.enrollment-list { display: flex; flex-direction: column; gap: 6px; max-height: 280px; overflow: auto; }
.e-item { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 8px; }
.e-item:hover { background: #f5f7fa; }
.e-name { flex: 1; font-weight: 500; }
.e-time { font-size: 12px; color: #909399; }

.side-card { border-radius: 14px; }
.enroll-box .eb-title { font-size: 20px; font-weight: 700; margin-bottom: 14px; text-align: center; }
.progress-wrap { margin-bottom: 18px; }
.pct-text { text-align: center; font-size: 13px; color: #606266; margin-top: 6px; }
.eb-tips { padding: 12px; background: #f5f9ff; border-radius: 10px; margin-bottom: 12px; }
.eb-tips p { font-size: 13px; color: #606266; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
.eb-tips p:last-child { margin-bottom: 0; }
.eb-tips .el-icon { color: #67c23a; }

.club-info { display: flex; gap: 12px; align-items: center; }
.club-logo { width: 52px; height: 52px; border-radius: 12px; overflow: hidden; }
.club-info h4 { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.club-info p { font-size: 13px; color: #909399; }
</style>
