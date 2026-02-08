import axios from 'axios';
import { WhaleListResponse, Whale, WhaleAnalytics, QuickStats, ActivityResponse, NftMetadataResponse, EnrichedWhaleResponse } from '../types/whale.types';

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
};

export default apiClient;
