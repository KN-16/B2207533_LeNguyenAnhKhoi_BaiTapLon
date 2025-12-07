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
          rowsPerPageLabel: 'Dòng mỗi trang',
          ofLabel: 'trên',
        }"
        :search-options="{ enabled: true, placeholder: 'Tìm kiếm đọc giả (Tên, Email, Mã)...' }"
        mode="remote"
        :totalRows="totalRecords"
        @page-change="onPageChange"
        @per-page-change="onPerPageChange"
        @search="onSearch"
        styleClass="vgt-table striped bordered condensed"
      >
        <template #table-row="props">
          <span v-if="props.column.field == 'HoTen'">
            <span class="fw-bold text-primary">{{ props.row.HoLot }} {{ props.row.Ten }}</span>
          </span>
          
          <span v-else-if="props.column.field == 'Phai'">
            <span class="badge" :class="props.row.Phai === 'Nam' ? 'bg-info' : 'bg-warning text-dark'">
              {{ props.row.Phai }}
            </span>
          </span>

          <span v-else-if="props.column.field == 'NgaySinh'">
            {{ formatDate(props.row.NgaySinh) }}
          </span>

          <span v-else-if="props.column.field == 'actions'">
            <div class="d-flex justify-content-center gap-2">
              <button class="btn btn-outline-warning btn-sm" @click="editReader(props.row)" title="Sửa">
                <i class="fas fa-edit"></i>
              </button>
              <button 
                class="btn btn-outline-danger btn-sm" 
                @click="deleteReader(props.row)" 
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
          <div class="text-center p-4 text-muted">Không có dữ liệu đọc giả.</div>
        </template>
      </vue-good-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, defineExpose } from 'vue';
import adminService from '@/services/adminService';
import { VueGoodTable } from 'vue-good-table-next';
import 'vue-good-table-next/dist/vue-good-table-next.css';
import Swal from 'sweetalert2';

const emit = defineEmits(['edit-reader']);

const isLoading = ref(false);
const rows = ref([]);
const totalRecords = ref(0);
const deleteLoading = reactive({});
const serverParams = ref({ page: 1, limit: 10, search: '' });

const columns = ref([
  { label: 'Mã Đọc Giả', field: 'MaDocGia', width: '140px', tdClass: 'fw-bold font-monospace' },
  { label: 'Họ và Tên', field: 'HoTen', sortable: false, width: '180px' }, // Field ảo để custom hiển thị
  { label: 'Giới tính', field: 'Phai', width: '100px', tdClass: 'text-center', thClass: 'text-center' },
  { label: 'Email', field: 'email' },
  { label: 'SĐT', field: 'DienThoai', width: '120px' },
  { label: 'Ngày sinh', field: 'NgaySinh', width: '120px', tdClass: 'text-center', thClass: 'text-center' },
  { label: 'Thao tác', field: 'actions', sortable: false, width: '100px', tdClass: 'text-center', thClass: 'text-center' },
]);

const loadReaders = async () => {
  isLoading.value = true;
  try {
    const data = await adminService.getReaders(serverParams.value);
    rows.value = data.readers;
    totalRecords.value = data.total;
  } catch (error) {
    console.error('Lỗi tải danh sách:', error);
  } finally {
    isLoading.value = false;
  }
};

const onPageChange = (p) => { serverParams.value.page = p.currentPage; loadReaders(); };
const onPerPageChange = (p) => { serverParams.value.limit = p.currentPerPage; serverParams.value.page = 1; loadReaders(); };
const onSearch = (p) => { serverParams.value.search = p.searchTerm; serverParams.value.page = 1; loadReaders(); };

const editReader = (reader) => {
  emit('edit-reader', reader);
};

const deleteReader = async (reader) => {
  const result = await Swal.fire({
    title: 'Xác nhận xoá?',
    text: `Bạn có chắc muốn xoá đọc giả "${reader.HoLot} ${reader.Ten}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Xoá ngay',
    cancelButtonText: 'Huỷ'
  });

  if (result.isConfirmed) {
    deleteLoading[reader._id] = true;
    try {
      await adminService.deleteReader(reader._id);
      await Swal.fire('Đã xoá!', 'Đọc giả đã bị xoá.', 'success');
      loadReaders();
    } catch (error) {
      Swal.fire('Lỗi', error.response?.data?.message || 'Không thể xoá', 'error');
    } finally {
      deleteLoading[reader._id] = false;
    }
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

onMounted(loadReaders);
defineExpose({ loadReaders });
</script>