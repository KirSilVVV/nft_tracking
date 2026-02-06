import express from 'express';
import {
  getTopWhales,
  searchWhale,
  getAnalytics,
  refreshCache,
  getQuickStats,
} from '../controllers/whale.controller';

const router = express.Router();

/**
 * GET /api/whales/top?limit=50
 * Получить топ N китов (по умолчанию 50)
 *
 * Query params:
 *   - limit: number (1-500, по умолчанию 50)
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "whales": [...],
 *     "totalCount": 50,
 *     "totalUniqueHolders": 2500,
 *     "floorPrice": 5.5,
 *     "cachedAt": true,
 *     "lastUpdated": "2024-02-06T..."
 *   }
 * }
 */
router.get('/top', getTopWhales);

/**
 * GET /api/whales/search?address=0x...
 * Найти кита по Ethereum адресу
 *
 * Query params:
 *   - address: string (Ethereum адрес, обязательно)
 *
 * Response:
 * {
 *   "success": true,
 *   "data": { whale object },
 *   "message": "✅ Found whale #1 with 150 NFTs"
 * }
 */
router.get('/search', searchWhale);

/**
 * GET /api/whales/analytics
 * Получить полную аналитику по китам:
 * - Топ 50 китов
 * - Распределение по размерам холдинга
 * - Статистика (средний размер, медиана, макс/мин)
 * - Концентрация топ 90 китов
 * - Общая рыночная капитализация
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "topWhales": [...],
 *     "distribution": { single, small, medium, large, whales },
 *     "statistics": { ... },
 *     "floorPrice": 5.5,
 *     "totalMarketCap": 123456,
 *     "whale90Concentration": 65.5
 *   }
 * }
 */
router.get('/analytics', getAnalytics);

/**
 * GET /api/whales/stats
 * Быстрая статистика (из кэша, очень быстро)
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "topWhales": 50,
 *     "topWhale": { whale object },
 *     "floorPrice": 5.5,
 *     "totalValue": 12345.6,
 *     "averageHoldingSize": 12.5,
 *     "cachedAt": true
 *   }
 * }
 */
router.get('/stats', getQuickStats);

/**
 * POST /api/whales/refresh
 * Принудительно обновить кэш китов
 * ⚠️ В production требует аутентификации!
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Whale cache cleared, will refresh on next request"
 * }
 */
router.post('/refresh', refreshCache);

// Healthcheck для whale API
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'whale-tracker',
    timestamp: new Date().toISOString(),
  });
});

export default router;
