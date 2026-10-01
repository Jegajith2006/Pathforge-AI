/**
 * Skill Intelligence Service for PathForge AI
 * Manages skill diagnostics, benchmark levels, and gap telemetry.
 */

import { apiClient } from './apiClient';
import { isMockMode } from '../config/dataMode';
import { ENDPOINTS } from '../config/api';
import { mockSkills } from '../data/mockData';
import { normalizeSkills, normalizeSkill } from '../utils/normalizeSkills';

export const skillService = {
  /**
   * Fetch complete tracked skills list
   */
  async getSkills() {
    if (isMockMode()) {
      return Promise.resolve(normalizeSkills(mockSkills));
    }

    const { data } = await apiClient.get(ENDPOINTS.SKILLS.LIST);
    return normalizeSkills(data);
  },

  /**
   * Fetch skill gap matrix with priority recommendations
   */
  async getSkillGap() {
    if (isMockMode()) {
      const normalized = normalizeSkills(mockSkills);
      const gaps = normalized.filter((s) => s.gap > 0);
      return Promise.resolve({
        totalSkills: normalized.length,
        criticalGapsCount: normalized.filter((s) => s.status === 'Critical Gap').length,
        developingCount: normalized.filter((s) => s.status === 'Developing').length,
        strongCount: normalized.filter((s) => s.status === 'Strong').length,
        skills: normalized,
        gaps,
      });
    }

    const { data } = await apiClient.get(ENDPOINTS.SKILLS.GAP);
    return {
      ...data,
      skills: normalizeSkills(data.skills),
      gaps: normalizeSkills(data.gaps),
    };
  },

  /**
   * Get single skill detail
   */
  async getSkillDetail(skillId) {
    if (isMockMode()) {
      const match = mockSkills.find(
        (s) => s.name.toLowerCase() === skillId.toLowerCase() || s.id === skillId
      );
      return Promise.resolve(normalizeSkill(match || mockSkills[0]));
    }

    const { data } = await apiClient.get(ENDPOINTS.SKILLS.DETAIL(skillId));
    return normalizeSkill(data);
  },

  /**
   * Update candidate competency level
   */
  async updateSkill(skillId, updates) {
    if (isMockMode()) {
      return Promise.resolve({
        success: true,
        skill: normalizeSkill({ ...mockSkills[0], ...updates }),
      });
    }

    const { data } = await apiClient.put(ENDPOINTS.SKILLS.UPDATE(skillId), updates);
    return normalizeSkill(data);
  },
};

export default skillService;
