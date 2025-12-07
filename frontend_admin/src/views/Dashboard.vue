<template>
  <div class="container-fluid p-0">
    <h2 class="mb-4 fw-bold text-gray-800">Tổng Quan Hệ Thống</h2>

    <div class="row g-4 mb-4">
      <div class="col-xl-3 col-md-6">
        <div class="card border-0 shadow-sm h-100 border-start border-primary border-4">
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <p class="text-uppercase text-muted small fw-bold mb-1">Tổng đầu sách</p>
                <h3 class="fw-bold text-dark mb-0">{{ stats.totalBooks }}</h3>
              </div>
              <div class="icon-bg bg-primary-subtle text-primary">
                <i class="fas fa-book fa-lg"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6">
        <div class="card border-0 shadow-sm h-100 border-start border-success border-4">
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <p class="text-uppercase text-muted small fw-bold mb-1">Tổng đọc giả</p>
                <h3 class="fw-bold text-dark mb-0">{{ stats.totalReaders }}</h3>
              </div>
              <div class="icon-bg bg-success-subtle text-success">
                <i class="fas fa-users fa-lg"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6">
        <div class="card border-0 shadow-sm h-100 border-start border-info border-4">
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <p class="text-uppercase text-muted small fw-bold mb-1">Phiếu đang mở</p>
                <h3 class="fw-bold text-dark mb-0">{{ stats.activeBorrows }}</h3>
                <small class="text-muted" style="font-size: 12px">({{ stats.totalBooksOut }} cuốn sách)</small>
              </div>
              <div class="icon-bg bg-info-subtle text-info">
                <i class="fas fa-file-contract fa-lg"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-xl-3 col-md-6">
        <div class="card border-0 shadow-sm h-100 border-start border-danger border-4">
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between">
              <div>
                <p class="text-uppercase text-muted small fw-bold mb-1">Phiếu quá hạn</p>
                <h3 class="fw-bold text-danger mb-0">{{ stats.overdueBorrows }}</h3>
              </div>
              <div class="icon-bg bg-danger-subtle text-danger">
                <i class="fas fa-exclamation-triangle fa-lg"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-lg-8">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-white py-3">
            <h6 class="m-0 fw-bold text-primary">Xu hướng mượn sách (7 ngày mới nhất được ghi nhận)</h6>
          </div>
          <div class="card-body">
            <Line v-if="chartLoaded" :data="lineChartData" :options="chartOptions" style="height: 300px;"/>
            <div v-else class="text-center py-5 text-muted">Đang tải dữ liệu...</div>
          </div>
        </div>
      </div>

      <div class="col-lg-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-white py-3">
            <h6 class="m-0 fw-bold text-success">Trạng thái phiếu mượn</h6>
          </div>
          <div class="card-body d-flex align-items-center justify-content-center">
             <Doughnut v-if="chartLoaded" :data="doughnutChartData" :options="doughnutOptions" style="max-height: 250px;" />
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import adminService from '@/services/adminService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'vue-chartjs';

// Đăng ký components cho Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const stats = ref({
  totalBooks: 0,
  totalReaders: 0,
  totalBorrows: 0,
  activeBorrows: 0,
  overdueBorrows: 0,
  totalBooksOut: 0
});

const chartLoaded = ref(false);
const lineChartData = ref(null);
const doughnutChartData = ref(null);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } }
};
const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
};

const loadStats = async () => {
  try {
    const data = await adminService.getStats(); // Gọi API getDashboardStats
    stats.value = data.stats;

    // Setup Line Chart (Trend)
    const labels = data.chartData.map(item => item._id);
    const values = data.chartData.map(item => item.count);

    lineChartData.value = {
      labels,
      datasets: [{
        label: 'Số phiếu mượn',
        backgroundColor: '#4e73df',
        borderColor: '#4e73df',
        data: values,
        tension: 0.3, // Đường cong mềm mại
        fill: false
      }]
    };

    // Setup Doughnut Chart (Status Distribution)
    // Tính % đơn giản: Quá hạn vs Đang mượn vs Đã trả
    // (Lưu ý: API cần trả về breakdown status để chính xác hơn, ở đây demo dùng số liệu có sẵn)
    doughnutChartData.value = {
      labels: ['Đang mượn', 'Quá hạn', 'Đã hoàn tất'],
      datasets: [{
        backgroundColor: ['#36b9cc', '#e74a3b', '#1cc88a'],
        data: [
            stats.value.activeBorrows - stats.value.overdueBorrows, 
            stats.value.overdueBorrows, 
            stats.value.totalBorrows - stats.value.activeBorrows
        ]
      }]
    };

    chartLoaded.value = true;
  } catch (error) {
    console.error("Lỗi tải dashboard:", error);
  }
};

onMounted(loadStats);
</script>

<style scoped>
.icon-bg {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>