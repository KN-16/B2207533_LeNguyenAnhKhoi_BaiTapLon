<template>
  <footer class="bg-gray-100 border-top-primary mt-auto">
    <div class="container py-4">
      <div class="row">
        <div class="col-md-4 mb-3">
          <h5 class="fw-bold text-primary mb-2">
            <i class="fas fa-book-reader me-2"></i>KN16 Library
          </h5>
          <p class="text-muted small">
            Hệ thống quản lý thư viện hiện đại, tối ưu hóa quy trình mượn trả sách và quản lý đọc giả. Được phát triển và vận hành bởi <strong>KN16</strong>.
          </p>
          <div class="d-flex gap-3">
            <a href="#" class="text-secondary"><i class="fab fa-facebook fa-lg"></i></a>
            <a href="#" class="text-secondary"><i class="fab fa-github fa-lg"></i></a>
            <a href="#" class="text-secondary"><i class="fab fa-linkedin fa-lg"></i></a>
          </div>
        </div>

        <div class="col-md-4 mb-3">
          <h6 class="fw-bold text-dark">Liên kết</h6>
          <ul class="list-unstyled small text-muted">
            <li class="mb-1"><router-link to="/" class="text-decoration-none text-muted">Trang chủ</router-link></li>
            <li class="mb-1"><router-link to="/wishlist" class="text-decoration-none text-muted">Danh sách yêu thích</router-link></li>
            <li class="mb-1"><router-link to="/myborrows" class="text-decoration-none text-muted">Phiếu mượn của tôi</router-link></li>
          </ul>
        </div>

        <div class="col-md-4 mb-3">
          <h6 class="fw-bold text-dark">Liên hệ</h6>
          <ul class="list-unstyled small text-muted">
            <li class="mb-2">
              <i class="fas fa-map-marker-alt me-2 text-primary"></i> 
              Tòa nhà KN16, Quận 1, TP. Hồ Chí Minh
            </li>
            <li class="mb-2">
              <i class="fas fa-envelope me-2 text-primary"></i> 
              contact@kn16.dev
            </li>
            <li class="mb-2">
              <i class="fas fa-phone me-2 text-primary"></i> 
              (+84) 0909 123 456
            </li>
          </ul>
        </div>
      </div>
    </div>
    
    <div class="bg-light py-2">
      <div class="container text-center">
        <small class="text-muted">
          &copy; {{ new Date().getFullYear() }} <strong>KN16</strong>. All rights reserved.
        </small>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* Đảm bảo footer luôn nằm dưới cùng nếu nội dung ngắn */
footer {
  width: 100%;
}
</style>