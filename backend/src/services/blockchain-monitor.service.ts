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
import { getNotificationService } from './notification.service';

export class BlockchainMonitorService {
  private static instance: BlockchainMonitorService;
  private isMonitoring = false;
  private lastProcessedBlock = 0;
  private monitorInterval: NodeJS.Timeout | null = null;
  private readonly POLL_INTERVAL_MS = 12000; // 12 seconds (Ethereum block time ~12s)
  private readonly PRICE_CHECK_INTERVAL_MS = 300000; // 5 minutes for floor price checks
  private readonly CONTRACT_ADDRESS = process.env.NFT_CONTRACT_ADDRESS || '0x60E4d786628Fea6478F785A6d7e704777c86a7c6';
  private readonly NOTIFY_ALL_TRANSACTIONS = process.env.NOTIFY_ALL_TRANSACTIONS === 'true';
  private priceCheckInterval: NodeJS.Timeout | null = null;

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

    // Start polling loop for new blocks
    this.monitorInterval = setInterval(() => this.checkNewBlocks(), this.POLL_INTERVAL_MS);

    // Start periodic floor price checking for price alerts
    this.priceCheckInterval = setInterval(() => this.checkFloorPrice(), this.PRICE_CHECK_INTERVAL_MS);

    // Run initial floor price check
    this.checkFloorPrice();

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

    if (this.priceCheckInterval) {
      clearInterval(this.priceCheckInterval);
      this.priceCheckInterval = null;
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

    // Track whale activity count for this batch
    let whaleActivityCount = 0;

    // Track volume for this batch
    let totalVolume = 0;

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

      // Send Telegram/Email notification for EVERY transaction (if NOTIFY_ALL_TRANSACTIONS=true)
      if (this.NOTIFY_ALL_TRANSACTIONS) {
        await this.sendTransactionNotification(enrichedTransaction);
      }

      // Track whale activity
      if (enrichedTransaction.isWhaleTransaction) {
        whaleActivityCount++;
        logger.info(`🐋 Whale transaction detected: Token #${enrichedTransaction.tokenId}`);
      }

      // Track volume for sales
      if (enrichedTransaction.type === 'sale' && enrichedTransaction.priceETH) {
        totalVolume += enrichedTransaction.priceETH;
      }
    }

    // Check all active alert rules after processing batch
    this.checkAllAlerts(alertService, {
      whaleActivityCount,
      totalVolume,
      transactionCount: events.length,
    });
  }

  /**
   * Check all active alert rules against current metrics
   */
  private checkAllAlerts(alertService: any, metrics: {
    whaleActivityCount: number;
    totalVolume: number;
    transactionCount: number;
  }): void {
    const allRules = alertService.getAllRules();

    for (const rule of allRules) {
      if (rule.status !== 'active') continue;

      let currentValue: number | null = null;

      // Determine current value based on alert type
      switch (rule.type) {
        case 'whale':
          // Whale activity count
          currentValue = metrics.whaleActivityCount;
          break;
        case 'volume':
          // Total volume in ETH
          currentValue = metrics.totalVolume;
          break;
        case 'listing':
          // Number of new listings/transfers
          currentValue = metrics.transactionCount;
          break;
        case 'price':
          // Price alerts are checked separately via floor price updates
          // Skip for now - can be enhanced to fetch floor price from Alchemy
          break;
        default:
          logger.warn(`Unknown alert type: ${rule.type}`);
      }

      // Check trigger if we have a value
      if (currentValue !== null) {
        alertService.checkTrigger(rule.id, currentValue);
      }
    }
  }

  /**
   * Check floor price and trigger price alerts
   */
  private async checkFloorPrice(): Promise<void> {
    if (!this.isMonitoring) return;

    try {
      const { getAlchemySDKProvider } = await import('../providers/alchemy-sdk.provider');
      const alchemySDK = getAlchemySDKProvider();
      const alertService = getAlertService();

      // Get floor price from Alchemy (returns number or null)
      const currentFloorPrice = await alchemySDK.getFloorPrice(this.CONTRACT_ADDRESS);

      if (!currentFloorPrice) {
        logger.debug('No floor price data available');
        return;
      }

      logger.debug(`Checking price alerts - Current floor price: ${currentFloorPrice} ETH`);

      // Check all price alert rules
      const allRules = alertService.getAllRules();
      for (const rule of allRules) {
        if (rule.status === 'active' && rule.type === 'price') {
          alertService.checkTrigger(rule.id, currentFloorPrice);
        }
      }
    } catch (error) {
      logger.error('Error checking floor price', error);
    }
  }

  /**
   * Send Telegram/Email notification for individual transaction
   */
  private async sendTransactionNotification(tx: any): Promise<void> {
    try {
      const notificationService = getNotificationService();

      // Format transaction message
      const emoji = tx.isWhaleTransaction ? '🐋' : (tx.type === 'sale' ? '💰' : '🔄');
      const whaleTag = tx.isWhaleTransaction ? ' [WHALE]' : '';
      const priceInfo = tx.priceETH ? ` for ${tx.priceETH.toFixed(4)} ETH` : '';

      const message = `
${emoji} <b>MAYC Transaction${whaleTag}</b>

🎨 <b>Token:</b> #${tx.tokenId}
📝 <b>Type:</b> ${tx.type.toUpperCase()}${priceInfo}
📤 <b>From:</b> <code>${tx.from.slice(0, 10)}...${tx.from.slice(-8)}</code>${tx.whaleFrom ? ' 🐋' : ''}
📥 <b>To:</b> <code>${tx.to.slice(0, 10)}...${tx.to.slice(-8)}</code>${tx.whaleTo ? ' 🐋' : ''}
🔗 <b>TX:</b> <a href="https://etherscan.io/tx/${tx.txHash}">View on Etherscan</a>

<i>Real-time blockchain monitoring</i>
      `.trim();

      // Send via Telegram
      await notificationService.sendTestNotification('telegram', message);

      // Send via Email (same format, HTML already compatible)
      await notificationService.sendTestNotification('email', message);

      logger.debug(`📨 Transaction notification sent (Telegram + Email): Token #${tx.tokenId}`);
    } catch (error) {
      logger.error('Failed to send transaction notification', error);
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
      priceCheckIntervalMs: this.PRICE_CHECK_INTERVAL_MS,
      notifyAllTransactions: this.NOTIFY_ALL_TRANSACTIONS,
    };
  }
}

/**
 * Singleton accessor
 */
export function getBlockchainMonitor(): BlockchainMonitorService {
  return BlockchainMonitorService.getInstance();
}
