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
      const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getLogs',
        params: [
          {
            address,
            fromBlock,
            toBlock,
            topics: topics || [],
          },
        ],
      };

      logger.debug(`Requesting logs from ${fromBlock} to ${toBlock} for ${address}`);

      const response = await this.client.post<AlchemyResponse<LogEvent[]>>(
        `/${this.apiKey}`,
        payload
      );

      if (response.data.error) {
        logger.error(`Alchemy API error: Code ${response.data.error.code} - ${response.data.error.message}`);
        throw new Error(`Alchemy error: ${response.data.error.message}`);
      }

      logger.debug(`Got ${response.data.result?.length || 0} logs`);
      return response.data.result;
    } catch (error: any) {
      // Try to extract Alchemy error message from response
      const alchemyError = error.response?.data?.error?.message || error.message;
      logger.error(`❌ Alchemy getLogs failed: ${alchemyError}`);
      logger.error(`Request params: fromBlock=${fromBlock}, toBlock=${toBlock}, address=${address}`);
      if (error.response?.data?.error) {
        logger.error(`Alchemy error code: ${error.response.data.error.code}`);
      }
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

      if (response.data.error) {
        throw new Error(`Alchemy error: ${response.data.error.message}`);
      }

      return parseInt(response.data.result, 16);
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

    // Log API key validity (first 10 chars only for security)
    const keyPrefix = apiKey.substring(0, 10);
    logger.info(`🔑 Initializing Alchemy provider with API key: ${keyPrefix}... on network: ${network}`);

    instance = new AlchemyProvider(apiKey, network);
  }

  return instance;
}
