import apiClient from './api';

const getAllBooks = async (params = {}) => {
  // params: { page, limit, search, sortBy, MaNXB, etc. }
  const { data } = await apiClient.get('/sach/reader', { params });
  return data; // { success, books, page, pages, total }
};

const getBookById = async (id) => {
  const { data } = await apiClient.get(`/sach/${id}`);
  return data; // { success, book }
};

const getHotBooks = async (limit = 10) => {
  const { data } = await apiClient.get('/sach/hot', { params: { limit } });
  return data; // { success, hotBooks }
};

const getPublishers = async () => {
  const { data } = await apiClient.get('/sach/nxb');
  return data; // { success, publishers }
};

export default {
  getAllBooks,
  getBookById,
  getHotBooks,
  getPublishers,
};