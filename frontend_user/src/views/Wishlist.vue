<template>
  <div class="container mt-4 mb-5">
    <div class="d-flex justify-content-between align-items-center mb-4 p-3 bg-white rounded shadow-sm border-start border-5 border-primary">
       <div>
           <h3 class="fw-bold text-primary mb-0"><i class="fas fa-heart me-2"></i>Danh sách yêu thích</h3>
           <small class="text-muted">Quản lý những cuốn sách bạn yêu thích - dự định mượn</small>
       </div>
       
       <button 
          class="btn btn-primary px-4 py-2 fw-bold shadow-sm" 
          :disabled="selectedIds.length === 0 || user.isBanned"
          @click="handleBorrowSelected"
       >
          <i class="fas fa-bolt me-2"></i> {{ user.isBanned ? user.message_ban : `Đăng ký mượn (${selectedIds.length})` }}
       </button>
    </div>

    <div v-if="wishlistStore.items.length === 0" class="text-center py-5 bg-light rounded border border-dashed">
       <div class="mb-3 text-muted opacity-50">
           <i class="far fa-folder-open fa-4x"></i>
       </div>
       <h5 class="text-muted fw-bold">Danh sách đang trống</h5>
       <p class="text-muted small">Hãy dạo một vòng thư viện và chọn những cuốn sách thú vị nhé!</p>
       <router-link to="/" class="btn btn-outline-primary mt-2 rounded-pill px-4">
           <i class="fas fa-search me-1"></i> Tìm sách ngay
       </router-link>
    </div>

    <div v-else class="card border-0 shadow-sm overflow-hidden">
       <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
             <thead class="bg-light text-secondary text-uppercase small fw-bold">
                <tr>
                   <th class="ps-4" style="width: 50px;">
                      <div class="form-check">
                          <input 
                             type="checkbox" 
                             class="form-check-input cursor-pointer" 
                             :checked="isAllSelected"
                             @change="toggleSelectAll"
                             :disabled="availableItems.length === 0"
                          >
                      </div>
                   </th>
                   <th style="width: 100px;" class="text-center">Ảnh bìa</th>
                   <th style="width: 35%;">Thông tin sách</th>
                   <th class="text-center" style="width: 180px;">Số lượng</th>
                   <th class="text-center" style="width: 150px;">Chi tiết</th>
                   <th class="text-end pe-4">Xóa</th>
                </tr>
             </thead>
             <tbody>
                <tr v-for="item in wishlistStore.items" :key="item._id" :class="{'bg-danger-subtle': !checkStock(item)}">
                   <td class="ps-4">
                      <div class="form-check">
                          <input 
                             type="checkbox" 
                             class="form-check-input cursor-pointer" 
                             :value="item.MaSach._id" 
                             v-model="selectedIds"
                             :disabled="!checkStock(item)"
                          >
                      </div>
                   </td>

                   <td class="text-center py-3">
                      <div class="position-relative d-inline-block">
                          <img 
                              :src="getImageUrl(item.MaSach.coverUrl)" 
                              class="rounded border bg-white shadow-sm" 
                              style="width: 60px; height: 90px; object-fit: cover;"
                          >
                          <span v-if="!checkStock(item)" class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                              <span class="visually-hidden">Hết hàng</span>
                          </span>
                      </div>
                   </td>

                   <td>
                      <h6 class="fw-bold mb-1 text-dark">
                         {{ item.MaSach.TenSach }}
                      </h6>
                      <div class="text-muted small mb-2">
                          <i class="fas fa-barcode me-1"></i> {{ item.MaSach.MaSach }}
                      </div>
                      
                      <div v-if="!checkStock(item)" class="text-danger small fw-bold p-2 bg-white rounded border border-danger border-dashed d-inline-block">
                         <i class="fas fa-exclamation-triangle me-1"></i> 
                         Kho chỉ còn {{ item.MaSach.SoQuyenConLai }}. Giảm số lượng!
                      </div>
                      <div v-else class="text-success small fw-bold">
                         <i class="fas fa-check-circle me-1"></i> Sẵn sàng (Kho: {{ item.MaSach.SoQuyenConLai }})
                      </div>
                   </td>

                   <td>
                      <div class="d-flex justify-content-center">
                          <div class="input-group input-group-sm shadow-sm" style="width: 130px;">
                             <button 
                                class="btn btn-outline-secondary border-end-0" 
                                type="button" 
                                @click="updateQty(item, -1)" 
                                :disabled="item.SoLuong <= 1"
                             >
                                <i class="fas fa-minus small"></i>
                             </button>
                             
                             <input 
                                type="number" 
                                class="form-control text-center border-start-0 border-end-0 fw-bold bg-white" 
                                :value="item.SoLuong" 
                                @change="(e) => handleManualQty(item, e.target.value)"
                                min="1"
                             >
                             
                             <button 
                                class="btn btn-outline-secondary border-start-0" 
                                type="button" 
                                @click="updateQty(item, 1)"
                             >
                                <i class="fas fa-plus small"></i>
                             </button>
                          </div>
                      </div>
                   </td>

                   <td class="text-center">
                       <button 
                          class="btn btn-sm btn-outline-info rounded-pill px-3 fw-bold" 
                          @click="openDetailModal(item.MaSach)"
                       >
                           <i class="fas fa-eye me-1"></i> Xem
                       </button>
                   </td>

                   <td class="text-end pe-4">
                      <button 
                         class="btn btn-link text-danger p-0 text-decoration-none" 
                         @click="removeItem(item.MaSach._id)"
                         data-bs-toggle="tooltip"
                         title="Xóa khỏi danh sách"
                      >
                         <i class="fas fa-trash-alt fa-lg"></i>
                      </button>
                   </td>
                </tr>
             </tbody>
          </table>
       </div>
    </div>

    <div class="modal fade" id="bookInfoModal" tabindex="-1" aria-hidden="true" ref="infoModalRef">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow" v-if="viewingBook">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title fw-bold"><i class="fas fa-book me-2"></i>Thông tin sách</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
             <div class="row g-4">
                <div class="col-4">
                   <img :src="getImageUrl(viewingBook.coverUrl)" class="img-fluid rounded shadow-sm w-100" style="object-fit: cover;">
                </div>
                <div class="col-8">
                   <h5 class="fw-bold text-primary">{{ viewingBook.TenSach }}</h5>
                   <hr class="my-2 opacity-25">
                   <p class="mb-1"><strong>Tác giả:</strong> {{ viewingBook.TacGia?.join(', ') || 'Đang cập nhật' }}</p>
                   <p class="mb-1"><strong>Năm XB:</strong> {{ viewingBook.NamXuatBan }}</p>
                   <p class="mb-1"><strong>Nhà XB:</strong> {{ viewingBook.MaNXB?.TenNXB || 'Đang cập nhật' }}</p>
                   <div class="mt-3 p-2 bg-light rounded text-muted small">
                       {{ viewingBook.MoTa || 'Hiện chưa có mô tả chi tiết.' }}
                   </div>
                </div>
             </div>
          </div>
          <div class="modal-footer">
             <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted ,nextTick} from 'vue';
import { useWishlistStore } from '@/store/wishlistStore';
import { Modal } from 'bootstrap';
import Swal from 'sweetalert2';
import { useAuthStore } from '@/store/authStore';

const authStore = useAuthStore();
const user = authStore.user;

const wishlistStore = useWishlistStore();
const selectedIds = ref([]);
const infoModalRef = ref(null);
const viewingBook = ref(null);
let infoModalInstance = null;

onMounted(() => {
    wishlistStore.fetchWishlist();
    if (infoModalRef.value) {
        infoModalInstance = new Modal(infoModalRef.value);
    }
});

// Helper Image
const getImageUrl = (url) => {
    if (!url) return '/images/book-placeholder.png';
    return url.startsWith('http') ? url : `${import.meta.env.VITE_BASE_ASSET_URL}${url}`;
};
// Helper Date
const formatDateISO = (date) => {
    return date.toISOString().split('T')[0];
};

// Check tồn kho
const checkStock = (item) => {
    if (!item.MaSach) return false;
    return item.SoLuong <= item.MaSach.SoQuyenConLai;
};

// Các item hợp lệ để Select All
const availableItems = computed(() => {
    return wishlistStore.items.filter(item => checkStock(item));
});

const isAllSelected = computed(() => {
    return availableItems.value.length > 0 && selectedIds.value.length === availableItems.value.length;
});

// Toggle Select All
const toggleSelectAll = () => {
    if (isAllSelected.value) {
        selectedIds.value = [];
    } else {
        selectedIds.value = availableItems.value.map(item => item.MaSach._id);
    }
};

// Cập nhật số lượng
const updateQty = async (item, change) => {
    const newQty = item.SoLuong + change;
    if (newQty < 1) return;
    
    await wishlistStore.updateQuantity(item.MaSach._id, newQty);

    // Nếu vượt quá kho thì bỏ tick chọn
    if (!checkStock(item) && selectedIds.value.includes(item.MaSach._id)) {
        selectedIds.value = selectedIds.value.filter(id => id !== item.MaSach._id);
    }
};

const handleManualQty = async (item, val) => {
    let qty = parseInt(val);
    if (isNaN(qty) || qty < 1) qty = 1;
    await wishlistStore.updateQuantity(item.MaSach._id, qty);
};

// Remove
const removeItem = async (id) => {
    const res = await Swal.fire({
        title: 'Xác nhận xóa?',
        text: 'Bạn có chắc muốn xóa sách này khỏi danh sách?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy'
    });
    if (res.isConfirmed) {
        await wishlistStore.removeItem(id);
        selectedIds.value = selectedIds.value.filter(itemId => itemId !== id);
    }
};

// Modal Detail
const openDetailModal = async (book) => {
    viewingBook.value = book;
    await nextTick();
    infoModalInstance?.show();
};

// --- LOGIC MƯỢN SÁCH (GỌI API BACKEND MỚI) ---
const handleBorrowSelected = async () => {
    // 1. Tính toán ngày mặc định
    const today = new Date();
    const nextWeek = new Date(new Date().setDate(today.getDate() + 7));

    // 2. Hiện Popup SweetAlert với Form HTML
    const result = await Swal.fire({
        title: 'Xác nhận mượn sách',
        html: `
            <div class="text-start">
                <p>Bạn đang đăng ký mượn <b>${selectedIds.value.length}</b> cuốn sách.</p>
                <hr class="my-2 opacity-25">
                
                <div class="mb-3">
                    <label class="form-label small fw-bold text-muted">Ngày mượn</label>
                    <input 
                        type="date" 
                        id="swal-input-start" 
                        class="form-control" 
                        value="${formatDateISO(today)}"
                        min="${formatDateISO(today)}"
                    >
                </div>
                
                <div class="mb-0">
                    <label class="form-label small fw-bold text-muted">Ngày trả (Dự kiến)</label>
                    <input 
                        type="date" 
                        id="swal-input-end" 
                        class="form-control" 
                        value="${formatDateISO(nextWeek)}"
                    >
                </div>
            </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Gửi yêu cầu',
        cancelButtonText: 'Hủy',
        focusConfirm: false,
        // preConfirm: Xử lý dữ liệu trước khi đóng popup
        preConfirm: () => {
            const startDate = document.getElementById('swal-input-start').value;
            const endDate = document.getElementById('swal-input-end').value;

            // Validate đơn giản
            if (!startDate || !endDate) {
                Swal.showValidationMessage('Vui lòng chọn đầy đủ ngày mượn và ngày trả');
                return false;
            }

            if (new Date(startDate) > new Date(endDate)) {
                Swal.showValidationMessage('Ngày trả phải sau ngày mượn');
                return false;
            }

            // Trả về dữ liệu nếu hợp lệ
            return { startDate, endDate };
        }
    });

    // Nếu user bấm Hủy
    if (!result.isConfirmed) return;

    // 3. Lấy dữ liệu từ popup và Gọi API
    try {
        const { startDate, endDate } = result.value; // Dữ liệu trả về từ preConfirm

        Swal.showLoading();
        
        const payload = {
            selectedBookIds: selectedIds.value,
            ngayMuon: new Date(startDate),    // Convert chuỗi '2023-12-05' thành Date Object
            ngayTraDuKien: new Date(endDate)
        };

        // Gọi Store Action
        await wishlistStore.createBorrowFromWishList(payload); // <--- Đảm bảo store action tên đúng nhé (check lại store của bạn)
        // Nếu dùng API trực tiếp: await apiClient.post('/muon-sach/wishlist', payload);

         // Thông báo nhỏ góc màn hình
        Swal.fire({
            toast: true, position: 'top-end', icon: 'success', 
            title: 'Đăng ký mượn sách thành công', showConfirmButton: false, timer: 1500
        });
        
        // Reload
        selectedIds.value = [];
        wishlistStore.fetchWishlist();
    } catch (error) {
        Swal.fire('Lỗi', error.response?.data?.message || 'Thất bại', 'error');
        console.error(error);
    }
};
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }

/* Ẩn spinner của input number */
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
input[type=number] {
  -moz-appearance: textfield;
}

/* Hiệu ứng hover cho hàng */
tr { transition: background-color 0.2s; }
</style>