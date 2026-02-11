import { Router, Request, Response } from 'express';
import { getBlockchainService } from '../services/blockchain.service';
import { getAnalyticsService } from '../services/analytics.service';
import { getCacheService } from '../services/cache.service';
import { getAlertService } from '../services/alert.service';
import { getNotificationService } from '../services/notification.service';
import { logger } from '../utils/logger';

const router = Router();
const blockchainService = getBlockchainService();
const analyticsService = getAnalyticsService();
const cacheService = getCacheService();
const alertService = getAlertService();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

/**
 * GET /api/holders/top
 * Get top N holders by NFT count
 */
router.get('/holders/top', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    // Check cache first
    let topHolders = cacheService.getTopHolders();

    if (!topHolders) {
      logger.info('Cache miss: fetching top holders');
      // Fetch all transfer events from beginning (this is expensive!)
      const events = await blockchainService.getAllTransferEvents(0);
      const allHolders = analyticsService.buildHoldersList(events);
      topHolders = analyticsService.getTopHolders(allHolders, limit);
      cacheService.setTopHolders(topHolders);
    }

    res.json({
      count: topHolders.length,
      limit,
      holders: topHolders.slice(0, limit),
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching top holders', error);
    res.status(500).json({ error: 'Failed to fetch top holders' });
  }
});

/**
 * GET /api/holders/distribution
 * Get distribution statistics
 */
router.get('/holders/distribution', async (req: Request, res: Response) => {
  try {
    // Check cache
    let stats = cacheService.getHolderStats();

    if (!stats) {
      logger.info('Cache miss: fetching holder distribution');
      const events = await blockchainService.getAllTransferEvents(0);
      const allHolders = analyticsService.buildHoldersList(events);
      stats = analyticsService.calculateDistribution(allHolders);
      cacheService.setHolderStats(stats);
    }

    res.json({
      ...stats,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching holder distribution', error);
    res.status(500).json({ error: 'Failed to fetch holder distribution' });
  }
});

/**
 * GET /api/holders/:address
 * Get details for a specific holder
 */
router.get('/holders/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    const events = await blockchainService.getAllTransferEvents(0);
    const allHolders = analyticsService.buildHoldersList(events);
    const holder = allHolders.find(
      (h) => h.address.toLowerCase() === address.toLowerCase()
    );

    if (!holder) {
      return res.status(404).json({ error: 'Holder not found' });
    }

    res.json({
      holder,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error(`Error fetching holder ${req.params.address}`, error);
    res.status(500).json({ error: 'Failed to fetch holder' });
  }
});

/**
 * GET /api/transactions/recent
 * Get recent transactions
 */
router.get('/transactions/recent', async (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const limit = parseInt(req.query.limit as string) || 100;

    // Check cache
    let transactions = cacheService.getTransactions('recentTransactions');

    if (!transactions) {
      logger.info('Cache miss: fetching recent transactions');
      const allEvents = await blockchainService.getAllTransferEvents(0);
      const filtered = analyticsService.getTransactionsInWindow(allEvents, hours);
      transactions = filtered.slice(0, limit);
      cacheService.setTransactions(transactions, 'recentTransactions');
    }

    res.json({
      count: transactions.length,
      limit,
      hours,
      transactions: transactions.slice(0, limit),
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching recent transactions', error);
    res.status(500).json({ error: 'Failed to fetch recent transactions' });
  }
});

/**
 * GET /api/metrics
 * Get metrics for a specific period
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || '24h';

    // Parse period
    let hours = 24;
    if (period === '7d') hours = 168;
    if (period === '30d') hours = 720;

    // Check cache
    let metrics = cacheService.getMetrics(period);

    if (!metrics) {
      logger.info(`Cache miss: fetching metrics for period ${period}`);
      const allEvents = await blockchainService.getAllTransferEvents(0);
      const inWindow = analyticsService.getTransactionsInWindow(allEvents, hours);
      metrics = analyticsService.calculateMetricsForPeriod(inWindow);
      cacheService.setMetrics(metrics, period);
    }

    res.json({
      period,
      metrics,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching metrics', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// NOTE: /api/whales/top is handled by direct handler in index.ts - do not add duplicate routes here

/**
 * GET /api/whales/search
 * Search whale by address
 */
router.get('/whales/search', async (req: Request, res: Response) => {
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

    const MAYC_TOTAL_SUPPLY = 19423;
    const recentSales = events.filter((e: any) => e.priceETH && e.priceETH > 0);
    const floorPrice = recentSales.length > 0
      ? parseFloat(Math.min(...recentSales.map((e: any) => e.priceETH)).toFixed(4))
      : null;

    const rank = allHolders.sort((a, b) => b.count - a.count).findIndex(h => h.address.toLowerCase() === address.toLowerCase()) + 1;

    res.json({
      address: whale.address,
      ensName: whale.ensName || null,
      rank,
      nftCount: whale.count,
      nftIds: whale.tokenIds || [],
      percentageOfCollection: ((whale.count / MAYC_TOTAL_SUPPLY) * 100).toFixed(2),
      floorPrice,
      estimatedValueETH: floorPrice ? (whale.count * floorPrice).toFixed(2) : null,
      lastUpdated: new Date(),
    });
  } catch (error) {
    logger.error('Error searching whale', error);
    res.status(500).json({ error: 'Failed to search whale' });
  }
});

/**
 * GET /api/whales/analytics
 * DEPRECATED: Use the handler in index.ts instead (direct handler takes precedence)
 * This route is kept for reference but the actual handler is in index.ts
 */
/* Commented out - using handler from index.ts
router.get('/whales/analytics', async (req: Request, res: Response) => {
  try {
    const events = await blockchainService.getAllTransferEvents(0);
    const allHolders = analyticsService.buildHoldersList(events);

    const distribution = {
      single: allHolders.filter(h => h.count === 1).length,
      small: allHolders.filter(h => h.count >= 2 && h.count <= 5).length,
      medium: allHolders.filter(h => h.count >= 6 && h.count <= 10).length,
      large: allHolders.filter(h => h.count >= 11 && h.count <= 19).length,
      whales: allHolders.filter(h => h.count >= 20).length,
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
*/

// NOTE: /api/whales/stats is handled by direct handler in index.ts - do not add duplicate routes here

/**
 * POST /api/whales/refresh
 * Refresh whale data cache
 */
router.post('/whales/refresh', async (req: Request, res: Response) => {
  try {
    cacheService.clear();
    res.json({ message: 'Cache cleared successfully', timestamp: new Date() });
  } catch (error) {
    logger.error('Error refreshing cache', error);
    res.status(500).json({ error: 'Failed to refresh cache' });
  }
});

/**
 * GET /api/whales
 * Get list of whale addresses (10+ NFTs)
 */
router.get('/whales', async (req: Request, res: Response) => {
  try {
    const minNFTs = parseInt(req.query.minNFTs as string) || 10;

    const events = await blockchainService.getAllTransferEvents(0);
    const allHolders = analyticsService.buildHoldersList(events);
    const whales = allHolders.filter((h) => h.count >= minNFTs);

    const topWhales = whales.sort((a, b) => b.count - a.count);

    res.json({
      count: topWhales.length,
      minNFTs,
      whales: topWhales,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching whales', error);
    res.status(500).json({ error: 'Failed to fetch whales' });
  }
});

/**
 * GET /api/cache/stats
 * Get cache statistics
 */
router.get('/cache/stats', (req: Request, res: Response) => {
  const stats = cacheService.getStats();
  res.json({
    stats,
    timestamp: new Date(),
  });
});

/**
 * POST /api/cache/clear
 * Clear cache
 */
router.post('/cache/clear', (req: Request, res: Response) => {
  cacheService.clear();
  res.json({
    message: 'Cache cleared',
    timestamp: new Date(),
  });
});

/**
 * ===== ENRICHED WHALE ENDPOINTS =====
 */

/**
 * GET /api/whales/top/enriched
 * Get top N whales with enriched data (ENS, ETH balance, portfolio)
 */
router.get('/whales/top/enriched', async (req: Request, res: Response) => {
  try {
    const { getEnrichmentService } = await import('../services/enrichment.service');
    const enrichmentService = getEnrichmentService();

    const limit = parseInt(req.query.limit as string) || 50;
    const skipCache = req.query.skipCache === 'true';

    logger.info(`GET /whales/top/enriched?limit=${limit}&skipCache=${skipCache}`);

    // Check cache first
    if (!skipCache) {
      const cached = cacheService.getEnrichedWhales();
      if (cached) {
        logger.info(`Returning cached enriched whales (${cached.length})`);
        return res.json({
          whales: cached.slice(0, limit),
          count: Math.min(cached.length, limit),
          total: cached.length,
          source: 'cache',
          enrichedAt: cached[0]?.enrichedAt || null,
          timestamp: new Date(),
        });
      }
    }

    // Fetch real data and enrich
    logger.info('Fetching real blockchain data for enrichment...');
    const events = await blockchainService.getAllTransferEvents(0);
    const allHolders = analyticsService.buildHoldersList(events);
    const topWhales = analyticsService.getTopHolders(allHolders, limit);

    const enrichedWhales = await enrichmentService.enrichWhales(topWhales);
    cacheService.setEnrichedWhales(enrichedWhales);

    return res.json({
      whales: enrichedWhales.slice(0, limit),
      count: enrichedWhales.length,
      total: enrichedWhales.length,
      source: 'live',
      enrichedAt: new Date(),
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching enriched whales', error);
    res.status(500).json({ error: 'Failed to fetch enriched whales' });
  }
});

/**
 * GET /api/whales/:address/enriched
 * Get detailed enriched info for specific whale address
 */
router.get('/whales/:address/enriched', async (req: Request, res: Response) => {
  try {
    const { getEnrichmentService } = await import('../services/enrichment.service');
    const enrichmentService = getEnrichmentService();

    const { address } = req.params;

    // Validate Ethereum address
    if (!address.match(/^0x[a-fA-F0-9]{40}$/i)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    logger.info(`GET /whales/${address}/enriched`);

    // Get base holder info
    const events = await blockchainService.getAllTransferEvents(0);
    const allHolders = analyticsService.buildHoldersList(events);
    const holder = allHolders.find((h) => h.address.toLowerCase() === address.toLowerCase());

    if (!holder) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // Enrich data
    const enriched = await enrichmentService.enrichWhale(holder);

    // Calculate rank
    const sorted = allHolders.sort((a, b) => b.count - a.count);
    const rank = sorted.findIndex((h) => h.address.toLowerCase() === address.toLowerCase()) + 1;

    res.json({
      whale: {
        ...enriched,
        rank,
      },
      enrichedAt: new Date(),
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching enriched whale details', error);
    res.status(500).json({ error: 'Failed to fetch whale details' });
  }
});

/**
 * GET /api/whales/portfolio/:address
 * Get detailed portfolio breakdown for whale
 */
router.get('/whales/portfolio/:address', async (req: Request, res: Response) => {
  try {
    const { getEnrichmentService } = await import('../services/enrichment.service');
    const enrichmentService = getEnrichmentService();

    const { address } = req.params;

    // Validate Ethereum address
    if (!address.match(/^0x[a-fA-F0-9]{40}$/i)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    logger.info(`GET /whales/portfolio/${address}`);

    // Get portfolio
    const portfolio = await enrichmentService.analyzePortfolio(address);
    const portfolioValue = await enrichmentService.calculatePortfolioValue(portfolio);

    res.json({
      address,
      portfolio,
      totalValueETH: portfolioValue,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching portfolio', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

/**
 * ===== COLLECTION INSIGHTS ENDPOINTS =====
 */

/**
 * GET /api/traits/analysis
 * Get trait rarity analysis for MAYC collection
 */
router.get('/traits/analysis', async (req: Request, res: Response) => {
  try {
    const { getTraitAnalyzerService } = await import('../services/trait-analyzer.service');
    const traitAnalyzer = getTraitAnalyzerService();

    logger.info('GET /api/traits/analysis');

    const analysis = await traitAnalyzer.analyzeTraits();

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching trait analysis', error);
    res.status(500).json({ error: 'Failed to fetch trait analysis' });
  }
});

/**
 * GET /api/metrics/historical?days=7
 * Get daily breakdown of activity over specified period
 */
router.get('/metrics/historical', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const maxDays = 30; // Limit to 30 days max

    if (days > maxDays) {
      return res.status(400).json({ error: `Maximum ${maxDays} days allowed` });
    }

    logger.info(`GET /api/metrics/historical?days=${days}`);

    // Check cache
    const cacheKey = `historical_metrics_${days}d`;
    const cached = cacheService.get(cacheKey);

    if (cached) {
      logger.info('Returning cached historical metrics');
      return res.json({
        success: true,
        data: cached,
        source: 'cache',
        timestamp: new Date(),
      });
    }

    // Fetch all transfer events
    const allEvents = await blockchainService.getAllTransferEvents(0);

    // Calculate cutoff timestamp
    const now = Date.now();
    const cutoffTime = now - days * 24 * 60 * 60 * 1000;

    // Filter events within time window
    const recentEvents = allEvents.filter((e: any) => {
      const eventTime = e.timestamp ? new Date(e.timestamp).getTime() : 0;
      return eventTime >= cutoffTime;
    });

    // Group by day
    const dailyMetrics: any[] = [];
    for (let i = 0; i < days; i++) {
      const dayStart = now - (i + 1) * 24 * 60 * 60 * 1000;
      const dayEnd = now - i * 24 * 60 * 60 * 1000;

      const dayEvents = recentEvents.filter((e: any) => {
        const eventTime = e.timestamp ? new Date(e.timestamp).getTime() : 0;
        return eventTime >= dayStart && eventTime < dayEnd;
      });

      const uniqueBuyers = new Set(dayEvents.map((e: any) => e.to)).size;
      const uniqueSellers = new Set(dayEvents.map((e: any) => e.from)).size;
      const totalVolume = dayEvents.reduce((sum: number, e: any) => sum + (e.priceETH || 0), 0);

      // Calculate floor price (minimum sale price for the day)
      const salesWithPrice = dayEvents.filter((e: any) => e.priceETH && e.priceETH > 0);
      const minPrice = salesWithPrice.length > 0
        ? Math.min(...salesWithPrice.map((e: any) => e.priceETH))
        : null;

      dailyMetrics.unshift({
        date: new Date(dayStart).toISOString().split('T')[0],
        transfers: dayEvents.length,
        uniqueBuyers,
        uniqueSellers,
        volumeETH: parseFloat(totalVolume.toFixed(4)),
        floorPriceETH: minPrice ? parseFloat(minPrice.toFixed(4)) : null,
      });
    }

    // Calculate week-over-week comparison
    const thisWeekTotal = dailyMetrics.slice(-7).reduce((sum, d) => sum + d.transfers, 0);
    const lastWeekTotal = dailyMetrics.slice(0, 7).reduce((sum, d) => sum + d.transfers, 0);
    const weekOverWeekChange = lastWeekTotal > 0
      ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal * 100).toFixed(1)
      : '0.0';

    const result = {
      period: `${days}d`,
      dailyBreakdown: dailyMetrics,
      summary: {
        totalTransfers: recentEvents.length,
        avgTransfersPerDay: (recentEvents.length / days).toFixed(1),
        weekOverWeekChange: parseFloat(weekOverWeekChange),
      },
    };

    // Cache for 30 minutes
    cacheService.set(cacheKey, result, 1800);

    res.json({
      success: true,
      data: result,
      source: 'live',
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching historical metrics', error);
    res.status(500).json({ error: 'Failed to fetch historical metrics' });
  }
});

/**
 * ALERTS API ENDPOINTS
 */

/**
 * GET /api/alerts/rules
 * Get all alert rules
 */
router.get('/alerts/rules', (req: Request, res: Response) => {
  try {
    const rules = alertService.getAllRules();
    res.json({
      success: true,
      count: rules.length,
      rules,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching alert rules', error);
    res.status(500).json({ error: 'Failed to fetch alert rules' });
  }
});

/**
 * GET /api/alerts/rules/:id
 * Get specific alert rule
 */
router.get('/alerts/rules/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rule = alertService.getRule(id);

    if (!rule) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }

    res.json({
      success: true,
      rule,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching alert rule', error);
    res.status(500).json({ error: 'Failed to fetch alert rule' });
  }
});

/**
 * POST /api/alerts/rules
 * Create new alert rule
 */
router.post('/alerts/rules', (req: Request, res: Response) => {
  try {
    const rule = alertService.createRule(req.body);
    res.status(201).json({
      success: true,
      rule,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error creating alert rule', error);
    res.status(500).json({ error: 'Failed to create alert rule' });
  }
});

/**
 * PUT /api/alerts/rules/:id
 * Update alert rule
 */
router.put('/alerts/rules/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rule = alertService.updateRule(id, req.body);

    if (!rule) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }

    res.json({
      success: true,
      rule,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error updating alert rule', error);
    res.status(500).json({ error: 'Failed to update alert rule' });
  }
});

/**
 * DELETE /api/alerts/rules/:id
 * Delete alert rule
 */
router.delete('/alerts/rules/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = alertService.deleteRule(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }

    res.json({
      success: true,
      message: 'Alert rule deleted',
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error deleting alert rule', error);
    res.status(500).json({ error: 'Failed to delete alert rule' });
  }
});

/**
 * POST /api/alerts/rules/:id/toggle
 * Toggle alert rule status (active/paused)
 */
router.post('/alerts/rules/:id/toggle', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rule = alertService.toggleRule(id);

    if (!rule) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }

    res.json({
      success: true,
      rule,
      message: `Alert ${rule.status === 'active' ? 'activated' : 'paused'}`,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error toggling alert rule', error);
    res.status(500).json({ error: 'Failed to toggle alert rule' });
  }
});

/**
 * GET /api/alerts/stats
 * Get alert statistics
 */
router.get('/alerts/stats', (req: Request, res: Response) => {
  try {
    const stats = alertService.getStats();
    res.json({
      success: true,
      stats,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching alert stats', error);
    res.status(500).json({ error: 'Failed to fetch alert stats' });
  }
});

/**
 * GET /api/alerts/history
 * Get alert history
 */
router.get('/alerts/history', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = alertService.getHistory(limit);

    res.json({
      success: true,
      count: history.length,
      history,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error fetching alert history', error);
    res.status(500).json({ error: 'Failed to fetch alert history' });
  }
});

/**
 * POST /api/alerts/history/:id/acknowledge
 * Acknowledge an alert
 */
router.post('/alerts/history/:id/acknowledge', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const acknowledged = alertService.acknowledgeAlert(id);

    if (!acknowledged) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({
      success: true,
      message: 'Alert acknowledged',
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error acknowledging alert', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

/**
 * POST /alerts/test-notification
 * Test notification sending (Telegram/Email/Webhook)
 */
router.post('/alerts/test-notification', async (req: Request, res: Response) => {
  try {
    const { channel, message } = req.body;

    if (!channel || !message) {
      return res.status(400).json({
        error: 'Missing required fields: channel, message',
      });
    }

    const notificationService = getNotificationService();
    const success = await notificationService.sendTestNotification(channel, message);

    if (success) {
      res.json({
        success: true,
        message: `Test ${channel} notification sent successfully`,
        timestamp: new Date(),
      });
    } else {
      res.status(500).json({
        error: `Failed to send ${channel} notification. Check configuration.`,
      });
    }
  } catch (error) {
    logger.error('Error sending test notification', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

export default router;
