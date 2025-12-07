<template>
  <div class="container my-5">
    <div class="row justify-content-center">
      <div class="col-md-8 col-lg-7">
        <div class="card shadow-lg border-0 rounded-3">
          <div class="card-body p-4 p-md-5">
            <h2 class="text-center fw-bold mb-4 text-primary">
              <i class="fas fa-user-plus me-2"></i>Đăng Ký Thành Viên
            </h2>

            <div v-if="serverError" class="alert alert-danger alert-dismissible fade show">
              <i class="fas fa-exclamation-circle me-2"></i> {{ serverError }}
              <button type="button" class="btn-close" @click="serverError = null"></button>
            </div>

            <Form @submit="handleRegister" :validation-schema="schema" v-slot="{ isSubmitting }">
              
              <h5 class="text-muted mb-3 pb-2 border-bottom">
                <i class="fas fa-lock me-2"></i>Thông tin tài khoản
              </h5>
              
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="username" class="form-label">Tên đăng nhập <span class="text-danger">*</span></label>
                  <Field name="username" type="text" class="form-control" id="username" placeholder="VD: nguyenvana" />
                  <ErrorMessage name="username" class="form-text text-danger small" />
                </div>
                <div class="col-md-6 mb-3">
                  <label for="email" class="form-label">Email <span class="text-danger">*</span></label>
                  <Field name="email" type="email" class="form-control" id="email" placeholder="email@example.com" />
                  <ErrorMessage name="email" class="form-text text-danger small" />
                </div>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="password" class="form-label">Mật khẩu <span class="text-danger">*</span></label>
                  <Field name="password" type="password" class="form-control" id="password" placeholder="******" />
                  <ErrorMessage name="password" class="form-text text-danger small" />
                </div>
                <div class="col-md-6 mb-3">
                  <label for="passwordConfirm" class="form-label">Xác nhận mật khẩu <span class="text-danger">*</span></label>
                  <Field name="passwordConfirm" type="password" class="form-control" id="passwordConfirm" placeholder="******" />
                  <ErrorMessage name="passwordConfirm" class="form-text text-danger small" />
                </div>
              </div>

              <h5 class="text-muted mt-4 mb-3 pb-2 border-bottom">
                <i class="fas fa-id-card me-2"></i>Thông tin cá nhân
              </h5>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="HoLot" class="form-label">Họ lót <span class="text-danger">*</span></label>
                  <Field name="HoLot" type="text" class="form-control" id="HoLot" placeholder="Nguyễn Văn" />
                  <ErrorMessage name="HoLot" class="form-text text-danger small" />
                </div>
                <div class="col-md-6 mb-3">
                  <label for="Ten" class="form-label">Tên <span class="text-danger">*</span></label>
                  <Field name="Ten" type="text" class="form-control" id="Ten" placeholder="An" />
                  <ErrorMessage name="Ten" class="form-text text-danger small" />
                </div>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                   <label for="NgaySinh" class="form-label">Ngày sinh</label>
                   <Field name="NgaySinh" type="date" class="form-control" id="NgaySinh" />
                   <ErrorMessage name="NgaySinh" class="form-text text-danger small" />
                </div>
                <div class="col-md-6 mb-3">
                   <label for="Phai" class="form-label">Giới tính</label>
                   <Field name="Phai" as="select" class="form-select" id="Phai">
                      <option value="" disabled>Chọn giới tính</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                   </Field>
                   <ErrorMessage name="Phai" class="form-text text-danger small" />
                </div>
              </div>

              <div class="mb-3">
                <label for="DienThoai" class="form-label">Số điện thoại <span class="text-danger">*</span></label>
                <Field name="DienThoai" type="text" class="form-control" id="DienThoai" placeholder="090xxxxxxx" />
                <ErrorMessage name="DienThoai" class="form-text text-danger small" />
              </div>

              <div class="mb-4">
                <label for="DiaChi" class="form-label">Địa chỉ</label>
                <Field name="DiaChi" type="text" class="form-control" id="DiaChi" placeholder="Số nhà, đường, quận/huyện..." />
                <ErrorMessage name="DiaChi" class="form-text text-danger small" />
              </div>

              <div class="d-grid mt-4 mb-3">
                <button type="submit" class="btn btn-primary btn-lg fw-bold shadow-sm" :disabled="isSubmitting">
                  <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Đăng Ký Ngay
                </button>
              </div>
            </Form>

            <div class="text-center mt-3">
              <small class="text-muted">
                Đã có tài khoản?
                <RouterLink to="/login" class="text-decoration-none fw-bold">Đăng nhập tại đây</RouterLink>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Form, Field, ErrorMessage } from 'vee-validate';
import * as yup from 'yup';
import authService from '@/services/authService';
import Swal from 'sweetalert2';
import { useRouter } from 'vue-router';

const router = useRouter();
const serverError = ref(null);

const phoneRegExp = /^(0[3|5|7|8|9])+([0-9]{8})\b$/;

// Schema Validation (Khớp với Controller của bạn)
// LƯU Ý: Đã BỎ field MaDocGia vì Backend tự sinh
const schema = yup.object({
  // Tài khoản
  username: yup.string().required('Vui lòng nhập tên đăng nhập').min(3, 'Tối thiểu 3 ký tự'),
  email: yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
  password: yup.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').required('Vui lòng nhập mật khẩu'),
  passwordConfirm: yup.string()
    .oneOf([yup.ref('password'), null], 'Mật khẩu xác nhận không khớp')
    .required('Vui lòng xác nhận mật khẩu'),
  
  // Cá nhân
  HoLot: yup.string().required('Vui lòng nhập họ lót'),
  Ten: yup.string().required('Vui lòng nhập tên'),
  DienThoai: yup.string().matches(phoneRegExp, 'Số điện thoại không hợp lệ (10 số)').required('Vui lòng nhập số điện thoại'),
  NgaySinh: yup.date().required('Vui lòng chọn ngày sinh').typeError('Ngày sinh không hợp lệ'),
  Phai: yup.string().required('Vui lòng chọn giới tính'),
  DiaChi: yup.string().required('Vui lòng nhập địa chỉ'),
});

const handleRegister = async (values) => {
  serverError.value = null;
  
  try {
    // 1. Loại bỏ passwordConfirm trước khi gửi (Backend không cần)
    const { passwordConfirm, ...payload } = values;
    let today = new Date();
    let birthDate = new Date(payload.NgaySinh);
    if (birthDate > today) {
      serverError.value = 'Ngày sinh không được lớn hơn ngày hiện tại.';
      return;
    }
    // 2. Gọi hàm register trong authService
    // (Hàm này sẽ gọi API POST /auth/register)
    await authService.register(payload);

    // 3. Thông báo thành công
    await Swal.fire({
      icon: 'success',
      title: 'Đăng ký thành công!',
      text: 'Tài khoản đọc giả của bạn đã được tạo. Vui lòng đăng nhập ngay.',
      timer: 2000,
      showConfirmButton: false
    });
    
    // 4. Chuyển hướng về trang đăng nhập
    router.push('/login'); 

  } catch (error) {
    // 5. Xử lý lỗi từ Backend trả về
    console.error(error);
    if (error.response && error.response.data) {
        // Ưu tiên hiển thị message từ Backend (VD: "Reader with this email... exists")
        serverError.value = error.response.data.message || 'Đăng ký thất bại.';
    } else {
        serverError.value = 'Lỗi kết nối đến máy chủ.';
    }
  } finally {
  }
};
</script>