import { Request, Response } from 'express';
import { getWhaleAnalyzerService } from '../services/whale-analyzer.service';
import { logger } from '../utils/logger';

const whaleService = getWhaleAnalyzerService();

/**
 * API контроллер для работы с китами (крупными держателями)
 */

/**
 * GET /api/whales/top?limit=50
 * Получить топ китов
 */
export async function getTopWhales(req: Request, res: Response) {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 500); // Макс 500

    logger.info(`🐋 Fetching top ${limit} whales...`);

    const whaleList = await whaleService.getTopWhales(limit);

    res.json({
      success: true,
      status: 200,
      data: whaleList,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('❌ Error in getTopWhales:', error);

    res.status(500).json({
      success: false,
      status: 500,
      error: 'Failed to fetch whale data',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * GET /api/whales/search?address=0x...
 * Найти кита по адресу
 */
export async function searchWhale(req: Request, res: Response) {
  try {
    const address = (req.query.address as string) || '';

    if (!address) {
      return res.status(400).json({
        success: false,
        status: 400,
        error: 'Missing address parameter',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info(`🔍 Searching whale: ${address.slice(0, 6)}...${address.slice(-4)}`);

    const result = await whaleService.searchWhaleByAddress(address);

    res.json({
      success: result.found,
      status: result.found ? 200 : 404,
      data: result.whale,
      message: result.message,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('❌ Error in searchWhale:', error);

    res.status(500).json({
      success: false,
      status: 500,
      error: 'Failed to search whale',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * GET /api/whales/analytics
 * Получить аналитику по китам
 */
export async function getAnalytics(req: Request, res: Response) {
  try {
    logger.info('📊 Computing whale analytics...');

    const analytics = await whaleService.getWhaleAnalytics();

    res.json({
      success: true,
      status: 200,
      data: analytics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('❌ Error in getAnalytics:', error);

    res.status(500).json({
      success: false,
      status: 500,
      error: 'Failed to compute analytics',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * POST /api/whales/refresh
 * Принудительно обновить кэш китов
 * ⚠️ Требует аутентификации в production
 */
export async function refreshCache(req: Request, res: Response) {
  try {
    logger.info('🔄 Refreshing whale cache...');

    whaleService.clearCache();

    res.json({
      success: true,
      status: 200,
      message: 'Whale cache cleared, will refresh on next request',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('❌ Error in refreshCache:', error);

    res.status(500).json({
      success: false,
      status: 500,
      error: 'Failed to refresh cache',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * GET /api/whales/stats
 * Получить быструю статистику (из кэша)
 */
export async function getQuickStats(req: Request, res: Response) {
  try {
    const whaleList = await whaleService.getTopWhales(50);

    const stats = {
      topWhales: whaleList.whales.length,
      topWhale: whaleList.whales[0] || null,
      floorPrice: whaleList.floorPrice,
      totalValue: whaleList.whales.reduce((sum, w) => sum + w.estimatedValueETH, 0),
      averageHoldingSize: whaleList.totalCount > 0 ?
        whaleList.whales.reduce((sum, w) => sum + w.nftCount, 0) / whaleList.whales.length : 0,
      cachedAt: whaleList.cachedAt,
    };

    res.json({
      success: true,
      status: 200,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('❌ Error in getQuickStats:', error);

    res.status(500).json({
      success: false,
      status: 500,
      error: 'Failed to get stats',
      timestamp: new Date().toISOString(),
    });
  }
}
