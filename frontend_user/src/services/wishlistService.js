import apiClient from './api';

const getWishlist = async () => {
    const { data } = await apiClient.get('/wishlist');
    return data;
};

const updateQuantity = async (bookId, quantity) => {
  const { data } = await apiClient.put(`/wishlist/${bookId}`, { SoLuong: quantity });
  return data;
}

const addItem = async (item) => { // { MaSach, SoLuong }
    const { data } = await apiClient.post('/wishlist/add', item);
    return data;
};

const removeItem = async (bookId) => {
  const { data } = await apiClient.delete(`/wishlist/${bookId}`);
  return data;
}

const createBorrowFromWishList = async (payload) => {
  const { data } = await apiClient.post('/wishlist/muon', payload);
  return data;
}

export default {
  addItem,
  getWishlist,
  updateQuantity,
  removeItem,
  createBorrowFromWishList
};