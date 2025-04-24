import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = (email, password) =>
  api.post('/login', { email, password }).then((res) => res.data);

export const getReports = () => // No department param needed
  api.get('/reports').then((res) => res.data);

export const updateReportStatus = (id, status) =>
  api.patch(`/report/${id}`, { status }).then((res) => res.data);

export const verifyStudent = (id) =>
api.post('/verify', { id }).then((res) => res.data);