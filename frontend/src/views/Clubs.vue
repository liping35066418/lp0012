<template>
  <div class="page-container clubs-page">
    <div class="page-header">
      <h1>社团展示</h1>
      <p>发现你的热爱，加入志同道合的伙伴</p>
    </div>
    <el-card class="filter-card">
      <el-input v-model="keyword" placeholder="搜索社团名称、描述..." size="large" clearable style="width: 360px;" :prefix-icon="Search">
        <template #append>
          <el-button :icon="Search">搜索</el-button>
        </template>
      </el-input>
    </el-card>
    <div v-loading="loading" class="club-grid">
      <el-card v-for="club in filteredClubs" :key="club.id" class="club-item card-hover" @click="goDetail(club.id)">
        <div class="cover-wrap">
          <div class="cover-img" :style="{ backgroundImage: `url(${club.banner || club.logo})` }" />
          <div class="cover-logo">
            <el-image :src="club.logo" fit="cover" />
          </div>
        </div>
        <div class="club-body">
          <h3 class="club-name">{{ club.name }}</h3>
          <p class="club-desc">{{ club.description }}</p>
          <div class="club-footer">
            <div class="meta">
              <el-tag :type="getCapacityType(club)" size="small" effect="dark">
                {{ club.current_members }} / {{ club.max_members }} 人
              </el-tag>
              <span class="president"><el-icon><UserFilled /></el-icon> {{ club.president }}</span>
            </div>
            <el-button type="primary" size="small" round>
              查看详情
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
    <el-empty v-if="!loading && filteredClubs.length === 0" description="未找到匹配的社团" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search, UserFilled } from '@element-plus/icons-vue';
import request from '@/utils/request';

const router = useRouter();
const loading = ref(false);
const clubs = ref([]);
const keyword = ref('');

onMounted(async () => {
  loading.value = true;
  try {
    const res = await request.get('/clubs');
    clubs.value = res.data || [];
  } finally {
    loading.value = false;
  }
});

const filteredClubs = computed(() => {
  if (!keyword.value) return clubs.value;
  const kw = keyword.value.toLowerCase();
  return clubs.value.filter(c =>
    c.name.toLowerCase().includes(kw) ||
    c.description.toLowerCase().includes(kw) ||
    c.president.toLowerCase().includes(kw)
  );
});

const goDetail = (id) => router.push(`/club/${id}`);
const getCapacityType = (c) => c.current_members / c.max_members > 0.8 ? 'danger' : c.current_members / c.max_members > 0.5 ? 'warning' : 'success';
</script>

<style scoped>
.page-header { text-align: center; padding: 20px 0 30px; }
.page-header h1 { font-size: 32px; font-weight: 700; margin-bottom: 8px; background: linear-gradient(135deg, #409eff, #67c23a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.page-header p { color: #909399; }
.filter-card { margin-bottom: 24px; }

.club-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}
.club-item { padding: 0; overflow: hidden; }
.cover-wrap {
  position: relative;
  height: 170px;
}
.cover-img { width: 100%; height: 100%; background-size: cover; background-position: center; }
.cover-wrap::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 80px;
  background: linear-gradient(transparent, rgba(0,0,0,0.3));
}
.cover-logo {
  position: absolute;
  bottom: -24px;
  left: 22px;
  width: 64px;
  height: 64px;
  border-radius: 14px;
  overflow: hidden;
  border: 3px solid #fff;
  background: #fff;
  z-index: 1;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
}
.cover-logo img { width: 100%; height: 100%; }

.club-body { padding: 34px 22px 18px; }
.club-name { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
.club-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  min-height: 42px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 14px;
}
.club-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 14px;
  border-top: 1px solid #f0f0f0;
}
.meta { display: flex; align-items: center; gap: 10px; font-size: 12px; color: #909399; }
.meta .president { display: inline-flex; align-items: center; gap: 3px; }
</style>
