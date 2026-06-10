<template>
  <div class="page-container">
    <div class="page-header flex-between">
      <div>
        <h1>校园动态</h1>
        <p>了解校园里的新鲜事</p>
      </div>
      <el-input v-model="keyword" placeholder="搜索动态标题..." style="width: 280px;" clearable :prefix-icon="Search" size="large" />
    </div>

    <div v-loading="loading" class="news-grid">
      <el-card v-for="n in list" :key="n.id" class="news-card card-hover" @click="goDetail(n.id)">
        <div class="n-cover" :style="{ backgroundImage: `url(${n.cover_image})` }">
          <el-tag v-if="n.club_name" class="n-club">{{ n.club_name }}</el-tag>
        </div>
        <div class="n-body">
          <h3 class="n-title">{{ n.title }}</h3>
          <div class="n-meta">
            <span><el-icon><User /></el-icon> {{ n.author_name }}</span>
            <span><el-icon><Watch /></el-icon> {{ n.created_at }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <div v-if="total > pageSize" class="pagination-wrap mt-20">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        background
        @current-change="fetchList"
      />
    </div>

    <el-empty v-if="!loading && list.length === 0" description="暂无动态" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Search, User, Watch } from '@element-plus/icons-vue';
import request from '@/utils/request';

const router = useRouter();
const loading = ref(false);
const list = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(9);
const keyword = ref('');

let timer = null;
const fetchList = async () => {
  loading.value = true;
  try {
    const res = await request.get('/news', { params: { status: 1, page: page.value, pageSize: pageSize.value, keyword: keyword.value } });
    list.value = res.data?.list || [];
    total.value = res.data?.total || 0;
  } finally {
    loading.value = false;
  }
};

onMounted(fetchList);

const debouncedSearch = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    page.value = 1;
    fetchList();
  }, 300);
};

const goDetail = (id) => router.push(`/news/${id}`);
</script>

<style scoped>
.page-header { padding: 20px 0 24px; }
.page-header h1 { font-size: 30px; font-weight: 700; margin-bottom: 6px; background: linear-gradient(135deg, #f5576c, #f093fb); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.page-header p { color: #909399; }

.news-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}
.news-card { padding: 0; overflow: hidden; }
.n-cover { height: 190px; background-size: cover; background-position: center; position: relative; }
.n-club { position: absolute; top: 12px; left: 12px; background: rgba(64,158,255,0.9); color: #fff; border: none; }
.n-body { padding: 18px; }
.n-title { font-size: 16px; font-weight: 600; line-height: 1.5; margin-bottom: 10px; min-height: 48px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.n-meta { display: flex; gap: 16px; font-size: 12px; color: #909399; }
.n-meta span { display: inline-flex; align-items: center; gap: 4px; }

.pagination-wrap { display: flex; justify-content: center; }
</style>
