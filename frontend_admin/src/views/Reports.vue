<template>
  <div class="container-fluid p-0">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="h3 mb-0 text-gray-800">Báo Cáo & Thống Kê</h2>
      <button class="btn btn-sm btn-outline-secondary" @click="loadReports">
        <i class="fas fa-sync-alt me-1"></i> Làm mới
      </button>
    </div>

    <div class="row g-4">
      <div class="col-lg-6">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-header bg-white py-3 border-bottom border-primary border-3">
            <h6 class="m-0 fw-bold text-primary"><i class="fas fa-book-open me-2"></i>Top 5 Sách Mượn Nhiều Nhất</h6>
          </div>
          <div class="card-body p-0">
            <table class="table table-hover table-striped mb-0 align-middle">
              <thead class="table-light">
                <tr>
                  <th class="ps-4">#</th>
                  <th>Tên Sách</th>
                  <th>Mã Sách</th>
                  <th class="text-center">Lượt mượn</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(book, index) in topBooks" :key="index">
                  <td class="ps-4 fw-bold text-muted">{{ index + 1 }}</td>
                  <td>
                    <span class="fw-bold text-dark">{{ book.TenSach }}</span>
                  </td>
                  <td class="small text-muted font-monospace">{{ book.MaSach }}</td>
                  <td class="text-center">
                    <span class="badge bg-primary rounded-pill px-3">{{ book.totalBorrowed }}</span>
                  </td>
                </tr>
                <tr v-if="topBooks.length === 0">
                  <td colspan="4" class="text-center py-4 text-muted">Chưa có dữ liệu</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="col-lg-6">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-header bg-white py-3 border-bottom border-success border-3">
            <h6 class="m-0 fw-bold text-success"><i class="fas fa-user-tag me-2"></i>Top 5 Đọc Giả Tích Cực</h6>
          </div>
          <div class="card-body p-0">
            <table class="table table-hover table-striped mb-0 align-middle">
              <thead class="table-light">
                <tr>
                  <th class="ps-4">#</th>
                  <th>Họ Tên</th>
                  <th>Mã đọc giả</th>
                  <th class="text-center">Số phiếu</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(reader, index) in topReaders" :key="index">
                  <td class="ps-4 fw-bold text-muted">{{ index + 1 }}</td>
                  <td>
                    <span class="fw-bold">{{ reader.HoTen }}</span>
                  </td>
                  <td class="small text-muted font-monospace">{{ reader.MaDocGia }}</td>
                  <td class="text-center">
                    <span class="badge bg-success rounded-pill px-3">{{ reader.borrowCount }}</span>
                  </td>
                </tr>
                <tr v-if="topReaders.length === 0">
                  <td colspan="4" class="text-center py-4 text-muted">Chưa có dữ liệu</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div class="card shadow-sm border-0 mt-4">
      <div class="card-header bg-white py-3">
        <h6 class="m-0 fw-bold text-danger"><i class="fas fa-clock me-2"></i>Cảnh báo quá hạn (Mới nhất)</h6>
      </div>
      <div class="card-body">
        <div class="alert alert-light border text-center mb-0">
           Vui lòng xem chi tiết tại trang <router-link :to="{ path: '/borrows', query: { status: 'late' } }" class="fw-bold text-decoration-none">Quản lý mượn trả</router-link> với bộ lọc "Trễ hạn".
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import adminService from '@/services/adminService';

const topBooks = ref([]);
const topReaders = ref([]);

const loadReports = async () => {
  try {
    const data = await adminService.getTopReports(); // Gọi API getTopReports
    topBooks.value = data.topBooks;
    topReaders.value = data.topReaders;
  } catch (error) {
    console.error("Lỗi tải báo cáo:", error);
  }
};

onMounted(loadReports);
</script>