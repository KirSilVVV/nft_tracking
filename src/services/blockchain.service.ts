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
   */
  async getAllTransferEvents(fromBlock: number = 0, toBlock?: number): Promise<Transaction[]> {
    try {
      logger.info(`Fetching transfer events from block ${fromBlock} to ${toBlock || 'latest'}`);

      if (!toBlock) {
        toBlock = await this.alchemyProvider.getBlockNumber();
      }

      // Fetch logs for Transfer events
      const logs = await this.alchemyProvider.getLogs(
        this.contractAddress,
        `0x${fromBlock.toString(16)}`,
        `0x${toBlock.toString(16)}`,
        [TRANSFER_EVENT_SIGNATURE]
      );

      logger.info(`Found ${logs.length} transfer events`);

      // Parse logs into Transaction objects
      const transactions: Transaction[] = [];
      for (const log of logs) {
        try {
          const tx = this.parseTransferLog(log);
          transactions.push(tx);
        } catch (error) {
          logger.warn(`Failed to parse log ${log.transactionHash}`, error);
        }
      }

      return transactions;
    } catch (error) {
      logger.error('Failed to get transfer events', error);
      throw error;
    }
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
      // This would require the contract ABI to call ownerOf
      // For now, we'll parse it from recent Transfer events
      logger.info(`Getting owner of token ${tokenId}`);

      // This is a simplified version - in production you'd use contract ABI
      const lastEvent = await this.alchemyProvider.getLogs(
        this.contractAddress,
        '0x0',
        '0xffffff',
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
    const tokenId = BigInt(data).toString();

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
