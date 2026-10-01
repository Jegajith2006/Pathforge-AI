/**
 * Authentication Service for PathForge AI
 * Prepares the frontend for future JWT-based authentication in FastAPI.
 */

import { apiClient } from './apiClient';
import { isMockMode } from '../config/dataMode';
import { ENDPOINTS } from '../config/api';
import { mockUserData } from '../data/mockData';

export const authService = {
  /**
   * Log in candidate with email & password
   */
  async login(credentials) {
    if (isMockMode()) {
      // Mock session setup
      try {
        sessionStorage.setItem('pathforge_mock_session', 'true');
      } catch {
        // no-op
      }
      return Promise.resolve({
        success: true,
        user: mockUserData,
        token: 'mock_jwt_token_demo_mode',
      });
    }

    const { data } = await apiClient.post(ENDPOINTS.AUTH.LOGIN, credentials);
    if (data?.token) {
      try {
        sessionStorage.setItem('pathforge_access_token', data.token);
      } catch {
        // no-op
      }
    }
    return data;
  },

  /**
   * Register new candidate
   */
  async register(registrationData) {
    if (isMockMode()) {
      return Promise.resolve({
        success: true,
        user: { ...mockUserData, name: registrationData.name || mockUserData.name },
        token: 'mock_jwt_token_demo_mode',
      });
    }

    const { data } = await apiClient.post(ENDPOINTS.AUTH.REGISTER, registrationData);
    return data;
  },

  /**
   * Fetch current authenticated user
   */
  async getCurrentUser() {
    if (isMockMode()) {
      return Promise.resolve(mockUserData);
    }

    const { data } = await apiClient.get(ENDPOINTS.AUTH.ME);
    return data;
  },

  /**
   * Refresh JWT authentication token
   */
  async refreshToken() {
    if (isMockMode()) {
      return Promise.resolve({ token: 'mock_jwt_token_refreshed' });
    }

    const { data } = await apiClient.post(ENDPOINTS.AUTH.REFRESH);
    if (data?.token) {
      try {
        sessionStorage.setItem('pathforge_access_token', data.token);
      } catch {
        // no-op
      }
    }
    return data;
  },

  /**
   * Logout user and clear session
   */
  async logout() {
    try {
      sessionStorage.removeItem('pathforge_access_token');
      sessionStorage.removeItem('pathforge_mock_session');
    } catch {
      // no-op
    }

    if (isMockMode()) {
      return Promise.resolve({ success: true });
    }

    try {
      await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
    } catch {
      // no-op on logout failure
    }
    return { success: true };
  },
};

export default authService;
