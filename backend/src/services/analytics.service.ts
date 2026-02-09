import { Holder, HolderStats } from '../models/holder.model';
import { Transaction, TransactionMetrics, WhaleActivity } from '../models/transaction.model';
import { logger } from '../utils/logger';

export class AnalyticsService {
  /**
   * Build holders list from transfer events
   */
  buildHoldersList(events: Transaction[]): Holder[] {
    const holders = new Map<string, Holder>();

    // Process events in chronological order
    for (const event of events) {
      // Remove from 'from' address
      if (event.from !== '0x0000000000000000000000000000000000000000') {
        if (holders.has(event.from)) {
          const holder = holders.get(event.from)!;
          holder.tokenIds = holder.tokenIds.filter((id) => id !== event.tokenId);
          holder.count--;
          holder.lastActivity = event.timestamp;
        }
      }

      // Add to 'to' address
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

    // Remove holders with no tokens
    const activeHolders = Array.from(holders.values()).filter((h) => h.count > 0);

    // Calculate percentages
    const totalSupply = activeHolders.reduce((sum, h) => sum + h.count, 0);
    for (const holder of activeHolders) {
      holder.percentageOfCollection = (holder.count / totalSupply) * 100;
    }

    return activeHolders;
  }

  /**
   * Get top N holders
   */
  getTopHolders(holders: Holder[], limit: number = 50): Holder[] {
    return holders.sort((a, b) => b.count - a.count).slice(0, limit);
  }

  /**
   * Calculate distribution statistics
   */
  calculateDistribution(holders: Holder[]): HolderStats {
    const distribution = {
      single: 0, // 1 NFT
      small: 0, // 2-5 NFT
      medium: 0, // 6-10 NFT
      large: 0, // 11-19 NFT
      whales: 0, // 20+ NFT
    };

    for (const holder of holders) {
      if (holder.count === 1) distribution.single++;
      else if (holder.count <= 5) distribution.small++;
      else if (holder.count <= 10) distribution.medium++;
      else if (holder.count <= 19) distribution.large++;
      else distribution.whales++;
    }

    const totalSupply = holders.reduce((sum, h) => sum + h.count, 0);
    const avgNFTsPerHolder = totalSupply / holders.length;

    return {
      totalHolders: holders.length,
      totalSupply,
      averageNFTsPerHolder: parseFloat(avgNFTsPerHolder.toFixed(2)),
      distribution,
    };
  }

  /**
   * Calculate metrics for a time period
   */
  calculateMetricsForPeriod(
    transactions: Transaction[],
    startDate?: Date,
    endDate?: Date
  ): TransactionMetrics {
    let relevantTxs = transactions;

    if (startDate && endDate) {
      relevantTxs = transactions.filter(
        (tx) => tx.timestamp >= startDate && tx.timestamp <= endDate
      );
    }

    logger.debug(
      `Calculating metrics for ${relevantTxs.length} transactions in period`
    );

    const prices = relevantTxs
      .filter((tx) => tx.priceETH !== undefined && tx.priceETH > 0)
      .map((tx) => tx.priceETH as number);

    const uniqueBuyers = new Set(
      relevantTxs.filter((tx) => tx.type === 'sale').map((tx) => tx.to)
    );
    const uniqueSellers = new Set(
      relevantTxs.filter((tx) => tx.type === 'sale').map((tx) => tx.from)
    );

    let avgPrice: number | undefined;
    let medianPrice: number | undefined;
    let floorPrice: number | undefined;

    if (prices.length > 0) {
      avgPrice = parseFloat((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(4));

      prices.sort((a, b) => a - b);
      const mid = Math.floor(prices.length / 2);
      medianPrice = parseFloat(
        (prices.length % 2 !== 0 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2).toFixed(4)
      );
      floorPrice = parseFloat(prices[0].toFixed(4));
    }

    const volume = prices.reduce((a, b) => a + b, 0);

    const topTx = relevantTxs
      .filter((tx) => tx.priceETH !== undefined)
      .sort((a, b) => (b.priceETH || 0) - (a.priceETH || 0))[0];

    return {
      transactionCount: relevantTxs.length,
      volume: parseFloat(volume.toFixed(4)),
      avgPrice,
      medianPrice,
      uniqueBuyers: uniqueBuyers.size,
      uniqueSellers: uniqueSellers.size,
      floorPrice,
      topTransaction: topTx
        ? {
            tokenId: topTx.tokenId,
            priceETH: topTx.priceETH!,
          }
        : undefined,
    };
  }

  /**
   * Detect whale activity (addresses with 10+ NFTs making transactions)
   */
  detectWhaleActivity(
    holders: Holder[],
    recentTransactions: Transaction[],
    minNFTs: number = 10
  ): WhaleActivity[] {
    const whaleAddresses = new Set(
      holders.filter((h) => h.count >= minNFTs).map((h) => h.address)
    );

    const whaleActivityList: WhaleActivity[] = [];

    for (const tx of recentTransactions) {
      if (whaleAddresses.has(tx.from) || whaleAddresses.has(tx.to)) {
        const whale = holders.find((h) => h.address === (whaleAddresses.has(tx.from) ? tx.from : tx.to));
        if (whale) {
          whaleActivityList.push({
            address: whale.address,
            action: whaleAddresses.has(tx.to) ? 'buy' : 'sell',
            tokenIds: [tx.tokenId],
            totalNFTs: whale.count,
            timestamp: tx.timestamp,
            txHash: tx.txHash,
          });
        }
      }
    }

    return whaleActivityList;
  }

  /**
   * Find transactions in a time window
   */
  getTransactionsInWindow(
    transactions: Transaction[],
    windowHours: number
  ): Transaction[] {
    const now = new Date();
    const startTime = new Date(now.getTime() - windowHours * 60 * 60 * 1000);

    return transactions.filter(
      (tx) => tx.timestamp >= startTime && tx.timestamp <= now
    );
  }

  /**
   * Identify large transactions
   */
  identifyLargeTransactions(
    transactions: Transaction[],
    minPriceETH: number = 10
  ): Transaction[] {
    return transactions.filter((tx) => (tx.priceETH || 0) >= minPriceETH);
  }

  /**
   * Get transaction volume trend for specific intervals
   */
  getVolumeTrend(
    transactions: Transaction[],
    intervalHours: number = 24,
    periods: number = 7
  ): Array<{ period: string; volume: number; count: number }> {
    const trend: Array<{ period: string; volume: number; count: number }> = [];
    const now = new Date();

    for (let i = periods - 1; i >= 0; i--) {
      const periodStart = new Date(now.getTime() - (i + 1) * intervalHours * 60 * 60 * 1000);
      const periodEnd = new Date(now.getTime() - i * intervalHours * 60 * 60 * 1000);

      const periodTxs = transactions.filter(
        (tx) => tx.timestamp >= periodStart && tx.timestamp < periodEnd
      );

      const volume = periodTxs
        .filter((tx) => tx.priceETH !== undefined)
        .reduce((sum, tx) => sum + (tx.priceETH || 0), 0);

      trend.push({
        period: periodStart.toISOString(),
        volume: parseFloat(volume.toFixed(4)),
        count: periodTxs.length,
      });
    }

    return trend;
  }
}

let instance: AnalyticsService;

export function getAnalyticsService(): AnalyticsService {
  if (!instance) {
    instance = new AnalyticsService();
  }
  return instance;
}
