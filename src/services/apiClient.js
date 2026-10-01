/**
 * Axios API Client for PathForge AI
 * Centralized HTTP client configured with request/response interceptors,
 * authentication placeholders, and robust error normalization.
 */

import axios from 'axios';
import { API_CONFIG } from '../config/api';

export const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    ...API_CONFIG.headers,
  },
  withCredentials: false,
});

/**
 * Request Interceptor
 * Injects Authorization header if a token is present in memory or secure storage.
 */
apiClient.interceptors.request.use(
  (config) => {
    // Auth token placeholder for future FastAPI JWT authentication
    try {
      const token = sessionStorage.getItem('pathforge_access_token');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Storage access gracefully caught
    }
    return config;
  },
  (error) => {
    return Promise.reject(normalizeApiError(error));
  }
);

/**
 * Response Interceptor
 * Centralized error transformation & token expiration handling.
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const normalized = normalizeApiError(error);

    // Placeholder for 401 Unauthorized handling (e.g. redirect to login or refresh token)
    if (error.response?.status === 401) {
      try {
        sessionStorage.removeItem('pathforge_access_token');
      } catch {
        // no-op
      }
    }

    return Promise.reject(normalized);
  }
);

/**
 * Normalize Axios/network errors into structured, user-friendly error objects.
 * Prevents raw exceptions from leaking into UI components.
 */
export function normalizeApiError(error) {
  if (axios.isAxiosError(error)) {
    // Backend returned an HTTP response with error code (4xx, 5xx)
    if (error.response) {
      const data = error.response.data;
      const status = error.response.status;
      const message =
        data?.detail ||
        data?.message ||
        (status === 404
          ? 'The requested resource was not found on the server.'
          : status === 403
          ? 'Access denied. You do not have permission for this resource.'
          : status === 500
          ? 'Internal server error in machine learning pipeline.'
          : `Server responded with status ${status}.`);

      return {
        status,
        message,
        code: data?.code || `HTTP_${status}`,
        details: data?.errors || null,
        isNetworkError: false,
      };
    }

    // Request was made but no response was received (e.g., backend offline, CORS blocked, timeout)
    if (error.request) {
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
      return {
        status: 0,
        message: isTimeout
          ? 'Request timed out waiting for ML backend server response.'
          : 'Unable to reach the PathForge API server. Backend may be offline or unreachable.',
        code: isTimeout ? 'TIMEOUT' : 'NETWORK_UNREACHABLE',
        details: null,
        isNetworkError: true,
      };
    }
  }

  // Generic or unexpected JavaScript error
  return {
    status: 500,
    message: error?.message || 'An unexpected error occurred while communicating with the server.',
    code: 'UNKNOWN_ERROR',
    details: null,
    isNetworkError: false,
  };
}

export default apiClient;
