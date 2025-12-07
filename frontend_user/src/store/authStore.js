import { defineStore } from 'pinia';
import authService from '@/services/authService';
import router from '@/router';

const USER_KEY = 'client_user'; // <--- Đổi tên key
const TOKEN_KEY = 'client_token'; // <--- Đổi tên key

// Helper function to get initial state from localStorage
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
    returnUrl: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.user && !!state.accessToken,
    isReader: (state) => state.user?.role === 'reader',
  },
  actions: {
    async login(identifier, password) {
      try {
        const { user, accessToken } = await authService.login(
          identifier,
          password
        );
        this.setAuth(user, accessToken);
        
        // Redirect to intended url or home
        router.push(this.returnUrl || '/');
        this.returnUrl = null;
      } catch (error) {
        this.clearAuth();
        throw error; // Re-throw to be caught by component
      }
    },

    logout() {
      try {
        authService.logout(); // Call API to invalidate refresh token
      } catch (error) {
        console.error("Error logging out on server, clearing client-side only.", error);
      } finally {
        this.clearAuth();
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

    async fetchProfile() {
      try {
        const { user } = await authService.getProfile();
        this.user = user;
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } catch (error) {
         console.error("Failed to fetch profile:", error);
         if (error.response?.status === 401) {
            this.logout();
         }
      }
    }
  },
});