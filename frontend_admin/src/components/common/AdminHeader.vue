<template>
  <nav class="navbar navbar-expand navbar-light bg-white shadow-sm" style="height: 70px;">
    <div class="container-fluid">
      <ul class="navbar-nav ms-auto">
        
        <li class="nav-item dropdown" ref="dropdownContainer">
          
          <a
            class="nav-link dropdown-toggle d-flex align-items-center cursor-pointer"
            href="#"
            id="adminUserDropdown"
            role="button"
            aria-expanded="false"
            @click.prevent="toggleDropdown"
          >
            <div class="d-flex align-items-center">
              <div class="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-2" style="width: 35px; height: 35px;">
                <i class="fas fa-user-shield"></i>
              </div>
              <span class="fw-bold">{{ authStore.user?.username || 'Admin' }}</span>
            </div>
          </a>

          <ul 
            class="dropdown-menu dropdown-menu-end shadow border-0 mt-2" 
            :class="{ show: isOpen }"
            aria-labelledby="adminUserDropdown"
          >
            <li>
              <router-link 
                to="/profile"
                class="dropdown-item py-2"
                @click="closeDropdown"
              >
                <i class="fas fa-id-card me-2 text-primary"></i> Thông tin cá nhân
              </router-link>
            </li>
            
            <li><hr class="dropdown-divider"></li>

            <li>
              <a class="dropdown-item py-2 text-danger" href="#" @click.prevent="handleLogout">
                <i class="fas fa-sign-out-alt me-2"></i> Đăng xuất
              </a>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
// KHÔNG CẦN IMPORT BOOTSTRAP JS Ở ĐÂY NỮA

const authStore = useAuthStore();
const router = useRouter();

// --- LOGIC ĐIỀU KHIỂN MỚI ---
const isOpen = ref(false);
const dropdownContainer = ref(null); // Ref để xác định vùng dropdown

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const closeDropdown = () => {
  isOpen.value = false;
};

// Hàm đóng menu khi click ra ngoài
const handleClickOutside = (event) => {
  // Nếu dropdown đang mở VÀ click không nằm trong vùng dropdownContainer
  if (isOpen.value && dropdownContainer.value && !dropdownContainer.value.contains(event.target)) {
    closeDropdown();
  }
};

const handleLogout = async () => {
  const result = await Swal.fire({
    icon: 'question',
    title: 'Đăng xuất',
    text: 'Bạn chắc chắn muốn đăng xuất?',
    showCancelButton: true,
    confirmButtonText: 'Xác nhận',
    cancelButtonText: 'Hủy',
  });
  if (!result.isConfirmed) return;
  await authStore.logout();
  closeDropdown();
};

// Lắng nghe sự kiện click toàn trang
onMounted(() => {
  window.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.dropdown-menu {
  min-width: 200px;
  border-radius: 0.5rem;
}
/* CSS bắt buộc để hiện menu khi Vue thêm class show */
.dropdown-menu.show {
  display: block;
  animation: fadeIn 0.2s ease-out;
}
.nav-item.dropdown {
  position: relative;
}

.dropdown-menu-end {
  right: 0 !important;
  left: auto !important;
  transform: translateX(0) !important;
}

.dropdown-menu {
  min-width: 200px;
  border-radius: 0.5rem;

  /* Ngăn tràn màn hình */
  max-width: calc(100vw - 20px);
  overflow-wrap: break-word;
}

.dropdown-menu.show {
  display: block;
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>