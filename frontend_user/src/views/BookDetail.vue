<!-- <template>
  <div class="container mt-4 mb-5">
    <button class="btn btn-link text-decoration-none ps-0 mb-3" @click="$router.go(-1)">
       <i class="fas fa-arrow-left me-1"></i> Quay lại
    </button>

    <div v-if="loading" class="text-center py-5">
       <div class="spinner-border text-primary" role="status"></div>
    </div>
    
    <div v-else-if="book" class="row g-4">
       <div class="col-md-5 col-lg-4">
          <div class="card border-0 shadow-sm overflow-hidden">
             <img :src="getImageUrl(book.coverUrl)" class="img-fluid w-100" style="object-fit: cover;">
          </div>
       </div>

       <div class="col-md-7 col-lg-8">
          <h2 class="fw-bold text-primary mb-2">{{ book.TenSach }}</h2>
          <div class="mb-3 text-muted">
             <span>Mã: {{ book.MaSach }}</span> | 
             <span>Tác giả: {{ book.TacGia?.join(', ') }}</span>
          </div>

          <div class="card bg-light border-0 p-3 mb-4">
             <div class="d-flex justify-content-between align-items-center">
                <div>
                   <span class="d-block text-muted small">Tình trạng kho</span>
                   <h5 class="mb-0" :class="book.SoQuyenConLai > 0 ? 'text-success' : 'text-danger'">
                      {{ book.SoQuyenConLai > 0 ? `Còn ${book.SoQuyenConLai} quyển` : 'Hết hàng' }}
                   </h5>
                </div>
                <div class="text-end">
                   <span class="d-block text-muted small">Năm xuất bản</span>
                   <span class="fw-bold">{{ book.NamXuatBan }}</span>
                </div>
             </div>
          </div>

          <div class="mb-4" v-if="book.SoQuyenConLai > 0">
             <label class="form-label fw-bold">Số lượng mượn / Thêm:</label>
             <div class="input-group" style="width: 160px;">
                <button class="btn btn-outline-secondary" type="button" @click="decreaseQty">-</button>
                <input 
                    type="number" 
                    class="form-control text-center bg-white" 
                    v-model.number="quantity" 
                    min="1" 
                    :max="book.SoQuyenConLai"
                    @change="validateQty"
                >
                <button class="btn btn-outline-secondary" type="button" @click="increaseQty">+</button>
             </div>
             <small class="text-danger" v-if="quantity > book.SoQuyenConLai">
                Vượt quá số lượng trong kho!
             </small>
          </div>

          <div class="d-flex gap-3">
             <button 
                class="btn btn-outline-primary btn-lg px-4"
                @click="addToWishlist"
                :disabled="book.SoQuyenConLai <= 0 || quantity > book.SoQuyenConLai"
             >
                <i class="fas fa-heart me-2"></i> Thêm vào danh sách
             </button>

             <button 
                class="btn btn-primary btn-lg px-4 shadow-sm"
                @click="openBorrowModal"
                :disabled="book.SoQuyenConLai <= 0 || quantity > book.SoQuyenConLai"
             >
                <i class="fas fa-bolt me-2"></i> Đăng ký ngay
             </button>
          </div>

          <div class="mt-5">
             <h5 class="border-bottom pb-2">Mô tả chi tiết</h5>
             <p class="text-muted mt-3">
                {{ book.MoTa || 'Hiện chưa có mô tả chi tiết cho cuốn sách này.' }}
             </p>
             <div class="mt-3">
                <span v-for="tag in book.tags" :key="tag" class="badge bg-secondary me-1">#{{ tag }}</span>
             </div>
          </div>
       </div>
    </div>
    
    <QuickBorrowModal 
        :show="showModal" 
        :book="book" 
        :initial-quantity="quantity"
        @close="showModal = false"
        @success="handleSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import bookService from '@/services/bookService';
import { useWishlistStore } from '@/store/wishlistStore';
import QuickBorrowModal from '@/components/QuickBorrowModal.vue';

const route = useRoute();
const wishlistStore = useWishlistStore();

const book = ref(null);
const loading = ref(true);
const showModal = ref(false);
const quantity = ref(1); // Mặc định là 1

const fetchDetail = async () => {
    loading.value = true;
    try {
        // Giả sử API getBookById trả về object sách
        let data  = await bookService.getBookById(route.params.id);
        book.value=data.book;

        console.log(book.value);
        // Reset quantity khi load sách mới
        quantity.value = 1;
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

// --- Logic Số Lượng ---
const increaseQty = () => {
    if (book.value && quantity.value < book.value.SoQuyenConLai) {
        quantity.value++;
    }
};

const decreaseQty = () => {
    if (quantity.value > 1) {
        quantity.value--;
    }
};

const validateQty = () => {
    if (quantity.value < 1) quantity.value = 1;
    if (book.value && quantity.value > book.value.SoQuyenConLai) {
        quantity.value = book.value.SoQuyenConLai;
    }
};

// --- Actions ---
const addToWishlist = async () => {
    if (book.value) {
        await wishlistStore.addItem(book.value._id, quantity.value);
    }
};

const openBorrowModal = () => {
    showModal.value = true;
};

const handleSuccess = () => {
    fetchDetail(); // Reload để update kho
};

const getImageUrl = (url) => {
    if (!url) return '/images/book-placeholder.png';
    return url.startsWith('http') ? url : `${import.meta.env.VITE_BASE_ASSET_URL}${url}`;
};

onMounted(fetchDetail);
</script> -->


<template>
  <div class="container mt-4 mb-5">
    <nav aria-label="breadcrumb" class="mb-4">
      <button class="btn btn-link text-decoration-none ps-0 text-muted fw-bold" @click="$router.go(-1)">
        <i class="fas fa-arrow-left me-2"></i>Quay lại danh sách
      </button>
    </nav>

    <div v-if="loading" key="loading" class="text-center py-5">
       <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
       <p class="mt-3 text-muted">Đang tải thông tin sách...</p>
    </div>
    
    <div v-else-if="book" key="content" class="row g-5">
       
       <div class="col-md-5 col-lg-4">
          <div class="position-relative book-cover-container">
             <div class="card border-0 shadow-lg rounded-3 overflow-hidden">
                <img 
                    :src="getImageUrl(book.coverUrl)" 
                    class="img-fluid w-100" 
                    style="object-fit: cover; aspect-ratio: 3/4;"
                    alt="Book Cover"
                    @error="$event.target.src='/images/book-placeholder.png'"
                >
             </div>
             
             <div v-if="book.pinnedHot" class="position-absolute top-0 start-0 m-2">
                 <span class="badge bg-warning text-dark shadow-sm"><i class="fas fa-fire me-1"></i> HOT</span>
             </div>

             <div v-if="book.SoQuyenConLai <= 0" class="position-absolute top-50 start-50 translate-middle w-100 text-center">
                 <span class="badge bg-danger fs-5 shadow-sm px-4 py-2 opacity-75">HẾT HÀNG</span>
             </div>
          </div>
       </div>

       <div class="col-md-7 col-lg-8">
          <div class="pb-3 border-bottom mb-3">
              <h1 class="fw-bold text-dark mb-2 display-6">{{ book.TenSach }}</h1>
              
              <div class="d-flex align-items-center text-muted mb-3 flex-wrap gap-3">
                  <span><i class="fas fa-barcode me-1"></i> Mã: <strong>{{ book.MaSach }}</strong></span>
                  <span><i class="fas fa-user-edit me-1"></i> Tác giả: <strong>{{ book.TacGia?.join(', ') || 'Chưa cập nhật' }}</strong></span>
              </div>
              
              <div class="mt-3">
                  <div v-if="book.SoQuyenConLai > 0" class="d-inline-flex align-items-center text-success bg-success-subtle px-3 py-2 rounded-3">
                      <i class="fas fa-check-circle me-2 fs-5"></i>
                      <div>
                          <span class="d-block fw-bold lh-1">Còn hàng</span>
                          <small class="text-muted">Sẵn sàng cho mượn</small>
                      </div>
                  </div>
                  <div v-else class="d-inline-flex align-items-center text-danger bg-danger-subtle px-3 py-2 rounded-3">
                      <i class="fas fa-times-circle me-2 fs-5"></i>
                      <div>
                          <span class="d-block fw-bold lh-1">Tạm hết</span>
                          <small class="text-danger-emphasis">Vui lòng quay lại sau</small>
                      </div>
                  </div>
              </div>
          </div>

          <div class="row g-3 mb-4 text-secondary">
              <div class="col-6 col-md-4">
                  <small class="text-uppercase fw-bold text-muted" style="font-size: 0.75rem;">Nhà xuất bản</small><br>
                  <span class="text-dark">{{ book.MaNXB?.TenNXB || book.MaNXB || 'Đang cập nhật' }}</span>
              </div>
              <div class="col-6 col-md-4">
                  <small class="text-uppercase fw-bold text-muted" style="font-size: 0.75rem;">Năm xuất bản</small><br>
                  <span class="text-dark">{{ book.NamXuatBan || 'N/A' }}</span>
              </div>
              <div class="col-6 col-md-4">
                  <small class="text-uppercase fw-bold text-muted" style="font-size: 0.75rem;">Kho tổng / Còn lại</small><br>
                  <span class="text-dark fw-bold">{{ book.SoQuyen }}</span> / <span class="text-primary fw-bold">{{ book.SoQuyenConLai }}</span>
              </div>
          </div>

          <div class="bg-light p-4 rounded-3 mb-4 border">
              <div class="row align-items-end g-3">
                  <div class="col-sm-4" v-if="book.SoQuyenConLai > 0">
                      <label class="form-label fw-bold small text-uppercase text-muted">Số lượng mượn</label>
                      <div class="input-group bg-white shadow-sm rounded overflow-hidden border">
                          <button class="btn btn-link text-dark text-decoration-none border-end" type="button" @click="decreaseQty">
                              <i class="fas fa-minus small"></i>
                          </button>
                          
                          <input 
                              type="number" 
                              class="form-control text-center border-0 fw-bold" 
                              v-model="quantity" 
                              min="1" 
                              :max="book.SoQuyenConLai"
                              @change="validateQty"
                          >
                          
                          <button class="btn btn-link text-dark text-decoration-none border-start" type="button" @click="increaseQty">
                              <i class="fas fa-plus small"></i>
                          </button>
                      </div>
                  </div>

                  <div class="col-sm-8 d-flex gap-2">
                      <button 
                          class="btn btn-outline-primary flex-grow-1 py-2 fw-bold"
                          @click="addToWishlist"
                          :disabled="book.SoQuyenConLai <= 0 || quantity > book.SoQuyenConLai"
                      >
                          <i class="far fa-heart me-2"></i> Lưu lại
                      </button>

                      <button 
                          class="btn btn-primary flex-grow-1 py-2 fw-bold shadow-sm"
                          @click="openBorrowModal"
                          :disabled="book.SoQuyenConLai <= 0 || quantity > book.SoQuyenConLai || user.isBanned"
                      >
                          <i class="fas fa-bolt me-2"></i> {{ user.isBanned ? user.message_ban : 'Đăng ký mượn ngay' }}
                      </button>
                  </div>
              </div>
              
              <div v-if="quantity > book.SoQuyenConLai" key="err-stock" class="text-danger small mt-2 fw-bold">
                  <i class="fas fa-exclamation-triangle me-1"></i> Số lượng vượt quá tồn kho (Max: {{ book.SoQuyenConLai }})
              </div>
          </div>

          <div class="mb-5">
             <div v-if="book.tags && book.tags.length > 0" class="mb-3">
                <i class="fas fa-tags text-muted me-2"></i>
                <span v-for="tag in book.tags" :key="tag" class="badge bg-secondary me-2 px-2 py-1">{{ tag }}</span>
             </div>
             
             <div class="p-3 bg-white border rounded">
                <h6 class="fw-bold text-muted mb-2">Thông tin thêm</h6>
                <p class="text-muted small mb-0">
                    Sách được xuất bản năm {{ book.NamXuatBan }}. 
                    Hiện tại thư viện đang quản lý {{ book.SoQuyen }} bản in của đầu sách này.
                </p>
             </div>
          </div>
       </div>
    </div>
    
    <QuickBorrowModal 
        :show="showModal" 
        :book="book" 
        :initial-quantity="quantity"
        @close="showModal = false"
        @success="handleSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import bookService from '@/services/bookService';
import { useWishlistStore } from '@/store/wishlistStore';
import QuickBorrowModal from '@/components/QuickBorrowModal.vue';
import { useAuthStore } from '@/store/authStore';
const route = useRoute();
const wishlistStore = useWishlistStore();
const authStore = useAuthStore();
const user = authStore.user;
const book = ref(null);
const loading = ref(true);
const showModal = ref(false);
const quantity = ref(1);

const fetchDetail = async () => {
    loading.value = true;
    try {
        let data  = await bookService.getBookById(route.params.id);
        
        // Điều chỉnh tùy theo response API của bạn trả về { book: ... } hay trực tiếp object
        book.value = data.book || data; 
        
        quantity.value = 1;
    } catch (e) {
        console.error("Lỗi tải sách:", e);
    } finally {
        loading.value = false;
    }
};

// --- Logic Số lượng ---
const increaseQty = () => {
    let current = parseInt(quantity.value) || 0;
    if (book.value && current < book.value.SoQuyenConLai) {
        quantity.value = current + 1;
    }
};

const decreaseQty = () => {
    let current = parseInt(quantity.value) || 0;
    if (current > 1) {
        quantity.value = current - 1;
    }
};

const validateQty = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val) || val < 1) {
        quantity.value = 1;
        return;
    }
    if (book.value && val > book.value.SoQuyenConLai) {
        quantity.value = book.value.SoQuyenConLai;
    } else {
        quantity.value = val;
    }
};

// --- Actions ---
const addToWishlist = async () => {
    if (book.value) {
        await wishlistStore.addItem(book.value._id, quantity.value);
    }
};

const openBorrowModal = () => {
    showModal.value = true;
};

const handleSuccess = () => {
    fetchDetail(); // Reload tồn kho
};

// --- Helpers ---
const getImageUrl = (url) => {
    if (!url) return '/images/book-placeholder.png';
    return url.startsWith('http') ? url : `${import.meta.env.VITE_BASE_ASSET_URL}${url}`;
};

onMounted(fetchDetail);
</script>

<style scoped>
.book-cover-container {
    transition: transform 0.3s ease;
}
.book-cover-container:hover {
    transform: translateY(-5px);
}
/* Ẩn nút spin của input number */
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
input[type=number] {
  -moz-appearance: textfield;
}
</style>