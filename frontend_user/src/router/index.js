import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/authStore';
import Home from '@/views/Home.vue';
import Login from '@/views/Login.vue';
import Register from '@/views/Register.vue';
import Layout from '@/views/Layout.vue';
import BookDetail from '@/views/BookDetail.vue';
import MyBorrows from '@/views/MyBorrows.vue';
import Profile from '@/views/Profile.vue';
import Wishlist from '../views/Wishlist.vue';
import NotFound from '@/views/NotFound.vue';

const routes = [
   {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: 'Đăng nhập' }
  },
  { path: '/register', 
    name: 'Register', 
    component: Register,
    meta: { title: 'Đăng ký' }
  },
  {
  path: '/',
  component: Layout,
  meta: { requiresAuth: true },
  
  children: [
  //Main content
  { path: '/', name: 'Home', component: Home , meta: { title: 'Trang chủ' }},
  { path: '/books/:id', name: 'book-detail', component: BookDetail , meta: { title: 'Chi tiết sách' }},
  { path: '/wishlist', name: 'Wishlist', component: Wishlist , meta: { title: 'Danh sách yêu thích' }},
  { path: '/myborrows', name: 'MyBorrows', component: MyBorrows, meta: { title: 'Phiếu mượn của tôi' }},
  { path: '/profile', name: 'Profile', component: Profile, meta: { title: 'Hồ sơ cá nhân' }}, 
      ]
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  linkActiveClass: 'active',
});

// --- Navigation Guard ---
router.beforeEach((to, from, next) => {
  const pageTitle = to.meta.title || 'KN16 Library';
  document.title = `${pageTitle} | KN16 Library`;
  
  const authStore = useAuthStore();
  const requiresAuth = to.meta.requiresAuth;

  if (requiresAuth && !authStore.isAuthenticated) {
    // Store the intended destination
    authStore.returnUrl = to.fullPath;
    next({ name: 'Login' });
  } else if (
    (to.name === 'Login' || to.name === 'Register') &&
    authStore.isAuthenticated
  ) {
    // Prevent logged-in users from seeing login/register pages
    next({ name: 'Home' });
  } else {
    next();
  }
});

export default router;