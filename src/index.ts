import 'dotenv/config';
import express from 'express';
import { NFTBot } from './bot/bot';
import { initNotificationService } from './services/notification.service';
import { getBlockchainService } from './services/blockchain.service';
import { getAnalyticsService } from './services/analytics.service';
import { getCacheService } from './services/cache.service';
import { logger } from './utils/logger';

class NFTAnalyticsApp {
  private bot: NFTBot | null = null;
  private isRunning: boolean = false;
  private httpServer: express.Application;
  private requestLog: Array<{ timestamp: string; type: string; data: string }> = [];

  constructor() {
    this.httpServer = express();
    this.setupHttpServer();
  }

  /**
   * Setup Express HTTP server for health checks and webhook
   */
  private setupHttpServer(): void {
    // Parse JSON body
    this.httpServer.use(express.json());

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

    // Diagnostic endpoint to check bot state
    this.httpServer.get('/status', (req, res) => {
      const cacheService = getCacheService();
      const topHolders = cacheService.get('topHolders');
      const recentEvents = cacheService.get('recentEvents');

      res.json({
        status: 'ok',
        isRunning: this.isRunning,
        bot: {
          initialized: this.bot !== null,
          type: 'webhook'
        },
        cache: {
          topHolders: topHolders ? `${topHolders.length} holders` : 'empty',
          recentEvents: recentEvents ? `${recentEvents.length} events` : 'empty'
        },
        timestamp: new Date().toISOString()
      });
    });

    // Telegram webhook endpoint
    this.httpServer.post('/webhook', (req, res) => {
      // Log webhook requests
      const messageText = req.body?.message?.text || req.body?.callback_query?.data || 'unknown';
      this.requestLog.push({
        timestamp: new Date().toISOString(),
        type: req.body?.message ? 'message' : 'callback',
        data: messageText
      });
      // Keep only last 20 requests
      if (this.requestLog.length > 20) {
        this.requestLog.shift();
      }

      if (this.bot) {
        this.bot.handleWebhookUpdate(req.body);
      }
      res.sendStatus(200);
    });

    // Debug endpoint to see recent requests
    this.httpServer.get('/debug', (req, res) => {
      res.json({
        status: 'ok',
        recentRequests: this.requestLog.slice(-10),
        timestamp: new Date().toISOString()
      });
    });

    // Start HTTP server on port 3000
    const port = parseInt(process.env.PORT || '3000', 10);

    const server = this.httpServer.listen(port, '0.0.0.0', () => {
      logger.info(`✅ HTTP server listening on port ${port}`);
    });

    // Handle errors
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${port} is already in use!`);
      } else {
        logger.error(`❌ Server error: ${err.message}`);
      }
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

      // Initialize Telegram bot with webhook
      this.bot = new NFTBot(botToken);
      const notificationService = initNotificationService(this.bot);

      logger.info('✅ Telegram bot initialized in webhook mode');

      // Register webhook with Telegram
      const webhookUrl = process.env.WEBHOOK_URL || `https://nft-tracking.onrender.com/webhook`;
      try {
        await this.bot.setWebhook(webhookUrl);
        logger.info(`🔗 Webhook registered at ${webhookUrl}`);
      } catch (error) {
        logger.error('Failed to register webhook', error);
        throw error;
      }

      this.isRunning = true;
      logger.info('✅ Bot is running in webhook mode!');

      // Initialize cache on startup (in background)
      logger.info('📥 Initializing cache on startup...');
      setImmediate(async () => {
        try {
          const events = await blockchainService.getAllTransferEvents(0);
          const holders = analyticsService.buildHoldersList(events);
          const topHolders = analyticsService.getTopHolders(holders, 50);

          cacheService.set('recentEvents', events, 3600);
          cacheService.set('topHolders', topHolders, 3600);

          logger.info(`✅ Cache initialized: ${events.length} events, ${topHolders.length} top holders`);
        } catch (error) {
          logger.error('Error initializing cache on startup', error);
        }
      });

      // Periodically update cache (every 5 minutes to keep data fresh)
      setInterval(async () => {
        try {
          logger.info('🔄 Periodic cache update started...');
          const events = await blockchainService.getAllTransferEvents(0);

          // Update events cache
          cacheService.set('recentEvents', events, 3600);
          logger.info(`✅ Events cache updated: ${events.length} events`);

          // Update holders cache
          const holders = analyticsService.buildHoldersList(events);
          const topHolders = analyticsService.getTopHolders(holders, 50);
          cacheService.set('topHolders', topHolders, 3600);
          logger.info(`✅ Holders cache updated: ${topHolders.length} top holders`);

          // Update distribution stats
          const stats = analyticsService.calculateDistribution(holders);
          cacheService.set('distribution', stats, 3600);
          logger.info('✅ Distribution stats updated');

          logger.info('✅ Periodic cache update completed');
        } catch (error) {
          logger.error('Error updating cache', error);
        }
      }, 5 * 60 * 1000); // 5 minutes

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
