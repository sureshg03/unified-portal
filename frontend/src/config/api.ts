// API Configuration
// Change this based on your environment
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.210.240:8000';

// Helper to get full API URL
export const getApiUrl = (path: string) => {
  const url = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${url}`;
};

// For development on localhost, use: http://localhost:8000
// For mobile/network testing, use your network IP: http://192.168.210.240:8000

console.log('🌐 API Base URL:', API_BASE_URL);
