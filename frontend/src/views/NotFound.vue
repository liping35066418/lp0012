<template>
  <div class="not-found-page">
    <div class="nf-content">
      <div class="nf-code">404</div>
      <h1>页面走丢了</h1>
      <p>您访问的页面不存在或已被移除</p>
      <div class="nf-actions">
        <el-button type="primary" size="large" @click="$router.push('/home')"><el-icon><HomeFilled /></el-icon> 返回首页</el-button>
        <el-button size="large" @click="$router.back()"><el-icon><ArrowLeft /></el-icon> 返回上一页</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.nf-content { text-align: center; }
.nf-code {
  font-size: 160px;
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(135deg, #409eff, #f56c6c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 10px;
}
h1 { font-size: 28px; margin-bottom: 10px; color: #303133; }
p { color: #909399; margin-bottom: 28px; font-size: 15px; }
.nf-actions { display: flex; gap: 16px; justify-content: center; }
</style>
