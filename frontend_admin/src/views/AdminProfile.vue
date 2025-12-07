<template>
  <div class="container-fluid p-0">
    <h2 class="h3 mb-4 text-gray-800">Hồ sơ cá nhân</h2>

    <div class="row" v-if="user">
      <div class="col-xl-4 col-md-5 mb-4">
        <div class="card shadow border-0">
          <div class="card-body text-center">
            <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3" style="width: 100px; height: 100px; font-size: 40px;">
              {{ getInitials(user.Ten) }}
            </div>
            <h5 class="fw-bold mb-1">{{ user.HoLot }} {{ user.Ten }}</h5>
            <p class="text-muted mb-1">{{ user.role === 'admin' ? 'Quản trị viên' : 'Thủ thư' }}</p>
            <span class="badge bg-secondary">{{ user.MSNV }}</span>
            
            <hr class="my-4">
            
            <div class="text-start">
              <p class="mb-2"><i class="fas fa-envelope me-2 text-primary"></i> {{ user.email }}</p>
              <p class="mb-2"><i class="fas fa-phone me-2 text-primary"></i> {{ user.DienThoai || 'Chưa cập nhật' }}</p>
              <p class="mb-2"><i class="fas fa-map-marker-alt me-2 text-primary"></i> {{ user.DiaChi || 'Chưa cập nhật' }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="col-xl-8 col-md-7">
        <div class="card shadow border-0">
          <div class="card-header bg-white py-3">
            <h6 class="m-0 fw-bold text-primary">Chỉnh sửa thông tin</h6>
          </div>
          <div class="card-body">
            <Form ref="formRef" @submit="updateProfile" :validation-schema="schema" :initial-values="initialValues" v-slot="{ isSubmitting }">
              
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label text-muted small">Mã nhân viên</label>
                  <input type="text" class="form-control bg-light" :value="user.MSNV" disabled>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label text-muted small">Tên đăng nhập</label>
                  <input type="text" class="form-control bg-light" :value="user.username" disabled>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                   <label class="form-label">Họ lót <span class="text-danger">*</span></label>
                   <Field name="HoLot" type="text" class="form-control" />
                   <ErrorMessage name="HoLot" class="text-danger small" />
                </div>
                <div class="col-md-6 mb-3">
                   <label class="form-label">Tên <span class="text-danger">*</span></label>
                   <Field name="Ten" type="text" class="form-control" />
                   <ErrorMessage name="Ten" class="text-danger small" />
                </div>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Email <span class="text-danger">*</span></label>
                  <Field name="email" type="email" class="form-control" />
                  <ErrorMessage name="email" class="text-danger small" />
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Điện thoại <span class="text-danger">*</span></label>
                  <Field name="DienThoai" type="text" class="form-control" />
                  <ErrorMessage name="DienThoai" class="text-danger small" />
                </div>
              </div>

              <div class="row">
                 <div class="col-md-6 mb-3">
                    <label class="form-label">Ngày sinh</label>
                    <Field name="NgaySinh" type="date" class="form-control" /> 
                 </div>
                 <div class="col-md-6 mb-3">
                    <label class="form-label">Giới tính</label>
                    <Field name="Phai" as="select" class="form-select">
                       <option value="Nam">Nam</option>
                       <option value="Nữ">Nữ</option>
                       <option value="Khác">Khác</option>
                    </Field>
                 </div>
              </div>

              <div class="mb-3">
                  <label class="form-label">Địa chỉ</label>
                  <Field name="DiaChi" type="text" class="form-control" />
                  <ErrorMessage name="DiaChi" class="text-danger small" />
              </div>

              <hr class="my-4">

              <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-3">
                   <h6 class="text-dark fw-bold mb-0"><i class="fas fa-key me-2"></i>Bảo mật</h6>
                   <button type="button" class="btn btn-sm btn-outline-primary" @click="toggleChangePass">
                      <i :class="isChangePass ? 'fas fa-minus' : 'fas fa-plus'"></i> 
                      {{ isChangePass ? 'Huỷ đổi mật khẩu' : 'Đổi mật khẩu' }}
                   </button>
                </div>

                <div v-if="isChangePass" class="bg-light p-3 rounded border animate__animated animate__fadeIn">
                   <div class="row">
                      <div class="col-md-6 mb-3">
                         <label class="form-label small fw-bold">Mật khẩu hiện tại <span class="text-danger">*</span></label>
                         <div class="input-group">
                            <Field name="currentPassword" :type="showOldPass ? 'text' : 'password'" class="form-control" placeholder="Nhập mật khẩu cũ" />
                            <button class="btn btn-outline-secondary" type="button" @click="showOldPass = !showOldPass">
                               <i :class="showOldPass ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                            </button>
                         </div>
                         <ErrorMessage name="currentPassword" class="text-danger small" />
                      </div>
                      <div class="col-md-6 mb-3">
                         <label class="form-label small fw-bold">Mật khẩu mới <span class="text-danger">*</span></label>
                         <div class="input-group">
                            <Field name="newPassword" :type="showNewPass ? 'text' : 'password'" class="form-control" placeholder="Nhập mật khẩu mới" />
                            <button class="btn btn-outline-secondary" type="button" @click="showNewPass = !showNewPass">
                               <i :class="showNewPass ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                            </button>
                         </div>
                         <ErrorMessage name="newPassword" class="text-danger small" />
                      </div>
                   </div>
                </div>
              </div>

              <div class="d-flex justify-content-end mt-3">
                <button type="submit" class="btn btn-primary px-4" :disabled="isSubmitting">
                  <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                  <i class="fas fa-save me-1"></i> Lưu thay đổi
                </button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2">Đang tải hồ sơ...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { Form, Field, ErrorMessage } from 'vee-validate';
import * as yup from 'yup';
import authService from '@/services/authService';
import { useAuthStore, USER_KEY } from '@/store/authStore';
import Swal from 'sweetalert2';

const authStore = useAuthStore();
const user = ref(null);
const initialValues = ref({});

// State Password
const isChangePass = ref(false);
const showOldPass = ref(false);
const showNewPass = ref(false);

const toggleChangePass = () => {
  isChangePass.value = !isChangePass.value;
  showOldPass.value = false;
  showNewPass.value = false;
};

// --- SCHEMA MỚI (Khớp với NhanVien Schema) ---
const schema = computed(() => {
  const rules = {
    HoLot: yup.string().transform(v => v.trim()).required('Họ lót là bắt buộc'),
    Ten: yup.string().transform(v => v.trim()).required('Tên là bắt buộc'),
    email: yup.string().transform(v => v.trim()).email('Email không hợp lệ').required('Email là bắt buộc'),
    DienThoai: yup.string().required('SĐT là bắt buộc').matches(/^\d{10}$/, 'SĐT phải có 10 số'),
    DiaChi: yup.string().transform(v => v.trim()).required('Địa chỉ là bắt buộc'),
    Phai: yup.string().required('Vui lòng chọn giới tính').oneOf(['Nam', 'Nữ', 'Khác'], 'Giới tính khó hợp lệ'),
    NgaySinh: yup.date().required('Ngày sinh là bắt buộc').typeError('Ngày sinh không hợp lệ'),
  };

  if (isChangePass.value) {
    rules.currentPassword = yup.string().required('Vui lòng nhập mật khẩu hiện tại');
    rules.newPassword = yup.string()
        .required('Vui lòng nhập mật khẩu mới')
        .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự')
        .notOneOf([yup.ref('currentPassword')], 'Mật khẩu mới không được trùng mật khẩu cũ');
  }
  return yup.object(rules);
});

// Fetch Profile
const fetchProfile = async () => {
  try {
    const data = await authService.getProfile();
    user.value = data.user;
    
    // Map dữ liệu vào Form
    initialValues.value = {
      HoLot: data.user.HoLot || '',
      Ten: data.user.Ten || '',
      email: data.user.email || '',
      DienThoai: data.user.DienThoai || '',
      DiaChi: data.user.DiaChi || '',
      Phai: data.user.Phai || '',
      // Convert Date ISO sang YYYY-MM-DD
      NgaySinh: data.user.NgaySinh ? new Date(data.user.NgaySinh).toISOString().split('T')[0] : '',
      currentPassword: '',
      newPassword: ''
    };
  } catch (error) {
    console.error(error);
  }
};

// Submit
const updateProfile = async (values) => {
  try {
    const payload = { ...values };
    if (!isChangePass.value) {
       delete payload.currentPassword;
       delete payload.newPassword;
    }
    console.log('Payload:', payload);
    payload._id = user.value._id;
    payload.role= user.value.role;
    const data = await authService.updateProfile(payload);
    
    // Update Local State & Pinia
    user.value = data.user; // Dùng data mới nhất từ server trả về
    // Lưu ý: Pinia store có thể cần map lại field fullName nếu bạn dùng nó để hiển thị ở Header
    authStore.user = { 
        ...authStore.user, 
        ...data.user,
        // Tạo lại fullName ảo để Header hiển thị đúng (vì schema mới không có field HoTenNV gộp)
        HoTenNV: `${data.user.HoLot} ${data.user.Ten}` 
    };
    // Set json
    localStorage.setItem(USER_KEY, JSON.stringify(authStore.user));

    Swal.fire({ icon: 'success', title: 'Thành công', text: 'Cập nhật hồ sơ thành công!', timer: 1500, showConfirmButton: false });

    if (isChangePass.value) {
      isChangePass.value = false;
      values.currentPassword = '';
      values.newPassword = '';
    }
  } catch (error) {
    Swal.fire('Lỗi', error.response?.data?.message || 'Cập nhật thất bại', 'error');
  } finally {
  }
};

const getInitials = (name) => {
  if (!name) return 'NV';
  return name.charAt(0).toUpperCase();
};

onMounted(fetchProfile);
</script>