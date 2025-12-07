<template>
  <div class="modal fade" ref="modalRef" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title"><i class="fas fa-bolt me-2"></i>Đăng ký mượn nhanh</h5>
          <button type="button" class="btn-close btn-close-white" @click="closeModal"></button>
        </div>
        
        <div class="modal-body" v-if="book">
          
          <div class="d-flex mb-4 p-2 border rounded bg-light">
             <img :src="getImageUrl(book.coverUrl)" width="60" height="80" class="rounded me-3 border" style="object-fit: cover;">
             <div>
                <h6 class="fw-bold mb-1">{{ book.TenSach }}</h6>
                <div class="small text-muted mb-1">{{ book.MaSach }}</div>
                <div class="text-muted small">
                    Kho hiện tại: <strong class="text-success fs-6">{{ book.SoQuyenConLai }}</strong> quyển
                </div>
             </div>
          </div>

          <Form @submit="handleSubmit" :validation-schema="schema" ref="formRef" :initial-values="initialValues" v-slot="{ isSubmitting, values, setFieldValue }">
             
             <div class="mb-3">
                <label class="form-label small fw-bold">Số lượng mượn</label>
                <Field 
                    name="SoLuong" 
                    type="number" 
                    class="form-control" 
                    min="1" 
                    :max="book.SoQuyenConLai"
                    @input="(e) => handleQuantityInput(e, setFieldValue)"
                />
                <ErrorMessage name="SoLuong" class="text-danger small" />
                <div v-if="values.SoLuong > book.SoQuyenConLai" class="text-danger small mt-1">
                    <i class="fas fa-exclamation-circle"></i> Vượt quá số lượng trong kho!
                </div>
             </div>

             <div class="row">
                <div class="col-6 mb-3">
                   <label class="form-label small fw-bold">Ngày mượn</label>
                   <Field name="NgayMuon" v-slot="{ field, handleChange }">
                      <VueDatePicker 
                        :model-value="field.value" 
                        @update:model-value="handleChange"
                        :enable-time-picker="false" 
                        auto-apply 
                        format="dd/MM/yyyy" 
                        :min-date="new Date()"
                      />
                   </Field>
                   <ErrorMessage name="NgayMuon" class="text-danger small" />
                </div>
                <div class="col-6 mb-3">
                   <label class="form-label small fw-bold">Ngày trả (Dự kiến)</label>
                   <Field name="NgayTraDuKien" v-slot="{ field, handleChange }">
                      <VueDatePicker 
                        :model-value="field.value" 
                        @update:model-value="handleChange"
                        :enable-time-picker="false" 
                        auto-apply 
                        format="dd/MM/yyyy" 
                        :min-date="values.NgayMuon || new Date()"
                      />
                   </Field>
                   <ErrorMessage name="NgayTraDuKien" class="text-danger small" />
                </div>
             </div>

             <div class="mb-3">
                <label class="form-label small fw-bold">Ghi chú</label>
                <Field name="GhiChu" as="textarea" class="form-control" rows="2" placeholder="Ví dụ: Sách kèm đĩa CD..." />
             </div>

             <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                <button type="button" class="btn btn-secondary" @click="closeModal">Hủy</button>
                <button type="submit" class="btn btn-primary px-4" :disabled="isSubmitting || values.SoLuong > book.SoQuyenConLai">
                   <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                   Xác nhận đăng ký
                </button>
             </div>

          </Form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { Modal } from 'bootstrap';
import { Form, Field, ErrorMessage } from 'vee-validate';
import * as yup from 'yup';
import borrowService from '@/services/borrowService'; // API: createBorrow
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import {VueDatePicker} from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

const props = defineProps(['book', 'show','initialQuantity']);
const emit = defineEmits(['close', 'success']);
const formRef = ref(null);
const modalRef = ref(null);
let modalInstance = null;
const authStore = useAuthStore();
const router = useRouter();

// Default values
const initialValues = ref({
    SoLuong: 1,
    NgayMuon: new Date(),
    NgayTraDuKien: new Date(new Date().setDate(new Date().getDate() + 7)), // Default +7 ngày
    GhiChu: ''
});

// Helper URL
const getImageUrl = (url) => {
  if (!url) return '/images/book-placeholder.png';
  return url.startsWith('http') ? url : `${import.meta.env.VITE_BASE_ASSET_URL || 'http://localhost:3000'}${url}`;
};

// Schema Validation
const schema = yup.object({
   SoLuong: yup.number().required().min(1).typeError('Phải là số'),
   NgayMuon: yup.date().required('Chọn ngày mượn'),
   NgayTraDuKien: yup.date().required('Chọn ngày trả').min(yup.ref('NgayMuon'), 'Ngày trả phải sau ngày mượn')
});

// Xử lý input số lượng (Không cho nhập lố)
const handleQuantityInput = (e, setFieldValue) => {
    let val = parseInt(e.target.value);
    if (val > props.book.SoQuyenConLai) {
        // Có thể set lại về max hoặc chỉ cần để validate chặn nút submit
        // setFieldValue('SoLuong', props.book.SoQuyenConLai);
    }
};

// Submit
const handleSubmit = async (values) => {
   // 1. Check Login
   if (!authStore.isAuthenticated) {
       modalInstance.hide();
       const result = await Swal.fire({ 
           title: 'Cần đăng nhập', 
           text: 'Vui lòng đăng nhập để thực hiện chức năng này', 
           icon: 'warning', 
           showCancelButton: true, 
           confirmButtonText: 'Đăng nhập',
           cancelButtonText: 'Hủy'
       });
       
       if (result.isConfirmed) {
           router.push('/login');
       } else {
           // Nếu hủy đăng nhập, mở lại modal cũ nếu muốn (tùy chọn)
           // modalInstance.show(); 
           emit('close');
       }
       return;
   }

   // 2. Call API
   try {
      const payload = {
         MaDocGia: authStore.user._id,
         ChiTietMuon: [{ 
             MaSach: props.book._id, 
             SoLuong: values.SoLuong,
             GhiChu: '',
             DaTra: 0
         }],
         NgayMuon: values.NgayMuon,
         NgayTraDuKien: values.NgayTraDuKien,
         status: 'pending',
         GhiChu: values.GhiChu || ''
      };

      await borrowService.createBorrow(payload);
      
      Swal.fire({
      title: 'Thành công',
      text: 'Yêu cầu mượn sách đã được gửi. Vui lòng chờ duyệt.',
      icon: 'success',
      showConfirmButton: false,
      timer: 1500
      });
      emit('success'); // Báo ra ngoài để reload sách
      closeModal();
      
   } catch (err) {
      Swal.fire('Lỗi', err.response?.data?.message || 'Có lỗi xảy ra', 'error');
   } finally {
   }
};

// Watch show
watch(() => props.show, (val) => {
    if (val) {
        modalInstance?.show();
        // Reset form về default mỗi khi mở
        initialValues.value = {
            SoLuong: props.initialQuantity || 1,
            NgayMuon: new Date(),
            NgayTraDuKien: new Date(new Date().setDate(new Date().getDate() + 7)),
            GhiChu: ''
        };
            if (formRef.value) {
            formRef.value.resetForm({
                values: initialValues.value
            });
        }
         }
     else {
        modalInstance?.hide();
    }
});

const closeModal = () => { 
    modalInstance?.hide(); 
    emit('close'); 
};

onMounted(() => { 
    if (modalRef.value) modalInstance = new Modal(modalRef.value); 
});
</script>