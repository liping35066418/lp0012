<template>
  <div class="admin-notifications">
    <el-card>
      <template #header>
        <div class="card-head">
          <el-icon><Bell /></el-icon>
          通知推送中心
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="14">
          <el-card shadow="never" class="form-card">
            <template #header>
              <div class="sub-title">发送新通知</div>
            </template>
            <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
              <el-form-item label="推送范围" prop="scope">
                <el-radio-group v-model="form.scope">
                  <el-radio value="all">全部用户</el-radio>
                  <el-radio value="club">指定社团</el-radio>
                  <el-radio value="custom">自定义选择</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item v-if="form.scope === 'club'" label="选择社团" prop="club_id">
                <el-select v-model="form.club_id" placeholder="选择要推送的社团" style="width: 100%;" filterable>
                  <el-option v-for="c in clubs" :key="c.id" :label="`${c.name} (${c.current_members}人)`" :value="c.id" />
                </el-select>
              </el-form-item>
              <el-form-item v-if="form.scope === 'custom'" label="选择用户">
                <el-select
                  v-model="form.user_ids"
                  multiple
                  filterable
                  placeholder="搜索并选择要推送的用户"
                  style="width: 100%;"
                  :loading="usersLoading"
                  remote
                  :remote-method="searchUsers"
                >
                  <el-option v-for="u in userOptions" :key="u.id" :label="`${u.real_name} (@${u.username})`" :value="u.id" />
                </el-select>
                <div style="margin-top: 6px; font-size: 12px; color: #909399;">
                  已选择 {{ form.user_ids.length }} 人
                </div>
              </el-form-item>
              <el-form-item label="通知类型">
                <el-select v-model="form.type" style="width: 200px;">
                  <el-option label="系统通知" value="system" />
                  <el-option label="活动通知" value="activity" />
                  <el-option label="审核通知" value="review" />
                  <el-option label="社团公告" value="notice" />
                </el-select>
              </el-form-item>
              <el-form-item label="通知标题" prop="title">
                <el-input v-model="form.title" placeholder="请输入通知标题" maxlength="50" show-word-limit />
              </el-form-item>
              <el-form-item label="通知内容" prop="content">
                <el-input v-model="form.content" type="textarea" :rows="8" placeholder="请输入通知内容..." maxlength="1000" show-word-limit />
              </el-form-item>
              <el-form-item label="快捷模板">
                <div class="template-wrap">
                  <el-button v-for="(t, i) in templates" :key="i" size="small" @click="useTemplate(t)" type="info" plain>{{ t.name }}</el-button>
                </div>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" size="large" :loading="sending" @click="sendNotify">
                  <el-icon><Promotion /></el-icon>
                  立即推送
                </el-button>
                <el-button size="large" @click="resetForm">重置</el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>

        <el-col :span="10">
          <el-card shadow="never" class="history-card">
            <template #header>
              <div class="sub-title flex-between">
                <span>最近推送记录</span>
                <el-button link type="primary" @click="fetchMyNotifications">刷新</el-button>
              </div>
            </template>
            <div v-loading="historyLoading" class="history-list">
              <div v-for="n in historyList" :key="n.id" class="history-item">
                <div class="h-head">
                  <el-tag size="small" :type="n.type === 'system' ? 'primary' : n.type === 'activity' ? 'success' : n.type === 'review' ? 'warning' : 'info'" effect="plain">
                    {{ typeLabel(n.type) }}
                  </el-tag>
                  <span class="h-club" v-if="n.club_name">{{ n.club_name }}</span>
                  <span class="h-time">{{ n.created_at }}</span>
                </div>
                <div class="h-title">{{ n.title }}</div>
                <div class="h-content">{{ n.content }}</div>
              </div>
              <el-empty v-if="!historyLoading && historyList.length === 0" description="暂无推送记录" :image-size="80" />
            </div>
          </el-card>

          <el-card shadow="never" class="stats-card mt-20">
            <template #header>
              <div class="sub-title">消息统计</div>
            </template>
            <div class="msg-stats">
              <div class="stat-item">
                <el-icon :size="24" color="#409eff"><Bell /></el-icon>
                <div class="stat-info">
                  <div class="num">{{ notifyStats.total }}</div>
                  <div class="label">我的消息</div>
                </div>
              </div>
              <div class="stat-item">
                <el-icon :size="24" color="#e6a23c"><Warning /></el-icon>
                <div class="stat-info">
                  <div class="num">{{ notifyStats.unread }}</div>
                  <div class="label">未读消息</div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';

const clubs = ref([]);
const userOptions = ref([]);
const usersLoading = ref(false);
const historyLoading = ref(false);
const historyList = ref([]);
const sending = ref(false);
const formRef = ref();
const notifyStats = reactive({ total: 0, unread: 0 });

const form = reactive({
  scope: 'all',
  club_id: '',
  user_ids: [],
  type: 'system',
  title: '',
  content: ''
});

const rules = {
  title: [{ required: true, message: '请输入通知标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入通知内容', trigger: 'blur' }],
  club_id: [{ required: true, message: '请选择社团', trigger: 'change' }]
};

const templates = [
  { name: '活动通知', title: '【活动通知】新活动报名开启', content: '亲爱的社团成员：\n\n我们即将举办新的精彩活动，欢迎大家积极报名参与！具体活动信息请查看活动中心页面。\n\n—— 社团管理团队' },
  { name: '招新公告', title: '【招新公告】社团招新进行中', content: '各位同学：\n\n社团年度招新活动正在火热进行中！欢迎有兴趣的同学前往招新报名页面提交申请。\n\n期待你的加入！' },
  { name: '会议通知', title: '【会议通知】社团例会安排', content: '各位成员：\n\n本周将召开社团例会，请大家准时参加。\n时间：本周五 19:00\n地点：大学生活动中心\n\n请提前做好准备。' },
  { name: '节日祝福', title: '【节日祝福】节日快乐！', content: '亲爱的同学们：\n\n值此佳节来临之际，社团管理团队向大家致以最诚挚的祝福！祝大家节日快乐，学业进步！' }
];

const typeLabel = (t) => ({ system: '系统', activity: '活动', review: '审核', notice: '公告' }[t] || t);

const fetchClubs = async () => {
  const res = await request.get('/clubs');
  clubs.value = res.data || [];
};

const fetchMyNotifications = async () => {
  historyLoading.value = true;
  try {
    const res = await request.get('/notifications/my');
    historyList.value = res.data?.list || [];
    notifyStats.total = historyList.value.length;
    notifyStats.unread = res.data?.unreadCount || 0;
  } finally {
    historyLoading.value = false;
  }
};

const searchUsers = async (kw) => {
  if (!kw) return;
  usersLoading.value = true;
  try {
    const res = await request.get('/members', { params: { keyword: kw } });
    userOptions.value = (res.data?.list || []).map(m => ({ id: m.user_id, username: m.username, real_name: m.real_name }));
  } finally {
    usersLoading.value = false;
  }
};

const useTemplate = (t) => {
  form.title = t.title;
  form.content = t.content;
};

const resetForm = () => {
  formRef.value?.resetFields();
  form.scope = 'all';
  form.user_ids = [];
};

const sendNotify = async () => {
  const validRules = { ...rules };
  if (form.scope !== 'club') delete validRules.club_id;
  const valid = await formRef.value.validate(validRules).catch(() => false);
  if (!valid) return;
  if (form.scope === 'custom' && form.user_ids.length === 0) {
    ElMessage.warning('请选择要推送的用户');
    return;
  }
  sending.value = true;
  try {
    const payload = {
      title: form.title,
      content: form.content,
      type: form.type
    };
    if (form.scope === 'club') payload.club_id = form.club_id;
    else if (form.scope === 'custom') payload.user_ids = form.user_ids;
    await request.post('/notifications/push', payload);
    ElMessage.success('通知推送成功');
    resetForm();
    fetchMyNotifications();
  } finally {
    sending.value = false;
  }
};

onMounted(() => {
  fetchClubs();
  fetchMyNotifications();
});
</script>

<style scoped>
.card-head { font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.sub-title { font-weight: 600; font-size: 15px; }
.form-card { border-radius: 10px; }
.history-card { border-radius: 10px; min-height: 400px; }
.history-list { max-height: 450px; overflow: auto; }
.history-item {
  padding: 14px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: all 0.2s;
}
.history-item:hover { border-color: #409eff; background: #fafcff; }
.h-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 12px; }
.h-club { color: #409eff; }
.h-time { margin-left: auto; color: #909399; }
.h-title { font-weight: 600; font-size: 14px; margin-bottom: 6px; }
.h-content { font-size: 13px; color: #606266; line-height: 1.6; white-space: pre-wrap; }
.template-wrap { display: flex; gap: 8px; flex-wrap: wrap; }
.stats-card { border-radius: 10px; }
.msg-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.stat-item {
  padding: 16px;
  background: linear-gradient(135deg, #f5f9ff, #f0f7ff);
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.stat-info .num { font-size: 24px; font-weight: 700; color: #303133; }
.stat-info .label { font-size: 12px; color: #909399; margin-top: 2px; }
</style>
