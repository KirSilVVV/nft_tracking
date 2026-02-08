import { ethers } from 'ethers';
import { getAlchemyProvider } from '../providers/alchemy.provider';
import { Transaction } from '../models/transaction.model';
import { logger } from '../utils/logger';
// normalizeAddress, convertWeiToEth available in helpers if needed

// ERC721 Transfer event signature
const TRANSFER_EVENT_SIGNATURE = ethers.id('Transfer(address,address,uint256)');

export class BlockchainService {
  private alchemyProvider: ReturnType<typeof getAlchemyProvider>;
  private contractAddress: string;
  private ethersProvider: ethers.JsonRpcProvider;

  // Cache for transfer events to avoid hammering Alchemy on concurrent requests
  private cachedEvents: Transaction[] | null = null;
  private cacheTimestamp: number = 0;
  private cacheTTL: number = 2 * 60 * 1000; // 2 minutes
  private fetchInProgress: Promise<Transaction[]> | null = null;

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
   * Note: fromBlock = 0 means "use recent blocks (last 200k blocks ~30 days)"
   * This is because Alchemy API rejects queries from genesis block
   */
  async getAllTransferEvents(fromBlock: number = 0, toBlock?: number): Promise<Transaction[]> {
    // Return cached data if fresh enough (prevents hammering Alchemy on concurrent requests)
    if (fromBlock === 0 && !toBlock && this.cachedEvents && (Date.now() - this.cacheTimestamp) < this.cacheTTL) {
      logger.info(`📦 Returning cached ${this.cachedEvents.length} events (age: ${Math.round((Date.now() - this.cacheTimestamp) / 1000)}s)`);
      return this.cachedEvents;
    }

    // If a fetch is already in progress, wait for it instead of making a duplicate request
    if (fromBlock === 0 && !toBlock && this.fetchInProgress) {
      logger.info(`⏳ Waiting for in-progress fetch...`);
      return this.fetchInProgress;
    }

    const fetchPromise = this._fetchTransferEvents(fromBlock, toBlock);

    if (fromBlock === 0 && !toBlock) {
      this.fetchInProgress = fetchPromise;
      fetchPromise.finally(() => { this.fetchInProgress = null; });
    }

    return fetchPromise;
  }

  private async _fetchTransferEvents(fromBlock: number = 0, toBlock?: number): Promise<Transaction[]> {
    try {
      logger.info(`🚀 getAllTransferEvents called with fromBlock=${fromBlock}, toBlock=${toBlock}`);

      if (!toBlock) {
        logger.info(`⏳ Getting current block number from Alchemy...`);
        toBlock = await this.alchemyProvider.getBlockNumber();
        logger.info(`✅ Current block: ${toBlock}`);
      }

      // If fromBlock is 0, use recent blocks instead (last 200000 blocks ~30 days)
      // This avoids Alchemy API error: "fromBlock too old"
      if (fromBlock === 0) {
        fromBlock = Math.max(0, toBlock - 200000);
        logger.info(`📊 Block range: ${fromBlock} to ${toBlock} (last ~30 days, ~${toBlock - fromBlock} blocks)`);
      } else {
        logger.info(`📊 Block range: ${fromBlock} to ${toBlock} (~${toBlock - fromBlock} blocks)`);
      }

      // Verify contract address
      logger.info(`📍 Contract: ${this.contractAddress}`);
      logger.info(`🔍 Looking for Transfer events with signature: ${TRANSFER_EVENT_SIGNATURE}`);

      // Fetch logs for Transfer events
      logger.info(`⏳ Fetching logs from Alchemy...`);
      const logs = await this.alchemyProvider.getLogs(
        this.contractAddress,
        `0x${fromBlock.toString(16)}`,
        `0x${toBlock.toString(16)}`,
        [TRANSFER_EVENT_SIGNATURE]
      );

      logger.info(`📦 Found ${logs.length} transfer events`);

      // Debug: log first few logs to understand their structure
      if (logs.length > 0) {
        logger.info(`🔍 First log structure:`);
        logger.info(`   address: ${logs[0].address}`);
        logger.info(`   topics.length: ${logs[0].topics?.length}`);
        logger.info(`   topics[0]: ${logs[0].topics?.[0]}`);
        logger.info(`   topics[1]: ${logs[0].topics?.[1]}`);
        logger.info(`   topics[2]: ${logs[0].topics?.[2]}`);
        logger.info(`   data: ${logs[0].data}`);
        logger.info(`   data.length: ${logs[0].data?.length}`);
      }

      // Parse logs into Transaction objects
      const transactions: Transaction[] = [];
      const nowMs = Date.now();
      const currentBlock = toBlock!;

      for (const log of logs) {
        try {
          const tx = this.parseTransferLog(log);
          // Estimate real timestamp from block number (~12 sec/block on Ethereum)
          const blocksAgo = currentBlock - tx.blockNumber;
          const estimatedMs = nowMs - (blocksAgo * 12 * 1000);
          tx.timestamp = new Date(estimatedMs);
          transactions.push(tx);
        } catch (error) {
          logger.warn(`⚠️ Failed to parse log ${log.transactionHash}:`, error);
        }
      }

      logger.info(`✅ Parsed ${transactions.length} transactions successfully`);

      // ===== FETCH REAL SALE PRICES =====
      // Get unique tx hashes and batch-fetch transaction values
      const uniqueTxHashes = [...new Set(transactions.map(t => t.txHash))];
      logger.info(`💰 Fetching sale prices for ${uniqueTxHashes.length} unique transactions...`);

      try {
        const txDataMap = await this.alchemyProvider.batchGetTransactions(uniqueTxHashes);

        let salesFound = 0;
        for (const tx of transactions) {
          const txData = txDataMap.get(tx.txHash.toLowerCase());
          if (txData && txData.value) {
            const valueWei = BigInt(txData.value);
            if (valueWei > 0n) {
              tx.priceETH = Number(valueWei) / 1e18;
              tx.type = 'sale';
              salesFound++;
            }
          }
        }
        logger.info(`💰 Found ${salesFound} sales with ETH prices out of ${transactions.length} transfers`);
      } catch (priceError) {
        logger.warn(`⚠️ Failed to fetch sale prices (non-critical): ${(priceError as any)?.message}`);
      }

      // Cache results for default queries
      if (fromBlock === 0 || (fromBlock > 0 && !toBlock)) {
        this.cachedEvents = transactions;
        this.cacheTimestamp = Date.now();
        logger.info(`📦 Cached ${transactions.length} events`);
      }

      return transactions;
    } catch (error) {
      logger.error('❌ Failed to get transfer events', error);
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
   * Parse a Transfer event log from ERC721 contract
   *
   * ERC721 Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
   * - topics[0] = Transfer signature (0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef)
   * - topics[1] = from address (indexed)
   * - topics[2] = to address (indexed)
   * - topics[3] = tokenId (indexed, packed as uint256)
   * - data = empty (0x) since all parameters are indexed
   */
  private parseTransferLog(log: any): Transaction {
    const topics = log.topics;

    if (!topics || topics.length < 4) {
      throw new Error(`Invalid Transfer log: expected 4 topics, got ${topics?.length}`);
    }

    const from = this.topic2Address(topics[1]);
    const to = this.topic2Address(topics[2]);

    // Extract tokenId from topics[3] (it's already an indexed uint256)
    const tokenIdHex = topics[3];
    const tokenId = BigInt(tokenIdHex).toString();

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

  /**
   * Lookup ENS name for an address
   */
  async lookupENS(address: string): Promise<string | null> {
    try {
      const ensName = await this.ethersProvider.lookupAddress(address);
      if (ensName) {
        logger.info(`ENS resolved for ${address}: ${ensName}`);
      }
      return ensName;
    } catch (error) {
      logger.debug(`ENS lookup failed for ${address}`, error);
      return null;
    }
  }

  /**
   * Get ETH balance for an address
   */
  async getETHBalance(address: string): Promise<string> {
    try {
      const balance = await this.ethersProvider.getBalance(address);
      const balanceETH = ethers.formatEther(balance);
      logger.info(`ETH balance for ${address}: ${balanceETH} ETH`);
      return balanceETH;
    } catch (error) {
      logger.error(`Failed to get ETH balance for ${address}`, error);
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
