<template>
  <div class="card shadow-sm border-0 sticky-top" style="top: 90px; z-index: 100;">
    <div class="card-header bg-white py-3 border-bottom">
      <h6 class="mb-0 fw-bold text-primary">
        <i class="fas fa-filter me-2"></i>Bộ Lọc & Tìm Kiếm
      </h6>
    </div>
    
    <div class="card-body">
      <div class="mb-3">
        <label for="search" class="form-label small fw-bold text-muted">Từ khóa</label>
        <div class="input-group">
          <span class="input-group-text bg-light border-end-0"><i class="fas fa-search text-muted"></i></span>
          <input
            type="text"
            class="form-control border-start-0 ps-0"
            id="search"
            v-model="localFilters.search"
            @input="debounceEmitFilters"
            placeholder="Tên sách, tác giả..."
          />
        </div>
      </div>

      <div class="mb-3">
        <label for="publisher" class="form-label small fw-bold text-muted">Nhà xuất bản</label>
        <select
          class="form-select"
          id="publisher"
          v-model="localFilters.MaNXB"
          @change="emitFilters"
          :disabled="loadingPubs"
        >
          <option value="">-- Tất cả NXB --</option>
          <option v-for="pub in publishers" :key="pub._id" :value="pub._id">
            {{ pub.TenNXB }} - {{ pub.MaNXB }}
          </option>
        </select>
        <div v-if="loadingPubs" class="text-muted small mt-1">
           <i class="fas fa-spinner fa-spin me-1"></i> Đang tải danh sách...
        </div>
      </div>

      <div class="mb-3">
        <label for="year" class="form-label small fw-bold text-muted">Năm xuất bản</label>
        <input
          type="number"
          class="form-control"
          id="year"
          v-model.number="localFilters.NamXuatBan"
          @input="debounceEmitFilters"
          placeholder="VD: 2023"
          min="1900"
        />
      </div>

      <div class="mb-4">
        <label for="sortBy" class="form-label small fw-bold text-muted">Sắp xếp theo</label>
        <select
          class="form-select"
          id="sortBy"
          v-model="localFilters.sortBy"
          @change="emitFilters"
        >
          <option value="createdAt_desc">Mới nhất</option>
          <option value="createdAt_asc">Cũ nhất</option>
          <option value="TenSach_asc">Tên sách (A-Z)</option>
          <option value="TenSach_desc">Tên sách (Z-A)</option>
        </select>
      </div>

      <button 
        class="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center" 
        @click="resetFilters"
      >
        <i class="fas fa-sync-alt me-2"></i> Đặt lại bộ lọc
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits, onMounted, defineProps, watch } from 'vue';
import bookService from '@/services/bookService'; // Dùng service lấy NXB

const props = defineProps({
  // Nhận giá trị khởi tạo từ URL (nếu user F5 trang)
  initialFilters: {
    type: Object,
    default: () => ({})
  }
});

const emits = defineEmits(['filter-change']);

const publishers = ref([]);
const loadingPubs = ref(false);
let debounceTimer = null;

const defaultFilters = {
  search: '',
  MaNXB: '',
  NamXuatBan: '',
  sortBy: 'createdAt_desc', // Backend cần xử lý logic tách chuỗi này
};

// Merge default với props truyền vào
const localFilters = ref({ ...defaultFilters, ...props.initialFilters });

// --- ACTIONS ---

const fetchPublishers = async () => {
  loadingPubs.value = true;
  try {
    // Tái sử dụng API lấy NXB
    const data  = await bookService.getPublishers();
    publishers.value = data.publishers;
  } catch (error) {
    console.error('Lỗi tải NXB:', error);
  } finally {
    loadingPubs.value = false;
  }
};

const emitFilters = () => {
  const cleanFilters = {};
  
  // Chỉ gửi các field có giá trị
  for (const key in localFilters.value) {
    if (localFilters.value[key] !== '' && localFilters.value[key] !== null) {
      cleanFilters[key] = localFilters.value[key];
    }
  }
  emits('filter-change', localFilters.value);
};

const debounceEmitFilters = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    emitFilters();
  }, 500);
};

const resetFilters = () => {
  localFilters.value = { ...defaultFilters };
  
  emitFilters();
};

// --- LIFECYCLE ---

// Đồng bộ khi props thay đổi (ví dụ user back/forward trình duyệt)
watch(() => props.initialFilters, (newVal) => {
  if (newVal) {
     // Chỉ cập nhật những field có trong url, còn lại về default
     localFilters.value = { ...defaultFilters, ...newVal };
  }
}, { deep: true });

onMounted(() => {
  fetchPublishers();
});
</script>