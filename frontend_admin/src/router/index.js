import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/authStore';

// Layout
import AdminLayout from '@/views/AdminLayout.vue';

// Views
import AdminLogin from '@/views/AdminLogin.vue';
import Dashboard from '@/views/Dashboard.vue';
import ManageBooks from '@/views/ManageBooks.vue';
import ManagePublishers from '@/views/ManagePublishers.vue';
import ManageReaders from '@/views/ManageReaders.vue';
import ManageBorrows from '@/views/ManageBorrows.vue';
import Reports from '@/views/Reports.vue';
import NotFound from '@/views/NotFound.vue';
import AdminProfile from '@/views/AdminProfile.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: AdminLogin,
    meta: { title: 'Đăng nhập' }
  },
  {
    // Main layout for all admin-only pages
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Dashboard', component: Dashboard, meta: { title: 'Tổng quan' }},
      { path: 'books', name: 'ManageBooks', component: ManageBooks, meta: { title: 'Quản lý sách' } },
      {
        path: 'publishers',
        name: 'ManagePublishers',
        component: ManagePublishers,
        meta: { title: 'Quản lý nhà xuất bản' }
      },
      { path: 'readers', name: 'ManageReaders', component: ManageReaders , meta: { title: 'Quản lý đọc giả' }},
      { path: 'borrows', name: 'ManageBorrows', component: ManageBorrows, meta: { title: 'Quản lý mượn trả sách' }},
      { path: 'reports', name: 'Reports', component: Reports, meta: { title: 'Báo cáo' }},
      {
        path: 'profile',
        name: 'profile',
        component: AdminProfile,
        meta: { title: 'Hồ sơ cá nhân' }
      }
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  linkActiveClass: 'active',
});

// --- Admin Navigation Guard ---
router.beforeEach((to, from, next) => {
  const pageTitle = to.meta.title || 'KN16 Admin'; 
  document.title = `${pageTitle} | KN16 Library`;
  
  const authStore = useAuthStore();
  const requiresAuth = to.meta.requiresAuth;

  if (requiresAuth && !authStore.isAuthenticated) {
    // 1. Not authenticated -> Redirect to login
    next({ name: 'Login' });
  } else if (requiresAuth && !authStore.isAdmin) {
    // 2. Authenticated but NOT admin/librarian -> Logout and redirect
    authStore.logout(); // Force logout
    next({ name: 'Login' });
  } else if (to.name === 'Login' && authStore.isAuthenticated && authStore.isAdmin) {
    // 3. Logged-in admin trying to access login page -> Redirect to dashboard
    next({ name: 'Dashboard' });
  } else {
    // 4. All good
    next();
  }
});

export default router;