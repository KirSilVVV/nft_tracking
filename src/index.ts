import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import http from 'http';
import routes from './api/routes';
import { WebSocketManager } from './api/websocket';
import { getBlockchainService } from './services/blockchain.service';
import { getAnalyticsService } from './services/analytics.service';
import { getCacheService } from './services/cache.service';
import { getEnrichmentService } from './services/enrichment.service';
import { logger } from './utils/logger';
import { sleep } from './utils/helpers';

class App {
  private express: Express;
  private httpServer: http.Server;
  private wsManager: WebSocketManager | null = null;
  private isRunning: boolean = false;

  constructor() {
    this.express = express();
    this.httpServer = http.createServer(this.express);
  }

  /**
   * Initialize Express middleware
   */
  private initializeMiddleware(): void {
    this.express.use(cors());
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: true }));

    // Request logging middleware
    this.express.use((req, res, next) => {
      logger.debug(`${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Initialize routes
   */
  private initializeRoutes(): void {
    // Test route to debug
    this.express.get('/test', (req, res) => {
      res.json({ status: 'test route works' });
    });

    // Whale tracker routes (direct handlers)
    const blockchainService = getBlockchainService();
    const analyticsService = getAnalyticsService();

    this.express.get('/api/whales/top', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 50;
        const events = await blockchainService.getAllTransferEvents(0);
        const allHolders = analyticsService.buildHoldersList(events);
        const topWhales = allHolders.sort((a, b) => b.count - a.count).slice(0, limit);
        const floorPrice = 5.5;
        const totalUniqueHolders = new Set(allHolders.map(h => h.address)).size;

        res.json({
          whales: topWhales.map((w, idx) => ({
            rank: idx + 1,
            address: w.address,
            ensName: w.ensName || null,
            nftCount: w.count,
            nftIds: w.tokenIds || [],
            percentageOfCollection: ((w.count / 10000) * 100).toFixed(2),
            floorPrice,
            estimatedValueETH: (w.count * floorPrice).toFixed(2),
          })),
          totalCount: topWhales.length,
          totalUniqueHolders,
          floorPrice,
          cachedAt: null,
          lastUpdated: new Date(),
        });
      } catch (error) {
        logger.error('Error fetching top whales', error);
        res.status(500).json({ error: 'Failed to fetch top whales' });
      }
    });

    this.express.get('/api/whales/search', async (req, res) => {
      try {
        const address = (req.query.address as string) || '';
        if (!address.match(/^0x[a-fA-F0-9]{40}$/i)) {
          return res.status(400).json({ error: 'Invalid Ethereum address' });
        }

        const events = await blockchainService.getAllTransferEvents(0);
        const allHolders = analyticsService.buildHoldersList(events);
        const whale = allHolders.find(h => h.address.toLowerCase() === address.toLowerCase());

        if (!whale) {
          return res.status(404).json({ error: 'Address not found' });
        }

        const floorPrice = 5.5;
        const rank = allHolders.sort((a, b) => b.count - a.count).findIndex(h => h.address.toLowerCase() === address.toLowerCase()) + 1;

        res.json({
          address: whale.address,
          ensName: whale.ensName || null,
          rank,
          nftCount: whale.count,
          nftIds: whale.tokenIds || [],
          percentageOfCollection: ((whale.count / 10000) * 100).toFixed(2),
          floorPrice,
          estimatedValueETH: (whale.count * floorPrice).toFixed(2),
          lastUpdated: new Date(),
        });
      } catch (error) {
        logger.error('Error searching whale', error);
        res.status(500).json({ error: 'Failed to search whale' });
      }
    });

    this.express.get('/api/whales/analytics', async (req, res) => {
      try {
        const events = await blockchainService.getAllTransferEvents(0);
        const allHolders = analyticsService.buildHoldersList(events);

        const distribution = {
          single: allHolders.filter(h => h.count === 1).length,
          small: allHolders.filter(h => h.count >= 2 && h.count <= 5).length,
          medium: allHolders.filter(h => h.count >= 6 && h.count <= 10).length,
          large: allHolders.filter(h => h.count >= 11 && h.count <= 50).length,
          whales: allHolders.filter(h => h.count > 50).length,
        };

        const topWhales = allHolders.sort((a, b) => b.count - a.count).slice(0, 10);

        res.json({
          totalHolders: allHolders.length,
          distribution,
          topHolders: topWhales,
          lastUpdated: new Date(),
        });
      } catch (error) {
        logger.error('Error fetching analytics', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
      }
    });

    this.express.get('/api/whales/stats', async (req, res) => {
      try {
        const events = await blockchainService.getAllTransferEvents(0);
        const allHolders = analyticsService.buildHoldersList(events);

        res.json({
          totalHolders: allHolders.length,
          floorPrice: 5.5,
          totalVolume: (allHolders.length * 5.5).toFixed(2),
          lastUpdated: new Date(),
        });
      } catch (error) {
        logger.error('Error fetching stats', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
      }
    });

    this.express.post('/api/whales/refresh', (req, res) => {
      try {
        getCacheService().clear();
        res.json({ message: 'Cache cleared successfully', timestamp: new Date() });
      } catch (error) {
        logger.error('Error refreshing cache', error);
        res.status(500).json({ error: 'Failed to refresh cache' });
      }
    });

    this.express.use('/api', routes);

    // Serve a simple dashboard page
    this.express.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>NFT Analytics - MAYC</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
              .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
              h1 { color: #333; }
              p { color: #666; line-height: 1.6; }
              .endpoints { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
              code { background: #e8e8e8; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
              ul { margin: 10px 0; }
              li { margin: 8px 0; }
              .status { color: #27ae60; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🎨 NFT Analytics - Mutant Ape Yacht Club</h1>
              <p class="status">✓ Server is running</p>
              <p>This is a real-time analytics platform for tracking Mutant Ape Yacht Club (MAYC) NFT transactions on Ethereum.</p>

              <h2>API Endpoints</h2>
              <div class="endpoints">
                <ul>
                  <li><code>GET /api/health</code> - Health check</li>
                  <li><code>GET /api/holders/top?limit=50</code> - Top NFT holders</li>
                  <li><code>GET /api/holders/distribution</code> - Holder distribution statistics</li>
                  <li><code>GET /api/holders/:address</code> - Details for specific holder</li>
                  <li><code>GET /api/transactions/recent?hours=24</code> - Recent transactions</li>
                  <li><code>GET /api/metrics?period=24h</code> - Trading metrics (24h, 7d, 30d)</li>
                  <li><code>GET /api/whales?minNFTs=10</code> - Whale addresses</li>
                  <li><code>GET /api/cache/stats</code> - Cache statistics</li>
                  <li><code>POST /api/cache/clear</code> - Clear cache</li>
                </ul>
              </div>

              <h2>WebSocket</h2>
              <div class="endpoints">
                <p>Connect to <code>ws://localhost:3001</code> for real-time updates:</p>
                <ul>
                  <li><strong>new_transfer</strong> - New NFT transfer event</li>
                  <li><strong>whale_alert</strong> - Large holder activity</li>
                  <li><strong>large_sale</strong> - High-value sales</li>
                  <li><strong>metrics_update</strong> - Periodic metric updates</li>
                  <li><strong>top_holders_update</strong> - Top holder changes</li>
                </ul>
              </div>

              <h2>Getting Started</h2>
              <div class="endpoints">
                <ol>
                  <li>Try <code>GET /api/health</code> to verify the server is running</li>
                  <li>Visit <code>GET /api/holders/top</code> to see top NFT holders</li>
                  <li>Check <code>GET /api/metrics?period=24h</code> for trading data</li>
                  <li>Connect WebSocket for real-time monitoring</li>
                </ol>
              </div>
            </div>
          </body>
        </html>
      `);
    });
  }

  /**
   * Initialize WebSocket manager
   */
  private initializeWebSocket(): void {
    try {
      const wsPort = parseInt(process.env.WS_PORT || '3003', 10);
      this.wsManager = new WebSocketManager(this.httpServer, wsPort);
      logger.info(`WebSocket server initialized on port ${wsPort}`);
    } catch (error) {
      logger.error('Failed to initialize WebSocket server (non-critical)', error);
      // Continue without WebSocket - it's not critical for the API to function
    }
  }

  /**
   * Start real-time blockchain monitoring
   */
  private async startBlockchainMonitoring(): Promise<void> {
    try {
      const blockchainService = getBlockchainService();
      const analyticsService = getAnalyticsService();
      const cacheService = getCacheService();

      logger.info('Starting blockchain monitoring...');

      // Subscribe to new transfer events
      await blockchainService.subscribeToTransfers((transaction) => {
        logger.debug(`New transfer detected: Token ${transaction.tokenId} from ${transaction.from} to ${transaction.to}`);

        // Broadcast to WebSocket clients
        if (this.wsManager) {
          this.wsManager.broadcastTransfer(transaction);

          // Add to recent feed
          cacheService.addToRecentTransactionFeed(transaction);

          // Check if it's a whale activity
          const minNFTs = 10;
          // This is simplified - in production you'd check the holder's count
          if (transaction.type === 'sale') {
            // Could add whale detection logic here
          }
        }
      });

      logger.info('Blockchain monitoring started');

      // Periodically update metrics (every 10 minutes)
      setInterval(async () => {
        try {
          logger.info('Updating metrics cache...');
          const events = await blockchainService.getAllTransferEvents(0);
          const metrics24h = analyticsService.calculateMetricsForPeriod(
            analyticsService.getTransactionsInWindow(events, 24)
          );
          cacheService.setMetrics(metrics24h, '24h');

          if (this.wsManager) {
            this.wsManager.broadcastMetricUpdate('24h', metrics24h);
          }
        } catch (error) {
          logger.error('Error updating metrics', error);
        }
      }, 10 * 60 * 1000); // 10 minutes

      // Periodically update top holders (every 30 minutes)
      setInterval(async () => {
        try {
          logger.info('Updating top holders cache...');
          const events = await blockchainService.getAllTransferEvents(0);
          const allHolders = analyticsService.buildHoldersList(events);
          const topHolders = analyticsService.getTopHolders(allHolders, 50);
          cacheService.setTopHolders(topHolders);

          if (this.wsManager) {
            this.wsManager.broadcastTopHoldersUpdate(topHolders);
          }
        } catch (error) {
          logger.error('Error updating top holders', error);
        }
      }, 30 * 60 * 1000); // 30 minutes

      // Periodically update enriched whales data (every 1 hour)
      setInterval(async () => {
        try {
          logger.info('Updating enriched whales data...');
          const enrichmentService = getEnrichmentService();
          const events = await blockchainService.getAllTransferEvents(0);
          const allHolders = analyticsService.buildHoldersList(events);
          const topWhales = analyticsService.getTopHolders(allHolders, 50);

          const enrichedWhales = await enrichmentService.enrichWhales(topWhales);
          cacheService.setEnrichedWhales(enrichedWhales);

          logger.info(`Updated ${enrichedWhales.length} enriched whales`);

          if (this.wsManager) {
            this.wsManager.broadcastEnrichedWhalesUpdate(enrichedWhales);
          }
        } catch (error) {
          logger.error('Error updating enriched whales', error);
        }
      }, 60 * 60 * 1000); // 1 hour
    } catch (error) {
      logger.error('Failed to start blockchain monitoring', error);
    }
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      this.initializeMiddleware();
      this.initializeRoutes();
      this.initializeWebSocket();

      const port = parseInt(process.env.PORT || '3000', 10);

      this.httpServer.listen(port, () => {
        logger.info(`Server is running on http://localhost:${port}`);
        this.isRunning = true;
      });

      // Wait a bit for server to start, then begin monitoring
      await sleep(1000);
      await this.startBlockchainMonitoring();
    } catch (error) {
      logger.error('Failed to start server', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down...');

    if (this.wsManager) {
      this.wsManager.close();
    }

    this.httpServer.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  }
}

// Create and start app
const app = new App();

// Handle graceful shutdown
process.on('SIGINT', () => {
  app.shutdown();
});

process.on('SIGTERM', () => {
  app.shutdown();
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

// Start the application
app.start().catch((error) => {
  logger.error('Failed to start application', error);
  process.exit(1);
});
