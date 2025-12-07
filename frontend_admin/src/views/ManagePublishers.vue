<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0 text-gray-800">Quản Lý Nhà Xuất Bản</h1>
      <button class="btn btn-primary" @click="openModal(null)">
        <i class="fas fa-plus me-2"></i>Thêm Nhà Xuất Bản
      </button>
    </div>

    <div class="card shadow-sm border-0">
      <div class="card-body p-0">
        <vue-good-table
          :columns="columns"
          :rows="rows"
          :line-numbers="true"
          v-model:isLoading="isLoading"
          :search-options="{ enabled: true, placeholder: 'Tìm kiếm nhà xuất bản...' }"
          :pagination-options="{
            enabled: true,
            mode: 'records',
            perPage: 10,
            nextLabel: 'Tiếp',
            prevLabel: 'Trước',
            rowsPerPageLabel: 'Dòng mỗi trang',
            ofLabel: 'trên',
          }"
          styleClass="vgt-table striped bordered condensed"
        >
          <template #table-row="props">
            <span v-if="props.column.field == 'actions'">
              <div class="d-flex justify-content-center gap-2">
                <button
                  class="btn btn-outline-warning btn-sm"
                  @click="openModal(props.row)"
                  title="Chỉnh sửa"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button
                  class="btn btn-outline-danger btn-sm"
                  @click="deletePublisher(props.row)"
                  :disabled="deleteLoading[props.row._id]"
                  title="Xóa"
                >
                  <span v-if="deleteLoading[props.row._id]" class="spinner-border spinner-border-sm"></span>
                  <i v-else class="fas fa-trash"></i>
                </button>
              </div>
            </span>
            <span v-else>
              {{ props.formattedRow[props.column.field] }}
            </span>
          </template>
          <template #emptystate>
            <div class="text-center p-4 text-muted">Không có dữ liệu nhà xuất bản.</div>
          </template>
        </vue-good-table>
      </div>
    </div>

    <div class="modal fade" ref="modalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ isEditMode ? 'Cập nhật Nhà Xuất Bản' : 'Thêm Nhà Xuất Bản Mới' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          
          <div class="modal-body">
            <div v-if="serverError" class="alert alert-danger">{{ serverError }}</div>
            
            <Form ref="formRef" @submit="handleSubmit" :validation-schema="schema" v-slot="{ isSubmitting }">
              
              <div class="mb-3" v-if="isEditMode">
                <label class="form-label fw-bold">Mã NXB</label>
                <Field name="MaNXB" type="text" class="form-control" disabled />
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">Tên Nhà Xuất Bản <span class="text-danger">*</span></label>
                <Field name="TenNXB" type="text" class="form-control" placeholder="Nhập tên NXB..." />
                <ErrorMessage name="TenNXB" class="text-danger small mt-1" />
              </div>

              <div class="mb-3">
                <label class="form-label fw-bold">Địa chỉ</label>
                <Field name="DiaChi" type="text" class="form-control" placeholder="Nhập địa chỉ..." />
                <ErrorMessage name="DiaChi" class="text-danger small mt-1" />
              </div>

              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-secondary" @click="closeModal">Hủy</button>
                <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
                  <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                  {{ isEditMode ? 'Lưu thay đổi' : 'Tạo mới' }}
                </button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, nextTick } from 'vue';
import { Modal } from 'bootstrap';
import { Form, Field, ErrorMessage } from 'vee-validate';
import * as yup from 'yup';
import adminService from '@/services/adminService';
import { VueGoodTable } from 'vue-good-table-next';
import 'vue-good-table-next/dist/vue-good-table-next.css';
import Swal from 'sweetalert2'; // Dùng Swal cho đẹp

const isLoading = ref(false);
const rows = ref([]);
const deleteLoading = reactive({});
const serverError = ref(null);
const modalRef = ref(null);
const formRef = ref(null); // Ref cho form VeeValidate
let modalInstance = null;
const selectedPublisher = ref(null);

const isEditMode = computed(() => !!selectedPublisher.value);

// Định nghĩa cột (Vietsub + Width)
const columns = ref([
  { label: 'Mã NXB', field: 'MaNXB', width: '120px' },
  { label: 'Tên Nhà Xuất Bản', field: 'TenNXB' },
  { label: 'Địa chỉ', field: 'DiaChi' },
  { label: 'Thao tác', field: 'actions', sortable: false, width: '150px', tdClass: 'text-center', thClass: 'text-center' },
]);

const schema = yup.object({
  TenNXB: yup.string().required('Tên Nhà Xuất Bản là bắt buộc'),
  DiaChi: yup.string().required('Địa chỉ là bắt buộc'), // Thường địa chỉ cũng nên required
});

const loadPublishers = async () => {
  isLoading.value = true;
  try {
    const data = await adminService.getPublishers();
    rows.value = data.publishers;
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

// --- FIX LỖI KHÔNG HIỆN DATA ---
const openModal = async (publisher) => {
  serverError.value = null;
  selectedPublisher.value = publisher;
  
  // Chuẩn bị data
  const initialData = publisher 
    ? { MaNXB: publisher.MaNXB, TenNXB: publisher.TenNXB, DiaChi: publisher.DiaChi }
    : { MaNXB: '', TenNXB: '', DiaChi: '' };

  modalInstance?.show();

  // Reset form với data mới
  await nextTick();
  if (formRef.value) {
    formRef.value.resetForm({
      values: initialData
    });
  }
};

const closeModal = () => {
  modalInstance?.hide();
  selectedPublisher.value = null;
};

const handleSubmit = async (values) => {
  serverError.value = null;
  const dataSubmit = {
    TenNXB: values.TenNXB,
    DiaChi: values.DiaChi,
  };
  try {
    if (isEditMode.value) {
      await adminService.updatePublisher(selectedPublisher.value._id, dataSubmit);
      Swal.fire({ icon: 'success', title: 'Thành công', text: 'Cập nhật NXB thành công!', timer: 1500, showConfirmButton: false });
    } else {
      await adminService.createPublisher(values);
      Swal.fire({ icon: 'success', title: 'Thành công', text: 'Thêm NXB mới thành công!', timer: 1500, showConfirmButton: false });
    }
    closeModal();
    loadPublishers(); 
  } catch (error) {
    serverError.value = error.response?.data?.message || 'Có lỗi xảy ra.';
  } finally {
  }
};

const deletePublisher = async (publisher) => {
  const result = await Swal.fire({
    title: 'Xác nhận xóa?',
    text: `Bạn có chắc muốn xóa NXB "${publisher.TenNXB}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Xóa',
    cancelButtonText: 'Hủy'
  });

  if (result.isConfirmed) {
    deleteLoading[publisher._id] = true;
    try {
      await adminService.deletePublisher(publisher._id);
      loadPublishers();
      Swal.fire('Đã xóa!', 'Nhà xuất bản đã bị xóa.', 'success');
    } catch (error) {
      Swal.fire('Lỗi', error.response?.data?.message || 'Không thể xóa', 'error');
    } finally {
      deleteLoading[publisher._id] = false;
    }
  }
};

onMounted(() => {
  loadPublishers();
  if (modalRef.value) {
    modalInstance = new Modal(modalRef.value);
  }
});
</script>