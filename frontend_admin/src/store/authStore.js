import { defineStore } from 'pinia';
import authService from '@/services/authService';
import router from '@/router';
import Swal from 'sweetalert2';

const USER_KEY = 'admin_user'; 
const TOKEN_KEY = 'admin_token';

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch (e) {
    return null;
  }
};

const getStoredToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};
export { USER_KEY, TOKEN_KEY };

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: getStoredUser(),
    accessToken: getStoredToken(),
    isLoggingOut: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.user && !!state.accessToken,
    isAdmin: (state) =>
      state.user?.role === 'admin' || state.user?.role === 'librarian',
  },
  actions: {
    async login(identifier, password) {
      try {
        const { user, accessToken } = await authService.login(
          identifier,
          password
        );

        // --- CRITICAL SECURITY CHECK ---
        // Ensure the user has an admin role
        if (user.role !== 'admin' && user.role !== 'librarian') {
          throw new Error('Access Denied: Reader accounts are not permitted.');
        }
        
        this.setAuth(user, accessToken);
        Swal.fire({
          icon: 'success',
          title: 'Đăng nhập',
          text: 'Đăng nhập thành công',
          timer: 1500,
          showConfirmButton: false,
        });
        router.push('/');

      } catch (error) {
        this.clearAuth();
        throw error; // Re-throw to be caught by component
      }
    },

    async logout() {
      if (this.isLoggingOut) return;
      this.isLoggingOut = true;
      try {
        await authService.logout();
        Swal.fire({
          icon: 'success',
          title: 'Đăng xuất',
          text: 'Đăng xuất thành công',
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error logging out on server, clearing client-side.", error);
      } finally {
        this.clearAuth();
        this.isLoggingOut = false;
        router.push('/login');
      }
    },

    refreshToken(accessToken) {
      this.accessToken = accessToken;
      localStorage.setItem(TOKEN_KEY, accessToken);
    },

    setAuth(user, accessToken) {
      this.user = user;
      this.accessToken = accessToken;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_KEY, accessToken);
    },

    clearAuth() {
      this.user = null;
      this.accessToken = null;
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    },
  },
});