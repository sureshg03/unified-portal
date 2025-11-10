import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 error and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Don't try to refresh if this IS the refresh endpoint failing
      if (originalRequest.url?.includes('/auth/token/refresh/')) {
        // Refresh token itself is invalid, clear auth and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
        window.location.href = '/';
        return Promise.reject(error);
      }
      
      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          // Use axios directly to avoid interceptor loop
          const refreshResponse = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { 
            refresh: refreshToken 
          });
          const { access } = refreshResponse.data;
          
          // Update stored token
          localStorage.setItem('access_token', access);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } else {
          // No refresh token available
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_info');
          window.location.href = '/';
        }
      } catch (refreshError) {
        // Token refresh failed, clear auth data and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (lscNumber: string, password: string) =>
    api.post('/auth/login/', { lscNumber, password }),

  refreshToken: (refresh: string) =>
    api.post('/auth/token/refresh/', { refresh }),

  logout: () => api.post('/auth/logout/'),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.post('/auth/change-password/', { oldPassword, newPassword }),
};

export const studentAPI = {
  getStudents: () => api.get('/students/'),
  getStudent: (id: number) => api.get(`/students/${id}/`),
  createStudent: (data: any) => api.post('/students/', data),
  updateStudent: (id: number, data: any) => api.put(`/students/${id}/`, data),
  deleteStudent: (id: number) => api.delete(`/students/${id}/`),
};

export const attendanceAPI = {
  getAttendance: () => api.get('/attendance/'),
  createAttendance: (data: any) => api.post('/attendance/', data),
  updateAttendance: (id: number, data: any) => api.put(`/attendance/${id}/`, data),
};

export const assignmentMarksAPI = {
  getMarks: () => api.get('/assignment-marks/'),
  createMark: (data: any) => api.post('/assignment-marks/', data),
  updateMark: (id: number, data: any) => api.put(`/assignment-marks/${id}/`, data),
};

export const counsellorAPI = {
  getCounsellors: () => api.get('/counsellors/'),
  createCounsellor: (data: any) => api.post('/counsellors/', data),
  updateCounsellor: (id: number, data: any) => api.put(`/counsellors/${id}/`, data),
};

export const reportsAPI = {
  getSummary: () => api.get('/reports/summary/'),
  getApplicationReport: () => api.get('/reports/application_report/'),
  getUnpaidReport: () => api.get('/reports/unpaid_report/'),
  getConfirmedReport: () => api.get('/reports/confirmed_report/'),
};

export const settingsAPI = {
  // Application Settings
  getApplicationSettings: () => api.get('/application-settings/'),
  updateApplicationSetting: (id: number, data: any) => api.put(`/application-settings/${id}/`, data),
  toggleApplicationStatus: (id: number) => api.post(`/application-settings/${id}/toggle_status/`),
  updateApplicationDeadlines: (id: number, data: any) => api.post(`/application-settings/${id}/update_deadlines/`, data),

  // System Settings
  getSystemSettings: () => api.get('/system-settings/'),
  getSystemSettingsByType: (type: string) => api.get(`/system-settings/by_type/?type=${type}`),
  updateSystemSetting: (id: number, data: any) => api.put(`/system-settings/${id}/`, data),
  createSystemSetting: (data: any) => api.post('/system-settings/', data),

  // Notification Settings
  getNotificationSettings: () => api.get('/notification-settings/'),
  updateNotificationSettings: (data: any) => api.post('/notification-settings/bulk_update/', data),
};

export const lscManagementAPI = {
  getLSCCenters: () => api.get('/auth/lsc-centers/'),
  getLSCCenter: (lscNumber: string) => api.get(`/auth/lsc-centers/${lscNumber}/`),
  createLSCCenter: (data: any) => api.post('/auth/lsc-centers/', data),
  updateLSCCenter: (lscNumber: string, data: any) => api.put(`/auth/lsc-centers/${lscNumber}/`, data),
  deleteLSCCenter: (lscNumber: string) => api.delete(`/auth/lsc-centers/${lscNumber}/`),
};

export default api;