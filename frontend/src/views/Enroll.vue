<template>
  <div class="page-container enroll-page">
    <div class="page-header text-center">
      <h1>社团招新报名</h1>
      <p>填写信息，加入你感兴趣的社团！</p>
    </div>

    <el-row :gutter="24">
      <el-col :span="8">
        <el-card v-if="selectedClub" class="club-info-card">
          <template #header>
            <div class="card-head"><el-icon><OfficeBuilding /></el-icon>社团信息</div>
          </template>
          <div class="club-preview">
            <div class="pc-banner" :style="{ backgroundImage: `url(${selectedClub.banner || selectedClub.logo})` }" />
            <div class="pc-info">
              <div class="pc-logo">
                <el-image :src="selectedClub.logo" fit="cover" />
              </div>
              <div class="pc-detail">
                <h3>{{ selectedClub.name }}</h3>
                <p class="pc-p">社长：{{ selectedClub.president }} · {{ selectedClub.contact_phone }}</p>
              </div>
            </div>
            <el-progress :percentage="capacityPct" :stroke-width="8" :status="capacityStatus" style="margin-top: 14px;" />
            <p class="pc-desc">{{ selectedClub.description }}</p>
            <div class="pc-tip" v-if="selectedClub.current_members >= selectedClub.max_members">
              <el-icon><Warning /></el-icon> 该社团名额已满
            </div>
          </div>
        </el-card>

        <el-card class="tips-card" :class="{ 'mt-20': selectedClub }">
          <template #header>
            <div class="card-head"><el-icon><InfoFilled /></el-icon>报名须知</div>
          </template>
          <ul class="tips-list">
            <li>每人同一社团仅可报名一次</li>
            <li>报名提交后由社团管理员审核</li>
            <li>审核结果将通过消息通知发送</li>
            <li>如有疑问请联系社团负责人</li>
          </ul>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card class="form-card">
          <template #header>
            <div class="card-head"><el-icon><Edit /></el-icon>填写报名信息</div>
          </template>
          <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" size="large" label-position="right">
            <el-form-item label="选择社团" prop="club_id">
              <el-select v-model="form.club_id" placeholder="请选择要报名的社团" size="large" style="width: 100%;" @change="onClubChange" filterable>
                <el-option v-for="c in clubs" :key="c.id" :label="c.name" :value="c.id" :disabled="c.current_members >= c.max_members">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>{{ c.name }}</span>
                    <el-tag size="small" :type="c.current_members / c.max_members > 0.8 ? 'danger' : c.current_members / c.max_members > 0.5 ? 'warning' : 'success'" effect="plain">
                      {{ c.current_members }}/{{ c.max_members }}
                    </el-tag>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="姓名" prop="real_name">
                  <el-input v-model="form.real_name" placeholder="请输入真实姓名" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="性别" prop="gender">
                  <el-radio-group v-model="form.gender">
                    <el-radio value="男">男</el-radio>
                    <el-radio value="女">女</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="学号" prop="student_id">
                  <el-input v-model="form.student_id" placeholder="请输入学号" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="手机" prop="phone">
                  <el-input v-model="form.phone" placeholder="请输入手机号" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="form.email" placeholder="请输入邮箱地址" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="院系" prop="department">
                  <el-input v-model="form.department" placeholder="请输入所在院系" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="年级" prop="grade">
                  <el-select v-model="form.grade" placeholder="请选择年级" style="width: 100%;">
                    <el-option label="大一" value="大一" />
                    <el-option label="大二" value="大二" />
                    <el-option label="大三" value="大三" />
                    <el-option label="大四" value="大四" />
                    <el-option label="研究生" value="研究生" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="报名理由" prop="reason">
              <el-input v-model="form.reason" type="textarea" :rows="4" placeholder="请说明你想加入本社团的原因..." maxlength="500" show-word-limit />
            </el-form-item>
            <el-form-item label="特长技能" prop="skills">
              <el-input v-model="form.skills" type="textarea" :rows="3" placeholder="如有相关特长或技能请填写（选填）" maxlength="300" show-word-limit />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="submitting" size="large" @click="handleSubmit" :disabled="!selectedClub || selectedClub.current_members >= selectedClub.max_members">
                <el-icon><Promotion /></el-icon> 提交报名
              </el-button>
              <el-button size="large" @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '@/utils/request';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const store = useUserStore();
const formRef = ref();
const submitting = ref(false);
const clubs = ref([]);
const selectedClubId = computed({
  get: () => form.club_id,
  set: (val) => { form.club_id = val; }
});

const form = reactive({
  club_id: route.params.clubId ? Number(route.params.clubId) : null,
  real_name: '',
  gender: '',
  student_id: '',
  phone: '',
  email: '',
  department: '',
  grade: '',
  reason: '',
  skills: ''
});

const rules = {
  club_id: [{ required: true, message: '请选择要报名的社团', trigger: 'change' }],
  real_name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  student_id: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式错误', trigger: 'blur' }
  ],
  email: [{ type: 'email', message: '邮箱格式错误', trigger: 'blur' }],
  department: [{ required: true, message: '请输入院系', trigger: 'blur' }],
  grade: [{ required: true, message: '请选择年级', trigger: 'change' }],
  reason: [{ required: true, message: '请填写报名理由', trigger: 'blur' }]
};

const selectedClub = computed(() => {
  const c = clubs.value.find(c => c.id === form.club_id);
  return c ? c : null;
});
const capacityPct = computed(() => selectedClub.value?.max_members ? Math.round(selectedClub.value.current_members / selectedClub.value.max_members * 100) : 0);
const capacityStatus = computed(() => capacityPct.value > 80 ? 'exception' : capacityPct.value > 50 ? 'warning' : 'success');

const fetchClubs = async () => {
  const res = await request.get('/clubs');
  clubs.value = res.data || [];
};

const handleVisibility = () => {
  if (!document.hidden) {
    fetchClubs();
  }
};

onMounted(async () => {
  await fetchClubs();
  if (store.isLogin && store.user) {
    form.real_name = store.user.real_name || '';
    form.phone = store.user.phone || '';
    form.email = store.user.email || '';
  }
  document.addEventListener('visibilitychange', handleVisibility);
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibility);
});

const onClubChange = (val) => {
  router.replace(`/enroll/${val}`);
};

watch(selectedClub, (c) => {
  if (c && c.id) {
    document.title = `报名 - ${c.name}`;
  }
});

const resetForm = () => {
  formRef.value?.resetFields();
};

const handleSubmit = async () => {
  if (!form.club_id) {
    ElMessage.warning('请先选择要报名的社团');
    return;
  }
  if (!store.isLogin) {
    try {
      await ElMessageBox.confirm('请先登录后再报名，是否跳转登录页？', '提示', { type: 'warning' });
      router.push({ path: '/login', query: { redirect: route.fullPath } });
    } catch (e) {}
    return;
  }
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  if (selectedClub.value.current_members >= selectedClub.value.max_members) {
    ElMessage.warning('该社团名额已满，请选择其他社团');
    return;
  }
  submitting.value = true;
  try {
    await request.post('/enrollments', { club_id: form.club_id, ...form });
    ElMessage.success('报名提交成功！等待审核中');
    router.push('/my-enrollments');
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.page-header { padding: 20px 0 28px; }
.page-header h1 { font-size: 30px; font-weight: 700; margin-bottom: 6px; background: linear-gradient(135deg, #409eff, #ff6b6b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.page-header p { color: #909399; }

.card-head { display: flex; align-items: center; gap: 8px; font-weight: 600; }

.club-info-card { border-radius: 12px; }
.club-preview { margin-top: 18px; }
.pc-banner { height: 120px; border-radius: 10px; background-size: cover; background-position: center; margin-bottom: -18px; }
.pc-info { display: flex; align-items: center; gap: 12px; padding: 0 8px; position: relative; }
.pc-logo { width: 52px; height: 52px; border-radius: 12px; overflow: hidden; border: 3px solid #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.1); background: #fff; }
.pc-logo img { width: 100%; height: 100%; }
.pc-detail h3 { font-size: 17px; font-weight: 600; margin-bottom: 2px; }
.pc-p { font-size: 12px; color: #909399; }
.pc-desc { margin-top: 12px; font-size: 13px; color: #606266; line-height: 1.6; padding: 10px; background: #f5f7fa; border-radius: 8px; }
.pc-tip { margin-top: 10px; padding: 10px; background: #fef0f0; color: #f56c6c; border-radius: 8px; font-size: 13px; display: flex; align-items: center; gap: 6px; }

.tips-card { border-radius: 12px; }
.tips-list { padding-left: 18px; font-size: 13px; color: #606266; line-height: 2; }

.form-card { border-radius: 12px; }
</style>
