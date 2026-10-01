/**
 * API Health and Diagnostic Service for PathForge AI
 * Safely checks if the FastAPI / ML backend is online without spamming requests.
 */

import { apiClient } from './apiClient';
import { isMockMode } from '../config/dataMode';
import { ENDPOINTS, API_BASE_URL, hasConfiguredApiUrl } from '../config/api';

export const healthService = {
  /**
   * Ping backend health endpoint
   * @param {number} timeoutMs
   */
  async checkBackendHealth(timeoutMs = 4000) {
    if (!hasConfiguredApiUrl) {
      return {
        status: 'unconfigured',
        connected: false,
        message: 'No backend API URL (VITE_API_BASE_URL) is configured. Operating with local demo intelligence data.',
        baseURL: 'Not configured',
        timestamp: new Date().toISOString(),
      };
    }

    if (isMockMode()) {
      return {
        status: 'mock',
        connected: false,
        message: 'Running in Demo (Mock) Mode. Live backend calls are disabled.',
        baseURL: API_BASE_URL,
        timestamp: new Date().toISOString(),
      };
    }

    const startTime = performance.now();
    try {
      const response = await apiClient.get(ENDPOINTS.HEALTH, {
        timeout: timeoutMs,
      });
      const latencyMs = Math.round(performance.now() - startTime);

      return {
        status: 'connected',
        connected: true,
        message: 'Backend server is healthy and responding normally.',
        latencyMs,
        baseURL: API_BASE_URL,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        status: 'unavailable',
        connected: false,
        message: 'Unable to reach backend server at ' + API_BASE_URL,
        error: err?.message || 'Connection refused',
        latencyMs,
        baseURL: API_BASE_URL,
        timestamp: new Date().toISOString(),
      };
    }
  },
};

export default healthService;
