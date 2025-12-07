<template>
  <div class="container mt-4">
    <div class="p-4 p-md-5 mb-4 text-white rounded bg-primary bg-gradient shadow-sm position-relative overflow-hidden">
      <div class="col-md-7 px-0 position-relative" style="z-index: 2;">
        <h1 class="display-4 fst-italic fw-bold">Thư viện KN16</h1>
        <p class="lead my-3">Khám phá thế giới tri thức với hàng ngàn đầu sách hấp dẫn. Đăng ký mượn sách trực tuyến ngay hôm nay!</p>
      </div>
      <i class="fas fa-book-reader position-absolute text-white opacity-25" style="font-size: 300px; right: -50px; bottom: -50px;"></i>
    </div>
    
    <hr class="my-4 text-muted" />

    <div class="row">
      <div class="col-lg-3 mb-4">
        <BookFilter 
          :initial-filters="route.query" 
          @filter-change="handleFilterChange" 
        />
      </div>

      <div class="col-lg-9">
        <div class="d-flex justify-content-between align-items-center mb-3 bg-white p-3 rounded shadow-sm border">
          <h5 class="mb-0 fw-bold text-primary">
            <i class="fas fa-book me-2"></i>Tất cả sách
          </h5>
          <span class="badge bg-light text-dark border">
             Tìm thấy {{ pagination.total || 0 }} kết quả
          </span>
        </div>

        <div v-if="loading" class="text-center py-5">
           <div class="spinner-border text-primary" role="status"></div>
           <p class="mt-2 text-muted">Đang tải dữ liệu sách...</p>
        </div>

        <div v-else-if="books.length === 0" class="alert alert-info text-center py-5 shadow-sm border-0">
          <i class="fas fa-search fa-3x mb-3 text-info opacity-50"></i>
          <h5 class="fw-bold">Không tìm thấy sách nào!</h5>
          <p class="text-muted">Vui lòng thử lại với từ khóa hoặc bộ lọc khác.</p>
        </div>

        <div v-else>
          <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4">
            <div class="col" v-for="book in books" :key="book._id">
              <div class="card h-100 shadow-sm border-0 book-card cursor-pointer"
                 @click="goToDetail(book._id)" >
                 
                 <div class="position-relative overflow-hidden bg-white border-bottom" style="height: 260px;">
                    <img 
                      :src="getImageUrl(book.coverUrl)" 
                      class="card-img-top w-100 h-100 p-2" 
                      style="object-fit: contain;" 
                      :alt="book.TenSach"
                      @error="$event.target.src='/images/book-placeholder.png'" 
                    >
                    <div class="position-absolute top-0 end-0 m-2">
                        <span v-if="book.SoQuyenConLai > 0" class="badge bg-success bg-gradient shadow-sm">
                           Còn {{ book.SoQuyenConLai }}
                        </span>
                        <span v-else class="badge bg-danger bg-gradient shadow-sm">
                           <i class="fas fa-times-circle me-1"></i> Hết hàng
                        </span>
                    </div>
                 </div>

                 <div class="card-body d-flex flex-column">
                    <h6 class="card-title fw-bold text-dark text-truncate-2 mb-1" :title="book.TenSach">
                       {{ book.TenSach }}
                    </h6>
                    <p class="small text-muted mb-2 text-truncate">
                       <i class="fas fa-user-edit me-1"></i> {{ book.TacGia?.join(', ') || 'Đang cập nhật' }}
                    </p>
                    
                    <div class="mt-auto">
                       <div class="d-grid gap-2">
                          <button 
                             class="btn btn-outline-primary btn-sm fw-bold" 
                             @click.stop="addToWishlist(book)" 
                             :disabled="book.SoQuyenConLai <= 0"
                          >
                            <i class="fas fa-heart text-danger me-1"></i> Lưu lại
                          </button>
                          
                          <button 
                             class="btn btn-primary btn-sm fw-bold shadow-sm" 
                             @click.stop="openQuickBorrow(book)"
                             :disabled="book.SoQuyenConLai <= 0 || user.isBanned"
                             
                          >
                             <i class="fas fa-bolt me-1"></i> {{ user.isBanned ? user.message_ban : 'Đăng ký mượn ngay' }}
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          <nav class="mt-5 d-flex justify-content-center">
            <ul class="pagination shadow-sm">
              <li class="page-item" :class="{ disabled: pagination.page <= 1 }">
                <button class="page-link" @click="handlePageChange(pagination.page - 1)">
                   <i class="fas fa-chevron-left"></i>
                </button>
              </li>
              <li class="page-item disabled">
                 <span class="page-link fw-bold text-dark bg-light">
                    Trang {{ pagination.page }} / {{ pagination.pages }}
                 </span>
              </li>
              <li class="page-item" :class="{ disabled: pagination.page >= pagination.pages }">
                <button class="page-link" @click="handlePageChange(pagination.page + 1)">
                   <i class="fas fa-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <QuickBorrowModal 
       :show="showQuickModal" 
       :book="selectedBook" 
       @close="showQuickModal = false" 
       @success="handleBorrowSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import { useAuthStore} from '@/store/authStore';
// Services & Stores
import bookService from '@/services/bookService';
import { useWishlistStore } from '@/store/wishlistStore'; // <--- SỬA TÊN IMPORT

// Components
import BookFilter from '@/components/BookFilter.vue';
import QuickBorrowModal from '@/components/QuickBorrowModal.vue';
const authStore = useAuthStore();
const user = authStore.user;
const route = useRoute();
const router = useRouter();
const wishlistStore = useWishlistStore(); // <--- SỬA TÊN BIẾN

const books = ref([]);
const loading = ref(true);
const limit = 12;

// Modal State
const showQuickModal = ref(false);
const selectedBook = ref(null);

// Filter State
const filters = reactive({
  page: 1,
  limit: limit,
  search: route.query.search || '',
  ...route.query
});

const pagination = ref({ page: 1, pages: 1, total: 0 });

// --- FETCH DATA ---
const fetchBooks = async () => {
  loading.value = true;
  try {
    const params = {};
    Object.keys(filters).forEach(key => {
       if (filters[key]) params[key] = filters[key];
    });
    await router.replace({ query: params });

    const  data  = await bookService.getAllBooks(params);
    books.value = data.books;
    pagination.value = { 
        page: data.page, 
        pages: data.pages, 
        total: data.total 
    };
  } catch (e) {
    console.error("Lỗi tải sách:", e);
  } finally {
    loading.value = false;
  }
};

// --- HANDLERS ---
const handleFilterChange = (newFilters) => {
  Object.assign(filters, newFilters, { page: 1 });
};

const handlePageChange = (p) => {
  if (p > 0 && p <= pagination.value.pages) {
      filters.page = p;
      window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// --- LOGIC WISHLIST & BORROW ---

const addToWishlist = async (book) => { // <--- ĐỔI TÊN HÀM CHO HỢP LÝ
  try {
    // Gọi action addItem từ store (Mặc định thêm 1 cuốn)
    await wishlistStore.addItem(book._id, 1);
    
    // Swal thông báo đã có sẵn trong store, không cần gọi lại ở đây
    // Trừ khi bạn muốn custom thông báo riêng
  } catch (e) {
    console.error(e);
  }
};

const openQuickBorrow = (book) => {
   selectedBook.value = book;
   showQuickModal.value = true;
};

const handleBorrowSuccess = () => {
   fetchBooks(); 
};

// --- HELPERS ---

const goToDetail = (bookId) => {
  // Chuyển hướng sang trang chi tiết với params id
  router.push({ name: 'book-detail', params: { id: bookId } });
};

const getImageUrl = (url) => {
  if (!url) return '/images/book-placeholder.png';
  if (url.startsWith('http')) return url;
  const baseUrl = import.meta.env.VITE_BASE_ASSET_URL || 'http://localhost:3000';
  // Xử lý dấu / thừa thiếu
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
};

const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p);

// --- WATCH & INIT ---
watch(filters, fetchBooks, { deep: true });

onMounted(fetchBooks);
</script>

<style scoped>
.book-card {
  transition: transform 0.2s, box-shadow 0.2s;
}
.book-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
}
.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.4em; 
}
.cursor-pointer {
  cursor: pointer;
}
</style>