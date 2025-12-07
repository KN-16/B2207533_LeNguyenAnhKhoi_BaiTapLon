<template>
  <div class="modal fade" ref="modalRef" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ isEditMode ? 'Cập nhật thông tin đọc giả' : 'Thêm đọc giả mới' }}</h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>
        <div class="modal-body">
          <div v-if="serverError" id="error-alert" class="alert alert-danger alert-dismissible fade show shadow-sm mb-3">
            <div class="d-flex align-items-center">
              <i class="fas fa-exclamation-triangle me-2 fs-4"></i>
              <div><strong>Lỗi:</strong> {{ serverError }}</div>
            </div>
            <button type="button" class="btn-close" @click="serverError = null"></button>
          </div>

          <Form ref="formRef" @submit="submitReader" :validation-schema="schema" :initial-values="initialFormValues" v-slot="{ isSubmitting }">
            <div class="row">
              <div class="col-md-6 mb-3" v-if ="isEditMode">
                <label class="form-label">Mã đọc giả <span class="text-danger">*</span></label>
                <Field name="MaDocGia" type="text" class="form-control" disabled />
                <ErrorMessage name="MaDocGia" class="text-danger small" />
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Tên đăng nhập <span class="text-danger">*</span></label>
                <Field name="username" type="text" class="form-control" :disabled="isEditMode"  />
                <ErrorMessage name="username" class="text-danger small" />
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Email <span class="text-danger">*</span></label>
                <Field name="email" type="email" class="form-control" placeholder="example@email.com" />
                <ErrorMessage name="email" class="text-danger small" />
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

            <div class="mb-3">
              <label class="form-label">
                Mật khẩu 
                <span v-if="!isEditMode" class="text-danger">*</span>
                <span v-else class="text-muted fst-italic small">(Để trống nếu không đổi)</span>
              </label>
              <Field name="password" type="password" class="form-control" />
              <ErrorMessage name="password" class="text-danger small" />
            </div>

            <div class="row">
              <div class="col-md-4 mb-3">
                <label class="form-label">Giới tính</label>
                <Field name="Phai" as="select" class="form-select">
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </Field>
                <ErrorMessage name="Phai" class="text-danger small" />
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Ngày sinh <span class="text-danger">*</span></label>
                <Field name="NgaySinh" type="date" class="form-control" />
                <ErrorMessage name="NgaySinh" class="text-danger small" />
              </div>
              <div class="col-md-4 mb-3">
                <label class="form-label">Điện thoại <span class="text-danger">*</span></label>
                <Field name="DienThoai" type="text" class="form-control" />
                <ErrorMessage name="DienThoai" class="text-danger small" />
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label">Địa chỉ <span class="text-danger">*</span></label>
              <Field name="DiaChi" type="text" class="form-control" />
              <ErrorMessage name="DiaChi" class="text-danger small" />
            </div>

            <div class="modal-footer pe-0">
              <button type="button" class="btn btn-secondary" @click="closeModal">Đóng</button>
              <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                {{ isEditMode ? 'Cập nhật' : 'Tạo mới' }}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, nextTick, onMounted } from 'vue';
import { Modal } from 'bootstrap';
import { Form, Field, ErrorMessage } from 'vee-validate';
import * as yup from 'yup';
import adminService from '@/services/adminService';
import Swal from 'sweetalert2';
const props = defineProps({
  show: Boolean,
  readerToEdit: Object,
});
const emits = defineEmits(['close', 'success']);

const modalRef = ref(null);
const formRef = ref(null);
let modalInstance = null;
const serverError = ref(null);

const isEditMode = computed(() => !!props.readerToEdit);

// --- VALIDATION SCHEMA ---
const schema = computed(() => {
  // 1. Định nghĩa các luật chung cho cả 2 trường hợp (Create & Edit)
  const baseRules = {
    username: yup.string().required('Tên đăng nhập là bắt buộc'),
    email: yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
    HoLot: yup.string().required('Họ lót là bắt buộc'),
    Ten: yup.string().required('Tên là bắt buộc'),
    Phai: yup.string().required('Vui lòng chọn giới tính'),
    // validate date: ép kiểu về date object để check
    NgaySinh: yup.date().required('Ngày sinh là bắt buộc').typeError('Ngày sinh không hợp lệ'),
    DienThoai: yup
    .string()
    .required('Số điện thoại là bắt buộc')
    .matches(/^\d{10}$/, 'SĐT phải có đúng 10 số và chỉ chứa số'),
    DiaChi: yup.string().required('Địa chỉ là bắt buộc'),
  };

  // 2. Xử lý riêng trường Password dựa trên biến Vue (isEditMode)
  // Đây là Javascript thuần, chạy 100% đúng logic
  if (isEditMode.value) {
    // --- TRƯỜNG HỢP: EDIT (SỬA) ---
    // Mật khẩu là tùy chọn. Nhưng NẾU nhập thì phải >= 6 ký tự.
    baseRules.password = yup.string()
      .nullable() // Cho phép null
      .notRequired() // Không bắt buộc
      .test('password-strength', 'Mật khẩu phải tối thiểu 6 ký tự', (value) => {
        // Logic: Nếu không nhập (null/undefined/rỗng) -> OK (True)
        // Nếu có nhập -> Kiểm tra độ dài
        if (!value || value === '') return true; 
        return value.length >= 6;
      });
  } else {
    // --- TRƯỜNG HỢP: CREATE (THÊM MỚI) ---
    // Mật khẩu bắt buộc và >= 6 ký tự
    baseRules.password = yup.string()
      .required('Mật khẩu là bắt buộc khi tạo mới')
      .min(6, 'Mật khẩu tối thiểu 6 ký tự');
  }

  // 3. Trả về Schema object hoàn chỉnh
  return yup.object(baseRules);
});

const initialFormValues = ref({});

// --- WATCHERS ---
watch(() => props.show, async (newVal) => {
  if (newVal) {
    modalInstance?.show();
    serverError.value = null;
    
    const reader = props.readerToEdit;
    if (reader) {
      // Edit Mode
      initialFormValues.value = {
        MaDocGia: reader.MaDocGia,
        username: reader.username,
        email: reader.email,
        HoLot: reader.HoLot,
        Ten: reader.Ten,
        Phai: reader.Phai,
        // Format Date về YYYY-MM-DD để input date hiểu
        NgaySinh: reader.NgaySinh ? new Date(reader.NgaySinh).toISOString().split('T')[0] : '',
        DienThoai: reader.DienThoai,
        DiaChi: reader.DiaChi,
        password: '', // Reset pass field
      };
    } else {
      // Add Mode
      initialFormValues.value = {
        username: '', email: '', HoLot: '', Ten: '', 
        password: '', Phai: '', NgaySinh: '', DienThoai: '', DiaChi: ''
      };
    }
    
    await nextTick();
    formRef.value?.resetForm({ values: initialFormValues.value });
  } else {
    modalInstance?.hide();
  }
});

// --- ACTIONS ---
const submitReader = async (values) => {
  serverError.value = null;
  try {
    // Lọc bỏ password nếu rỗng ở chế độ Edit
    const payload = { ...values };
    if (isEditMode.value && !payload.password) {
      delete payload.password;
    }
    delete payload.MaDocGia; // Không gửi MaDocGia lên server
    if (isEditMode.value) {
      await adminService.updateReader(props.readerToEdit._id, payload);
      await Swal.fire({ icon: 'success', title: 'Thành công', text: 'Cập nhật đọc giả thành công!', timer: 1500, showConfirmButton: false });
    } else {
      await adminService.createReader(payload);
      await Swal.fire({ icon: 'success', title: 'Thành công', text: 'Thêm đọc giả thành công!', timer: 1500, showConfirmButton: false });
    }
    emits('success');
  } catch (error) {
    serverError.value = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
    await nextTick();
    const errorEl = document.getElementById('error-alert');
    if (errorEl) errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } finally {
  }
};

const closeModal = () => emits('close');

onMounted(() => {
  if (modalRef.value) modalInstance = new Modal(modalRef.value);
});
</script>
<style scoped>
/* CSS tùy chỉnh nhỏ để icon lịch trông cân đối với Bootstrap */
.dp__input {
  border-radius: 0.375rem; /* Khớp với bootstrap */
  border-color: #dee2e6;
  font-family: inherit;
  color: #212529;
}
.dp__input:hover {
  border-color: #b6babc;
}
.is-invalid .dp__input {
  border-color: #dc3545;
}
</style>