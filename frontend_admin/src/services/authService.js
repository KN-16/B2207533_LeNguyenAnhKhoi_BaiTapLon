import apiClient from './api';

const login = async (identifier, password) => {
  const { data } = await apiClient.post('/auth/login', { identifier, password, role: 'admin'});
  return data; // { success, user, accessToken }
};

const logout = async () => {
  const { data } = await apiClient.post('/auth/logout');
  return data;
};

const getProfile = async () => {
  const { data } = await apiClient.get('/auth/profile');
  return data; // { success, user }
};

const updateProfile = async payload => {
  const {data} = await apiClient.put('/auth/profile', payload);
  return data;
  }

export default {
  login,
  logout,
  getProfile,
  updateProfile,
};