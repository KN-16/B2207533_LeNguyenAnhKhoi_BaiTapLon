import apiClient from './api';

// --- Dashboard ---
const getStats = async () => {
  const { data } = await apiClient.get('/admin/stats');
  return data; // { success, stats, borrowsByDay }
};

// --- Books ---
const getBooks = async (params = {}) => {
  const { data } = await apiClient.get('/admin/sach', { params });
  return data; // { success, books, page, pages, total }
};

const getBookById = async (id) => {
  const { data } = await apiClient.get(`/admin/sach/${id}`);
  return data;
};

const createBook = async (formData) => {
  const { data } = await apiClient.post('/admin/sach', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

const updateBook = async (id, formData) => {
  const { data } = await apiClient.put(`/admin/sach/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

const deleteBook = async (id) => {
  const { data } = await apiClient.delete(`/admin/sach/${id}`);
  return data;
};

// --- Publishers ---
const getPublishers = async () => {
  const { data } = await apiClient.get('/admin/nxb');
  return data; // { success, publishers }
};

const createPublisher = async (publisherData) => {
  const { data } = await apiClient.post('/admin/nxb', publisherData);
  return data;
};

const updatePublisher = async (id, publisherData) => {
  const { data } = await apiClient.put(`/admin/nxb/${id}`, publisherData);
  return data;
};

const deletePublisher = async (id) => {
  const { data } = await apiClient.delete(`/admin/nxb/${id}`);
  return data;
};

// --- Readers ---
const getReaders = async (params = {}) => {
  const { data } = await apiClient.get('/admin/docgia', { params });
  return data; // { success, readers, page, pages, total }
};

const deleteReader = async (id) => {
  const { data } = await apiClient.delete(`/admin/docgia/${id}`);
  return data;
};
const createReader = async (data) => {
  return apiClient.post('/admin/docgia', data);
};
const updateReader = async (id, data) => {
  return apiClient.put(`/admin/docgia/${id}`, data);
};

// --- Borrows ---
const getBorrows = async (params = {}) => {
  const { data } = await apiClient.get('/admin/muon', { params });
  return data; // { success, records, page, pages, total }
};

const updateBorrow = async (id, data) => {
  return await apiClient.put(`/admin/muon/${id}`, data);
};

const createBorrow = async (data) => {
  return await apiClient.post('/muon', data);
};

const returnBook = async (id, data) => {
  return await apiClient.put(`/admin/muon/${id}/return`, data);
};

// --- Reports ---
const getHotBooksReport = async () => {
  const { data } = await apiClient.get('/admin/report/hot-books');
  return data;
};

const getTopReports = async () => {
  const { data } = await apiClient.get('/admin/report/top');
  return data;
};


export default {
  getStats,
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getPublishers,
  createPublisher,
  updatePublisher,
  deletePublisher,
  getReaders,
  deleteReader,
  createReader,
  updateReader,
  getBorrows,
  updateBorrow,
  createBorrow,
  returnBook,
  getHotBooksReport,
  getTopReports,
};