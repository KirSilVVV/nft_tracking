import { Router, Request, Response } from 'express';
import { getBlockchainService } from '../services/blockchain.service';
import { getAnalyticsService } from '../services/analytics.service';
import { getCacheService } from '../services/cache.service';
import { logger } from '../utils/logger';

const router = Router();
const blockchainService = getBlockchainService();
const analyticsService = getAnalyticsService();
const cacheService = getCacheService();

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

export default router;
