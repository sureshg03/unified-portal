// Authentication utility functions
export interface UserInfo {
  id: number;
  lsc_code?: string;
  lsc_number?: string;
  lsc_name: string;
  email: string;
  is_active: boolean;
  user_type: 'admin' | 'user';
  database: string;
  is_admin?: boolean;
  is_staff?: boolean;
  center_name?: string;
  mobile?: string;
}

export const AUTH_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_INFO_KEY = 'user_info';

/**
 * Get access token from localStorage
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Get user info from localStorage
 */
export const getUserInfo = (): UserInfo | null => {
  const userInfoStr = localStorage.getItem(USER_INFO_KEY);
  if (!userInfoStr) return null;
  
  try {
    return JSON.parse(userInfoStr) as UserInfo;
  } catch (error) {
    console.error('Failed to parse user info:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  const userInfo = getUserInfo();
  return !!(token && userInfo);
};

/**
 * Check if user is an admin
 */
export const isAdmin = (): boolean => {
  const userInfo = getUserInfo();
  return userInfo?.user_type === 'admin';
};

/**
 * Check if user is a regular LSC user
 */
export const isLSCUser = (): boolean => {
  const userInfo = getUserInfo();
  return userInfo?.user_type === 'user';
};

/**
 * Get LSC code/number
 */
export const getLSCCode = (): string => {
  const userInfo = getUserInfo();
  return userInfo?.lsc_code || userInfo?.lsc_number || '';
};

/**
 * Get LSC name
 */
export const getLSCName = (): string => {
  const userInfo = getUserInfo();
  return userInfo?.lsc_name || userInfo?.center_name || 'LSC Portal';
};

/**
 * Set authentication data
 */
export const setAuthData = (accessToken: string, refreshToken: string, userInfo: UserInfo): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
};

/**
 * Clear all authentication data
 */
export const clearAuthData = (): void => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
};

/**
 * Decode JWT token (without verification)
 */
export const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

/**
 * Validate authentication and redirect if needed
 */
export const validateAuth = (): { isValid: boolean; redirectTo?: string } => {
  const token = getAccessToken();
  const userInfo = getUserInfo();
  
  if (!token || !userInfo) {
    return { isValid: false, redirectTo: '/login' };
  }
  
  if (isTokenExpired(token)) {
    clearAuthData();
    return { isValid: false, redirectTo: '/login' };
  }
  
  return { isValid: true };
};
