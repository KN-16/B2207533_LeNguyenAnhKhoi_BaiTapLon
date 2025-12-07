import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import router from "@/router";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// ----------------------------
// 1. REQUEST INTERCEPTOR
// ----------------------------
apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = authStore.accessToken;

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ----------------------------
// 2. RESPONSE INTERCEPTOR
// ----------------------------
let isRefreshing = false;
let queue = [];

// Helper: queue processor
const processQueue = (error, token = null) => {
  queue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token);
  });
  queue = [];
};

apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const authStore = useAuthStore();
    const originalRequest = error.config;

    if (originalRequest.url.includes('/auth/login')) {
        return Promise.reject(error);
    }

    // Only handle 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // CASE 1: Refreshing in progress → queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // CASE 2: First request → start refresh
      isRefreshing = true;

      try {
        // IMPORTANT: Use axios (NOT apiClient)
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = data.accessToken;

        // Save token
        authStore.refreshToken(newToken);

        // Resolve queued requests
        processQueue(null, newToken);

        // Update header & retry original
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        // REFRESH FAILED → Session expired
        processQueue(refreshError, null);

        if (router.currentRoute.value.path === '/login') {
        return Promise.reject(refreshError);
         }

        authStore.clearAuth();

        Swal.fire({
        icon: 'warning',
        title: 'Hết phiên làm việc',
        text: 'Vui lòng đăng nhập lại.',
        confirmButtonText: 'Đồng ý'
        }).then(() => {
            router.push('/login');
        });

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Other errors
    return Promise.reject(error);
  }
);

export default apiClient;