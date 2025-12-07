<template>
  <div class="modal fade" ref="modalRef" tabindex="-1" data-bs-backdrop="static">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="fas fa-undo me-2 text-success"></i>
            Trả sách phiếu: <strong>{{ borrowRecord?.MaMuonSach }}</strong>
          </h5>
          <button class="btn-close" @click="closeModal"></button>
        </div>
        
        <div class="modal-body" v-if="borrowRecord">
          
          <div class="alert alert-light border d-flex justify-content-between align-items-center mb-4">
            <div>
              <i class="fas fa-user-circle me-2 fs-5 text-primary"></i>
              Đọc giả: <strong>{{ borrowRecord.MaDocGia.HoLot }} {{ borrowRecord.MaDocGia.Ten }}</strong>
              <span class="text-muted ms-2">({{ borrowRecord.MaDocGia.MaDocGia }})</span>
            </div>
            <div>
              <span class="badge bg-secondary">{{ borrowRecord.ChiTietMuon.length }} đầu sách</span>
            </div>
          </div>

          <div class="row">
            <div class="col-md-8 border-end">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="text-primary mb-0">Danh sách sách cần trả</h6>
                <div class="form-check">
                  <input 
                    class="form-check-input" 
                    type="checkbox" 
                    id="returnAll" 
                    v-model="isReturnAll" 
                    @change="toggleReturnAll"
                  >
                  <label class="form-check-label fw-bold cursor-pointer" for="returnAll">
                    Trả tất cả (Hoàn tất phiếu)
                  </label>
                </div>
              </div>

              <div class="table-responsive">
                <table class="table table-bordered table-hover align-middle">
                  <thead class="table-light">
                    <tr>
                      <th>Tên sách</th>
                      <th class="text-center" width="80">Mượn</th>
                      <th class="text-center" width="80">Đã trả</th>
                      <th class="text-center" width="100">Trả thêm</th>
                      <th>Ghi chú sách</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in returnList" :key="idx">
                      <td>
                        <div class="fw-bold">{{ item.TenSach }}</div>
                        <small class="text-muted">{{ item.MaSachCode }}</small>
                      </td>
                      <td class="text-center">{{ item.SoLuong }}</td>
                      <td class="text-center text-muted">{{ item.DaTraCu }}</td>
                      
                      <td>
                         <input 
                           type="number" 
                           class="form-control form-control-sm text-center fw-bold text-primary"
                           v-model.number="item.TraThem"
                           min="0"
                           :max="item.SoLuong - item.DaTraCu"
                           :disabled="isReturnAll || (item.SoLuong ===item.DaTraCu)"
                           @input="handleInputQty(item)" 
                         />
                      </td>

                      <td>
                         <input 
                           type="text" 
                           class="form-control form-control-sm" 
                           placeholder="Tình trạng..."
                           v-model="item.GhiChu"
                           :disabled="(item.SoLuong ===item.DaTraCu)"
                         />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="col-md-4">
              <h6 class="text-primary mb-3">Thông tin bổ sung</h6>
              
              <div class="mb-3">
                <label class="form-label">Ghi chú chung phiếu mượn</label>
                <textarea class="form-control" rows="4" v-model="generalNote" placeholder="Ví dụ: Trả trễ, sách bị rách..."></textarea>
              </div>

              <div class="card bg-light border-0 mt-4">
                <div class="card-body">
                  <h6 class="card-title text-secondary">Tổng kết:</h6>
                  <ul class="list-unstyled mb-0">
                    <li>Tổng số sách mượn: <strong>{{ totalBorrowed }}</strong></li>
                    <li>Đã trả trước đó: <strong>{{ totalReturnedOld }}</strong></li>
                    <li class="mt-3 pt-3 border-top">
                       <div class="d-flex justify-content-between align-items-center">
                          <span>Đang trả lần này:</span>
                          <span class="h4 text-success mb-0">{{ totalReturning }}</span>
                       </div>
                       <small class="text-muted">cuốn sách</small>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer pe-0 mt-3 border-top-0">
            <button type="button" class="btn btn-secondary" @click="closeModal">Đóng</button>
            <button type="button" class="btn btn-success px-4" @click="submitReturn" :disabled="totalReturning === 0">
              <i class="fas fa-check me-1"></i> Xác nhận trả
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { Modal } from 'bootstrap';
import adminService from '@/services/adminService';
import Swal from 'sweetalert2';

const props = defineProps({ show: Boolean, borrowRecord: Object });
const emit = defineEmits(['close', 'success']);

const modalRef = ref(null);
let modalInstance = null;

const returnList = ref([]);
const isReturnAll = ref(false);
const generalNote = ref(''); // Ghi chú chung

// --- COMPUTED ---
const totalBorrowed = computed(() => returnList.value.reduce((sum, i) => sum + i.SoLuong, 0));
const totalReturnedOld = computed(() => returnList.value.reduce((sum, i) => sum + i.DaTraCu, 0));
const totalReturning = computed(() => returnList.value.reduce((sum, i) => sum + (parseInt(i.TraThem) || 0), 0));

// --- WATCHERS ---
watch(() => props.show, (val) => {
  if (val && props.borrowRecord) {
    modalInstance?.show();
    isReturnAll.value = false;
    generalNote.value = props.borrowRecord.GhiChu || '';
    
    // Map dữ liệu từ prop vào state local
    returnList.value = props.borrowRecord.ChiTietMuon.map(item => ({
      MaSach: item.MaSach._id,
      TenSach: item.MaSach.TenSach,
      MaSachCode: item.MaSach.MaSach,
      SoLuong: item.SoLuong,
      DaTraCu: item.DaTra || 0,
      
      // Field để nhập liệu
      TraThem: 0, 
      GhiChu: item.GhiChu || ''
    }));

  } else {
    modalInstance?.hide();
  }
});

// --- LOGIC ---

const toggleReturnAll = () => {
  if (isReturnAll.value) {
    // Điền Max
    returnList.value.forEach(item => {
      item.TraThem = item.SoLuong - item.DaTraCu;
    });
  } else {
    // Reset 0
    returnList.value.forEach(item => {
      item.TraThem = 0;
    });
  }
};

// Logic Validate Đơn Giản (Không hack DOM)
const handleInputQty = (item) => {
  const max = item.SoLuong - item.DaTraCu;
  
  // Nếu nhập quá -> Gán lại Max + Báo lỗi nhẹ
  if (item.TraThem > max) {
    item.TraThem = max;
    Swal.fire({
      toast: true,
      position: 'top',
      icon: 'warning',
      title: `Chỉ còn ${max} quyển chưa trả`,
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true
    });
  }
  
  // Nếu nhập âm -> Về 0
  if (item.TraThem < 0) {
    item.TraThem = 0;
    Swal.fire({
      toast: true,
      position: 'top',
      icon: 'warning',
      title: 'Vui lòng nhập số lớn hơn 0',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true
    });
  }
};

const submitReturn = async () => {
  // Lấy danh sách cần trả
  const itemsToReturn = returnList.value
    .filter(i => i.TraThem > 0)
    .map(i => ({ 
        MaSach: i.MaSach, 
        DaTra: i.TraThem, 
        GhiChu: i.GhiChu 
    }));

  if (itemsToReturn.length === 0) {
    Swal.fire('Chú ý', 'Vui lòng nhập số lượng sách muốn trả', 'warning');
    return;
  }

  try {
    await adminService.returnBook(props.borrowRecord._id, { 
        ChiTietTra: itemsToReturn,
        GhiChu: generalNote.value 
    });
    
    Swal.fire('Thành công', 'Trả sách thành công!', 'success');
    emit('success');
  } catch (err) {
    Swal.fire('Lỗi', err.response?.data?.message || 'Lỗi kết nối', 'error');
  }
};

const closeModal = () => emit('close');

onMounted(() => { 
  if (modalRef.value) modalInstance = new Modal(modalRef.value); 
});
</script>