import { ethers } from 'ethers';
import { getAlchemyProvider } from '../providers/alchemy.provider';
import { Transaction } from '../models/transaction.model';
import { logger } from '../utils/logger';
import { normalizeAddress, convertWeiToEth } from '../utils/helpers';

// ERC721 Transfer event signature
const TRANSFER_EVENT_SIGNATURE = ethers.id('Transfer(address,address,uint256)');

export class BlockchainService {
  private alchemyProvider: ReturnType<typeof getAlchemyProvider>;
  private contractAddress: string;
  private ethersProvider: ethers.JsonRpcProvider;

  constructor() {
    this.alchemyProvider = getAlchemyProvider();
    this.contractAddress = process.env.NFT_CONTRACT_ADDRESS || '';

    if (!this.contractAddress) {
      throw new Error('NFT_CONTRACT_ADDRESS environment variable is required');
    }

    // Initialize ethers provider for additional RPC calls
    const rpcUrl = `https://${process.env.ALCHEMY_NETWORK}.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
    this.ethersProvider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Get all Transfer events from contract starting from a block
   * Chunks the request into smaller block ranges to avoid hitting Alchemy limits
   */
  async getAllTransferEvents(fromBlock: number = 0, toBlock?: number): Promise<Transaction[]> {
    try {
      if (!toBlock) {
        toBlock = await this.alchemyProvider.getBlockNumber();
      }

      logger.info(`Fetching transfer events from block ${fromBlock} to ${toBlock}`);

      // For large ranges, only fetch recent data (last 7 days approximately)
      // to avoid hitting API limits
      const blockRange = toBlock - fromBlock;
      if (blockRange > 100000) {
        // Approximately 7 days of blocks (13 sec per block)
        const recentFromBlock = Math.max(fromBlock, toBlock - 45000);
        logger.info(`Block range too large (${blockRange}), fetching recent blocks: ${recentFromBlock} to ${toBlock}`);
        fromBlock = recentFromBlock;
      }

      const transactions = await this.fetchLogsInChunks(fromBlock, toBlock);
      logger.info(`Found ${transactions.length} transfer events`);

      return transactions;
    } catch (error) {
      logger.error('Failed to get transfer events', error);
      throw error;
    }
  }

  /**
   * Fetch logs in chunks to avoid exceeding Alchemy's block range limit
   * Free tier: up to 10 blocks per request, ~10 requests/sec rate limit
   * PAYG tier: up to 10,000 blocks per request
   *
   * Uses exponential backoff for rate limiting
   */
  private async fetchLogsInChunks(fromBlock: number, toBlock: number): Promise<Transaction[]> {
    const CHUNK_SIZE = 10; // Free tier limit (works with PAYG too)
    const transactions: Transaction[] = [];
    let rateLimitDelay = 200; // Start with 200ms delay (5 req/sec = safe for free tier)

    for (let chunk = fromBlock; chunk < toBlock; chunk += CHUNK_SIZE) {
      const chunkEnd = Math.min(chunk + CHUNK_SIZE, toBlock);
      logger.debug(`Fetching logs chunk: ${chunk} to ${chunkEnd}`);

      try {
        const logs = await this.alchemyProvider.getLogs(
          this.contractAddress,
          `0x${chunk.toString(16)}`,
          `0x${chunkEnd.toString(16)}`,
          [TRANSFER_EVENT_SIGNATURE]
        );

        // Parse logs into Transaction objects
        for (const log of logs) {
          try {
            const tx = this.parseTransferLog(log);
            transactions.push(tx);
          } catch (error) {
            logger.warn(`Failed to parse log ${log.transactionHash}`, error);
          }
        }

        // Reset delay on success
        rateLimitDelay = 200;

        // Add delay between requests to respect rate limits
        await this.sleep(rateLimitDelay);
      } catch (error: any) {
        // Handle 429 Too Many Requests with exponential backoff
        if (error.response?.status === 429) {
          rateLimitDelay = Math.min(rateLimitDelay * 2, 5000); // Max 5 second delay
          logger.warn(`Rate limited, backing off to ${rateLimitDelay}ms`);

          // Wait longer before retrying
          await this.sleep(rateLimitDelay);

          // Retry this chunk
          try {
            const retryLogs = await this.alchemyProvider.getLogs(
              this.contractAddress,
              `0x${chunk.toString(16)}`,
              `0x${chunkEnd.toString(16)}`,
              [TRANSFER_EVENT_SIGNATURE]
            );

            for (const log of retryLogs) {
              try {
                const tx = this.parseTransferLog(log);
                transactions.push(tx);
              } catch (e) {
                logger.warn(`Failed to parse log ${log.transactionHash}`, e);
              }
            }
          } catch (retryError) {
            logger.error(`Failed to fetch logs for block range ${chunk}-${chunkEnd} after retry`, retryError);
          }
        } else {
          logger.error(`Failed to fetch logs for block range ${chunk}-${chunkEnd}`, error);
        }
      }
    }

    return transactions;
  }

  /**
   * Sleep helper for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get transfer events from a specific date range
   */
  async getTransferEventsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    try {
      logger.info(`Fetching transfer events between ${startDate} and ${endDate}`);

      // Get block numbers for dates (approximate)
      const startBlock = Math.floor(startDate.getTime() / 1000 / 13); // ~13 seconds per block
      const endBlock = Math.floor(endDate.getTime() / 1000 / 13);

      return this.getAllTransferEvents(startBlock, endBlock);
    } catch (error) {
      logger.error('Failed to get transfer events by date range', error);
      throw error;
    }
  }

  /**
   * Get current balance (owner) of a specific token
   */
  async getTokenOwner(tokenId: number): Promise<string> {
    try {
      logger.info(`Getting owner of token ${tokenId}`);

      // Get recent blocks only (last 10000 blocks)
      const currentBlock = await this.alchemyProvider.getBlockNumber();
      const recentFromBlock = Math.max(0, currentBlock - 10000);

      // Get recent Transfer events
      const lastEvent = await this.alchemyProvider.getLogs(
        this.contractAddress,
        `0x${recentFromBlock.toString(16)}`,
        `0x${currentBlock.toString(16)}`,
        [TRANSFER_EVENT_SIGNATURE]
      );

      // Find the last transfer of this token
      for (const log of lastEvent.reverse()) {
        const parsed = this.parseTransferLog(log);
        if (parsed.tokenId === tokenId) {
          return parsed.to;
        }
      }

      return '';
    } catch (error) {
      logger.error(`Failed to get owner of token ${tokenId}`, error);
      throw error;
    }
  }

  /**
   * Get transaction receipt and details
   */
  async getTransactionDetails(txHash: string): Promise<any> {
    try {
      const receipt = await this.alchemyProvider.getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      logger.error(`Failed to get transaction details for ${txHash}`, error);
      throw error;
    }
  }

  /**
   * Parse a Transfer event log
   */
  private parseTransferLog(log: any): Transaction {
    const topics = log.topics;
    const data = log.data;

    // topics[0] = Transfer(address,address,uint256) signature
    // topics[1] = from address (indexed)
    // topics[2] = to address (indexed)
    // data = tokenId (uint256)

    const from = this.topic2Address(topics[1]);
    const to = this.topic2Address(topics[2]);

    // Parse tokenId - handle empty or invalid data
    let tokenId = '0';
    if (data && data !== '0x' && data.length > 2) {
      try {
        tokenId = BigInt(data).toString();
      } catch (error) {
        logger.warn(`Failed to parse tokenId from data: ${data}`, error);
        tokenId = '0';
      }
    }

    // Determine if it's a mint (from = 0x0...)
    const isMint = from === '0x0000000000000000000000000000000000000000';

    return {
      txHash: log.transactionHash,
      blockNumber: parseInt(log.blockNumber, 16),
      timestamp: new Date(), // Will be set properly when fetching from OpenSea/Etherscan
      from,
      to,
      tokenId: parseInt(tokenId),
      type: isMint ? 'mint' : 'transfer',
    };
  }

  /**
   * Convert topic to address
   */
  private topic2Address(topic: string): string {
    return '0x' + topic.slice(-40);
  }

  /**
   * Get block timestamp for a block number
   */
  async getBlockTimestamp(blockNumber: number): Promise<number> {
    try {
      const block = await this.ethersProvider.getBlock(blockNumber);
      return block?.timestamp || 0;
    } catch (error) {
      logger.error(`Failed to get block timestamp for block ${blockNumber}`, error);
      return 0;
    }
  }

  /**
   * Subscribe to new Transfer events (for real-time monitoring)
   */
  async subscribeToTransfers(callback: (event: Transaction) => void): Promise<void> {
    try {
      logger.info('Subscribing to Transfer events');

      // Get current block
      let lastBlock = await this.alchemyProvider.getBlockNumber();

      // Poll for new blocks every 12 seconds (1 block interval)
      setInterval(async () => {
        try {
          const currentBlock = await this.alchemyProvider.getBlockNumber();

          if (currentBlock > lastBlock) {
            const logs = await this.alchemyProvider.getLogs(
              this.contractAddress,
              `0x${lastBlock.toString(16)}`,
              `0x${currentBlock.toString(16)}`,
              [TRANSFER_EVENT_SIGNATURE]
            );

            for (const log of logs) {
              const tx = this.parseTransferLog(log);
              // Fetch block timestamp
              tx.timestamp = new Date(
                (await this.getBlockTimestamp(tx.blockNumber)) * 1000
              );
              callback(tx);
            }

            lastBlock = currentBlock;
          }
        } catch (error) {
          logger.error('Error in subscribe interval', error);
        }
      }, 13000); // Check every ~13 seconds (1 block time)
    } catch (error) {
      logger.error('Failed to subscribe to transfers', error);
      throw error;
    }
  }
}

let instance: BlockchainService;

export function getBlockchainService(): BlockchainService {
  if (!instance) {
    instance = new BlockchainService();
  }
  return instance;
}
