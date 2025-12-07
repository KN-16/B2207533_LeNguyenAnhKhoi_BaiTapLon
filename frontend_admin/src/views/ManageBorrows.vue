<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0 text-gray-800">Quản Lý Mượn Trả Sách</h1>
      <button class="btn btn-primary" @click="openModal(null)">
        <i class="fas fa-plus me-2"></i> Đăng ký mượn mới
      </button>
    </div>

    <div class="card mb-3 shadow-sm border-0">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <input 
              v-model="serverParams.search" 
              class="form-control" 
              placeholder="Tìm theo Mã phiếu, Đọc giả, Sách..." 
              @input="debounceSearch" 
            />
          </div>
          <div class="col-md-3">
            <select v-model="serverParams.status" class="form-select" @change="loadBorrows">
              <option value="">-- Tất cả trạng thái --</option>
              <option value="pending">Chờ duyệt</option>
              <option value="borrowed">Đang mượn</option>
              <option value="returned">Đã trả</option>
              <option value="late">Trễ hạn</option>
              <option value="reject">Đã từ chối</option>
              <option value="partial_returned">Trả một phần</option>
              <option value="late_returned">Hoàn tất trả (Trễ)</option>
              <option value="cancel">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="card shadow-sm border-0">
      <div class="card-body p-0">
        <vue-good-table
          :columns="columns"
          :rows="rows"
          mode="remote"
          v-model:isLoading="isLoading"
          :totalRows="totalRecords"
          :pagination-options="{
            enabled: true,
            mode: 'records',
            perPage: 10,
            nextLabel: 'Tiếp',
            prevLabel: 'Trước',
            rowsPerPageLabel: 'Dòng mỗi trang',
            ofLabel: 'trên',
          }"
          @page-change="onPageChange"
          @per-page-change="onPerPageChange"
          @sort-change="onSortChange"
          styleClass="vgt-table striped bordered condensed"
        >
          <template #table-row="props">
            
            <span v-if="props.column.field == 'MaMuonSach'">
              <span class="font-monospace fw-bold text-primary">{{ props.row.MaMuonSach }}</span>
            </span>

            <span v-else-if="props.column.field == 'DocGia'">
              <div class="fw-bold text-dark">{{ props.row.MaDocGia?.HoLot }} {{ props.row.MaDocGia?.Ten }}</div>
              <div class="small text-muted">{{ props.row.MaDocGia?.MaDocGia }}</div>
            </span>

            <span v-else-if="props.column.field == 'NgayMuon'">
              {{ formatDate(props.row.NgayMuon) }}
            </span>

            <span v-else-if="props.column.field == 'NgayTraDuKien'">
              {{ formatDate(props.row.NgayTraDuKien) }}
            </span>
            
            <span v-else-if="props.column.field == 'NgayTraThucTe'">
              {{ formatDate(props.row.NgayTraThucTe) || '-' }}
            </span>

            <span v-else-if="props.column.field == 'status'">
              <span class="badge rounded-pill" :class="getStatusBadge(props.row.status)">
                {{ getStatusText(props.row.status) }}
              </span>
            </span>

            <span v-else-if="props.column.field == 'details'">
              <button class="btn btn-sm btn-outline-secondary border-0" @click="viewDetail(props.row)" title="Xem chi tiết">
                <i class="fas fa-eye text-info fs-6"></i>
              </button>
            </span>

            <span v-else-if="props.column.field == 'actions'">
              <div class="d-flex gap-2 justify-content-center">
                
                <template v-if="props.row.status === 'pending'">
                  <button class="btn btn-sm btn-success" @click="changeStatus(props.row, 'borrowed')" title="Duyệt nhanh">
                    <i class="fas fa-check"></i>
                  </button>

                  <button class="btn btn-sm btn-danger" @click="changeStatus(props.row, 'reject')" title="Từ chối">
                    <i class="fas fa-times"></i>
                  </button>

                  <button class="btn btn-sm btn-outline-primary" @click="openModal(props.row)" title="Duyệt / Sửa thông tin">
                    <i class="fas fa-edit"></i>
                  </button>

                </template>

                <template v-if="['borrowed', 'late', 'partial_returned'].includes(props.row.status)">
                  <button class="btn btn-sm btn-success" @click="openReturnModal(props.row)" title="Trả sách">
                    <i class="fas fa-undo me-1"></i> Trả
                  </button>
                </template>

                <span v-if="['returned', 'reject', 'late_returned', 'cancel'].includes(props.row.status)" class="text-muted small">
                  <i class="fas fa-lock"></i> Đã đóng
                </span>

              </div>
            </span>

            <span v-else>
              {{ props.formattedRow[props.column.field] }}
            </span>
          </template>
          
          <template #emptystate>
            <div class="text-center p-5 text-muted">
              <i class="fas fa-inbox fa-3x mb-3 text-secondary"></i>
              <p>Không tìm thấy dữ liệu phiếu mượn nào.</p>
            </div>
          </template>
        </vue-good-table>
      </div>
    </div>

    <BorrowForm :show="showModal" :borrow-to-edit="selectedBorrow" @close="closeModal" @success="loadBorrows" />
    <ReturnForm :show="showReturnModal" :borrow-record="selectedReturn" @close="closeReturnModal" @success="loadBorrows" />
    
    <div class="modal fade" ref="detailModalRef" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content" v-if="selectedDetail">
          <div class="modal-header bg-light">
            <h5 class="modal-title">
              <i class="fas fa-info-circle me-2 text-info"></i>
              Chi tiết phiếu: <strong>{{ selectedDetail.MaMuonSach }}</strong>
            </h5>
            <button type="button" class="btn-close" @click="closeDetailModal"></button>
          </div>
          <div class="modal-body">
            <div class="row mb-4">
              <div class="col-md-6">
                <p><strong>Đọc giả:</strong> {{ selectedDetail.MaDocGia?.HoLot }} {{ selectedDetail.MaDocGia?.Ten }}</p>
                <p><strong>Ngày mượn:</strong> {{ formatDate(selectedDetail.NgayMuon) }}</p>
                <p v-if="selectedDetail.NgayTraThucTe"><strong>Ngày trả thực tế:</strong> {{ formatDate(selectedDetail.NgayTraThucTe) }}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Trạng thái:</strong> <span class="badge" :class="getStatusBadge(selectedDetail.status)">{{ getStatusText(selectedDetail.status) }}</span></p>
                <p><strong>Hạn trả:</strong> {{ formatDate(selectedDetail.NgayTraDuKien) }}</p>
              </div>
              <div class="col-12 mt-2" v-if="selectedDetail.GhiChu">
                 <div class="alert alert-warning p-2">
                    <strong><i class="fas fa-sticky-note me-1"></i> Ghi chú:</strong> {{ selectedDetail.GhiChu }}
                 </div>
              </div>
            </div>

            <h6 class="text-primary border-bottom pb-2">Danh sách sách mượn</h6>
            <table class="table table-bordered table-sm mt-2">
              <thead class="table-light">
                <tr>
                  <th>Tên sách</th>
                  <th class="text-center" width="100">Số lượng</th>
                  <th class="text-center" width="100">Đã trả</th>
                  <th>Ghi chú sách</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in selectedDetail.ChiTietMuon" :key="idx">
                  <td>
                    <div class="fw-bold">{{ item.MaSach?.TenSach || 'Sách đã bị xóa' }}</div>
                    <small class="text-muted">{{ item.MaSach?.MaSach }}</small>
                  </td>
                  <td class="text-center align-middle fw-bold">{{ item.SoLuong }}</td>
                  <td class="text-center align-middle">
                    <span :class="item.DaTra >= item.SoLuong ? 'text-success' : 'text-warning'">
                      {{ item.DaTra }}
                    </span>
                  </td>
                  <td class="align-middle">{{ item.GhiChu || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeDetailModal">Đóng</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter} from 'vue-router';
import { VueGoodTable } from 'vue-good-table-next';
import { Modal } from 'bootstrap';
import BorrowForm from '@/components/forms/BorrowForm.vue';
import ReturnForm from '@/components/forms/ReturnForm.vue';
import adminService from '@/services/adminService';
import { debounce } from 'lodash';
import Swal from 'sweetalert2';

// --- STATE ---
const isLoading = ref(false);
const rows = ref([]);
const totalRecords = ref(0);

// Modal States
const showModal = ref(false);
const selectedBorrow = ref(null);

const showReturnModal = ref(false);
const selectedReturn = ref(null);

const detailModalRef = ref(null);
let detailModalInstance = null;
const selectedDetail = ref(null);

const route=useRoute();
const router=useRouter();

const serverParams = ref({ page: 1, limit: 10, search: '', status: '' });

// Cấu hình Cột
const columns = ref([
  { label: 'Mã Phiếu', field: 'MaMuonSach', width: '120px' },
  { label: 'Đọc Giả', field: 'DocGia' },
  { label: 'Ngày Mượn', field: 'NgayMuon', tdClass: 'text-center', thClass: 'text-center' },
  { label: 'Hạn Trả', field: 'NgayTraDuKien', tdClass: 'text-center', thClass: 'text-center' },
  { label: 'Ngày Trả Thực Tế', field: 'NgayTraThucTe', tdClass: 'text-center', thClass: 'text-center' },
  { label: 'Trạng Thái', field: 'status', tdClass: 'text-center', thClass: 'text-center', width: '130px' },
  { label: 'Chi Tiết', field: 'details', sortable: false, tdClass: 'text-center',thClass: 'text-center', width: '130px' },
  { label: 'Thao Tác', field: 'actions', sortable: false, tdClass: 'text-center', thClass: 'text-center', width: '140px' },
]);

// --- API FETCH ---
const loadBorrows = async () => {
  // Close Modal
  if (showModal.value)
  {
    closeModal();
  }
  if (showReturnModal.value)
  {
    closeReturnModal();
  }
  isLoading.value = true;
  try {
    const res = await adminService.getBorrows(serverParams.value);
    rows.value = res.records;
    totalRecords.value = res.total;
  } catch (err) { console.error(err); } 
  finally { isLoading.value = false; }
};

const debounceSearch = debounce(loadBorrows, 500);

// --- MODAL ACTIONS ---
const openModal = (borrow) => {
  selectedBorrow.value = borrow;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedBorrow.value = null;
};

const openReturnModal = (borrow) => {
  selectedReturn.value = borrow;
  showReturnModal.value = true;
};

const closeReturnModal = () => {
  showReturnModal.value = false;
  selectedReturn.value = null;
};

const viewDetail = (borrow) => {
  selectedDetail.value = borrow;
  if (detailModalInstance) detailModalInstance.show();
};

const closeDetailModal = () => {
  if (detailModalInstance) detailModalInstance.hide();
  selectedDetail.value = null;
};

// Hàm chuyển trạng thái nhanh
const changeStatus = async (borrow, newStatus) => {
  try {
    let noteToSend = borrow.GhiChu || '';

    // CASE 1: TỪ CHỐI (REJECT) -> BẮT BUỘC NHẬP LÝ DO
    if (newStatus === 'reject') {
      const { value: text, isDismissed } = await Swal.fire({
        title: 'Từ chối yêu cầu?',
        input: 'textarea',
        inputLabel: 'Lý do từ chối (Bắt buộc)',
        inputPlaceholder: 'Nhập lý do...',
        inputValue: noteToSend,
        showCancelButton: true,
        confirmButtonText: 'Xác nhận từ chối',
        confirmButtonColor: '#d33',
        cancelButtonText: 'Hủy',
        inputValidator: (value) => {
          if (!value) return 'Bạn phải nhập lý do từ chối!';
        }
      });

      if (isDismissed) return; // User bấm hủy
      noteToSend = text;
    } 
    // CASE 2: DUYỆT (BORROWED) -> XÁC NHẬN ĐƠN GIẢN
    else {
      const result = await Swal.fire({
        title: 'Duyệt phiếu mượn?',
        text: `Xác nhận duyệt phiếu: ${borrow.MaMuonSach}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Duyệt ngay',
        confirmButtonColor: '#198754', // Màu xanh success
        cancelButtonText: 'Hủy'
      });

      if (!result.isConfirmed) return;
    }

    // GỌI API CẬP NHẬT
    await adminService.updateBorrow(borrow._id, { 
      status: newStatus, 
      GhiChu: noteToSend 
    });

    // Thành công
    Swal.fire({
      icon: 'success',
      title: 'Thành công',
      text: newStatus === 'reject' ? 'Đã từ chối phiếu mượn' : 'Đã duyệt phiếu mượn',
      timer: 1500,
      showConfirmButton: false
    });
    
    // Refresh bảng
    await loadBorrows();

  } catch (err) {
    console.error(err);
    Swal.fire('Lỗi', err.response?.data?.message || 'Có lỗi xảy ra', 'error');
  }
};

// --- PAGINATION EVENTS ---
const onPageChange = (params) => {
  serverParams.value.page = params.currentPage;
  loadBorrows();
};

const onPerPageChange = (params) => {
  serverParams.value.limit = params.currentPerPage;
  serverParams.value.page = 1;
  loadBorrows();
};

const onSortChange = (params) => {
  // params là mảng: [{ field: 'NgayMuon', type: 'asc' }]
  if (params && params[0]) {
    serverParams.value.sortBy = params[0].field;
    serverParams.value.sortType = params[0].type; // 'asc' hoặc 'desc'
    loadBorrows();
  }
};

// --- HELPER FUNCTIONS ---
const getStatusText = (status) => {
  const map = {
    pending: 'Chờ duyệt',
    borrowed: 'Đang mượn',
    returned: 'Hoàn tất trả',
    late: 'Trễ hạn',
    reject: 'Đã từ chối',
    partial_returned: 'Trả một phần',
    late_returned: 'Hoàn tất trả (Trễ)',
    cancel: 'Đã hủy'
  };
  return map[status] || status;
};

const getStatusBadge = (status) => {
  if (status === 'pending') return 'bg-warning text-dark';
  if (status === 'borrowed') return 'bg-primary';
  if (status === 'returned') return 'bg-success';
  if (status === 'late' || status === 'late_returned') return 'bg-danger';
  if (status === 'partial_returned') return 'bg-info text-dark';
  return 'bg-secondary';
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

// --- LIFECYCLE ---
onMounted(() => {
  if (route.query?.status) {
    serverParams.value.status = route.query.status;
    //Clear query param
    router.replace({ query: null });
  }
  loadBorrows();
  if (detailModalRef.value) {
    detailModalInstance = new Modal(detailModalRef.value);
  }
});
</script>