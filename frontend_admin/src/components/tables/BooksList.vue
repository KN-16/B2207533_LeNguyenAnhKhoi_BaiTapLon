<template>
  <div class="card shadow-sm border-0">
    <div class="card-body p-0">
      <vue-good-table
        :columns="columns"
        :rows="rows"
        :line-numbers="true"
        v-model:isLoading="isLoading"
        :pagination-options="{
          enabled: true,
          mode: 'records',
          perPage: 10,
          nextLabel: 'Tiếp',
          prevLabel: 'Trước',
          rowsPerPageLabel: 'Số dòng mỗi trang',
          ofLabel: 'trên',
        }"
        :search-options="{ enabled: true, placeholder: 'Tìm kiếm sách (Tên sách, Tác giả)...' }"
        mode="remote"
        :totalRows="totalRecords"
        @page-change="onPageChange"
        @per-page-change="onPerPageChange"
        @search="onSearch"
        @sort-change="onSortChange"
        styleClass="vgt-table striped bordered condensed"
      >
        <template #table-row="props">
          
          <span v-if="props.column.field == 'coverUrl'">
            <img
              :src="getImageUrl(props.row.coverUrl)"
              :alt="props.row.TenSach"
              class="book-cover-thumbnail"
            />
          </span>

          <span v-else-if="props.column.field == 'TenSach'">
            <div class="text-limit fw-bold text-primary">
              {{ props.row.TenSach }}
            </div>
          </span>

          <span v-else-if="props.column.field == 'TacGia'">
            <div class="text-limit">
              {{ formatListToString(props.row.TacGia) }}
            </div>
          </span>

          <span v-else-if="props.column.field == 'SoQuyen'">
            <span class="badge bg-secondary rounded-pill">
              {{ props.row.SoQuyen }}
            </span>
          </span>

          <span v-else-if="props.column.field == 'available'">
            <span
              class="badge rounded-pill"
              :class="calculateAvailable(props.row) > 0 ? 'bg-success' : 'bg-danger'"
            >
              {{ calculateAvailable(props.row) }}
            </span>
          </span>

          <span v-else-if="props.column.field == 'tags'">
            <div class="text-limit text-muted fst-italic small">
              {{ formatListToString(props.row.tags) }}
            </div>
          </span>

          <span v-else-if="props.column.field == 'actions'">
            <div class="d-flex justify-content-center gap-2">
              <button
                class="btn btn-outline-warning btn-sm"
                @click="editBook(props.row)"
                title="Chỉnh sửa"
              >
                <i class="fas fa-edit"></i>
              </button>
              <button
                class="btn btn-outline-danger btn-sm"
                @click="deleteBook(props.row)"
                :disabled="deleteLoading[props.row._id]"
                title="Xóa"
              >
                <span
                  v-if="deleteLoading[props.row._id]"
                  class="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
                <i v-else class="fas fa-trash"></i>
              </button>
            </div>
          </span>

          <span v-else class="fw-medium">
            {{ props.formattedRow[props.column.field] }}
          </span>
        </template>
        
        <template #emptystate>
          <div class="text-center p-4 text-muted">
            Không tìm thấy dữ liệu sách nào.
          </div>
        </template>

      </vue-good-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, defineEmits, defineExpose } from 'vue';
import adminService from '@/services/adminService';
import { VueGoodTable } from 'vue-good-table-next';
import 'vue-good-table-next/dist/vue-good-table-next.css';
import { debounce } from 'lodash';

const emits = defineEmits(['edit-book']);

const isLoading = ref(false);

// --- CẤU HÌNH CỘT (Fixed Width) ---
const columns = ref([
  { 
    label: 'Ảnh minh hoạ', 
    field: 'coverUrl', 
    sortable: false, 
    width: '100px', // Cố định chiều rộng ảnh
    tdClass: 'text-center align-middle',
    thClass: 'text-center'
  },
  { 
    label: 'Mã sách', 
    field: 'MaSach', 
    width: '100px',
    tdClass: 'align-middle font-monospace', // Font kiểu code cho ID
  },
  { 
    label: 'Tên sách', 
    field: 'TenSach', 
    width: '200px', // Rộng hơn cho tên
    tdClass: 'align-middle' 
  },
  { 
    label: 'Tác giả', 
    field: 'TacGia', 
    sortable: false, 
    width: '150px',
    tdClass: 'align-middle'
  },
  { 
    label: 'Số quyển', 
    field: 'SoQuyen', 
    type: 'number',
    width: '100px',
    tdClass: 'text-center align-middle',
    thClass: 'text-center'
  },
  { 
    label: 'Có thể mượn', // Cột mới
    field: 'available', 
    sortable: false, // Thường là field tính toán nên tắt sort server
    width: '120px',
    tdClass: 'text-center align-middle',
    thClass: 'text-center'
  },
  { 
    label: 'Năm', 
    field: 'NamXuatBan', 
    type: 'number',
    width: '80px',
    tdClass: 'text-center align-middle',
    thClass: 'text-center'
  },
  { 
    label: 'Tags', 
    field: 'tags', 
    sortable: false, 
    width: '150px',
    tdClass: 'align-middle'
  },
  { 
    label: 'Thao tác', // Actions -> Thao tác
    field: 'actions', 
    sortable: false, 
    width: '120px',
    tdClass: 'text-center align-middle',
    thClass: 'text-center'
  },
]);

const rows = ref([]);
const totalRecords = ref(0);
const deleteLoading = reactive({});

// Server-side pagination state
const serverParams = ref({
  page: 1,
  limit: 10,
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
});

// --- HELPER FUNCTIONS ---

// 1. Chuyển mảng thành chuỗi: ['A', 'B'] -> "A, B"
const formatListToString = (list) => {
  if (Array.isArray(list)) {
    return list.join(', ');
  }
  return list || ''; // Trả về chính nó nếu là string hoặc rỗng
};

// 2. Tính số lượng có thể mượn
const calculateAvailable = (row) => {
  // Giả sử row có totalBorrowed, nếu không có thì mặc định là 0
  return row.SoQuyenConLai;
};

// 3. Lấy ảnh
const getImageUrl = (coverUrl) => {
  const PLACEHOLDER_IMG = '/images/book-placeholder.png';
  if (!coverUrl) return PLACEHOLDER_IMG;
  if (coverUrl.startsWith('http')) return coverUrl;
  
  const baseUrl = import.meta.env.VITE_BASE_ASSET_URL || 'http://localhost:3000';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = coverUrl.startsWith('/') ? coverUrl : `/${coverUrl}`;
  return `${cleanBase}${cleanPath}`;
};

const loadItems = async () => {
  isLoading.value = true;
  try {
    const data = await adminService.getBooks(serverParams.value);
    rows.value = data.books;
    totalRecords.value = data.total;
  } catch (error) {
    console.error('Failed to fetch books:', error);
  } finally {
    isLoading.value = false;
  }
};

// --- EVENTS ---
const onPageChange = (params) => {
  serverParams.value.page = params.currentPage;
  loadItems();
};

const onPerPageChange = (params) => {
  serverParams.value.limit = params.currentPerPage;
  serverParams.value.page = 1; 
  loadItems();
};

const onSearch = (params) => {
  serverParams.value.search = params.searchTerm;
  serverParams.value.page = 1; 
  loadItems();
};

const onSortChange = (params) => {
  serverParams.value.sortBy = params[0].field;
  serverParams.value.sortOrder = params[0].type;
  loadItems();
};

// --- ACTIONS ---
const editBook = (book) => {
  emits('edit-book', book);
};

const deleteBook = async (book) => {
  if (!confirm(`Bạn có chắc chắn muốn xóa sách "${book.TenSach}"? Hành động này không thể hoàn tác.`)) return;

  deleteLoading[book._id] = true;
  try {
    await adminService.deleteBook(book._id);
    // Thay alert bằng thông báo nhẹ nhàng hơn nếu có thể, hoặc giữ alert tiếng Việt
    alert('Xóa sách thành công!'); 
    loadItems(); 
  } catch (error) {
    console.error('Failed to delete book:', error);
    alert('Lỗi khi xóa sách: ' + (error.response?.data?.message || error.message));
  } finally {
    deleteLoading[book._id] = false;
  }
};

onMounted(loadItems);
defineExpose({ loadItems });
</script>

<style scoped>
/* Style cho ảnh bìa */
.book-cover-thumbnail {
  width: 60px;
  height: 85px; /* Tỉ lệ ~ 1:1.4 chuẩn sách */
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border: 1px solid #eee;
}

/* Style cắt chữ (Truncate) đa dòng 
   Giới hạn tối đa 3 dòng, nếu quá sẽ hiện dấu ...
   Đảm bảo không bị vỡ layout chiều dọc
*/
.text-limit {
  display: -webkit-box;
  line-clamp: 3; /* Số dòng tối đa */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal; /* Cho phép xuống dòng */
  line-height: 1.4;
  max-height: 4.2em; /* line-height * line-clamp */
}
</style>