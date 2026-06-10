<template>
  <div class="page-container">
    <div class="page-header flex-between">
      <div>
        <h1>活动中心</h1>
        <p>丰富多彩的校园活动等你来参与</p>
      </div>
      <el-input v-model="keyword" placeholder="搜索活动..." style="width: 280px;" clearable :prefix-icon="Search" size="large" />
    </div>

    <div v-loading="loading" class="activity-grid">
      <el-card v-for="a in filteredActivities" :key="a.id" class="activity-card card-hover" @click="goDetail(a.id)">
        <div class="act-cover" :style="{ backgroundImage: `url(${a.poster})` }">
          <div class="act-club-tag">{{ a.club_name }}</div>
          <div v-if="a.max_participants > 0" class="act-progress">
            <el-progress :percentage="Math.round(a.current_participants / a.max_participants * 100)" :stroke-width="4" :show-text="false" color="#fff" />
            <span>{{ a.current_participants }}/{{ a.max_participants }}</span>
          </div>
        </div>
        <div class="act-body">
          <h3 class="act-title">{{ a.title }}</h3>
          <div class="act-info">
            <div class="info-row"><el-icon><Calendar /></el-icon> {{ a.start_time }} ~ {{ a.end_time }}</div>
            <div class="info-row"><el-icon><Location /></el-icon> {{ a.location }}</div>
          </div>
          <div class="act-footer">
            <el-tag :type="a.max_participants > 0 && a.current_participants >= a.max_participants ? 'danger' : 'success'" size="small">
              {{ a.max_participants > 0 && a.current_participants >= a.max_participants ? '名额已满' : '报名中' }}
            </el-tag>
            <el-button type="primary" size="small" link>查看详情 →</el-button>
          </div>
        </div>
      </el-card>
    </div>
    <el-empty v-if="!loading && filteredActivities.length === 0" description="暂无活动" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Calendar, Location } from '@element-plus/icons-vue';
import request from '@/utils/request';

const router = useRouter();
const loading = ref(false);
const activities = ref([]);
const keyword = ref('');

onMounted(async () => {
  loading.value = true;
  try {
    const res = await request.get('/activities');
    activities.value = res.data || [];
  } finally {
    loading.value = false;
  }
});

const filteredActivities = computed(() => {
  if (!keyword.value) return activities.value;
  const kw = keyword.value.toLowerCase();
  return activities.value.filter(a => a.title.toLowerCase().includes(kw) || a.description.toLowerCase().includes(kw) || a.club_name.toLowerCase().includes(kw));
});

const goDetail = (id) => router.push(`/activity/${id}`);
</script>

<style scoped>
.page-header { padding: 20px 0 24px; }
.page-header h1 { font-size: 30px; font-weight: 700; margin-bottom: 6px; background: linear-gradient(135deg, #409eff, #f5576c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.page-header p { color: #909399; }

.activity-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}
.activity-card { padding: 0; overflow: hidden; }
.act-cover {
  height: 180px;
  background-size: cover;
  background-position: center;
  position: relative;
}
.act-club-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 12px;
  background: rgba(64, 158, 255, 0.9);
  color: #fff;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}
.act-progress {
  position: absolute;
  bottom: 12px;
  right: 12px;
  padding: 4px 10px;
  background: rgba(0,0,0,0.5);
  color: #fff;
  border-radius: 20px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(4px);
}
.act-progress .el-progress { width: 80px; }

.act-body { padding: 18px; }
.act-title { font-size: 17px; font-weight: 600; margin-bottom: 10px; line-height: 1.4; min-height: 48px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.act-info { margin-bottom: 14px; }
.info-row { font-size: 13px; color: #606266; display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
.act-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #f0f0f0; }
</style>
