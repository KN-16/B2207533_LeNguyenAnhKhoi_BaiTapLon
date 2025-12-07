<template>
  <div class="modal fade" ref="modalRef" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            {{ isEditMode ? `Cập nhật phiếu: ${borrowToEdit.MaMuonSach}` : 'Tạo phiếu mượn mới' }}
          </h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>
        
        <div class="modal-body">
          <Form ref="formRef" @submit="submitBorrow" :validation-schema="schema" v-slot="{ values, setFieldValue, errors }">
            
            <div class="row">
              <div class="col-md-4 border-end">
                <h6 class="text-primary mb-3">Thông tin phiếu</h6>
                
                <div class="mb-3">
                  <label class="form-label">Đọc giả <span class="text-danger">*</span></label>
                  <v-select 
                    :options="readers" 
                    label="label" 
                    v-model="selectedReader"
                    placeholder="Tìm tên hoặc mã đọc giả..."
                    class="style-chooser" 
                    :disabled="isEditMode"
                    @update:modelValue="(opt) => setFieldValue('MaDocGia', opt?.code)"
                  >
                    <template #option="{ label, code }">
                      <div class="d-flex justify-content-between align-items-center">
                        <span>{{ label }}</span>
                        <!-- <span class="badge bg-light text-dark border ms-2">{{ code }}</span> -->
                      </div>
                    </template>
                    <template #no-options="{ search, searching }">
                      <template v-if="searching">Không tìm thấy "{{ search }}"</template>
                      <template v-else>Nhập để tìm kiếm...</template>
                    </template>
                  </v-select>
                  
                  <Field name="MaDocGia" type="hidden" />
                  <ErrorMessage name="MaDocGia" class="text-danger small" />
                </div>

                <div class="mb-3">
                  <label class="form-label">Ngày mượn</label>
                  <Field name="NgayMuon" v-slot="{ field, handleChange }" >
                     <VueDatePicker 
                        :model-value="field.value" 
                        @update:model-value="handleChange" 
                        :enable-time-picker="false" 
                        auto-apply 
                        format="dd/MM/yyyy" 
                        placeholder="Chọn ngày"
                        :teleport="true"
                        :disabled="statusLocal === 'reject'"
                     />
                  </Field>
                  <ErrorMessage name="NgayMuon" class="text-danger small" />
                </div>

                <div class="mb-3">
                  <label class="form-label">Hạn trả <span class="text-danger">*</span></label>
                  <Field name="NgayTraDuKien" v-slot="{ field, handleChange }" >
                     <VueDatePicker 
                        :model-value="field.value" 
                        @update:model-value="handleChange" 
                        :enable-time-picker="false" 
                        auto-apply 
                        format="dd/MM/yyyy" 
                        placeholder="Chọn ngày"
                        :teleport="true"
                        :disabled="statusLocal === 'reject'"
                     />
                  </Field>
                  <ErrorMessage name="NgayTraDuKien" class="text-danger small" />
                </div>

                <div v-if="isEditMode" class="mb-3 p-3 bg-light rounded border">
                  <label class="form-label fw-bold">Trạng thái xử lý</label>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="status" value="pending" v-model="statusLocal" >
                    <label class="form-check-label">Giữ nguyên (Chờ duyệt)</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="status" value="borrowed" v-model="statusLocal">
                    <label class="form-check-label text-success fw-bold">Duyệt mượn (Borrowed)</label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="status" value="reject" v-model="statusLocal" @change="handleRejectChange">
                    <label class="form-check-label text-danger fw-bold">Từ chối (Reject)</label>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Ghi chú <span v-if="statusLocal === 'reject'" class="text-danger">*</span></label>
                  <Field name="GhiChu" as="textarea" class="form-control" rows="3" placeholder="Ghi chú chung..." />
                  <ErrorMessage name="GhiChu" class="text-danger small" />
                </div>
              </div>

              <div class="col-md-8">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h6 class="text-primary mb-0">Danh sách sách mượn</h6>
                  
                  <div v-if="isEditMode">
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" id="toggleCartEdit" v-model="isCartEditable" :disabled="statusLocal === 'reject'">
                      <label class="form-check-label fw-bold cursor-pointer" for="toggleCartEdit">
                        {{ isCartEditable ? 'Đang chỉnh sửa' : 'Chỉnh sửa danh sách' }}
                      </label>
                    </div>
                  </div>
                </div>
                
                <div v-if="canEditCart && statusLocal !== 'reject'" class="card bg-light mb-3 border-0">
                  <div class="card-body">
                    <div class="input-group">
                      <v-select 
                        class="flex-grow-1 style-chooser"
                        :options="books" 
                        label="label"
                        v-model="bookToAdd"
                        placeholder="Tìm sách để thêm..."
                      >
                        <template #option="{ label, stock }">
                          <div class="d-flex justify-content-between">
                            <span>{{ label }}</span>
                            <span class="badge" :class="stock > 0 ? 'bg-info' : 'bg-secondary'">Kho: {{ stock }}</span>
                          </div>
                        </template>
                      </v-select>
                      <input type="number" class="form-control" style="max-width: 80px;" v-model="qtyToAdd" min="1">
                      <button class="btn btn-success" type="button" @click="addToCart">
                        <i class="fas fa-plus"></i> Thêm
                      </button>
                    </div>
                    <small class="text-muted ps-1" v-if="bookToAdd">Tồn kho khả dụng: <strong>{{ bookToAdd.stock }}</strong></small>
                  </div>
                </div>

                <div class="table-responsive">
                  <table class="table table-bordered table-hover align-middle">
                    <thead class="table-light">
                      <tr>
                        <th>Tên sách</th>
                        <th width="100" class="text-center">Số lượng</th>
                        
                        <th>Ghi chú sách</th>
                        
                        <th width="50" class="text-center" v-if="canEditCart">
                          <i class="fas fa-trash-alt text-muted"></i>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in cart" :key="index">
                        <td :class="{ 'opacity-50': !canEditCart }">
                          <div class="fw-bold">{{ item.TenSach }}</div>
                          <small class="text-muted font-monospace">{{ item.MaSachCode }}</small>
                        </td>

                        <td class="text-center">
                          <span v-if="!canEditCart || statusLocal === 'reject'" class="fw-bold">
                              {{ item.SoLuong }}
                          </span>
                          <input 
                            v-else 
                            type="number" 
                            class="form-control form-control-sm text-center" 
                            v-model="item.SoLuong" 
                            min="1" 
                            @change="validateCartItem(item)"
                          >
                        </td>

                        <td>
                          <input 
                            v-if="canEditCart && statusLocal !== 'reject'"
                            type="text" 
                            class="form-control form-control-sm" 
                            v-model="item.GhiChu" 
                            placeholder="Tình trạng sách..."
                          >
                          <span v-else class="text-muted small fst-italic">
                            {{ item.GhiChu || '-' }}
                          </span>
                        </td>

                        <td class="text-center" v-if="canEditCart">
                          <button v-if="statusLocal !== 'reject'" class="btn btn-sm text-danger" @click="removeFromCart(index)" title="Xóa dòng này">
                            <i class="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                      
                      <tr v-if="cart.length === 0">
                        <td colspan="4" class="text-center text-muted py-4"> <i class="fas fa-box-open mb-2 fs-4 d-block"></i>
                          Chưa chọn sách nào
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div v-if="cartError" class="alert alert-danger py-2 mt-2 small">
                   <i class="fas fa-exclamation-circle me-1"></i> {{ cartError }}
                </div>
                
                <div v-if="isEditMode && !isCartEditable" class="alert alert-warning py-2 mt-2 small">
                   <i class="fas fa-lock me-1"></i> Danh sách sách đang được giữ nguyên. Bật nút <strong>"Chỉnh sửa danh sách"</strong> ở trên để thay đổi.
                </div>
              </div>
            </div>

            <div class="modal-footer pe-0 mt-3 pt-3 border-top-0">
              <button type="button" class="btn btn-secondary" @click="closeModal">Đóng</button>
              <button type="submit" class="btn btn-primary px-4" :disabled="cart.length === 0 && statusLocal !== 'reject'">
                <i class="fas fa-save me-1"></i>
                {{ isEditMode ? 'Lưu thay đổi' : 'Tạo phiếu mượn' }}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, nextTick } from 'vue';
import { Modal } from 'bootstrap';
import { Form, Field, ErrorMessage } from 'vee-validate';
import * as yup from 'yup';
import vSelect from 'vue-select';
import 'vue-select/dist/vue-select.css';
import {VueDatePicker} from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import adminService from '@/services/adminService';
import Swal from 'sweetalert2';

const props = defineProps({ show: Boolean, borrowToEdit: Object });
const emit = defineEmits(['close', 'success']);

// --- STATE ---
const modalRef = ref(null);
const formRef = ref(null);
let modalInstance = null;

const readers = ref([]);
const books = ref([]);
const selectedReader = ref(null);

const cart = ref([]);
const bookToAdd = ref(null);
const qtyToAdd = ref(1);

const statusLocal = ref('pending');
const isCartEditable = ref(false); // Trạng thái Switch
const cartError = ref('');

const originalData = ref(null);

const isEditMode = computed(() => !!props.borrowToEdit);

// Biến tính toán: Được sửa giỏ hàng khi (Tạo Mới) hoặc (Đang Edit + Đã Bật Switch)
const canEditCart = computed(() => !isEditMode.value || isCartEditable.value);

// --- FETCH DATA ---
const fetchDropdownData = async () => {
  try {
    const [resReaders, resBooks] = await Promise.all([
      adminService.getReaders({ limit: 2000 }), // Lấy số lượng lớn để search
      adminService.getBooks({ limit: 2000 })
    ]);
    
    readers.value = resReaders.readers.map(r => ({ 
      label: `${r.HoLot} ${r.Ten} (${r.MaDocGia})`, 
      code: r._id 
    }));
    
    books.value = resBooks.books.map(b => ({ 
      label: b.TenSach, 
      id: b._id, 
      code: b.MaSach, 
      stock: b.SoQuyenConLai 
    }));
  } catch (e) { console.error('Error fetching data:', e); }
};

// --- CART LOGIC ---
const addToCart = () => {
  if (!bookToAdd.value) return;
  cartError.value = ''; // Clear error

  // Validate kho
  if (bookToAdd.value.stock < qtyToAdd.value) {
    Swal.fire('Hết hàng', `Sách này chỉ còn ${bookToAdd.value.stock} quyển trong kho!`, 'warning');
    return;
  }

  const existing = cart.value.find(i => i.MaSach === bookToAdd.value.id);
  if (existing) {
    // Check cộng dồn
    if (existing.SoLuong + qtyToAdd.value > bookToAdd.value.stock) {
        Swal.fire('Lỗi', 'Tổng số lượng mượn vượt quá tồn kho!', 'warning');
        return;
    }
    existing.SoLuong += qtyToAdd.value;
  } else {
    cart.value.push({
      MaSach: bookToAdd.value.id,
      TenSach: bookToAdd.value.label,
      MaSachCode: bookToAdd.value.code,
      SoLuong: qtyToAdd.value,
      stockMax: bookToAdd.value.stock, // Lưu max để validate khi sửa số lượng input
      GhiChu: ''
    });
  }
  // Reset input
  bookToAdd.value = null;
  qtyToAdd.value = 1;
};

const removeFromCart = (idx) => cart.value.splice(idx, 1);

const validateCartItem = (item) => {
  // Logic đơn giản: Không được nhập quá số tồn kho ban đầu (stockMax)
  // Thực tế nếu edit thì logic phức tạp hơn, nhưng tạm thời check thế này là an toàn
  if (item.stockMax && item.SoLuong > item.stockMax) {
    Swal.fire('Cảnh báo', `Vượt quá số lượng tồn kho (${item.stockMax})`, 'warning');
    item.SoLuong = item.stockMax;
  }
};

// --- WATCH & INIT ---
watch(() => props.show, async (val) => {
  if (val) {
    modalInstance?.show();
    await fetchDropdownData();
    
    // Reset Default State
    cart.value = [];
    statusLocal.value = 'pending';
    cartError.value = '';
    isCartEditable.value = false; // Mặc định khóa khi Edit
    
    // Default Dates
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    // Initial Values cho Vee-Validate
    let initValues = {
        MaDocGia: '',
        NgayMuon: today,
        NgayTraDuKien: nextWeek,
        GhiChu: '',
        status: 'pending'
    };

    if (props.borrowToEdit) {
      // --- EDIT MODE ---
      const b = props.borrowToEdit;
      statusLocal.value = b.status;
      
      // 1. Set v-select hiển thị
      selectedReader.value = { 
          label: `${b.MaDocGia.HoLot} ${b.MaDocGia.Ten} (${b.MaDocGia.MaDocGia})`, 
          code: b.MaDocGia._id 
      };

      // 2. Set giá trị cho Form Vee-Validate
      initValues = {
          MaDocGia: b.MaDocGia._id,
          NgayMuon: new Date(b.NgayMuon),
          NgayTraDuKien: new Date(b.NgayTraDuKien),
          GhiChu: b.GhiChu || '',
          status: b.status
      };

      // 3. Load Cart
      cart.value = b.ChiTietMuon.map(item => ({
          MaSach: item.MaSach._id,
          TenSach: item.MaSach.TenSach,
          MaSachCode: item.MaSach.MaSach,
          SoLuong: item.SoLuong,
          GhiChu: item.GhiChu || '',
          stockMax: 999 // Khi edit khó check lại stock cũ, tạm bỏ qua check max line này
      }));

      // Lưu lại data gốc của cart
      originalData.value = {
        MaDocGia: b.MaDocGia._id,
        NgayMuon: new Date(b.NgayMuon),
        NgayTraDuKien: new Date(b.NgayTraDuKien),
        GhiChu: b.GhiChu || '',
        cart: JSON.parse(JSON.stringify(cart.value)), // Deep copy mảng sách
        selectedReader: selectedReader.value
      };

    } else {
      // --- ADD MODE ---
      selectedReader.value = null;
      isCartEditable.value = true; // Tạo mới luôn được sửa
    }

    // APPLY VALUES TO FORM
    await nextTick();
    if (formRef.value) {
        formRef.value.resetForm({ values: initValues });
    }

  } else {
    modalInstance?.hide();
  }
});

// --- SUBMIT ---
const schema = yup.object({
  MaDocGia: yup.string().required('Chưa chọn đọc giả'),
  NgayMuon: yup.date().required('Ngày mượn là bắt buộc').min(new Date(), 'Ngày mượn không được nhỏ hơn ngày hiện tại'),
  NgayTraDuKien: yup.date().required('Hạn trả là bắt buộc')
    .min(yup.ref('NgayMuon'), 'Ngày trả phải sau ngày mượn'),
  GhiChu: yup.string().test('required-reject', 'Bắt buộc nhập lý do từ chối', function(val) {
      return statusLocal.value === 'reject' ? !!val : true;
  })
});

const submitBorrow = async (values) => {
  // Validate cart length
  if (cart.value.length === 0 && statusLocal.value !== 'reject') {
    cartError.value = 'Vui lòng chọn ít nhất 1 quyển sách';
    return;
  }

  const payload = {
    ...values,
    status: statusLocal.value,
    
    
    // LOGIC GỬI DATA QUAN TRỌNG:
    // Nếu canEditCart = true (Tạo mới hoặc Bật switch) -> Gửi mảng sách mới lên
    // Nếu canEditCart = false (Edit nhưng không sửa sách) -> Gửi undefined (Backend giữ nguyên sách cũ)
    ...(canEditCart.value && {ChiTietMuon: cart.value})
  };
  // Validate ngayMuon, ngayTraDuKien format to ISO string
  payload.NgayMuon = new Date(payload.NgayMuon).toISOString();
  payload.NgayTraDuKien = new Date(payload.NgayTraDuKien).toISOString();
  if (payload.NgayMuon < new Date().toISOString()) {
    Swal.fire(
      {
        title: 'Lỗi ngày mượn',
        text: 'Ngày mượn không được nhỏ hơn ngày hiện tại.',
        icon: 'error',
        showConfirmButton: false,
        timer: 1500
      }
    );
    return;
  }
  if (payload.NgayTraDuKien < payload.NgayMuon) {
    Swal.fire(
      {
        title: 'Lỗi ngày trả',
        text: 'Ngày trả dự kiến không được nhỏ hơn ngày mượn.',
        icon: 'error',
        showConfirmButton: false,
        timer: 1500
      }
    );
    return;
  }

  try {
    if (isEditMode.value) {
      console.log('Updating borrow with ID:', props.borrowToEdit._id);
      console.log('Payload:', payload);
      await adminService.updateBorrow(props.borrowToEdit._id, {
        ...payload,
        NgayMuonBanDau:originalData.value.NgayMuon,
      });
    } else {
      await adminService.createBorrow(payload);
    }
    Swal.fire('Thành công', 'Lưu phiếu mượn thành công', 'success');
    emit('success');
  } catch (err) {
    Swal.fire('Lỗi', err.response?.data?.message || 'Có lỗi xảy ra', 'error');
  }
};

// --- THÊM HÀM XỬ LÝ REJECT ---
const handleRejectChange = async () => {
  const result = await Swal.fire({
    title: 'Xác nhận từ chối?',
    text: "Mọi thay đổi bạn vừa nhập (sách, ngày tháng...) sẽ bị hủy bỏ và quay về dữ liệu gốc.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Đồng ý từ chối',
    cancelButtonText: 'Không, quay lại'
  });

  if (result.isConfirmed) {
    // 1. Reset dữ liệu về ban đầu
    if (originalData.value) {
      cart.value = JSON.parse(JSON.stringify(originalData.value.cart));
      isCartEditable.value = false; // Khóa lại danh sách
      
      // Reset Form Vee-Validate
      if (formRef.value) {
        formRef.value.setValues({
          MaDocGia: originalData.value.MaDocGia,
          NgayMuon: originalData.value.NgayMuon,
          NgayTraDuKien: originalData.value.NgayTraDuKien,
          GhiChu: originalData.value.GhiChu
        });
      }
      // Reset v-select
      selectedReader.value = originalData.value.selectedReader;
    }
    // Trạng thái vẫn giữ là 'reject' (do v-model)
  } else {
    // User hủy -> Quay về trạng thái pending
    statusLocal.value = 'pending';
  }
};

const closeModal = () => emit('close');

onMounted(() => { 
  if (modalRef.value) modalInstance = new Modal(modalRef.value); 
});
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }

/* CSS Fix Vue-Select cho giống Bootstrap */
:deep(.style-chooser .vs__dropdown-toggle) {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 0.375rem 0.75rem;
  min-height: 38px;
  background-color: #fff;
}
:deep(.style-chooser .vs__search::placeholder) {
  color: #6c757d;
}
:deep(.style-chooser .vs__dropdown-menu) {
  border-color: #dee2e6;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  z-index: 1060; /* Cao hơn modal backdrop */
}
/* Style disabled cho v-select */
:deep(.style-chooser.vs--disabled .vs__dropdown-toggle) {
  background-color: #e9ecef;
  cursor: not-allowed;
}
</style>