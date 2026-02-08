import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

interface AlchemyResponse<T> {
  jsonrpc: string;
  id: number;
  result: T;
  error?: {
    code: number;
    message: string;
  };
}

interface LogEvent {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  logIndex: string;
  removed: boolean;
}

export class AlchemyProvider {
  private client: AxiosInstance;
  private apiKey: string;
  private network: string;
  private baseUrl: string;

  constructor(apiKey: string, network: string = 'eth-mainnet') {
    this.apiKey = apiKey;
    this.network = network;
    this.baseUrl = `https://${network}.g.alchemy.com/v2`;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
    });
  }

  async getLogs(
    address: string,
    fromBlock: string,
    toBlock: string,
    topics?: string[]
  ): Promise<LogEvent[]> {
    try {
      const normalizedAddress = address.toLowerCase();
      const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getLogs',
        params: [
          {
            address: normalizedAddress,
            fromBlock,
            toBlock,
            topics: topics || [],
          },
        ],
      };

      logger.info(`🔗 Alchemy getLogs request:`);
      logger.info(`   Address: ${normalizedAddress}`);
      logger.info(`   FromBlock: ${fromBlock}`);
      logger.info(`   ToBlock: ${toBlock}`);
      logger.info(`   Topics: ${JSON.stringify(topics || [])}`);

      const response = await this.client.post<AlchemyResponse<LogEvent[]>>(
        `/${this.apiKey}`,
        payload
      );

      // Log the full response for debugging
      logger.info(`✅ Alchemy response status: ${response.status}`);

      if (response.data.error) {
        logger.error(`❌ Alchemy API error: ${JSON.stringify(response.data.error)}`);
        throw new Error(`Alchemy error: ${response.data.error.message}`);
      }

      const result = response.data.result || [];
      logger.info(`✅ getLogs returned ${result.length} events`);

      if (result.length > 0) {
        logger.info(`   First event: tx=${result[0].transactionHash}, block=${result[0].blockNumber}`);
        logger.info(`   First event topics count: ${result[0].topics?.length}`);
        logger.info(`   First event data: "${result[0].data}"`);
        logger.info(`   First event data length: ${result[0].data?.length}`);
      }

      return result;
    } catch (error) {
      logger.error('❌ Failed to get logs from Alchemy', error);
      throw error;
    }
  }

  async getBlockNumber(): Promise<number> {
    try {
      const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_blockNumber',
        params: [],
      };

      const response = await this.client.post<AlchemyResponse<string>>(
        `/${this.apiKey}`,
        payload
      );

      logger.debug(`BlockNumber response: ${JSON.stringify(response.data).substring(0, 200)}`);

      if (response.data.error) {
        logger.error(`Alchemy API error: ${JSON.stringify(response.data.error)}`);
        throw new Error(`Alchemy error: ${response.data.error.message}`);
      }

      const blockNum = parseInt(response.data.result, 16);
      logger.info(`Current block number: ${blockNum}`);
      return blockNum;
    } catch (error) {
      logger.error('Failed to get block number from Alchemy', error);
      throw error;
    }
  }

  async getTransactionReceipt(txHash: string): Promise<any> {
    try {
      const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      };

      const response = await this.client.post<AlchemyResponse<any>>(
        `/${this.apiKey}`,
        payload
      );

      if (response.data.error) {
        throw new Error(`Alchemy error: ${response.data.error.message}`);
      }

      return response.data.result;
    } catch (error) {
      logger.error(`Failed to get transaction receipt for ${txHash}`, error);
      throw error;
    }
  }

  /**
   * Batch fetch transaction details by hash using JSON-RPC batch request.
   * Returns a Map of txHash → transaction object (with value field in wei hex).
   */
  async batchGetTransactions(txHashes: string[]): Promise<Map<string, any>> {
    const results = new Map<string, any>();
    if (txHashes.length === 0) return results;

    // Alchemy supports up to ~1000 requests per batch, split into chunks of 100
    const BATCH_SIZE = 100;
    for (let i = 0; i < txHashes.length; i += BATCH_SIZE) {
      const chunk = txHashes.slice(i, i + BATCH_SIZE);
      const payload = chunk.map((hash, idx) => ({
        jsonrpc: '2.0',
        id: i + idx,
        method: 'eth_getTransactionByHash',
        params: [hash],
      }));

      try {
        const response = await this.client.post(`/${this.apiKey}`, payload);
        const responses = Array.isArray(response.data) ? response.data : [response.data];

        for (const r of responses) {
          if (r.result && r.result.hash) {
            results.set(r.result.hash.toLowerCase(), r.result);
          }
        }
      } catch (error) {
        logger.warn(`⚠️ Batch tx fetch failed for chunk ${i}-${i + chunk.length}: ${(error as any)?.message}`);
      }

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < txHashes.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    logger.info(`✅ Batch fetched ${results.size}/${txHashes.length} transactions`);
    return results;
  }

  async call(method: string, params: any[]): Promise<any> {
    try {
      const payload = {
        jsonrpc: '2.0',
        id: 1,
        method,
        params,
      };

      const response = await this.client.post<AlchemyResponse<any>>(
        `/${this.apiKey}`,
        payload
      );

      if (response.data.error) {
        throw new Error(`Alchemy error: ${response.data.error.message}`);
      }

      return response.data.result;
    } catch (error) {
      logger.error(`Failed to call ${method}`, error);
      throw error;
    }
  }
}

// Singleton instance
let instance: AlchemyProvider;

export function getAlchemyProvider(): AlchemyProvider {
  if (!instance) {
    const apiKey = process.env.ALCHEMY_API_KEY;
    const network = process.env.ALCHEMY_NETWORK || 'eth-mainnet';

    if (!apiKey) {
      throw new Error('ALCHEMY_API_KEY environment variable is required');
    }

    instance = new AlchemyProvider(apiKey, network);
  }

  return instance;
}
