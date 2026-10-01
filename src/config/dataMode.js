/**
 * PathForge AI Data Mode Switch
 * Controls whether the application operates in 'mock' mode (demo data)
 * or 'api' mode (live FastAPI / ML backend).
 */

const STORAGE_KEY = 'pathforge_data_mode';

// Read default from environment variable; default strictly to 'mock'
const ENV_DATA_MODE = (import.meta.env?.VITE_DATA_MODE || 'mock').toLowerCase();

/**
 * Get active data mode ('mock' | 'api')
 * Supports optional localStorage override for interactive developer testing
 */
export const getDataMode = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'api' || saved === 'mock') {
      return saved;
    }
  } catch {
    // localStorage might be restricted in some iframe sandboxes
  }
  return ENV_DATA_MODE === 'api' ? 'api' : 'mock';
};

/**
 * Set active data mode
 * @param {'mock' | 'api'} mode
 */
export const setDataMode = (mode) => {
  const normalized = mode === 'api' ? 'api' : 'mock';
  try {
    localStorage.setItem(STORAGE_KEY, normalized);
    window.dispatchEvent(new CustomEvent('pathforge:datamode-change', { detail: { mode: normalized } }));
  } catch (err) {
    console.warn('Unable to persist data mode to localStorage:', err);
  }
  return normalized;
};

/**
 * Helper to check if currently in mock mode
 */
export const isMockMode = () => getDataMode() === 'mock';

/**
 * Helper to check if currently in live API mode
 */
export const isApiMode = () => getDataMode() === 'api';

export const DATA_MODE = getDataMode();

export default {
  getDataMode,
  setDataMode,
  isMockMode,
  isApiMode,
};
