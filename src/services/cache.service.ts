import NodeCache from 'node-cache';
import { Holder, HolderStats } from '../models/holder.model';
import { Transaction, TransactionMetrics } from '../models/transaction.model';
import { EnrichedWhale, NFTPortfolio } from '../models/enrichment.model';
import { logger } from '../utils/logger';

export class CacheService {
  private cache: NodeCache;
  private readonly HOLDER_TTL = 600; // 10 minutes
  private readonly TRANSACTION_TTL = 300; // 5 minutes
  private readonly METRIC_TTL = 600; // 10 minutes

  // Enrichment TTLs
  private readonly ENS_TTL = 86400; // 24 hours
  private readonly ETH_BALANCE_TTL = 1800; // 30 minutes
  private readonly PORTFOLIO_TTL = 3600; // 1 hour
  private readonly FLOOR_PRICE_TTL = 1800; // 30 minutes
  private readonly ENRICHED_WHALES_TTL = 3600; // 1 hour

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 600,
      checkperiod: 120,
    });

    logger.info('CacheService initialized');
  }

  /**
   * Get cached holders
   */
  getHolders(): Holder[] | null {
    return this.cache.get('holders') || null;
  }

  /**
   * Set holders in cache
   */
  setHolders(holders: Holder[]): void {
    this.cache.set('holders', holders, this.HOLDER_TTL);
    logger.debug(`Cached ${holders.length} holders`);
  }

  /**
   * Get cached top holders
   */
  getTopHolders(): Holder[] | null {
    return this.cache.get('topHolders') || null;
  }

  /**
   * Set top holders in cache
   */
  setTopHolders(holders: Holder[]): void {
    this.cache.set('topHolders', holders, this.HOLDER_TTL);
    logger.debug(`Cached top ${holders.length} holders`);
  }

  /**
   * Get cached holder statistics
   */
  getHolderStats(): HolderStats | null {
    return this.cache.get('holderStats') || null;
  }

  /**
   * Set holder statistics in cache
   */
  setHolderStats(stats: HolderStats): void {
    this.cache.set('holderStats', stats, this.HOLDER_TTL);
    logger.debug('Cached holder statistics');
  }

  /**
   * Get cached transactions
   */
  getTransactions(key: string = 'transactions'): Transaction[] | null {
    return this.cache.get(key) || null;
  }

  /**
   * Set transactions in cache
   */
  setTransactions(transactions: Transaction[], key: string = 'transactions'): void {
    this.cache.set(key, transactions, this.TRANSACTION_TTL);
    logger.debug(`Cached ${transactions.length} transactions (key: ${key})`);
  }

  /**
   * Get cached metrics
   */
  getMetrics(period: string = '24h'): TransactionMetrics | null {
    return this.cache.get(`metrics_${period}`) || null;
  }

  /**
   * Set metrics in cache
   */
  setMetrics(metrics: TransactionMetrics, period: string = '24h'): void {
    this.cache.set(`metrics_${period}`, metrics, this.METRIC_TTL);
    logger.debug(`Cached metrics for period ${period}`);
  }

  /**
   * Get recent transaction feed
   */
  getRecentTransactionFeed(): Transaction[] | null {
    return this.cache.get('recentTransactionFeed') || null;
  }

  /**
   * Set recent transaction feed
   */
  setRecentTransactionFeed(transactions: Transaction[]): void {
    this.cache.set('recentTransactionFeed', transactions, 300); // 5 min
    logger.debug(`Cached ${transactions.length} recent transactions`);
  }

  /**
   * Add transaction to recent feed
   */
  addToRecentTransactionFeed(transaction: Transaction): void {
    let feed = this.getRecentTransactionFeed() || [];
    feed.unshift(transaction);
    feed = feed.slice(0, 100); // Keep last 100 transactions
    this.setRecentTransactionFeed(feed);
  }

  /**
   * Get cached whale alerts
   */
  getWhaleAlerts(): any[] | null {
    return this.cache.get('whaleAlerts') || null;
  }

  /**
   * Add whale alert
   */
  addWhaleAlert(alert: any): void {
    let alerts = this.getWhaleAlerts() || [];
    alerts.unshift(alert);
    alerts = alerts.slice(0, 50); // Keep last 50 alerts
    this.cache.set('whaleAlerts', alerts, 3600); // 1 hour
    logger.debug('Added whale alert to cache');
  }

  /**
   * ===== ENS NAME CACHING =====
   */

  /**
   * Get cached ENS name for address
   */
  getENSName(address: string): string | null | undefined {
    return this.cache.get(`ens_${address}`);
  }

  /**
   * Set ENS name in cache
   */
  setENSName(address: string, ensName: string | null): void {
    this.cache.set(`ens_${address}`, ensName, this.ENS_TTL);
  }

  /**
   * ===== ETH BALANCE CACHING =====
   */

  /**
   * Get cached ETH balance for address
   */
  getETHBalance(address: string): string | undefined {
    return this.cache.get(`eth_balance_${address}`);
  }

  /**
   * Set ETH balance in cache
   */
  setETHBalance(address: string, balance: string): void {
    this.cache.set(`eth_balance_${address}`, balance, this.ETH_BALANCE_TTL);
  }

  /**
   * ===== PORTFOLIO CACHING =====
   */

  /**
   * Get cached portfolio for address
   */
  getPortfolio(address: string): NFTPortfolio | undefined {
    return this.cache.get(`portfolio_${address}`);
  }

  /**
   * Set portfolio in cache
   */
  setPortfolio(address: string, portfolio: NFTPortfolio): void {
    this.cache.set(`portfolio_${address}`, portfolio, this.PORTFOLIO_TTL);
    logger.debug(`Cached portfolio for ${address} (${portfolio.collections.length} collections)`);
  }

  /**
   * ===== FLOOR PRICE CACHING =====
   */

  /**
   * Get cached floor price for collection
   */
  getFloorPrice(contractAddress: string): number | null | undefined {
    return this.cache.get(`floor_price_${contractAddress}`);
  }

  /**
   * Set floor price in cache
   */
  setFloorPrice(contractAddress: string, price: number | null): void {
    this.cache.set(`floor_price_${contractAddress}`, price, this.FLOOR_PRICE_TTL);
  }

  /**
   * ===== ENRICHED WHALES CACHING =====
   */

  /**
   * Get cached enriched whales
   */
  getEnrichedWhales(): EnrichedWhale[] | null {
    return this.cache.get('enriched_whales') || null;
  }

  /**
   * Set enriched whales in cache
   */
  setEnrichedWhales(whales: EnrichedWhale[]): void {
    this.cache.set('enriched_whales', whales, this.ENRICHED_WHALES_TTL);
    logger.debug(`Cached ${whales.length} enriched whales`);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.flushAll();
    logger.info('Cache cleared');
  }

  /**
   * Clear specific key
   */
  clearKey(key: string): void {
    this.cache.del(key);
    logger.debug(`Cache key cleared: ${key}`);
  }

  /**
   * Get cache stats
   */
  getStats(): any {
    return this.cache.getStats();
  }
}

let instance: CacheService;

export function getCacheService(): CacheService {
  if (!instance) {
    instance = new CacheService();
  }
  return instance;
}
