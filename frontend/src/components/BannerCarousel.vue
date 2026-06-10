<template>
  <div class="carousel-wrap">
    <el-carousel
      :interval="interval"
      :duration="500"
      height="420px"
      arrow="hover"
      indicator-position="outside"
    >
      <el-carousel-item v-for="banner in banners" :key="banner.id" @click="goLink(banner.link_url)">
        <div class="banner-item" :style="{ backgroundImage: `url(${banner.image_url})` }">
          <div class="banner-overlay">
            <h2 class="banner-title">{{ banner.title }}</h2>
            <p v-if="banner.subtitle" class="banner-subtitle">{{ banner.subtitle }}</p>
            <el-button v-if="banner.link_url" type="primary" size="large" @click.stop="goLink(banner.link_url)">
              立即查看
            </el-button>
          </div>
        </div>
      </el-carousel-item>
    </el-carousel>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const props = defineProps({
  banners: { type: Array, default: () => [] },
  interval: { type: Number, default: 4000 }
});
const emit = defineEmits(['click']);
const router = useRouter();

const goLink = (link) => {
  if (!link) return;
  emit('click', link);
  if (link.startsWith('/')) {
    router.push(link);
  } else {
    window.open(link, '_blank');
  }
};
</script>

<style scoped>
.carousel-wrap {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}
.banner-item {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  position: relative;
}
.banner-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.55), rgba(0,0,0,0.15));
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 80px;
  color: #fff;
}
.banner-title {
  font-size: 40px;
  font-weight: 700;
  margin-bottom: 12px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.3);
  letter-spacing: 2px;
}
.banner-subtitle {
  font-size: 18px;
  margin-bottom: 24px;
  opacity: 0.9;
}
:deep(.el-carousel__indicator) {
  padding: 12px 8px;
}
:deep(.el-carousel__button) {
  width: 28px;
  height: 4px;
  border-radius: 2px;
  opacity: 0.5;
}
:deep(.is-active .el-carousel__button) {
  opacity: 1;
  background: #409eff;
}
</style>
