/**
 * BlockchainMonitorService - Real-time blockchain monitoring
 * Continuously checks for new blocks and broadcasts Transfer events via WebSocket
 */

import { logger } from '../utils/logger';
import { getBlockchainService } from './blockchain.service';
import { getAlchemyProvider } from '../providers/alchemy.provider';
import { getWebSocketService } from '../api/websocket';
import { getAlertService } from './alert.service';
import { getAnalyticsService } from './analytics.service';

export class BlockchainMonitorService {
  private static instance: BlockchainMonitorService;
  private isMonitoring = false;
  private lastProcessedBlock = 0;
  private monitorInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 12000; // 12 seconds (Ethereum block time ~12s)
  private readonly CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || '0x60E4d786628Fea6478F785A6d7e704777c86a7c6';

  private constructor() {
    logger.info('BlockchainMonitorService initialized');
  }

  static getInstance(): BlockchainMonitorService {
    if (!BlockchainMonitorService.instance) {
      BlockchainMonitorService.instance = new BlockchainMonitorService();
    }
    return BlockchainMonitorService.instance;
  }

  /**
   * Start monitoring blockchain for new Transfer events
   */
  async start(): Promise<void> {
    if (this.isMonitoring) {
      logger.warn('Blockchain monitor already running');
      return;
    }

    logger.info('🚀 Starting blockchain monitor...');
    this.isMonitoring = true;

    // Get current block to start from
    const alchemyProvider = getAlchemyProvider();
    this.lastProcessedBlock = await alchemyProvider.getBlockNumber();
    logger.info(`Starting from block ${this.lastProcessedBlock}`);

    // Start polling loop
    this.monitorInterval = setInterval(() => this.checkNewBlocks(), this.POLL_INTERVAL_MS);

    logger.info(`✅ Blockchain monitor started (polling every ${this.POLL_INTERVAL_MS}ms)`);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    logger.info('Stopping blockchain monitor...');
    this.isMonitoring = false;

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    logger.info('✅ Blockchain monitor stopped');
  }

  /**
   * Check for new blocks and process Transfer events
   */
  private async checkNewBlocks(): Promise<void> {
    if (!this.isMonitoring) return;

    try {
      const alchemyProvider = getAlchemyProvider();
      const currentBlock = await alchemyProvider.getBlockNumber();

      // No new blocks
      if (currentBlock <= this.lastProcessedBlock) {
        return;
      }

      const newBlocks = currentBlock - this.lastProcessedBlock;
      logger.info(`📦 Found ${newBlocks} new block(s): ${this.lastProcessedBlock + 1} → ${currentBlock}`);

      // Fetch Transfer events for new blocks
      const blockchainService = getBlockchainService();
      const events = await blockchainService.getAllTransferEvents(this.lastProcessedBlock + 1, currentBlock);

      if (events.length > 0) {
        logger.info(`🔔 Found ${events.length} new Transfer events`);

        // Process each event
        await this.processNewEvents(events);
      }

      // Update last processed block
      this.lastProcessedBlock = currentBlock;
    } catch (error) {
      logger.error('Error checking new blocks', error);
    }
  }

  /**
   * Process new Transfer events: enrich data, check alerts, broadcast via WebSocket
   */
  private async processNewEvents(events: any[]): Promise<void> {
    const analyticsService = getAnalyticsService();
    const alertService = getAlertService();
    const wsService = getWebSocketService();

    // Get all current holders for whale detection
    const allEvents = await getBlockchainService().getAllTransferEvents(0);
    const allHolders = analyticsService.buildHoldersList(allEvents);
    const whaleHolders = analyticsService.getTopHolders(allHolders, 9999).filter((h: any) => h.count >= 20);
    const whaleAddresses = new Set(whaleHolders.map((w: any) => w.address.toLowerCase()));

    for (const event of events) {
      const fromAddress = event.from.toLowerCase();
      const toAddress = event.to.toLowerCase();
      const isWhaleFrom = whaleAddresses.has(fromAddress);
      const isWhaleTo = whaleAddresses.has(toAddress);

      // Enrich transaction data
      const enrichedTransaction = {
        tokenId: event.tokenId,
        from: event.from,
        to: event.to,
        timestamp: event.timestamp,
        txHash: event.transactionHash || event.txHash,
        type: event.type || 'transfer',
        priceETH: event.priceETH,
        isWhaleTransaction: isWhaleFrom || isWhaleTo,
        whaleFrom: isWhaleFrom,
        whaleTo: isWhaleTo,
      };

      // Broadcast via WebSocket
      wsService.broadcast({
        type: 'transaction:new',
        data: enrichedTransaction,
        timestamp: Date.now(),
      });

      // Check alert rules for whale activity
      if (enrichedTransaction.isWhaleTransaction) {
        logger.info(`🐋 Whale transaction detected: Token #${enrichedTransaction.tokenId}`);

        // Trigger whale activity alerts
        // Note: This is a simplified check. Real implementation would be more sophisticated.
        alertService.checkTrigger('whale_activity', 1); // Increment whale activity counter
      }

      // Check price alerts if sale
      if (enrichedTransaction.type === 'sale' && enrichedTransaction.priceETH) {
        alertService.checkTrigger('price_change', enrichedTransaction.priceETH);
      }
    }
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      lastProcessedBlock: this.lastProcessedBlock,
      pollIntervalMs: this.POLL_INTERVAL_MS,
    };
  }
}

/**
 * Singleton accessor
 */
export function getBlockchainMonitor(): BlockchainMonitorService {
  return BlockchainMonitorService.getInstance();
}
