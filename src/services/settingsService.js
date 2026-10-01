import axios from 'axios';
import { mockSettingsData } from '../data/mockSettings';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 8000,
});

const USE_MOCK = true;

export const settingsService = {
  /**
   * Fetch current system and user settings
   */
  async getSettings() {
    if (USE_MOCK) {
      return Promise.resolve({ ...mockSettingsData });
    }
    const { data } = await apiClient.get('/api/settings');
    return data;
  },

  /**
   * Save updated settings section
   */
  async updateSettings(section, values) {
    if (USE_MOCK) {
      return Promise.resolve({
        success: true,
        updatedSection: section,
        values,
      });
    }
    const { data } = await apiClient.patch(`/api/settings/${section}`, values);
    return data;
  },

  /**
   * Reset all candidate progress back to default demo state
   */
  async resetCandidateProgress() {
    if (USE_MOCK) {
      return Promise.resolve({ success: true, message: 'All telemetry reset to baseline' });
    }
    const { data } = await apiClient.post('/api/settings/reset');
    return data;
  },
};

export default settingsService;
