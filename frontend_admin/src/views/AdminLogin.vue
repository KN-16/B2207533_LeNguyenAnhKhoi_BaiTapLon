<template>
  <div
    class="container-fluid d-flex justify-content-center align-items-center"
    style="min-height: 100vh; background-color: #f0f2f5"
  >
    <div class="col-md-5 col-lg-4">
      <div class="card shadow-lg border-0">
        <div class="card-body p-4 p-md-5" >
          <h2 class="text-center fw-bold mb-4">
            <i class="fas fa-shield-alt me-2 d-block" ></i>
            Đăng nhập Quản trị viên
          </h2>

          <div v-if="serverError" class="alert alert-danger">
            {{ serverError }}
          </div>

          <Form
            @submit="handleLogin"
            :validation-schema="schema"
            v-slot="{ isSubmitting }"
          >
            <div class="mb-3">
              <label for="identifier" class="form-label">Tên đăng nhập hoặc Email</label>
              <Field
                name="identifier"
                type="text"
                class="form-control form-control-lg"
                id="identifier"
              />
              <ErrorMessage name="identifier" class="form-text text-danger" />
            </div>

            <div class="mb-4">
              <label for="password" class="form-label">Mật khẩu</label>
              <Field
                name="password"
                type="password"
                class="form-control form-control-lg"
                id="password"
              />
              <ErrorMessage name="password" class="form-text text-danger" />
            </div>

            <div class="d-grid mb-3">
              <button
                type="submit"
                class="btn btn-primary btn-lg"
                :disabled="isSubmitting"
              >
                <span
                  v-if="isSubmitting"
                  class="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Đăng nhập
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Form, Field, ErrorMessage } from 'vee-validate';
import * as yup from 'yup';
import { useAuthStore } from '@/store/authStore';

const authStore = useAuthStore();
const serverError = ref(null);

const schema = yup.object({
  identifier: yup.string().required('Tên đăng nhập hoặc số điện thoại là bắt buộc'),
  password: yup.string().required('Mật khẩu là bắt buộc'),
});

const handleLogin = async (values) => {
  serverError.value = null;
  try {
    // This action in authStore contains the role check
    await authStore.login(values.identifier, values.password);
    // Redirect is handled inside authStore or router
  } catch (error) {
    serverError.value =
      error.response?.data?.message || error.message || 'Đã xảy ra lỗi không xác định.';
  } finally {
  }
};
</script>