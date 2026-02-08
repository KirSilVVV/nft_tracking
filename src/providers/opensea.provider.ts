import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

/**
 * OpenSea API Provider
 * Fetches NFT sales data from OpenSea marketplace
 * Docs: https://docs.opensea.io/reference/api-overview
 */

interface OpenSeaSaleEvent {
  event_type: string;
  event_timestamp: number; // Unix timestamp
  transaction: string;
  seller: string;
  buyer: string;
  quantity: number;
  payment: {
    quantity: string; // In Wei
    token_address: string;
    decimals: number;
    symbol: string;
  };
  nft: {
    identifier: string; // token_id
    collection: string;
    contract: string;
    token_standard: string;
    name: string;
    image_url: string;
  };
}

interface OpenSeaEventsResponse {
  asset_events: OpenSeaSaleEvent[];
  next: string | null;
}

interface OpenSeaCollectionStats {
  total: {
    volume: number;
    sales: number;
    num_owners: number;
    market_cap: number;
    floor_price: number;
    floor_price_symbol: string;
    average_price: number;
  };
  intervals: Array<{
    interval: string; // "one_day", "seven_day", "thirty_day"
    volume: number;
    volume_diff: number;
    volume_change: number;
    sales: number;
    sales_diff: number;
    average_price: number;
  }>;
}

export interface CollectionStats {
  // Total (all-time)
  totalVolume: number;
  totalSales: number;
  totalOwners: number;
  marketCap: number;
  floorPrice: number;
  floorPriceSymbol: string;
  avgPrice: number;

  // 24h stats
  volume24h: number;
  sales24h: number;
  avgPrice24h: number;

  // 7d stats
  volume7d: number;
  sales7d: number;
  avgPrice7d: number;

  // 30d stats
  volume30d: number;
  sales30d: number;
  avgPrice30d: number;
}

export interface NFTSaleEvent {
  tokenId: number;
  priceETH: number;
  priceUSD: number;
  from: string;
  to: string;
  timestamp: string;
  txHash: string;
  eventType: 'sale' | 'transfer';
}

export class OpenSeaProvider {
  private client: AxiosInstance;
  private readonly baseURL = 'https://api.opensea.io/api/v2';
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENSEA_API_KEY || '';

    if (!this.apiKey) {
      logger.warn('OpenSea API key not found. Using fallback data.');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-API-KEY': this.apiKey,
        'Accept': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Fetch sales events for a specific NFT collection
   * @param contractAddress - NFT contract address
   * @param limit - Number of events to fetch (max 300 per request)
   */
  async getCollectionSales(
    contractAddress: string,
    limit: number = 100
  ): Promise<NFTSaleEvent[]> {
    try {
      if (!this.apiKey) {
        logger.warn('No OpenSea API key - returning empty sales data');
        return [];
      }

      logger.info(`Fetching ${limit} sales events from OpenSea for contract ${contractAddress}`);

      // OpenSea API v2 endpoint: /api/v2/events/collection/{slug}
      const response = await this.client.get<OpenSeaEventsResponse>(
        '/events/collection/mutant-ape-yacht-club',
        {
          params: {
            event_type: 'sale',
            limit: Math.min(limit, 50), // OpenSea v2 max is 50 per request
          },
        }
      );

      const salesEvents: NFTSaleEvent[] = response.data.asset_events
        .filter(event => event.event_type === 'sale')
        .map(event => {
          const priceWei = BigInt(event.payment.quantity);
          const decimals = event.payment.decimals || 18;
          const priceETH = Number(priceWei) / Math.pow(10, decimals);

          return {
            tokenId: parseInt(event.nft.identifier),
            priceETH,
            priceUSD: 0, // OpenSea v2 doesn't provide USD price directly
            from: event.seller.toLowerCase(),
            to: event.buyer.toLowerCase(),
            timestamp: new Date(event.event_timestamp * 1000).toISOString(),
            txHash: event.transaction,
            eventType: 'sale',
          };
        });

      logger.info(`Fetched ${salesEvents.length} sales events from OpenSea`);
      return salesEvents;
    } catch (error: any) {
      if (error.response?.status === 401) {
        logger.error('OpenSea API authentication failed - check API key');
      } else if (error.response?.status === 429) {
        logger.error('OpenSea API rate limit exceeded');
      } else {
        logger.error('Failed to fetch OpenSea sales events:', error.message);
      }
      return [];
    }
  }

  /**
   * Fetch sales history for a specific token
   */
  async getTokenSalesHistory(
    contractAddress: string,
    tokenId: number
  ): Promise<NFTSaleEvent[]> {
    try {
      if (!this.apiKey) {
        logger.warn('No OpenSea API key - returning empty sales history');
        return [];
      }

      logger.info(`Fetching sales history for token ${tokenId}`);

      const response = await this.client.get<OpenSeaEventsResponse>('/events/chain/ethereum', {
        params: {
          asset_contract_address: contractAddress,
          token_id: tokenId,
          event_type: 'sale',
          limit: 50,
        },
      });

      const salesEvents: NFTSaleEvent[] = response.data.asset_events.map(event => {
        const priceWei = BigInt(event.payment.quantity);
        const decimals = event.payment.decimals || 18;
        const priceETH = Number(priceWei) / Math.pow(10, decimals);

        return {
          tokenId,
          priceETH,
          priceUSD: 0, // OpenSea v2 doesn't provide USD price directly
          from: event.seller.toLowerCase(),
          to: event.buyer.toLowerCase(),
          timestamp: new Date(event.event_timestamp * 1000).toISOString(),
          txHash: event.transaction,
          eventType: 'sale',
        };
      });

      logger.info(`Fetched ${salesEvents.length} sales events for token ${tokenId}`);
      return salesEvents;
    } catch (error: any) {
      logger.error(`Failed to fetch sales history for token ${tokenId}:`, error.message);
      return [];
    }
  }

  /**
   * Get collection statistics from OpenSea
   * @param collectionSlug - Collection slug (e.g., "mutant-ape-yacht-club")
   */
  async getCollectionStats(collectionSlug: string): Promise<CollectionStats | null> {
    try {
      if (!this.apiKey) {
        logger.warn('No OpenSea API key - cannot fetch collection stats');
        return null;
      }

      logger.info(`Fetching collection stats from OpenSea for ${collectionSlug}`);

      const response = await this.client.get<OpenSeaCollectionStats>(
        `/collections/${collectionSlug}/stats`
      );

      const data = response.data;

      // Find intervals
      const oneDayInterval = data.intervals.find(i => i.interval === 'one_day');
      const sevenDayInterval = data.intervals.find(i => i.interval === 'seven_day');
      const thirtyDayInterval = data.intervals.find(i => i.interval === 'thirty_day');

      const stats: CollectionStats = {
        // Total (all-time)
        totalVolume: data.total.volume,
        totalSales: data.total.sales,
        totalOwners: data.total.num_owners,
        marketCap: data.total.market_cap,
        floorPrice: data.total.floor_price,
        floorPriceSymbol: data.total.floor_price_symbol,
        avgPrice: data.total.average_price,

        // 24h stats
        volume24h: oneDayInterval?.volume || 0,
        sales24h: oneDayInterval?.sales || 0,
        avgPrice24h: oneDayInterval?.average_price || 0,

        // 7d stats
        volume7d: sevenDayInterval?.volume || 0,
        sales7d: sevenDayInterval?.sales || 0,
        avgPrice7d: sevenDayInterval?.average_price || 0,

        // 30d stats
        volume30d: thirtyDayInterval?.volume || 0,
        sales30d: thirtyDayInterval?.sales || 0,
        avgPrice30d: thirtyDayInterval?.average_price || 0,
      };

      logger.info(`Fetched collection stats: floor=${stats.floorPrice} ETH, 24h volume=${stats.volume24h} ETH`);
      return stats;
    } catch (error: any) {
      if (error.response?.status === 401) {
        logger.error('OpenSea API authentication failed - check API key');
      } else if (error.response?.status === 429) {
        logger.error('OpenSea API rate limit exceeded');
      } else {
        logger.error('Failed to fetch collection stats:', error.message);
      }
      return null;
    }
  }

  /**
   * Check if OpenSea API is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }
}

// Singleton instance
let instance: OpenSeaProvider | null = null;

export const getOpenSeaProvider = (): OpenSeaProvider => {
  if (!instance) {
    instance = new OpenSeaProvider();
  }
  return instance;
};
