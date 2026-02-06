import 'dotenv/config';
import express from 'express';
import { NFTBot } from './bot/bot';
import { initNotificationService } from './services/notification.service';
import { getBlockchainService } from './services/blockchain.service';
import { getAnalyticsService } from './services/analytics.service';
import { getCacheService } from './services/cache.service';
import { logger } from './utils/logger';
import { sleep } from './utils/helpers';

class NFTAnalyticsApp {
  private bot: NFTBot | null = null;
  private isRunning: boolean = false;
  private httpServer: express.Application;

  constructor() {
    this.httpServer = express();
    this.setupHttpServer();
  }

  /**
   * Setup Express HTTP server for health checks and Render compatibility
   */
  private setupHttpServer(): void {
    // Health check endpoint
    this.httpServer.get('/', (req, res) => {
      res.json({
        status: 'ok',
        message: 'NFT Tracking Bot is running',
        isRunning: this.isRunning
      });
    });

    this.httpServer.get('/health', (req, res) => {
      res.json({
        status: this.isRunning ? 'healthy' : 'initializing',
        timestamp: new Date().toISOString()
      });
    });

    // Start HTTP server on port 3000
    const port = process.env.PORT || '3000';
    this.httpServer.listen(port, () => {
      logger.info(`✅ HTTP server listening on port ${port}`);
    });
  }

  /**
   * Start the application
   */
  async start(): Promise<void> {
    try {
      // Validate environment variables
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const alchemyKey = process.env.ALCHEMY_API_KEY;

      if (!botToken) {
        throw new Error('TELEGRAM_BOT_TOKEN environment variable is required');
      }
      if (!alchemyKey) {
        throw new Error('ALCHEMY_API_KEY environment variable is required');
      }

      logger.info('🚀 Starting NFT Tracking Bot...');

      // Initialize services
      const blockchainService = getBlockchainService();
      const analyticsService = getAnalyticsService();
      const cacheService = getCacheService();

      // Initialize Telegram bot
      this.bot = new NFTBot(botToken);
      const notificationService = initNotificationService(this.bot);

      logger.info('✅ Telegram bot initialized');
      logger.info('🔄 Starting blockchain monitoring...');

      // Start blockchain monitoring
      await blockchainService.subscribeToTransfers(async (transaction) => {
        try {
          // Fetch current holders for whale detection
          const events = await blockchainService.getAllTransferEvents(0);
          const holders = analyticsService.buildHoldersList(events);

          // Add to recent feed
          cacheService.addToRecentTransactionFeed(transaction);

          // Handle notifications
          await notificationService.handleNewTransfer(transaction, holders);
        } catch (error) {
          logger.error('Error in transfer handler', error);
        }
      });

      this.isRunning = true;
      logger.info('✅ Bot is running!');

      // Periodically update cache (every 10 minutes)
      setInterval(async () => {
        try {
          logger.debug('Updating cache...');
          const events = await blockchainService.getAllTransferEvents(0);

          // Update holders cache
          const holders = analyticsService.buildHoldersList(events);
          cacheService.setHolders(holders);

          const topHolders = analyticsService.getTopHolders(holders, 50);
          cacheService.setTopHolders(topHolders);

          // Update distribution stats
          const stats = analyticsService.calculateDistribution(holders);
          cacheService.setHolderStats(stats);

          logger.debug('Cache updated successfully');
        } catch (error) {
          logger.error('Error updating cache', error);
        }
      }, 10 * 60 * 1000); // 10 minutes

      // Keep the process alive
      process.on('SIGINT', () => {
        this.shutdown();
      });

      process.on('SIGTERM', () => {
        this.shutdown();
      });
    } catch (error) {
      logger.error('❌ Failed to start application', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('🛑 Shutting down...');

    if (this.bot) {
      this.bot.close();
    }

    this.isRunning = false;
    logger.info('✅ Application stopped gracefully');
    process.exit(0);
  }

  /**
   * Get running status
   */
  isBotRunning(): boolean {
    return this.isRunning;
  }
}

// Create and start app
const app = new NFTAnalyticsApp();

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught exception', error);
  process.exit(1);
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled rejection', reason);
  process.exit(1);
});

// Start the application
app.start().catch((error) => {
  logger.error('❌ Failed to start application', error);
  process.exit(1);
});
