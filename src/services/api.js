import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL 
    ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` 
    : '/api',
});



// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('attendx_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('attendx_token');
      localStorage.removeItem('attendx_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
