import axios, { AxiosInstance } from 'axios';
import { Whale, WhaleListResponse, WhaleSearchResult, WhaleAnalytics } from '../models/whale.model';
import { logger } from '../utils/logger';

/**
 * Service to interact with Whale Tracker REST API
 * Makes HTTP calls to the local API endpoints
 */
export class WhaleService {
  private api: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000/api/whales') {
    this.baseUrl = baseUrl;
    this.api = axios.create({
      baseURL: baseUrl,
      timeout: 30000, // 30 second timeout
    });
  }

  /**
   * Get top N whales
   */
  async getTopWhales(limit: number = 50): Promise<WhaleListResponse> {
    try {
      logger.info(`🐋 Fetching top ${limit} whales from API...`);
      const response = await this.api.get(`/top?limit=${limit}`);
      return response.data.data;
    } catch (error) {
      logger.error(`Failed to get top whales`, error);
      throw error;
    }
  }

  /**
   * Search whale by address
   */
  async searchWhale(address: string): Promise<WhaleSearchResult> {
    try {
      logger.info(`🔍 Searching whale: ${address.substring(0, 10)}...`);
      const response = await this.api.get(`/search?address=${address}`);
      return response.data.data;
    } catch (error) {
      logger.error(`Failed to search whale ${address}`, error);
      throw error;
    }
  }

  /**
   * Get full whale analytics
   */
  async getAnalytics(): Promise<WhaleAnalytics> {
    try {
      logger.info('📊 Fetching whale analytics...');
      const response = await this.api.get('/analytics');
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get analytics', error);
      throw error;
    }
  }

  /**
   * Get quick stats from cache
   */
  async getStats(): Promise<any> {
    try {
      logger.info('⚡ Fetching quick stats...');
      const response = await this.api.get('/stats');
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get stats', error);
      throw error;
    }
  }

  /**
   * Refresh cache (admin only)
   */
  async refreshCache(): Promise<any> {
    try {
      logger.info('🔄 Refreshing whale cache...');
      const response = await this.api.post('/refresh');
      return response.data;
    } catch (error) {
      logger.error('Failed to refresh cache', error);
      throw error;
    }
  }
}

let instance: WhaleService;

/**
 * Get singleton instance of WhaleService
 */
export function getWhaleService(): WhaleService {
  if (!instance) {
    // Use localhost for internal API calls
    const baseUrl = process.env.WHALE_API_URL || 'http://localhost:3000/api/whales';
    instance = new WhaleService(baseUrl);
  }
  return instance;
}
