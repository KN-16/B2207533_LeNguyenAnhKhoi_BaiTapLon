import { defineStore } from 'pinia';
import wishlistService from '@/services/wishlistService';
import Swal from 'sweetalert2';
import {useAuthStore} from './authStore';

export const useWishlistStore = defineStore('wishlist', {
  state: () => ({
    items: [],
  }),
  getters: {
    // Tính tổng số lượng sách trong list
    totalCount: (state) => state.items.reduce((sum, item) => sum + item.SoLuong, 0),
  },
  actions: {
    async fetchWishlist() {
      // 2. Khởi tạo Auth Store
      const authStore = useAuthStore(); 

      // 3. SỬA LỖI Ở ĐÂY: Dùng .isAuthenticated thay vì .isLoggedIn
      if (!authStore.isAuthenticated) { 
        console.log('User chưa đăng nhập (hoặc hết hạn token), reset wishlist.');
        this.items = [];
        return;
      }
      try {
        const data  = await wishlistService.getWishlist();
        if (data.wishlist) {
          this.items = data.wishlist.ChiTietDanhSachMuon;
        }
      } catch (e) {
        console.error('Lỗi tải wishlist', e);
      }
    },
    async addItem(bookId, quantity = 1) {
      try {
        const data = await wishlistService.addItem({ MaSach: bookId, SoLuong: quantity });
        this.items = data.wishlist.ChiTietDanhSachMuon; // Cập nhật state
        
        // Thông báo nhỏ góc màn hình
        Swal.fire({
            toast: true, position: 'top-end', icon: 'success', 
            title: 'Đã thêm vào danh sách', showConfirmButton: false, timer: 1500
        });
        return true;
      } catch (e) {
        Swal.fire('Lỗi', e.response?.data?.message || 'Thất bại', 'error');
        return false;
      }
    },
    async updateQuantity (bookId, quantity) {
      try {
        const data = await wishlistService.updateQuantity(bookId, quantity);
        this.items = data.wishlist.ChiTietDanhSachMuon; // Cập nhật state
        
        // Thông báo nhỏ góc màn hình
        Swal.fire({
            toast: true, position: 'top-end', icon: 'success', 
            title: 'Đã cập nhật số lượng', showConfirmButton: false, timer: 1500
        })
        return true;
      } catch (e) {
        console.error(e);
        Swal.fire('Lỗi', e.response?.data?.message || 'Thất bại', 'error');
        return false;
      }
    },

    async removeItem(bookId) {
      try {
        const data = await wishlistService.removeItem(bookId);
        this.items = data.wishlist.ChiTietDanhSachMuon; // Cập nhật state
        
        // Thông báo nhỏ góc màn hình
        Swal.fire({
            toast: true, position: 'top-end', icon: 'success', 
            title: 'Đã xóa khỏi danh sách', showConfirmButton: false, timer: 1500
        })
        return true;
      } catch (e) {
        Swal.fire('Lỗi', e.response?.data?.message || 'Thất bại', 'error');
        return false;
      }
    },

    async createBorrowFromWishList (payload)
    {
      try {
        const data = await wishlistService.createBorrowFromWishList(payload);
        this.items = data.wishlist.ChiTietDanhSachMuon; // Cập nhật state
        return true;
      } catch (e) {
        console.error(e);
        throw e;  
      }
    }
  }
});