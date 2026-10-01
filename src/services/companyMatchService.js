import axios from 'axios';
import {
  companyMatchData,
  availableCompanies,
  companyRolesMap,
  getCompanyMatch as getLocalCompanyMatch,
} from '../data/companyMatchData';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000';

const companyApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Flag to switch between live API calls and mock data (mock by default for Stage 9)
const USE_MOCK = true;

export const companyMatchService = {
  /**
   * Fetch all company-role opportunities
   */
  async getAllOpportunities() {
    if (USE_MOCK) {
      return Promise.resolve([...companyMatchData]);
    }
    const { data } = await companyApiClient.get('/api/company-match/opportunities');
    return data;
  },

  /**
   * Fetch single company-role match intelligence
   */
  async getCompanyRoleMatch(companyName, roleTitle) {
    if (USE_MOCK) {
      const result = getLocalCompanyMatch(companyName, roleTitle);
      return Promise.resolve(result);
    }
    const { data } = await companyApiClient.get('/api/company-match/compare', {
      params: { company: companyName, role: roleTitle },
    });
    return data;
  },

  /**
   * Get list of top companies available for selection
   */
  async getAvailableCompanies() {
    if (USE_MOCK) {
      return Promise.resolve(availableCompanies);
    }
    const { data } = await companyApiClient.get('/api/company-match/companies');
    return data;
  },

  /**
   * Get roles for a specific company
   */
  async getRolesForCompany(companyName) {
    if (USE_MOCK) {
      return Promise.resolve(companyRolesMap[companyName] || []);
    }
    const { data } = await companyApiClient.get(`/api/company-match/companies/${companyName}/roles`);
    return data;
  },
};

export default companyMatchService;
