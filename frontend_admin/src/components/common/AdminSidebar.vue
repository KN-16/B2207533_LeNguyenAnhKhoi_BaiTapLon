<template>
  <nav id="sidebar" class="p-3 d-flex flex-column">
    <h3 class="text-center text-white border-bottom pb-3 mb-3">
      <i class="fas fa-shield-alt me-2"></i>Quản trị viên
    </h3>
    <ul class="nav nav-pills flex-column mb-auto">
      <li class="nav-item">
        <RouterLink to="/" class="nav-link text-white"
        exact-active-class="active">
          <i class="fas fa-tachometer-alt fa-fw me-2"></i>Dashboard
        </RouterLink>
      </li>
      <li class="nav-item">
        <RouterLink to="/books" class="nav-link text-white">
          <i class="fas fa-book fa-fw me-2"></i>Quản lý sách
        </RouterLink>
      </li>
      <li class="nav-item">
        <RouterLink to="/readers" class="nav-link text-white">
          <i class="fas fa-users fa-fw me-2"></i>Quản lý đọc giả
        </RouterLink>
      </li>
      <li class="nav-item">
        <RouterLink to="/publishers" class="nav-link text-white">
          <i class="fas fa-building fa-fw me-2"></i>Quản lý nhà xuất bản
        </RouterLink>
      </li>
      <li class="nav-item">
        <RouterLink to="/borrows" class="nav-link text-white">
          <i class="fas fa-list-check fa-fw me-2"></i>Quản lý mượn trả sách
        </RouterLink>
      </li>
      <li class="nav-item">
        <RouterLink to="/reports" class="nav-link text-white">
          <i class="fas fa-chart-line fa-fw me-2"></i>Báo cáo & Thống kê
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>

<style scoped>
#sidebar .nav-link {
  font-size: 1.05rem;
  padding: 0.75rem 1rem;
  transition: all 0.2s ease;
}
#sidebar .nav-link:hover {
  background-color: #495057;
}
#sidebar .nav-link.active {
  background-color: #0d6efd;
  font-weight: bold;
}
</style>