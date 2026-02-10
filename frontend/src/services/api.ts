import axios from 'axios';
import { WhaleListResponse, Whale, WhaleAnalytics, QuickStats, ActivityResponse, NftMetadataResponse, EnrichedWhaleResponse } from '../types/whale.types';
import { AlertRule, AlertHistory, AlertStats, CreateAlertRequest, UpdateAlertRequest } from '../types/alert.types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:6252/api/whales';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,  // 60 seconds - blockchain batch requests can take time
  headers: {
    'Content-Type': 'application/json',
  },
});

export const whaleAPI = {
  /**
   * Get top N whales - REAL DATA ONLY
   */
  getTopWhales: async (limit: number = 50): Promise<WhaleListResponse> => {
    const response = await apiClient.get(`/top?limit=${limit}&skipENS=true`);
    return response.data;
  },

  /**
   * Search whale by address
   */
  searchWhale: async (address: string): Promise<Whale | null> => {
    const response = await apiClient.get(`/search?address=${address}`);
    return response.data;
  },

  /**
   * Get full analytics
   */
  getAnalytics: async (): Promise<WhaleAnalytics> => {
    const response = await apiClient.get('/analytics');
    return response.data;
  },

  /**
   * Get quick stats
   */
  getQuickStats: async (): Promise<QuickStats> => {
    const response = await apiClient.get('/stats');
    return response.data;
  },

  /**
   * Refresh cache (admin only)
   */
  refreshCache: async (): Promise<void> => {
    await apiClient.post('/refresh');
  },

  /**
   * Get whale activity history
   */
  getWhaleActivity: async (address: string, limit: number = 50, offset: number = 0): Promise<ActivityResponse> => {
    const response = await apiClient.get(`/${address}/activity?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  /**
   * Get NFT metadata by token ID
   */
  getNftMetadata: async (tokenId: number): Promise<NftMetadataResponse> => {
    // This endpoint is at /api/nft/:tokenId, not under /api/whales
    const baseUrl = API_BASE_URL.replace('/api/whales', '');
    const response = await axios.get(`${baseUrl}/api/nft/${tokenId}`, { timeout: 30000 });
    return response.data;
  },

  /**
   * Get enriched whale data (with portfolio, ETH balance, ENS)
   */
  getWhaleEnriched: async (address: string): Promise<EnrichedWhaleResponse> => {
    const response = await apiClient.get(`/${address}/enriched`, { timeout: 60000 });
    return response.data;
  },

  /**
   * Get wallet portfolio (NFT holdings by collection)
   */
  getPortfolio: async (address: string): Promise<any> => {
    const response = await apiClient.get(`/portfolio/${address}`, { timeout: 60000 });
    return response.data;
  },

  /**
   * Search NFT by image (AI visual search)
   */
  searchByImage: async (image: File, limit: number = 10, threshold: number = 70): Promise<{
    matches: Array<{
      tokenId: number;
      name: string;
      image: string;
      similarity: number;
      hammingDistance: number;
    }>;
  }> => {
    const formData = new FormData();
    formData.append('image', image);

    const baseUrl = API_BASE_URL.replace('/api/whales', '');
    const response = await axios.post(
      `${baseUrl}/api/nft/search-by-image?limit=${limit}&threshold=${threshold}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 2 minutes for indexing
      }
    );
    return response.data;
  },
};

/**
 * Alert API - Manage price and whale alerts
 */
export const alertAPI = {
  /**
   * Get all alert rules
   */
  getRules: async (): Promise<AlertRule[]> => {
    const baseUrl = API_BASE_URL.replace('/api/whales', '');
    const response = await axios.get(`${baseUrl}/api/alerts/rules`);
    return response.data.rules;
  },

  /**
   * Get specific alert rule
   */
  getRule: async (id: string): Promise<AlertRule> => {
    const baseUrl = API_BASE_URL.replace('/api/whales', '');
    const response = await axios.get(`${baseUrl}/api/alerts/rules/${id}`);
    return response.data.rule;
  },

  /**
   * Create new alert rule
   */
  createRule: async (data: CreateAlertRequest): Promise<AlertRule> => {
    const baseUrl = API_BASE_URL.replace('/api/whales', '');
    const response = await axios.post(`${baseUrl}/api/alerts/rules`, data);
    return response.data.rule;
  },

  /**
   * Update alert rule
   */
  updateRule: async (id: string, data: UpdateAlertRequest): Promise<AlertRule> => {
    const baseUrl = API_BASE_URL.replace('/api/whales', '');
    const response = await axios.put(`${baseUrl}/api/alerts/rules/${id}`, data);
    return response.data.rule;
  },

  /**
   * Delete alert rule
   */
  deleteRule: async (id: string): Promise<void> => {
    const baseUrl = API_BASE_URL.replace('/api/whales', '');
    await axios.delete(`${baseUrl}/api/alerts/rules/${id}`);
  },

  /**
   * Toggle alert rule status
   */
  toggleRule: async (id: string): Promise<AlertRule> => {
    const baseUrl = API_BASE_URL.replace('/api/whales', '');
    const response = await axios.post(`${baseUrl}/api/alerts/rules/${id}/toggle`);
    return response.data.rule;
  },

  /**
   * Get alert statistics
   */
  getStats: async (): Promise<AlertStats> => {
    const baseUrl = API_BASE_URL.replace('/api/whales', '');
    const response = await axios.get(`${baseUrl}/api/alerts/stats`);
    return response.data.stats;
  },

  /**
   * Get alert history
   */
  getHistory: async (limit: number = 50): Promise<AlertHistory[]> => {
    const baseUrl = API_BASE_URL.replace('/api/whales', '');
    const response = await axios.get(`${baseUrl}/api/alerts/history?limit=${limit}`);
    return response.data.history;
  },

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert: async (id: string): Promise<void> => {
    const baseUrl = API_BASE_URL.replace('/api/whales', '');
    await axios.post(`${baseUrl}/api/alerts/history/${id}/acknowledge`);
  },
};

export default apiClient;
