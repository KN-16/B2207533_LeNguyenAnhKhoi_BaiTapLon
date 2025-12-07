<template>
  <div
    class="modal fade"
    ref="modalRef"
    tabindex="-1"
    aria-labelledby="bookFormModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="bookFormModalLabel">
            {{ isEditMode ? 'Chỉnh sửa sách' : 'Thêm sách mới' }}
          </h5>
          <button
            type="button"
            class="btn-close"
            @click="closeModal"
            aria-label="Close"
          ></button>
        </div>
        
          <div class="modal-body"> <div 
    v-if="serverError" 
    class="alert alert-danger alert-dismissible fade show shadow-sm mb-3" 
    role="alert"
    id="error-alert"
  >
    <div class="d-flex align-items-center">
        <i class="fas fa-exclamation-triangle me-2 fs-4"></i>
        <div>
            <strong>Lỗi:</strong> {{ serverError }}
        </div>
    </div>
    <button type="button" class="btn-close" @click="serverError = null"></button>
  </div>

          <Form
            ref="formRef"
            @submit="submitBook"
            :validation-schema="schema"
            :initial-values="initialFormValues"
            v-slot="{ isSubmitting, setFieldValue, values }"
          >
            <div class="row" v-if="isEditMode">
              <div class="col-md-6 mb-3">
                <label for="MaSach" class="form-label">Mã sách</label>
                <Field
                  name="MaSach"
                  type="text"
                  class="form-control"
                  id="MaSach"
                  disabled
                />
                <ErrorMessage name="MaSach" class="form-text text-danger" />
              </div>
              <div class="col-md-6 mb-3">
                <label for="TenSach" class="form-label">Tên sách</label>
                <Field
                  name="TenSach"
                  type="text"
                  class="form-control"
                  id="TenSach"
                />
                <ErrorMessage name="TenSach" class="form-text text-danger" />
              </div>
            </div>
            <div class="mb-3" v-else>
              <label for="TenSach" class="form-label">Tên sách</label>
                <Field
                  name="TenSach"
                  type="text"
                  class="form-control"
                  id="TenSach"
                />
                <ErrorMessage name="TenSach" class="form-text text-danger" />
            </div>
            <div class="row">
              <div class="col-md-4 mb-3">
                <label for="SoQuyen" class="form-label">Số quyển</label>
                <Field
                  name="SoQuyen"
                  type="number"
                  class="form-control"
                  id="SoQuyen"
                  @input="(e) => handleChangeSoQuyen(e, setFieldValue)"
                />
                <ErrorMessage name="SoQuyen" class="form-text text-danger" />
              </div>
              <div class="col-md-4 mb-3">
                <label for="SoQuyenConLai" class="form-label">Có thể mượn</label>
                <Field
                  name="SoQuyenConLai"
                  type="number"
                  class="form-control"
                  id="SoQuyenConLai"
                  disabled
                  readonly
                />
                <ErrorMessage name="SoQuyenConLai" class="form-text text-danger" />
              </div>
              <div class="col-md-4 mb-3">
                <label for="NamXuatBan" class="form-label">Năm xuất bản</label>
                <Field
                  name="NamXuatBan"
                  type="number"
                  class="form-control"
                  id="NamXuatBan"
                />
                <ErrorMessage name="NamXuatBan" class="form-text text-danger" />
              </div>
            </div>

            <div class="mb-3">
              <label for="MaNXB" class="form-label">Nhà xuất bản</label>
              <Field
                name="MaNXB"
                as="select"
                class="form-select"
                id="MaNXB"
                @change="onPublisherChange($event, setFieldValue)"
              >
                <option value="" disabled>Chọn nhà xuất bản</option>
                <option
                  v-for="nxb in publishers"
                  :key="nxb._id"
                  :value="nxb._id"
                >
                  {{ nxb.TenNXB }} ({{ nxb.MaNXB }})
                </option>
                <option value="new" class="fw-bold text-primary">+ Thêm nhà xuất bản mới</option>
              </Field>
              <ErrorMessage name="MaNXB" class="form-text text-danger" />
            </div>

            <div class="mb-3 border p-3 rounded bg-light">
              <h6>Chi tiết nhà xuất bản</h6>
              <div class="mb-2">
                <label for="TenNXB" class="form-label">Tên nhà xuất bản</label>
                <Field
                  name="TenNXB"
                  type="text"
                  class="form-control"
                  id="TenNXB"
                  :disabled="!isNewPublisher"
                />
                <ErrorMessage name="TenNXB" class="form-text text-danger" />
              </div>
              <div class="mb-2">
                <label for="DiaChi" class="form-label">Địa chỉ</label>
                <Field
                  name="DiaChi"
                  type="text"
                  class="form-control"
                  id="DiaChi"
                  :disabled="!isNewPublisher"
                />
                <ErrorMessage name="DiaChi" class="form-text text-danger" />
              </div>
            </div>

            <div class="mb-3">
              <label for="TacGia" class="form-label">Tác giả (phân cách bằng dấu phẩy)</label>
              <Field
                name="TacGia"
                type="text"
                class="form-control"
                id="TacGia"
                placeholder="Nguyễn Nhật Ánh, J.K. Rowling, George Orwell..."
              />
              <ErrorMessage name="TacGia" class="form-text text-danger" />
            </div>

            <div class="mb-3">
              <label for="tags" class="form-label">Nhãn (phân cách bằng dấu phẩy)</label>
              <Field
                name="tags"
                type="text"
                class="form-control"
                id="tags"
                placeholder="Thiếu nhi, Khoa học viễn tưởng, Lịch sử..."
              />
              <ErrorMessage name="tags" class="form-text text-danger" />
            </div>

            <div class="mb-3">
              <label for="coverImage" class="form-label">Ảnh bìa</label>

              <div v-if="previewUrl" class="mb-3 text-center p-3 bg-light rounded border">
                <img
                  :src="previewUrl"
                  alt="Ảnh bìa xem trước"
                  class="img-fluid shadow-sm rounded"
                  style="max-height: 200px; object-fit: contain;"
                />
                <div class="text-muted mt-2 small">
                  {{ coverImageFile ? 'Ảnh mới được chọn' : 'Ảnh hiện tại' }}
                </div>
              </div>

              <input
                name="coverImage"
                type="file"
                class="form-control"
                id="coverImage"
                accept="image/*"
                @change="handleFileUpload($event, setFieldValue)"
              />
              <div class="form-text text-muted">
                Recommended size: 500x800px. Max size: 2MB.
              </div>
            </div>

            <div class="mb-3 form-check">
              <Field
                name="pinnedHot"
                type="checkbox"
                class="form-check-input"
                id="pinnedHot"
                :value="true"
              />
              <label class="form-check-label" for="pinnedHot">Ghim làm sách hot</label>
            </div>

            <div class="modal-footer pe-0">
              <button
                type="button"
                class="btn btn-secondary"
                @click="closeModal"
              >
                Đóng
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="isSubmitting"
              >
                <span
                  v-if="isSubmitting"
                  class="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
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
import { ref, onMounted, watch, computed, onUnmounted, nextTick } from 'vue';
import { Modal } from 'bootstrap';
import { Form, Field, ErrorMessage } from 'vee-validate';
import * as yup from 'yup';
import adminService from '@/services/adminService';
import Swal from 'sweetalert2';

const props = defineProps({
  show: Boolean,
  bookToEdit: Object,
});

const emits = defineEmits(['close', 'success']);

// --- REFS ---
const modalRef = ref(null);
const formRef = ref(null); // Reference to the Vee-Validate Form
let modalInstance = null;

const serverError = ref(null);
const publishers = ref([]);
const coverImageFile = ref(null);
const previewUrl = ref(null);
const isNewPublisher = ref(false);

const isEditMode = computed(() => !!props.bookToEdit);

// --- HELPER: Resolve Full Image URL ---
const getFullImageUrl = (relativePath) => {
  // Fallback placeholder image
  const PLACEHOLDER_IMG = '/images/book-placeholder.png';
  if (!relativePath) return PLACEHOLDER_IMG;

  // If the path starts with http, it's already a full URL, web or CDN link
  if (relativePath.startsWith('http')) return relativePath;

  //If it's a backend upload, prepend the backend URL
  const baseUrl = import.meta.env.VITE_BASE_ASSET_URL || 'http://localhost:3000';
  // Ensure we don't double slash if baseUrl ends with /
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${cleanBase}${cleanPath}`;
};

const soSachDangMuon = ref(0);

// --- VALIDATION SCHEMA ---
const schema = yup.object({
  MaSach: yup.string().when('isEditMode', {
    is: true,  // edit mode
    then: (schema) => schema.required('Book ID is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  TenSach: yup.string().required('Tiêu đề là bắt buộc'),
  SoQuyenConLai: yup.number().required('Số lượng còn lại là bắt buộc').min(0).integer(),
  SoQuyen: yup.number().required('Số lượng là bắt buộc').min(0).integer(),
  NamXuatBan: yup
    .number()
    .required('Năm xuất bản là bắt buộc')
    .integer()
    .min(1000)
    .max(new Date().getFullYear()),
  MaNXB: yup.string().required('Mã nhà xuất bản là bắt buộc'),
  // Conditional Validation for Publisher
  TenNXB: yup.string().when('MaNXB', {
    is: 'new',
    then: (schema) => schema.required('Tên nhà xuất bản là bắt buộc'),
    otherwise: (schema) => schema.notRequired(),
  }),
  DiaChi: yup.string().when('MaNXB', {
    is: 'new',
    then: (schema) => schema.required('Địa chỉ là bắt buộc'),
    otherwise: (schema) => schema.notRequired(),
  }),
  TacGia: yup.string(),
  tags: yup.string(),
  pinnedHot: yup.boolean(),
});

// --- INITIAL VALUES ---
const initialFormValues = ref({
  MaSach: '', TenSach: '', SoQuyenConLai: 1, SoQuyen: 1,
  NamXuatBan: new Date().getFullYear(),
  MaNXB: '', TenNXB: '', DiaChi: '',
  TacGia: '', tags: '', pinnedHot: false, coverUrl: '',
});

// --- MODAL VISIBILITY & CLEANUP ---
watch(
  () => props.show,
  async (isOpen) => {
    if (isOpen) {
      // 1. Mở Modal trước cho mượt
      modalInstance?.show();
      serverError.value = null; // Reset lỗi

      // 2. Gọi API lấy danh sách Publisher và CHỜ nó xong (await)
      try {
        const data = await adminService.getPublishers();
        publishers.value = data.publishers;
      } catch (error) {
        console.error('Lỗi tải danh sách NXB:', error);
      }

      // 3. Sau khi có danh sách NXB rồi, mới bắt đầu điền form
      // Logic này copy từ cái watch(bookToEdit) cũ sang
      const newBook = props.bookToEdit;
      
      // Reset ảnh preview
      if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl.value);
      }

      if (newBook) {
        // --- CHẾ ĐỘ EDIT ---
        isNewPublisher.value = false;
        previewUrl.value = getFullImageUrl(newBook.coverUrl);
        soSachDangMuon.value = newBook.SoQuyen - newBook.SoQuyenConLai;
        // Xử lý map dữ liệu
        initialFormValues.value = {
          MaSach: newBook.MaSach,
          TenSach: newBook.TenSach,
          SoQuyen: newBook.SoQuyen,
          SoQuyenConLai: newBook.SoQuyenConLai,
          NamXuatBan: newBook.NamXuatBan,
          // Lấy ID chuẩn
          MaNXB: newBook.MaNXB?._id || newBook.MaNXB, 
          // Các trường text
          TenNXB: newBook.MaNXB?.TenNXB || '',
          DiaChi: newBook.MaNXB?.DiaChi || '',
          TacGia: Array.isArray(newBook.TacGia) ? newBook.TacGia.join(', ') : (newBook.TacGia || ''),
          tags: Array.isArray(newBook.tags) ? newBook.tags.join(', ') : (newBook.tags || ''),
          pinnedHot: newBook.pinnedHot || false,
          coverUrl: newBook.coverUrl,
        };
      } else {
        console.log('Adding new book');
        // --- CHẾ ĐỘ ADD NEW ---
        isNewPublisher.value = false;
        previewUrl.value = null;
        initialFormValues.value = {
          TenSach: '', SoQuyen: 1, SoQuyenConLai: 1,
          NamXuatBan: new Date().getFullYear(),
          MaNXB: '', TenNXB: '', DiaChi: '',
          TacGia: '', tags: '', pinnedHot: false, coverUrl: '',
        };
        soSachDangMuon.value = 0;
      }
      console.log("Chua reset form");
      // 4. Reset Form UI
      await nextTick();
      if (formRef.value) {
        formRef.value.resetForm({
          values: initialFormValues.value,
        });
      }
      console.log('Form initialized with values:', initialFormValues.value);

    } else {
      // Khi đóng modal
      modalInstance?.hide();
      if (coverImageFile.value && previewUrl.value && previewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl.value);
        previewUrl.value = null;
      }
      coverImageFile.value = null;
    }
  }
);
const handleChangeSoQuyen = (event, setFieldValue) => {
  const newSoQuyen = parseInt(event.target.value);
  if (isNaN(newSoQuyen) || newSoQuyen < 0) {
    return;
  }
  const newSoQuyenConLai = newSoQuyen - soSachDangMuon.value;
  if (newSoQuyenConLai < 0 ) {
    Swal.fire({
      icon: 'error',
      title: 'Không hợp lệ',
      text: `Đang có ${soSachDangMuon.value} quyển đang được mượn. Không thể giảm tổng số thấp hơn mức này!`,
      confirmButtonColor: '#d33'
    });
    return;
  }
  setFieldValue('SoQuyen', newSoQuyen); 
  setFieldValue('SoQuyenConLai', newSoQuyenConLai);
};
// --- HANDLER: PUBLISHER CHANGED ---
const onPublisherChange = (event, setFieldValue) => {
  const selectedValue = event.target.value;

  if (selectedValue === 'new') {
    isNewPublisher.value = true;
    setFieldValue('TenNXB', '');
    setFieldValue('DiaChi', '');
  } else {
    isNewPublisher.value = false;
    const selectedPub = publishers.value.find((p) => p._id === selectedValue);
    if (selectedPub) {
      setFieldValue('TenNXB', selectedPub.TenNXB);
      setFieldValue('DiaChi', selectedPub.DiaChi);
    }
  }
};

// --- HANDLER: FILE UPLOAD ---
const handleFileUpload = (event, setFieldValue) => {
  const file = event.target.files[0];

  // Revoke old blob
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value);
  }

  if (file) {
    // Basic validation
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Only JPG, PNG, or WebP images are allowed.');
      event.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB.');
      event.target.value = '';
      return;
    }

    coverImageFile.value = file;
    setFieldValue('coverImage', file);

    // Create local preview
    previewUrl.value = URL.createObjectURL(file);
  }
};

// --- INITIALIZE ---
onMounted(async () => {
  if (modalRef.value) {
    modalInstance = new Modal(modalRef.value);
    modalRef.value.addEventListener('hidden.bs.modal', () => {
      emits('close');
    });
  }
  try {
    const data = await adminService.getPublishers();
    publishers.value = data.publishers;
  } catch (error) {
    console.error('Failed to fetch publishers:', error);
  }
});

// --- SUBMIT ---
const submitBook = async (values) => {
  serverError.value = null;
  const formData = new FormData();

  Object.keys(values).forEach((key) => {
    // Skip these fields
    if (key === 'coverImage' 
    || (key === "TenNXB" && !isNewPublisher.value) 
    ||(key === "DiaChi" && !isNewPublisher.value)  ) {
      return;
    }
    // Handle specific fields carefully
    if (key === 'pinnedHot') {
      formData.append(key, values[key] || false);
    } else if (values[key] !== null && values[key] !== undefined) {
      formData.append(key, values[key]);
    }
    });

  if (coverImageFile.value) {
    formData.append('coverImage', coverImageFile.value);
  }
  try {
    if (isEditMode.value) {
      await adminService.updateBook(props.bookToEdit._id, formData);
      await Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'Cập nhật sách thành công!',
        timer: 1500,
        showConfirmButton: false
      });
    } else {
      await adminService.createBook(formData);
      await Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'Tạo sách thành công!',
        timer: 1500,
        showConfirmButton: false
      });
    }
    emits('success');
  } catch (error) {
    serverError.value = error.response?.data?.message || 'An error occurred.';
    await nextTick();
    
    const errorElement = document.getElementById('error-alert');
    if (errorElement) {
      // Lệnh này bắt buộc trình duyệt cuộn tới phần tử này bất kể thanh cuộn nằm đâu
      errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // (Tùy chọn) Focus vào đó để người dùng khiếm thị hoặc dùng phím biết có lỗi
      errorElement.focus(); 
    }
  } 
};

const closeModal = () => emits('close');

// --- CLEANUP ---
onUnmounted(() => {
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>