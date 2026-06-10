<template>
  <div v-loading="loading" class="page-container" v-if="news">
    <el-page-header @back="$router.back()" class="mb-20">
      <template #content>动态详情</template>
    </el-page-header>

    <el-card class="news-detail-card">
      <div v-if="news.cover_image" class="cover-wrap">
        <el-image :src="news.cover_image" fit="cover" class="cover-img" />
      </div>
      <div class="article-body">
        <h1 class="title">{{ news.title }}</h1>
        <div class="meta-info">
          <el-tag v-if="news.club_name" type="primary" effect="plain">{{ news.club_name }}</el-tag>
          <span class="meta-item"><el-icon><User /></el-icon> {{ news.author_name || '匿名' }}</span>
          <span class="meta-item"><el-icon><Watch /></el-icon> {{ news.created_at }}</span>
          <span v-if="news.reviewed_at" class="meta-item review-item"><el-icon><CircleCheckFilled /></el-icon> 已审核 {{ news.reviewed_at }}</span>
        </div>
        <div class="content-text">
          {{ news.content }}
        </div>
        <div class="action-row mt-20">
          <el-button @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回列表</el-button>
          <el-button type="primary" @click="$router.push('/news')">查看更多动态</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import request from '@/utils/request';

const route = useRoute();
const loading = ref(false);
const news = ref(null);

onMounted(async () => {
  loading.value = true;
  try {
    const res = await request.get(`/news/${route.params.id}`);
    news.value = res.data;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.news-detail-card { border-radius: 14px; padding: 0; overflow: hidden; }
.cover-wrap { max-height: 380px; overflow: hidden; }
.cover-img { width: 100%; }
.news-detail-card :deep(.el-card__body) { padding: 0; }
.article-body { padding: 32px 40px; }
.title { font-size: 30px; font-weight: 700; line-height: 1.4; margin-bottom: 14px; }
.meta-info { display: flex; align-items: center; gap: 16px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0; margin-bottom: 24px; flex-wrap: wrap; }
.meta-item { font-size: 13px; color: #909399; display: inline-flex; align-items: center; gap: 4px; }
.review-item { color: #67c23a; }
.content-text { font-size: 16px; line-height: 2; color: #2c3e50; white-space: pre-wrap; }
.action-row { padding-top: 20px; border-top: 1px solid #f0f0f0; display: flex; gap: 12px; justify-content: center; }
</style>
