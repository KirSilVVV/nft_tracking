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
 * GET /api/whales/top
 * Get top N whales by NFT count
 */
router.get('/whales/top', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const events = await blockchainService.getAllTransferEvents(0);
    const allHolders = analyticsService.buildHoldersList(events);
    const topWhales = allHolders.sort((a, b) => b.count - a.count).slice(0, limit);

    const floorPrice = 5.5; // Mock floor price
    const totalUniqueHolders = new Set(allHolders.map(h => h.address)).size;

    res.json({
      whales: topWhales.map((w, idx) => ({
        rank: idx + 1,
        address: w.address,
        ensName: w.ensName || null,
        nftCount: w.count,
        nftIds: w.tokenIds || [],
        percentageOfCollection: ((w.count / 10000) * 100).toFixed(2),
        floorPrice: floorPrice,
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

/**
 * GET /api/whales/analytics
 * Get whale analytics and distribution
 */
router.get('/whales/analytics', async (req: Request, res: Response) => {
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

/**
 * GET /api/whales/stats
 * Get quick stats
 */
router.get('/whales/stats', async (req: Request, res: Response) => {
  try {
    const events = await blockchainService.getAllTransferEvents(0);
    const allHolders = analyticsService.buildHoldersList(events);

    const stats = {
      totalHolders: allHolders.length,
      floorPrice: 5.5,
      totalVolume: (allHolders.length * 5.5).toFixed(2),
      lastUpdated: new Date(),
    };

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching stats', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

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

    // Fetch and enrich with fallback
    try {
      logger.info('Fetching fresh enriched whales...');
      const events = await blockchainService.getAllTransferEvents(0);
      const allHolders = analyticsService.buildHoldersList(events);
      const topWhales = analyticsService.getTopHolders(allHolders, limit);

      logger.info(`Enriching ${topWhales.length} whales...`);
      const enrichedWhales = await enrichmentService.enrichWhales(topWhales);

      // Cache results
      cacheService.setEnrichedWhales(enrichedWhales);

      return res.json({
        whales: enrichedWhales.slice(0, limit),
        count: enrichedWhales.length,
        total: enrichedWhales.length,
        source: 'live',
        enrichedAt: new Date(),
        timestamp: new Date(),
      });
    } catch (apiError) {
      logger.warn('Blockchain API error, using mock data fallback', apiError);

      // Generate and cache mock enriched whales
      const mockWhales = generateMockEnrichedWhales(limit);
      cacheService.setEnrichedWhales(mockWhales);

      return res.json({
        whales: mockWhales.slice(0, limit),
        count: mockWhales.length,
        total: mockWhales.length,
        source: 'mock_fallback',
        enrichedAt: new Date(),
        timestamp: new Date(),
        warning: 'Using mock data due to blockchain API limitations',
      });
    }
  } catch (error) {
    logger.error('Error fetching enriched whales', error);
    res.status(500).json({ error: 'Failed to fetch enriched whales' });
  }
});

/**
 * Generate mock enriched whales for fallback
 */
function generateMockEnrichedWhales(count: number = 50) {
  const whales: any[] = [];
  for (let i = 0; i < count; i++) {
    const address = '0x' + i.toString().padStart(40, '0').substring(0, 40);
    const nftCount = Math.max(10, 150 - i * 2);

    whales.push({
      address,
      ensName: i === 0 ? 'whale.eth' : null,
      tokenIds: Array.from({ length: nftCount }, (_, j) => 1000 * (i + 1) + j),
      count: nftCount,
      firstSeen: new Date(2021, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      lastActivity: new Date(),
      percentageOfCollection: (nftCount / 10000 * 100),
      ethBalance: (Math.random() * 500).toString(),
      portfolio: {
        totalCollections: 3,
        totalNFTs: nftCount,
        collections: [
          {
            contractAddress: '0x60E4d786628Fea6478F785A6d7e704777c86a7c6',
            name: 'Mutant Ape Yacht Club',
            symbol: 'MAYC',
            tokenType: 'ERC721',
            count: nftCount,
            floorPrice: 5.5,
            estimatedValueETH: nftCount * 5.5,
            image: null,
          },
        ],
      },
      portfolioValueETH: nftCount * 5.5,
      enrichedAt: new Date(),
      enrichmentStatus: 'complete' as const,
    });
  }
  return whales;
}

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

export default router;
