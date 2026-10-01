import axios from 'axios';
import { mockNotifications } from '../data/mockNotifications';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 8000,
});

const USE_MOCK = true;

export const notificationService = {
  /**
   * Fetch all user notifications
   */
  async getNotifications() {
    if (USE_MOCK) {
      return Promise.resolve([...mockNotifications]);
    }
    const { data } = await apiClient.get('/api/notifications');
    return data;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id) {
    if (USE_MOCK) {
      return Promise.resolve({ success: true, id });
    }
    const { data } = await apiClient.patch(`/api/notifications/${id}/read`);
    return data;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    if (USE_MOCK) {
      return Promise.resolve({ success: true });
    }
    const { data } = await apiClient.post('/api/notifications/mark-all-read');
    return data;
  },

  /**
   * Clear or delete notification
   */
  async deleteNotification(id) {
    if (USE_MOCK) {
      return Promise.resolve({ success: true, id });
    }
    const { data } = await apiClient.delete(`/api/notifications/${id}`);
    return data;
  },

  /**
   * Clear all notifications
   */
  async clearAll() {
    if (USE_MOCK) {
      return Promise.resolve({ success: true });
    }
    const { data } = await apiClient.delete('/api/notifications/clear');
    return data;
  },
};

export default notificationService;
