import { logger } from '../utils/logger';
import { getOpenSeaProvider, NFTSaleEvent } from '../providers/opensea.provider';

interface FlipEstimate {
  buyPrice: number;
  sellPrice: number;
  gasFees: number;
  marketplaceFees: number;
  netProfit: number;
  roi: number;
  breakeven: number;
}

interface HistoricalFlip {
  tokenId: number;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  roi: number;
  holdingPeriodDays: number;
  buyDate: string;
  sellDate: string;
  buyerAddress: string;
  sellerAddress: string;
}

interface FlipStatistics {
  totalFlips: number;
  profitableFlips: number;
  unprofitableFlips: number;
  successRate: number;
  avgProfit: number;
  avgHoldingPeriod: number;
  avgROI: number;
}

export class FlipCalculatorService {
  // Constants
  private readonly GAS_FEE_ETH = 0.003; // Average gas fee for NFT transfer (~$10-20)
  private readonly MARKETPLACE_FEE_PERCENT = 2.5; // OpenSea fee 2.5%
  private readonly ETH_USD_RATE = 3000; // Approximate ETH/USD rate

  /**
   * Calculate profit estimate for a potential flip
   */
  calculateEstimate(buyPrice: number, sellPrice: number, holdingPeriodDays: number = 0): FlipEstimate {
    logger.info(`Calculating flip estimate: buy=${buyPrice} ETH, sell=${sellPrice} ETH`);

    // Calculate fees
    const gasFees = this.GAS_FEE_ETH * 2; // Buy + Sell
    const marketplaceFees = (sellPrice * this.MARKETPLACE_FEE_PERCENT) / 100;

    // Calculate net profit
    const totalCost = buyPrice + gasFees + marketplaceFees;
    const netProfit = sellPrice - totalCost;

    // Calculate ROI
    const roi = ((netProfit / buyPrice) * 100);

    // Calculate breakeven price (price needed to break even)
    const breakeven = buyPrice + gasFees + (buyPrice * this.MARKETPLACE_FEE_PERCENT / 100);

    return {
      buyPrice,
      sellPrice,
      gasFees,
      marketplaceFees,
      netProfit,
      roi,
      breakeven,
    };
  }

  /**
   * Calculate profit estimate in USD
   */
  calculateEstimateUSD(buyPriceETH: number, sellPriceETH: number): {
    estimate: FlipEstimate;
    estimateUSD: {
      buyPrice: number;
      sellPrice: number;
      gasFees: number;
      marketplaceFees: number;
      netProfit: number;
    };
  } {
    const estimate = this.calculateEstimate(buyPriceETH, sellPriceETH);

    const estimateUSD = {
      buyPrice: estimate.buyPrice * this.ETH_USD_RATE,
      sellPrice: estimate.sellPrice * this.ETH_USD_RATE,
      gasFees: estimate.gasFees * this.ETH_USD_RATE,
      marketplaceFees: estimate.marketplaceFees * this.ETH_USD_RATE,
      netProfit: estimate.netProfit * this.ETH_USD_RATE,
    };

    return { estimate, estimateUSD };
  }

  /**
   * Analyze historical flips from OpenSea sales events (PREFERRED)
   * Uses real marketplace sales data for accurate flip analysis
   */
  async analyzeHistoricalFlipsFromOpenSea(contractAddress: string): Promise<{
    flips: HistoricalFlip[];
    statistics: FlipStatistics;
  }> {
    logger.info('Analyzing historical flips from OpenSea sales data');

    const openSeaProvider = getOpenSeaProvider();

    if (!openSeaProvider.isAvailable()) {
      logger.warn('OpenSea API not available - returning empty flips');
      return {
        flips: [],
        statistics: {
          totalFlips: 0,
          profitableFlips: 0,
          unprofitableFlips: 0,
          successRate: 0,
          avgProfit: 0,
          avgHoldingPeriod: 0,
          avgROI: 0,
        },
      };
    }

    // Fetch recent sales from OpenSea (max 300)
    const salesEvents = await openSeaProvider.getCollectionSales(contractAddress, 300);

    if (salesEvents.length === 0) {
      logger.warn('No sales events from OpenSea');
      return {
        flips: [],
        statistics: {
          totalFlips: 0,
          profitableFlips: 0,
          unprofitableFlips: 0,
          successRate: 0,
          avgProfit: 0,
          avgHoldingPeriod: 0,
          avgROI: 0,
        },
      };
    }

    // Group sales by tokenId
    const tokenSales = new Map<number, NFTSaleEvent[]>();

    for (const sale of salesEvents) {
      if (!tokenSales.has(sale.tokenId)) {
        tokenSales.set(sale.tokenId, []);
      }
      tokenSales.get(sale.tokenId)!.push(sale);
    }

    // Find flips (buy -> sell by same address)
    const flips: HistoricalFlip[] = [];

    for (const [tokenId, sales] of tokenSales.entries()) {
      // Sort by timestamp (oldest first)
      sales.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Look for buy -> sell patterns
      for (let i = 0; i < sales.length - 1; i++) {
        const buyEvent = sales[i];

        // Find corresponding sell event by this buyer
        for (let j = i + 1; j < sales.length; j++) {
          const sellEvent = sales[j];

          // Check if the buyer (to) from buyEvent is the seller (from) in sellEvent
          if (buyEvent.to === sellEvent.from) {
            const buyPrice = buyEvent.priceETH;
            const sellPrice = sellEvent.priceETH;

            // Calculate profit
            const estimate = this.calculateEstimate(buyPrice, sellPrice);

            // Calculate holding period
            const buyDate = new Date(buyEvent.timestamp);
            const sellDate = new Date(sellEvent.timestamp);
            const holdingPeriodMs = sellDate.getTime() - buyDate.getTime();
            const holdingPeriodDays = Math.floor(holdingPeriodMs / (1000 * 60 * 60 * 24));

            flips.push({
              tokenId,
              buyPrice,
              sellPrice,
              profit: estimate.netProfit,
              roi: estimate.roi,
              holdingPeriodDays,
              buyDate: buyEvent.timestamp,
              sellDate: sellEvent.timestamp,
              buyerAddress: buyEvent.to,
              sellerAddress: sellEvent.from,
            });

            break; // Found a flip for this buy event
          }
        }
      }
    }

    // Calculate statistics
    const profitableFlips = flips.filter(f => f.profit > 0);
    const unprofitableFlips = flips.filter(f => f.profit <= 0);

    const statistics: FlipStatistics = {
      totalFlips: flips.length,
      profitableFlips: profitableFlips.length,
      unprofitableFlips: unprofitableFlips.length,
      successRate: flips.length > 0 ? (profitableFlips.length / flips.length) * 100 : 0,
      avgProfit: flips.length > 0
        ? flips.reduce((sum, f) => sum + f.profit, 0) / flips.length
        : 0,
      avgHoldingPeriod: flips.length > 0
        ? flips.reduce((sum, f) => sum + f.holdingPeriodDays, 0) / flips.length
        : 0,
      avgROI: flips.length > 0
        ? flips.reduce((sum, f) => sum + f.roi, 0) / flips.length
        : 0,
    };

    logger.info(`Found ${flips.length} historical flips from OpenSea (${profitableFlips.length} profitable, ${unprofitableFlips.length} unprofitable)`);

    return { flips, statistics };
  }

  /**
   * Analyze historical flips from transfer events (DEPRECATED - use OpenSea instead)
   * A flip is when the same tokenId is transferred multiple times:
   * 1. Address A buys (receives) tokenId at price X
   * 2. Address A sells (sends) tokenId at price Y
   * Profit = Y - X - fees
   *
   * NOTE: Transfer events don't contain real price data. Use analyzeHistoricalFlipsFromOpenSea instead.
   */
  analyzeHistoricalFlips(transferEvents: any[]): {
    flips: HistoricalFlip[];
    statistics: FlipStatistics;
  } {
    logger.info(`Analyzing historical flips from ${transferEvents.length} transfer events`);

    // Group events by tokenId
    const tokenTransfers = new Map<number, any[]>();

    for (const event of transferEvents) {
      if (!event.priceETH || event.priceETH === 0) continue; // Skip transfers without price

      const tokenId = event.tokenId;
      if (!tokenTransfers.has(tokenId)) {
        tokenTransfers.set(tokenId, []);
      }
      tokenTransfers.get(tokenId)!.push(event);
    }

    // Find flips (buy -> sell by same address)
    const flips: HistoricalFlip[] = [];

    for (const [tokenId, events] of tokenTransfers.entries()) {
      // Sort by timestamp
      events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Look for buy -> sell patterns
      for (let i = 0; i < events.length - 1; i++) {
        const buyEvent = events[i];

        // Find corresponding sell event by this buyer
        for (let j = i + 1; j < events.length; j++) {
          const sellEvent = events[j];

          // Check if the buyer (to) from buyEvent is the seller (from) in sellEvent
          if (buyEvent.to.toLowerCase() === sellEvent.from.toLowerCase()) {
            const buyPrice = buyEvent.priceETH;
            const sellPrice = sellEvent.priceETH;

            // Calculate profit
            const estimate = this.calculateEstimate(buyPrice, sellPrice);

            // Calculate holding period
            const buyDate = new Date(buyEvent.timestamp);
            const sellDate = new Date(sellEvent.timestamp);
            const holdingPeriodMs = sellDate.getTime() - buyDate.getTime();
            const holdingPeriodDays = Math.floor(holdingPeriodMs / (1000 * 60 * 60 * 24));

            flips.push({
              tokenId,
              buyPrice,
              sellPrice,
              profit: estimate.netProfit,
              roi: estimate.roi,
              holdingPeriodDays,
              buyDate: buyEvent.timestamp,
              sellDate: sellEvent.timestamp,
              buyerAddress: buyEvent.to,
              sellerAddress: sellEvent.from,
            });

            break; // Found a flip for this buy event
          }
        }
      }
    }

    // Calculate statistics
    const profitableFlips = flips.filter(f => f.profit > 0);
    const unprofitableFlips = flips.filter(f => f.profit <= 0);

    const statistics: FlipStatistics = {
      totalFlips: flips.length,
      profitableFlips: profitableFlips.length,
      unprofitableFlips: unprofitableFlips.length,
      successRate: flips.length > 0 ? (profitableFlips.length / flips.length) * 100 : 0,
      avgProfit: flips.length > 0
        ? flips.reduce((sum, f) => sum + f.profit, 0) / flips.length
        : 0,
      avgHoldingPeriod: flips.length > 0
        ? flips.reduce((sum, f) => sum + f.holdingPeriodDays, 0) / flips.length
        : 0,
      avgROI: flips.length > 0
        ? flips.reduce((sum, f) => sum + f.roi, 0) / flips.length
        : 0,
    };

    logger.info(`Found ${flips.length} historical flips (${profitableFlips.length} profitable, ${unprofitableFlips.length} unprofitable)`);

    return { flips, statistics };
  }

  /**
   * Get top profitable flips (sorted by profit)
   */
  getTopFlips(flips: HistoricalFlip[], limit: number = 10): HistoricalFlip[] {
    return flips
      .sort((a, b) => b.profit - a.profit)
      .slice(0, limit);
  }

  /**
   * Get flips sorted by ROI
   */
  getTopROIFlips(flips: HistoricalFlip[], limit: number = 10): HistoricalFlip[] {
    return flips
      .sort((a, b) => b.roi - a.roi)
      .slice(0, limit);
  }
}

// Singleton instance
let instance: FlipCalculatorService | null = null;

export const getFlipCalculatorService = (): FlipCalculatorService => {
  if (!instance) {
    instance = new FlipCalculatorService();
  }
  return instance;
};
