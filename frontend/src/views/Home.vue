<template>
  <div class="home-page">
    <div class="page-container">
      <BannerCarousel :banners="banners" @click="handleBannerClick" />

      <section class="stats-section">
        <div class="stat-card" v-for="(s, i) in stats" :key="i">
          <div class="stat-icon" :style="{ background: s.bg }">
            <el-icon :size="28"><component :is="s.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-num">{{ s.num }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </section>

      <section class="section-wrap">
        <div class="section-head">
          <h2 class="section-title">
            <span class="title-bar"></span>
            特色社团
          </h2>
          <el-button type="primary" link @click="$router.push('/clubs')">
            查看全部 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="club-grid">
          <el-card v-for="club in clubs.slice(0, 4)" :key="club.id" class="club-card card-hover" @click="goClub(club.id)">
            <div class="club-cover" :style="{ backgroundImage: `url(${club.banner || club.logo})` }" />
            <div class="club-body">
              <div class="club-logo">
                <el-image :src="club.logo" fit="cover" class="logo-img" />
              </div>
              <div class="club-info">
                <h3 class="club-name">{{ club.name }}</h3>
                <p class="club-desc">{{ club.description }}</p>
                <div class="club-meta">
                  <el-tag :type="getCapacityType(club)" size="small">
                    成员 {{ club.current_members }}/{{ club.max_members }}
                  </el-tag>
                  <span class="president">社长：{{ club.president }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </section>

      <section class="section-wrap two-col">
        <div class="col">
          <div class="section-head">
            <h2 class="section-title"><span class="title-icon"><Promotion /></span>校园动态</h2>
            <el-button type="primary" link @click="$router.push('/news')">更多</el-button>
          </div>
          <el-card class="news-card">
            <div v-for="n in news" :key="n.id" class="news-item" @click="$router.push(`/news/${n.id}`)">
              <el-image :src="n.cover_image" fit="cover" class="news-cover" />
              <div class="news-content">
                <h4 class="news-title">{{ n.title }}</h4>
                <p class="news-meta">
                  <span><el-icon><CollectionTag /></el-icon> {{ n.club_name }}</span>
                  <span>{{ n.created_at }}</span>
                </p>
              </div>
            </div>
          </el-card>
        </div>
        <div class="col">
          <div class="section-head">
            <h2 class="section-title"><span class="title-icon"><Calendar /></span>热门活动</h2>
            <el-button type="primary" link @click="$router.push('/activities')">更多</el-button>
          </div>
          <el-card class="news-card">
            <div v-for="a in activities" :key="a.id" class="news-item" @click="$router.push(`/activity/${a.id}`)">
              <div class="activity-date">
                <div class="date-day">{{ getDay(a.start_time) }}</div>
                <div class="date-month">{{ getMonth(a.start_time) }}月</div>
              </div>
              <div class="news-content">
                <h4 class="news-title">{{ a.title }}</h4>
                <p class="news-meta">
                  <span><el-icon><Location /></el-icon> {{ a.location }}</span>
                  <span>{{ a.club_name }}</span>
                </p>
              </div>
            </div>
          </el-card>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import request from '@/utils/request';
import BannerCarousel from '@/components/BannerCarousel.vue';

const router = useRouter();
const banners = ref([]);
const clubs = ref([]);
const news = ref([]);
const activities = ref([]);

const stats = computed(() => [
  { num: clubs.value.length, label: '入驻社团', icon: 'OfficeBuilding', bg: 'linear-gradient(135deg,#667eea,#764ba2)' },
  { num: clubs.value.reduce((a, c) => a + (c.current_members || 0), 0), label: '社团成员', icon: 'User', bg: 'linear-gradient(135deg,#f093fb,#f5576c)' },
  { num: activities.value.length, label: '近期活动', icon: 'Calendar', bg: 'linear-gradient(135deg,#4facfe,#00f2fe)' },
  { num: news.value.length, label: '校园动态', icon: 'Promotion', bg: 'linear-gradient(135deg,#43e97b,#38f9d7)' }
]);

onMounted(async () => {
  try {
    const [bRes, cRes, nRes, aRes] = await Promise.all([
      request.get('/clubs/banners').catch(() => ({ data: [] })),
      request.get('/clubs').catch(() => ({ data: [] })),
      request.get('/news?status=1&pageSize=6').catch(() => ({ data: { list: [] } })),
      request.get('/activities').catch(() => ({ data: [] }))
    ]);
    banners.value = bRes.data || [];
    clubs.value = cRes.data || [];
    news.value = nRes.data?.list || [];
    activities.value = aRes.data || [];
  } catch (e) {
    console.error('加载首页数据失败:', e);
  }
});

const goClub = (id) => router.push(`/club/${id}`);
const handleBannerClick = (link) => {
  if (link.startsWith('/')) router.push(link);
};
const getCapacityType = (c) => c.current_members / c.max_members > 0.8 ? 'danger' : c.current_members / c.max_members > 0.5 ? 'warning' : 'success';
const getDay = (d) => new Date(d).getDate();
const getMonth = (d) => new Date(d).getMonth() + 1;
</script>

<style scoped>
.home-page { padding-top: 20px; }
.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin: 32px 0;
}
.stat-card {
  background: #fff;
  border-radius: 14px;
  padding: 22px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s;
}
.stat-card:hover { transform: translateY(-3px); }
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-num { font-size: 28px; font-weight: 700; color: #303133; }
.stat-label { font-size: 13px; color: #909399; margin-top: 2px; }

.section-wrap { margin-bottom: 40px; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-title {
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}
.section-title .title-icon {
  display: inline-flex;
  color: #409eff;
}
.section-title::before {
  content: '';
  width: 4px;
  height: 22px;
  background: linear-gradient(180deg, #409eff, #67c23a);
  border-radius: 2px;
  display: inline-block;
}
.club-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
.club-card { padding: 0; overflow: hidden; }
.club-cover { height: 160px; background-size: cover; background-position: center; }
.club-body {
  padding: 16px;
  display: flex;
  gap: 14px;
  position: relative;
  margin-top: -30px;
}
.club-logo {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  border: 3px solid #fff;
}
.logo-img { width: 100%; height: 100%; }
.club-info { flex: 1; min-width: 0; }
.club-name { font-size: 17px; font-weight: 600; margin-bottom: 6px; }
.club-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 8px;
}
.club-meta { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #909399; }

.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.news-card { padding: 8px; }
.news-item {
  display: flex;
  gap: 14px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}
.news-item:hover { background: #f5f7fa; }
.news-cover { width: 110px; height: 75px; border-radius: 8px; flex-shrink: 0; }
.activity-date {
  width: 55px;
  height: 65px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  border-radius: 10px;
  color: #fff;
  text-align: center;
  padding-top: 6px;
  flex-shrink: 0;
}
.date-day { font-size: 24px; font-weight: 700; line-height: 1; }
.date-month { font-size: 12px; margin-top: 4px; opacity: 0.9; }
.news-content { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
.news-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.news-meta { font-size: 12px; color: #909399; display: flex; gap: 14px; align-items: center; }
.news-meta span { display: inline-flex; align-items: center; gap: 3px; }
</style>
