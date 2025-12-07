<template>
  <div class="modal fade" ref="modalRef" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title">
            <i class="fas fa-plus-circle me-2"></i> Đăng ký mượn sách mới
          </h5>
          <button type="button" class="btn-close btn-close-white" @click="closeModal"></button>
        </div>
        
        <div class="modal-body">
          <Form ref="formRef" @submit="submitBorrow" :validation-schema="schema" v-slot="{ values }">
            
            <div class="row">
              <div class="col-md-4 border-end">
                <h6 class="text-primary fw-bold mb-3">Thông tin chung</h6>
                
                <div class="mb-3">
                  <label class="form-label small fw-bold text-muted">Người mượn</label>
                  <input type="text" class="form-control bg-light" :value="currentUserLabel" disabled readonly />
                  <div class="form-text text-muted small"><i class="fas fa-lock me-1"></i> Tự động điền</div>
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-bold">Ngày mượn</label>
                  <Field name="NgayMuon" v-slot="{ field, handleChange }" >
                      <VueDatePicker 
                        :model-value="field.value" 
                        @update:model-value="handleChange" 
                        :enable-time-picker="false" 
                        auto-apply 
                        format="dd/MM/yyyy" 
                        :teleport="true"
                        :min-date="new Date()"
                      />
                  </Field>
                  <ErrorMessage name="NgayMuon" class="text-danger small" />
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-bold">Ngày trả (Dự kiến)</label>
                  <Field name="NgayTraDuKien" v-slot="{ field, handleChange }" >
                      <VueDatePicker 
                        :model-value="field.value" 
                        @update:model-value="handleChange" 
                        :enable-time-picker="false" 
                        auto-apply 
                        format="dd/MM/yyyy" 
                        :teleport="true"
                        :min-date="values.NgayMuon || new Date()"
                      />
                  </Field>
                  <ErrorMessage name="NgayTraDuKien" class="text-danger small" />
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-bold">Ghi chú</label>
                  <Field name="GhiChu" as="textarea" class="form-control" rows="3" placeholder="Ghi chú cho thủ thư..." />
                </div>
              </div>

              <div class="col-md-8 ps-md-4">
                <h6 class="text-primary fw-bold mb-3">Danh sách sách mượn</h6>
                
                <div class="card bg-light border-0 mb-3">
                  <div class="card-body p-3">
                    
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <label class="form-label fw-bold mb-0">Chọn sách:</label>
                        <div class="form-check form-switch cursor-pointer">
                            <input class="form-check-input" type="checkbox" id="wishlistToggle" v-model="showWishlistOnly">
                            <label class="form-check-label small fw-bold" :class="showWishlistOnly ? 'text-danger' : 'text-muted'" for="wishlistToggle">
                                <i class="fas fa-heart me-1"></i> {{ showWishlistOnly ? 'Đang lọc sách yêu thích' : 'Hiện sách yêu thích' }}
                            </label>
                        </div>
                    </div>

                    <div class="input-group">
                      <v-select 
                        class="flex-grow-1 style-chooser"
                        :options="filteredBookOptions" 
                        label="label"
                        v-model="bookToAdd"
                        placeholder="Tìm kiếm sách..."
                        :clearable="false"
                      >
                        <template #option="{ label, stock, id }">
                          <div class="d-flex justify-content-between align-items-center w-100">
                            <div>
                                <i v-if="isBookInWishlist(id)" class="fas fa-heart text-danger me-2" title="Sách yêu thích"></i>
                                <span>{{ label }}</span>
                            </div>
                            <span class="badge" :class="stock > 0 ? 'bg-success-subtle text-success' : 'bg-secondary'">Kho: {{ stock }}</span>
                          </div>
                        </template>
                        
                        <template #selected-option="{ label, id }">
                            <span>
                                <i v-if="isBookInWishlist(id)" class="fas fa-heart text-danger me-1"></i> {{ label }}
                            </span>
                        </template>
                      </v-select>

                      <input type="number" class="form-control text-center fw-bold" style="max-width: 80px;" v-model="qtyToAdd" min="1">
                      
                      <button class="btn btn-success" type="button" @click="addToCart" :disabled="!bookToAdd || bookToAdd.stock <= 0">
                        <i class="fas fa-plus"></i> Thêm
                      </button>
                    </div>
                    <small class="text-muted ps-1" v-if="bookToAdd">Tồn kho: <strong>{{ bookToAdd.stock }}</strong></small>
                  </div>
                </div>

                <div class="table-responsive border rounded bg-white" style="min-height: 200px;">
                  <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                      <tr>
                        <th>Tên sách</th>
                        <th width="120" class="text-center">Số lượng</th>
                        <th>Ghi chú sách</th>
                        <th width="50"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in cart" :key="index">
                        <td>
                          <div class="fw-bold">
                              <i v-if="isBookInWishlist(item.MaSach)" class="fas fa-heart text-danger me-1 small"></i>
                              {{ item.TenSach }}
                          </div>
                          <small class="text-muted font-monospace">{{ item.MaSachCode }}</small>
                        </td>
                        <td>
                          <input 
                            type="number" 
                            class="form-control form-control-sm text-center" 
                            v-model="item.SoLuong" 
                            min="1" 
                            :max="item.stockMax"
                            @change="validateCartItem(item)"
                          >
                        </td>
                        <td>
                          <input type="text" class="form-control form-control-sm" v-model="item.GhiChu" placeholder="..." >
                        </td>
                        <td class="text-center">
                          <button class="btn btn-sm text-danger" @click="removeFromCart(index)">
                            <i class="fas fa-times"></i>
                          </button>
                        </td>
                      </tr>
                      <tr v-if="cart.length === 0">
                        <td colspan="4" class="text-center text-muted py-5">
                           <i class="fas fa-book-open mb-2 fs-3 d-block opacity-25"></i>
                           Chưa có sách nào được chọn
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div v-if="cartError" class="alert alert-danger py-2 mt-2 small animate__animated animate__shakeX">
                    <i class="fas fa-exclamation-circle me-1"></i> {{ cartError }}
                </div>
              </div>
            </div>

            <div class="modal-footer pe-0 mt-3 pt-3 border-top-0">
              <button type="button" class="btn btn-light" @click="closeModal">Huỷ bỏ</button>
              <button type="submit" class="btn btn-primary px-4 fw-bold shadow-sm" :disabled="cart.length === 0">
                <i class="fas fa-paper-plane me-2"></i> Gửi yêu cầu mượn
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
import borrowService from '@/services/borrowService';
import bookService from '@/services/bookService';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import Swal from 'sweetalert2';

const props = defineProps({ show: Boolean });
const emit = defineEmits([ 'close','success']);

// --- STORES ---
const authStore = useAuthStore();
const wishlistStore = useWishlistStore();

// --- STATE ---
const modalRef = ref(null);
const formRef = ref(null);
let modalInstance = null;

const allBooks = ref([]);
const cart = ref([]);
const bookToAdd = ref(null);
const qtyToAdd = ref(1);
const cartError = ref('');

// State cho Wishlist Filter
const showWishlistOnly = ref(false);

// Lấy thông tin user hiện tại để hiển thị readonly
const currentUserLabel = computed(() => {
    const u = authStore.user;
    return u ? `${u.fullName} (${u.MaDocGia || u.username})` : 'Đang tải...';
});

// --- FETCH DATA ---
const fetchData = async () => {
  try {
    // 1. Lấy tất cả sách (dùng api public hoặc user)
    const resBooks = await bookService.getAllBooks({ limit: 3000 }); 
    allBooks.value = resBooks.books.map(b => ({ 
      label: b.TenSach, 
      id: b._id, 
      code: b.MaSach, 
      stock: b.SoQuyenConLai 
    }));

    // 2. Đảm bảo Wishlist đã được load
    if (authStore.isAuthenticated) {
        await wishlistStore.fetchWishlist();
    }
  } catch (e) { console.error('Error fetching data:', e); }
};

// --- LOGIC WISHLIST & FILTER BOOK ---

// Kiểm tra sách có trong wishlist không
const isBookInWishlist = (bookId) => {
    // wishlistStore.items chứa array các object { MaSach: { _id, ... } }
    // Cần check xem bookId có nằm trong list này không
    return wishlistStore.items.some(item => item.MaSach?._id === bookId || item.MaSach === bookId);
};

// Filter options cho Dropdown
const filteredBookOptions = computed(() => {
    if (showWishlistOnly.value) {
        // Chỉ trả về sách có trong wishlist
        return allBooks.value.filter(b => isBookInWishlist(b.id));
    }
    // Trả về tất cả
    return allBooks.value;
});

// --- CART LOGIC ---
const addToCart = () => {
  if (!bookToAdd.value) return;
  cartError.value = '';

  if (bookToAdd.value.stock < qtyToAdd.value) {
    Swal.fire('Hết hàng', `Sách này chỉ còn ${bookToAdd.value.stock} quyển!`, 'warning');
    return;
  }

  const existing = cart.value.find(i => i.MaSach === bookToAdd.value.id);
  if (existing) {
    if (existing.SoLuong + qtyToAdd.value > bookToAdd.value.stock) {
        Swal.fire('Lỗi', 'Tổng số lượng vượt quá tồn kho!', 'warning');
        return;
    }
    existing.SoLuong += qtyToAdd.value;
  } else {
    cart.value.push({
      MaSach: bookToAdd.value.id,
      TenSach: bookToAdd.value.label,
      MaSachCode: bookToAdd.value.code,
      SoLuong: qtyToAdd.value,
      stockMax: bookToAdd.value.stock,
      GhiChu: ''
    });
  }
  // Reset
  bookToAdd.value = null;
  qtyToAdd.value = 1;
};

const removeFromCart = (idx) => cart.value.splice(idx, 1);

const validateCartItem = (item) => {
  if (item.stockMax && item.SoLuong > item.stockMax) {
    Swal.fire('Cảnh báo', `Vượt quá số lượng tồn kho (${item.stockMax})`, 'warning');
    item.SoLuong = item.stockMax;
  }
};

// --- MODAL CONTROL ---
watch(() => props.show, async (val) => {
  if (val) {
    modalInstance?.show();
    await fetchData();
    
    // Reset Form
    cart.value = [];
    cartError.value = '';
    showWishlistOnly.value = false;
    
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    // Initial Values (Status auto pending, MaDocGia lấy từ authStore)
    if (formRef.value) {
        formRef.value.resetForm({
            values: {
                NgayMuon: today,
                NgayTraDuKien: nextWeek,
                GhiChu: ''
            }
        });
    }
  } else {
    modalInstance?.hide();
  }
});

// --- SUBMIT ---
const schema = yup.object({
  NgayMuon: yup.date().required('Ngày mượn là bắt buộc'),
  NgayTraDuKien: yup.date().required('Hạn trả là bắt buộc').min(yup.ref('NgayMuon'), 'Hạn trả phải sau ngày mượn'),
});

const submitBorrow = async (values) => {
  if (cart.value.length === 0) {
    cartError.value = 'Vui lòng chọn ít nhất 1 quyển sách';
    return;
  }

  // Payload chuẩn bị gửi
  const payload = {
    ...values,
    MaDocGia: authStore.user._id, // LẤY ID USER HIỆN TẠI
    status: 'pending',            // LUÔN LUÔN LÀ PENDING
    ChiTietMuon: cart.value.map(item => ({
        MaSach: item.MaSach,
        SoLuong: item.SoLuong,
        GhiChu: item.GhiChu,
        DaTra: 0
    }))
  };
  console.log(payload);
  try {
    await borrowService.createBorrow(payload); // Hoặc borrowService.createBorrow
    Swal.fire('Thành công', 'Yêu cầu mượn sách đã được gửi đi!', 'success');
    emit('success');
    closeModal();
  } catch (err) {
    Swal.fire('Lỗi', err.response?.data?.message || 'Có lỗi xảy ra', 'error');
  }
};
const closeModal = () => emit('close');

onMounted(() => { 
  if (modalRef.value) modalInstance = new Modal(modalRef.value); 
});
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }

/* Tùy chỉnh Vue Select */
:deep(.style-chooser .vs__dropdown-toggle) {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 0.375rem 0.5rem;
  min-height: 38px;
  background-color: #fff;
}
:deep(.style-chooser .vs__search::placeholder) { color: #6c757d; }
:deep(.style-chooser .vs__dropdown-menu) { 
    z-index: 1060; 
    border-radius: 0.5rem; 
    box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15); 
}
</style>