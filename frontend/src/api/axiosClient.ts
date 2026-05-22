import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Thêm token vào header trước khi gửi request
axiosClient.interceptors.request.use(
  (config) => {
    // Không dùng hook bên trong hàm ngoài React component, dùng getState() của Zustand
    const token = useAuthStore.getState().token;
    const deviceToken = localStorage.getItem('device_token');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (deviceToken && config.headers) {
      config.headers['x-device-token'] = deviceToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Xử lý response lỗi toàn cục
axiosClient.interceptors.response.use(
  (response) => {
    return response.data; // Backend trả về cấu trúc { success, message, data }
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc sai
      useAuthStore.getState().logout();
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default axiosClient;
