<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top" style="height: 70px;">
    <div class="container">
      
      <router-link to="/" class="navbar-brand d-flex align-items-center text-primary fw-bold">
        <i class="fas fa-book-open fa-lg me-2"></i>
        <span class="fs-4">KN16 Library</span>
      </router-link>

      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarContent">
        
        <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4">
          <li class="nav-item">
            <router-link 
              to="/" 
              class="nav-link px-3" 
              active-class="" 
              exact-active-class="active fw-bold text-primary"
            >
              <i class="fas fa-home me-1"></i> Trang chủ
            </router-link>
          </li>

          <li class="nav-item">
            <router-link to="/wishlist" class="nav-link px-3" active-class="active fw-bold text-primary">
              <i class="fas fa-heart me-1"></i> Danh sách yêu thích
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/myborrows" class="nav-link px-3" active-class="active fw-bold text-primary">
              <i class="fas fa-history me-1"></i> Phiếu mượn của tôi
            </router-link>
          </li>
        </ul>

        <ul class="navbar-nav ms-auto align-items-center gap-3">
          
          <li class="nav-item position-relative me-2">
            <router-link to="/wishlist" class="nav-link text-secondary position-relative" title="Danh sách mượn">
              <i class="fas fa-heart"></i> 
              
              <span v-if="wishlistStore.totalCount > 0" 
                    class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light">
                {{ wishlistStore.totalCount }}
                <span class="visually-hidden">sách</span>
              </span>
            </router-link>
          </li>

          <li class="nav-item dropdown" ref="dropdownRef">
            <a
              class="nav-link dropdown-toggle d-flex align-items-center cursor-pointer p-0"
              @click.prevent="toggleDropdown"
            >
              <div class="d-flex align-items-center">
                <div class="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-2 shadow-sm" style="width: 40px; height: 40px;">
                  {{ getInitials(authStore.user?.Ten) }}
                </div>
                <span class="fw-bold d-none d-lg-block text-dark">
                  {{authStore.user?.username }}
                </span>
              </div>
            </a>

            <ul 
              class="dropdown-menu dropdown-menu-end shadow border-0 mt-3 animate__animated animate__fadeIn" 
              :class="{ show: isOpen }"
            >
              <li><h6 class="dropdown-header text-muted">Tài khoản</h6></li>
              
              <li>
                <router-link to="/profile" class="dropdown-item py-2" @click="closeDropdown">
                  <i class="fas fa-id-badge me-2 text-primary"></i> Thông tin cá nhân
                </router-link>
              </li>
              <li>
                <router-link to="/myborrows" class="dropdown-item py-2" @click="closeDropdown">
                   <i class="fas fa-file-invoice me-2 text-info"></i> Lịch sử mượn
                </router-link>
              </li>
              
              <li><hr class="dropdown-divider"></li>

              <li>
                <a class="dropdown-item py-2 text-danger fw-bold" href="#" @click.prevent="handleLogout">
                  <i class="fas fa-sign-out-alt me-2"></i> Đăng xuất
                </a>
              </li>
            </ul>
          </li>

        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore'; // Store mới tạo
import Swal from 'sweetalert2';

const router = useRouter();
const authStore = useAuthStore();
const wishlistStore = useWishlistStore();

// --- LOGIC DROPDOWN ---
const isOpen = ref(false);
const dropdownRef = ref(null);

const toggleDropdown = () => (isOpen.value = !isOpen.value);
const closeDropdown = () => (isOpen.value = false);

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown();
  }
};

// --- LOGIC LOGOUT ---
const handleLogout = async () => {
  const result = await Swal.fire({
    title: 'Đăng xuất?',
    text: 'Bạn có chắc chắn muốn đăng xuất không?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Đăng xuất',
    cancelButtonText: 'Hủy'
  });

  if (result.isConfirmed) {
    closeDropdown();
    await authStore.logout();
    // Clear wishlist store local khi logout để tránh hiện số cũ
    wishlistStore.$reset();
    Swal.fire(
      {
        title: 'Đã đăng xuất',
        text: 'Bạn đã đăng xuất thành công.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      }
    ); 
    router.push('/login');
  }
};

// Helper Initials (Lấy chữ cái đầu tên)
const getInitials = (name) => {
  return name ? name.charAt(0).toUpperCase() : 'U';
};

// --- LIFECYCLE ---
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  // Tải số lượng wishlist ngay khi Header hiện ra
  if (authStore.isAuthenticated) {
     wishlistStore.fetchWishlist();
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.cursor-pointer { cursor: pointer; }

/* Custom Badge vị trí */
.badge {
  font-size: 0.7rem;
  padding: 0.35em 0.5em;
}

/* Dropdown Animation */
.dropdown-menu.show {
  display: block;
  /* Hiệu ứng trượt nhẹ */
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Link active state */
.nav-link.active {
  position: relative;
}
.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 1rem;
  right: 1rem;
  height: 3px;
  background-color: var(--bs-primary);
  border-radius: 2px;
}
</style>