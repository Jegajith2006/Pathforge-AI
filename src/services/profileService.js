import axios from 'axios';
import { mockProfileData } from '../data/mockProfile';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 8000,
});

const USE_MOCK = true;

export const profileService = {
  /**
   * Fetch current user profile
   */
  async getProfile() {
    if (USE_MOCK) {
      return Promise.resolve({ ...mockProfileData });
    }
    const { data } = await apiClient.get('/api/profile');
    return data;
  },

  /**
   * Update profile information
   */
  async updateProfile(updates) {
    if (USE_MOCK) {
      return Promise.resolve({
        success: true,
        profile: { ...mockProfileData, ...updates },
      });
    }
    const { data } = await apiClient.put('/api/profile', updates);
    return data;
  },
};

export default profileService;
