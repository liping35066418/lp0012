<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-links">
        <a href="/home">首页</a>
        <a href="/clubs">社团展示</a>
        <a href="/activities">活动中心</a>
        <a href="/news">校园动态</a>
        <a href="/enroll">招新报名</a>
      </div>
      <div class="copyright">
        © 2026 社团管理系统 · 本系统仅用于学习演示
      </div>
      <div class="footer-meta">
        <span>前端端口: 3612</span>
        <span>后端端口: 8612</span>
        <span>数据库: SQLite</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  background: #2c3e50;
  color: #bdc3c7;
  margin-top: 60px;
}
.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 40px 24px;
  text-align: center;
}
.footer-links {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 20px;
}
.footer-links a {
  color: #ecf0f1;
  transition: color 0.2s;
  font-size: 14px;
}
.footer-links a:hover {
  color: #409eff;
}
.copyright {
  font-size: 13px;
  margin-bottom: 12px;
  color: #95a5a6;
}
.footer-meta {
  display: flex;
  justify-content: center;
  gap: 20px;
  font-size: 12px;
  color: #7f8c8d;
}
</style>
