<template>
  <div v-loading="loading" class="club-detail-page" v-if="club">
    <div class="club-banner" :style="{ backgroundImage: `url(${club.banner || club.logo})` }">
      <div class="banner-mask">
        <div class="page-container banner-content">
          <div class="club-logo-wrap">
            <el-image :src="club.logo" fit="cover" class="club-logo" />
          </div>
          <div class="club-main-info">
            <h1 class="club-name">{{ club.name }}</h1>
            <div class="club-tags">
              <el-tag type="primary" effect="dark" round>社长：{{ club.president }}</el-tag>
              <el-tag type="success" effect="dark" round>联系电话：{{ club.contact_phone }}</el-tag>
              <el-tag :type="getCapacityType(club)" effect="dark" round>成员 {{ club.current_members }}/{{ club.max_members }}</el-tag>
            </div>
            <div class="club-actions">
              <el-button type="primary" size="large" round @click="goEnroll" :disabled="club.current_members >= club.max_members">
                {{ club.current_members >= club.max_members ? '名额已满' : '立即报名加入' }}
              </el-button>
              <el-button size="large" round @click="$router.back()">
                <el-icon><ArrowLeft /></el-icon>返回列表
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-container">
      <el-row :gutter="24">
        <el-col :span="16">
          <el-card class="section-card">
            <template #header>
              <div class="card-head"><el-icon><Reading /></el-icon>社团简介</div>
            </template>
            <div class="desc-text">{{ club.description }}</div>
          </el-card>

          <el-card class="section-card mt-20">
            <template #header>
              <div class="card-head flex-between">
                <span><el-icon><Promotion /></el-icon>社团动态</span>
                <el-button type="primary" link size="small" @click="$router.push('/news')">更多</el-button>
              </div>
            </template>
            <div v-if="club.news?.length" class="news-list">
              <div v-for="n in club.news" :key="n.id" class="news-item" @click="$router.push(`/news/${n.id}`)">
                <el-image :src="n.cover_image" fit="cover" class="news-cover" />
                <div class="news-body">
                  <h4 class="n-title">{{ n.title }}</h4>
                  <div class="n-meta">{{ n.created_at }}</div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无动态" :image-size="80" />
          </el-card>

          <el-card class="section-card mt-20">
            <template #header>
              <div class="card-head flex-between">
                <span><el-icon><Calendar /></el-icon>近期活动</span>
                <el-button type="primary" link size="small" @click="$router.push('/activities')">更多</el-button>
              </div>
            </template>
            <div v-if="club.activities?.length" class="activity-list">
              <div v-for="a in club.activities" :key="a.id" class="activity-item" @click="$router.push(`/activity/${a.id}`)">
                <div class="act-date">
                  <div class="d-day">{{ getDay(a.start_time) }}</div>
                  <div class="d-month">{{ getMonth(a.start_time) }}月</div>
                </div>
                <div class="act-body">
                  <h4>{{ a.title }}</h4>
                  <p><el-icon><Location /></el-icon> {{ a.location }} · {{ a.start_time }}</p>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无活动" :image-size="80" />
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card class="section-card">
            <template #header>
              <div class="card-head"><el-icon><Avatar /></el-icon>社团成员（{{ club.members?.length || 0 }}）</div>
            </template>
            <div v-if="club.members?.length" class="member-list">
              <div v-for="m in club.members.slice(0, 20)" :key="m.id" class="member-item">
                <el-avatar :size="40" :src="m.avatar">{{ m.real_name?.charAt(0) }}</el-avatar>
                <div class="m-info">
                  <div class="m-name">{{ m.real_name }}</div>
                  <el-tag size="small" :type="m.position === 'member' ? 'info' : 'warning'">{{ m.position }}</el-tag>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无成员" :image-size="80" />
          </el-card>

          <el-card class="section-card mt-20">
            <template #header>
              <div class="card-head"><el-icon><DataAnalysis /></el-icon>社团数据</div>
            </template>
            <el-progress :percentage="capacityPct" :stroke-width="12" :status="capacityStatus" />
            <div class="stats-grid mt-20">
              <div class="stat-block">
                <div class="num">{{ club.current_members }}</div>
                <div class="label">当前成员</div>
              </div>
              <div class="stat-block">
                <div class="num">{{ club.news?.length || 0 }}</div>
                <div class="label">发布动态</div>
              </div>
              <div class="stat-block">
                <div class="num">{{ club.activities?.length || 0 }}</div>
                <div class="label">开展活动</div>
              </div>
              <div class="stat-block">
                <div class="num">{{ club.max_members }}</div>
                <div class="label">最大容量</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import request from '@/utils/request';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const club = ref(null);

const fetchClub = async () => {
  loading.value = true;
  try {
    const res = await request.get(`/clubs/${route.params.id}`);
    club.value = res.data;
  } finally {
    loading.value = false;
  }
};

const handleVisibility = () => {
  if (!document.hidden) {
    fetchClub();
  }
};

onMounted(async () => {
  await fetchClub();
  document.addEventListener('visibilitychange', handleVisibility);
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibility);
});

const goEnroll = () => router.push(`/enroll/${club.value.id}`);
const getCapacityType = (c) => c.current_members / c.max_members > 0.8 ? 'danger' : c.current_members / c.max_members > 0.5 ? 'warning' : 'success';
const capacityPct = computed(() => club.value ? Math.round(club.value.current_members / club.value.max_members * 100) : 0);
const capacityStatus = computed(() => capacityPct.value > 80 ? 'exception' : capacityPct.value > 50 ? 'warning' : 'success');
const getDay = (d) => new Date(d).getDate();
const getMonth = (d) => new Date(d).getMonth() + 1;
</script>

<style scoped>
.club-banner {
  height: 340px;
  background-size: cover;
  background-position: center;
}
.banner-mask { width: 100%; height: 100%; background: linear-gradient(135deg, rgba(0,0,0,0.6), rgba(0,0,0,0.3)); }
.banner-content { display: flex; align-items: center; gap: 24px; padding-top: 70px; color: #fff; }
.club-logo-wrap {
  width: 120px;
  height: 120px;
  border-radius: 24px;
  overflow: hidden;
  border: 5px solid rgba(255,255,255,0.9);
  background: #fff;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  flex-shrink: 0;
}
.club-logo { width: 100%; height: 100%; }
.club-name { font-size: 32px; font-weight: 700; margin-bottom: 12px; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.club-tags { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 22px; }
.club-actions { display: flex; gap: 12px; }

.section-card { border-radius: 14px; }
.card-head { display: flex; align-items: center; gap: 8px; font-weight: 600; }

.desc-text { font-size: 15px; line-height: 1.8; color: #4a5568; }

.news-list { display: flex; flex-direction: column; gap: 6px; }
.news-item {
  display: flex;
  gap: 14px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}
.news-item:hover { background: #f5f7fa; }
.news-cover { width: 120px; height: 80px; border-radius: 8px; flex-shrink: 0; }
.n-title { font-weight: 600; margin-bottom: 4px; }
.n-meta { font-size: 12px; color: #909399; }

.activity-list { display: flex; flex-direction: column; gap: 8px; }
.activity-item {
  display: flex;
  gap: 14px;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid #ebeef5;
  cursor: pointer;
  transition: all 0.2s;
}
.activity-item:hover { border-color: #409eff; background: #f5f9ff; }
.act-date {
  width: 55px;
  text-align: center;
  background: linear-gradient(135deg, #409eff, #67c23a);
  color: #fff;
  border-radius: 10px;
  padding: 6px 0;
  flex-shrink: 0;
}
.d-day { font-size: 24px; font-weight: 700; line-height: 1; }
.d-month { font-size: 12px; margin-top: 4px; }
.act-body h4 { margin-bottom: 6px; font-weight: 600; }
.act-body p { font-size: 12px; color: #909399; display: flex; align-items: center; gap: 4px; }

.member-list { display: flex; flex-direction: column; gap: 10px; max-height: 380px; overflow: auto; }
.member-item { display: flex; gap: 10px; align-items: center; padding: 6px; border-radius: 8px; }
.member-item:hover { background: #f5f7fa; }
.m-name { font-size: 14px; font-weight: 500; margin-bottom: 3px; }

.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.stat-block { padding: 14px; background: #f5f7fa; border-radius: 10px; text-align: center; }
.stat-block .num { font-size: 24px; font-weight: 700; color: #409eff; }
.stat-block .label { font-size: 12px; color: #909399; margin-top: 4px; }
</style>
