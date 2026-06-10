<template>
  <div class="admin-clubs">
    <el-card>
      <template #header>
        <div class="card-head flex-between">
          <div class="card-title">
            <el-icon><OfficeBuilding /></el-icon>
            社团管理（管理员）
          </div>
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>
            新增社团
          </el-button>
        </div>
      </template>

      <el-table :data="list" v-loading="loading" stripe style="width: 100%;">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="社团信息" min-width="300">
          <template #default="{ row }">
            <div style="display: flex; gap: 12px; align-items: center;">
              <el-image :src="row.logo" fit="cover" style="width: 56px; height: 56px; border-radius: 10px; flex-shrink: 0;" />
              <div>
                <div style="font-weight: 600; font-size: 15px; margin-bottom: 4px;">{{ row.name }}</div>
                <div style="font-size: 12px; color: #909399;">
                  <el-icon><User /></el-icon> 社长：{{ row.president }} · {{ row.contact_phone }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="成员规模" width="180">
          <template #default="{ row }">
            <div>
              <div style="margin-bottom: 6px;">
                <el-tag :type="row.current_members / row.max_members > 0.8 ? 'danger' : row.current_members / row.max_members > 0.5 ? 'warning' : 'success'" size="small">
                  {{ row.current_members }} / {{ row.max_members }} 人
                </el-tag>
              </div>
              <el-progress
                :percentage="Math.round(row.current_members / row.max_members * 100)"
                :stroke-width="6"
                :status="row.current_members / row.max_members > 0.8 ? 'exception' : 'success'"
                :show-text="false"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="editClub(row)">编辑</el-button>
            <el-button size="small" type="success" link @click="$router.push(`/club/${row.id}`)" target="_blank">预览</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑社团' : '新增社团'" width="680px">
      <el-form :model="clubForm" :rules="clubRules" ref="clubFormRef" label-width="100px">
        <el-form-item label="社团名称" prop="name">
          <el-input v-model="clubForm.name" placeholder="请输入社团名称" maxlength="30" show-word-limit />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="社团Logo" prop="logo">
              <el-input v-model="clubForm.logo" placeholder="Logo图片URL" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Banner图片">
              <el-input v-model="clubForm.banner" placeholder="Banner图片URL（选填）" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="社长" prop="president">
              <el-input v-model="clubForm.president" placeholder="请输入社长姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contact_phone">
              <el-input v-model="clubForm.contact_phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="最大人数" prop="max_members">
              <el-input-number v-model="clubForm.max_members" :min="1" :max="500" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前状态">
              <el-switch v-model="clubForm.status" :active-value="1" :inactive-value="0" />
              <span style="margin-left: 10px; color: #909399;">{{ clubForm.status ? '正常' : '停用' }}</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="社团介绍" prop="description">
          <el-input v-model="clubForm.description" type="textarea" :rows="6" placeholder="请详细介绍社团..." maxlength="1000" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitClub">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';

const loading = ref(false);
const submitLoading = ref(false);
const list = ref([]);

const dialogVisible = ref(false);
const editingId = ref(null);
const clubFormRef = ref();
const clubForm = reactive({
  name: '',
  logo: '',
  banner: '',
  description: '',
  max_members: 50,
  president: '',
  contact_phone: '',
  status: 1
});
const clubRules = {
  name: [{ required: true, message: '请输入社团名称', trigger: 'blur' }],
  logo: [{ required: true, message: '请输入Logo图片URL', trigger: 'blur' }],
  president: [{ required: true, message: '请输入社长姓名', trigger: 'blur' }],
  contact_phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  description: [{ required: true, message: '请输入社团介绍', trigger: 'blur' }]
};

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await request.get('/clubs');
    list.value = res.data || [];
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  editingId.value = null;
  Object.assign(clubForm, {
    name: '',
    logo: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&h=200&fit=crop',
    banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=400&fit=crop',
    description: '',
    max_members: 50,
    president: '',
    contact_phone: '',
    status: 1
  });
  dialogVisible.value = true;
};

const editClub = (row) => {
  editingId.value = row.id;
  Object.assign(clubForm, {
    name: row.name,
    logo: row.logo,
    banner: row.banner || '',
    description: row.description || '',
    max_members: row.max_members,
    president: row.president || '',
    contact_phone: row.contact_phone || '',
    status: row.status
  });
  dialogVisible.value = true;
};

const submitClub = async () => {
  const valid = await clubFormRef.value.validate().catch(() => false);
  if (!valid) return;
  submitLoading.value = true;
  try {
    if (editingId.value) {
      await request.put(`/clubs/${editingId.value}`, clubForm);
      ElMessage.success('社团信息更新成功');
    } else {
      await request.post('/clubs', clubForm);
      ElMessage.success('社团创建成功');
    }
    dialogVisible.value = false;
    fetchList();
  } finally {
    submitLoading.value = false;
  }
};

const toggleStatus = async (row) => {
  try {
    await request.put(`/clubs/${row.id}`, { status: row.status });
    ElMessage.success(row.status ? '社团已启用' : '社团已停用');
  } catch (e) {
    row.status = row.status ? 0 : 1;
  }
};

onMounted(fetchList);
</script>

<style scoped>
.card-head { display: flex; align-items: center; gap: 8px; }
.card-title { font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
</style>
