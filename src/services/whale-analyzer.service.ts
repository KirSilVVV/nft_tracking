import { logger } from '../utils/logger';
import { Holder } from '../models/holder.model';
import { Whale, WhaleListResponse, WhaleAnalytics, WhaleSearchResult } from '../models/whale.model';
import { getCacheService } from './cache.service';
import { getBlockchainService } from './blockchain.service';

/**
 * WhaleAnalyzerService - Анализ крупных держателей (китов) MAYC
 * Использует существующие Transfer события для вычисления балансов
 * ⚠️ ЭКОНОМИТ API вызовы: не использует getOwnersForContract()
 */
export class WhaleAnalyzerService {
  private cacheService = getCacheService();
  private blockchainService = getBlockchainService();
  private readonly CACHE_KEY_WHALES = 'whales:list';
  private readonly CACHE_KEY_ANALYTICS = 'whales:analytics';
  private readonly CACHE_TTL = 1800; // 30 минут

  /**
   * Получить список топ китов из данных холдеров
   * @param holders - массив холдеров с информацией о балансах
   * @param floorPrice - текущий floor price в ETH
   * @param limit - сколько топ китов вернуть
   */
  buildWhaleList(holders: Holder[], floorPrice: number, limit: number = 50): Whale[] {
    logger.info(`🐋 Building whale list from ${holders.length} holders...`);

    // Фильтруем только значительных холдеров (3+ NFT)
    const significantHolders = holders.filter((h) => h.count >= 3);

    // Трансформируем холдеров в китов
    const whales: Whale[] = significantHolders.map((holder, index) => ({
      address: holder.address,
      ensName: null, // Будет заполнено при запросе
      rank: index + 1,

      nftCount: holder.count,
      nftIds: holder.tokenIds,
      percentageOfCollection: holder.percentageOfCollection || 0,

      floorPrice: floorPrice,
      estimatedValueETH: holder.count * floorPrice,
      estimatedValueUSD: (holder.count * floorPrice) * 1800, // ~$1800 за ETH (будет обновляться)
      ethBalance: 0, // Будет получено отдельно через getBalance()

      firstSeen: holder.firstSeen,
      lastActivity: holder.lastActivity,
    }));

    // Сортируем по количеству NFT
    whales.sort((a, b) => b.nftCount - a.nftCount);

    // Обновляем ранги после сортировки
    whales.forEach((whale, index) => {
      whale.rank = index + 1;
    });

    logger.info(`✅ Built ${whales.length} whales, top whale has ${whales[0]?.nftCount || 0} NFTs`);

    return whales.slice(0, limit);
  }

  /**
   * Получить топ китов с кэшированием
   * Сначала пытается вернуть из кэша, затем обновляет в фоне
   */
  async getTopWhales(limit: number = 50): Promise<WhaleListResponse> {
    // Проверить кэш
    const cached = this.cacheService.get(this.CACHE_KEY_WHALES);
    if (cached) {
      logger.info(`📦 Returning cached whale list (${cached.whales.length} whales)`);
      return {
        ...cached,
        cachedAt: true,
        lastUpdated: new Date(),
      };
    }

    logger.info('🔄 Cache miss, fetching fresh whale data...');

    // Получить свежие данные
    try {
      const response = await this.fetchFreshWhales(limit);

      // Кэшировать результат
      this.cacheService.set(this.CACHE_KEY_WHALES, response, this.CACHE_TTL);

      return {
        ...response,
        cachedAt: false,
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error('❌ Error fetching whale data:', error);

      // Если ошибка, вернуть старый кэш если есть
      const staleCache = this.cacheService.get(this.CACHE_KEY_WHALES);
      if (staleCache) {
        logger.warn('⚠️ Returning stale cache due to error');
        return {
          ...staleCache,
          cachedAt: true,
          lastUpdated: new Date(),
        };
      }

      throw error;
    }
  }

  /**
   * Получить свежие данные о китах (дорогая операция)
   * ⚠️ Использует кэшированные Transfer события
   */
  private async fetchFreshWhales(limit: number): Promise<WhaleListResponse> {
    logger.info('📥 Fetching transfer events...');

    // Получить Transfer события (используются уже закэшированные!)
    const events = await this.blockchainService.getAllTransferEvents(0);
    logger.info(`📊 Got ${events.length} transfer events`);

    // Вычислить балансы из событий
    const holders = this.computeHoldersFromEvents(events);
    logger.info(`👥 Computed ${holders.length} holders`);

    // ЭКОНОМИЯ API: не получаем floor price для каждого запроса, используем кэшированное значение
    // Но для примера возьмем фиксированное значение (в продакшене получать через WebSocket)
    const floorPrice = 5.5; // ETH (эту цену нужно получать из OpenSea API 1 раз в час)

    // Построить список китов
    const whales = this.buildWhaleList(holders, floorPrice, limit);

    return {
      whales,
      totalCount: whales.length,
      totalUniqueHolders: holders.length,
      floorPrice,
      lastUpdated: new Date(),
      cachedAt: false,
    };
  }

  /**
   * Вычислить холдеры из Transfer событий (копия из analytics.service)
   * ⚠️ ЭКОНОМИТ API: использует локальный расчет вместо getOwnersForContract
   */
  private computeHoldersFromEvents(events: any[]): Holder[] {
    const holders = new Map<string, Holder>();

    // Обработать события в хронологическом порядке
    for (const event of events) {
      // Удалить из 'from' адреса
      if (event.from !== '0x0000000000000000000000000000000000000000') {
        if (holders.has(event.from)) {
          const holder = holders.get(event.from)!;
          holder.tokenIds = holder.tokenIds.filter((id) => id !== event.tokenId);
          holder.count--;
          holder.lastActivity = event.timestamp;
        }
      }

      // Добавить в 'to' адрес
      if (!holders.has(event.to)) {
        holders.set(event.to, {
          address: event.to,
          tokenIds: [],
          count: 0,
          firstSeen: event.timestamp,
          lastActivity: event.timestamp,
        });
      }

      const holder = holders.get(event.to)!;
      if (!holder.tokenIds.includes(event.tokenId)) {
        holder.tokenIds.push(event.tokenId);
        holder.count++;
      }
      holder.lastActivity = event.timestamp;
    }

    // Удалить холдеров без токенов
    const activeHolders = Array.from(holders.values()).filter((h) => h.count > 0);

    // Вычислить проценты от коллекции
    const totalSupply = activeHolders.reduce((sum, h) => sum + h.count, 0);
    for (const holder of activeHolders) {
      holder.percentageOfCollection = (holder.count / totalSupply) * 100;
    }

    return activeHolders;
  }

  /**
   * Найти кита по адресу
   */
  async searchWhaleByAddress(address: string): Promise<WhaleSearchResult> {
    try {
      // Валидация адреса
      if (!address.match(/^0x[a-fA-F0-9]{40}$/i)) {
        return {
          whale: null,
          found: false,
          message: '❌ Invalid Ethereum address format',
        };
      }

      const normalizedAddress = address.toLowerCase();

      // Получить данные о китах
      const { whales } = await this.getTopWhales(1000); // Ищем в топ 1000

      // Найти кита
      const whale = whales.find((w) => w.address.toLowerCase() === normalizedAddress);

      if (whale) {
        return {
          whale,
          found: true,
          message: `✅ Found whale #${whale.rank} with ${whale.nftCount} NFTs`,
        };
      }

      return {
        whale: null,
        found: false,
        message: `⚠️ Address not found in top 1000 holders`,
      };
    } catch (error) {
      logger.error('Error searching whale:', error);
      return {
        whale: null,
        found: false,
        message: '❌ Error searching whale',
      };
    }
  }

  /**
   * Получить аналитику по китам
   */
  async getWhaleAnalytics(): Promise<WhaleAnalytics> {
    // Проверить кэш
    const cached = this.cacheService.get(this.CACHE_KEY_ANALYTICS);
    if (cached) {
      logger.info('📦 Returning cached analytics');
      return cached;
    }

    logger.info('🔄 Computing whale analytics...');

    const { whales: topWhales } = await this.getTopWhales(1000);

    // Распределение по размерам холдинга
    const distribution = {
      single: topWhales.filter((w) => w.nftCount === 1).length,
      small: topWhales.filter((w) => w.nftCount >= 2 && w.nftCount <= 5).length,
      medium: topWhales.filter((w) => w.nftCount >= 6 && w.nftCount <= 10).length,
      large: topWhales.filter((w) => w.nftCount >= 11 && w.nftCount <= 50).length,
      whales: topWhales.filter((w) => w.nftCount > 50).length,
    };

    // Статистика
    const allCounts = topWhales.map((w) => w.nftCount);
    const totalNFTs = allCounts.reduce((a, b) => a + b, 0);
    const averagePerHolder = totalNFTs / topWhales.length;
    const sorted = [...allCounts].sort((a, b) => a - b);
    const medianPerHolder = sorted[Math.floor(sorted.length / 2)];

    // Концентрация топ 90
    const topWhale90Percent = topWhales.filter((w) => w.rank <= 90);
    const whale90Total = topWhale90Percent.reduce((sum, w) => sum + w.nftCount, 0);
    const whale90Concentration = (whale90Total / totalNFTs) * 100;

    const analytics: WhaleAnalytics = {
      topWhales: topWhales.slice(0, 50),
      distribution,
      statistics: {
        totalHolders: topWhales.length,
        totalNFTs,
        averagePerHolder,
        medianPerHolder,
        maxHeld: allCounts[0] || 0,
        minHeld: allCounts[allCounts.length - 1] || 0,
      },
      floorPrice: 5.5,
      totalMarketCap: totalNFTs * 5.5,
      whale90Concentration,
    };

    // Кэшировать
    this.cacheService.set(this.CACHE_KEY_ANALYTICS, analytics, this.CACHE_TTL);

    logger.info(`✅ Analytics computed: top 50 whales control ${whale90Concentration.toFixed(2)}% of collection`);

    return analytics;
  }

  /**
   * Очистить кэш (при обновлении данных)
   */
  clearCache(): void {
    this.cacheService.clearKey(this.CACHE_KEY_WHALES);
    this.cacheService.clearKey(this.CACHE_KEY_ANALYTICS);
    logger.info('✅ Whale cache cleared');
  }
}

let instance: WhaleAnalyzerService;

export function getWhaleAnalyzerService(): WhaleAnalyzerService {
  if (!instance) {
    instance = new WhaleAnalyzerService();
  }
  return instance;
}
