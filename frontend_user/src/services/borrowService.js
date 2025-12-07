import apiClient from './api';

const createBorrow = async (payload) => {
    // data: { MaDocGia, ChiTietMuon, NgayMuon, NgayTraDuKien, status: 'pending', GhiChu }
    const { data } = await apiClient.post('/muon', payload);
    return data;
};

const getMyBorrows = async (params = {}) => {
  const { data } = await apiClient.get('/muon', { params });
  return data; // { success, borrows }
};

const cancelBorrow = async (id, GhiChu) => {
  const { data } = await apiClient.put(`/muon/${id}/cancel`, { GhiChu });
  return data;
};

export default {
  getMyBorrows,
  createBorrow,
  cancelBorrow,
};