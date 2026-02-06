import NodeCache from 'node-cache';
import { Holder, HolderStats } from '../models/holder.model';
import { Transaction, TransactionMetrics } from '../models/transaction.model';
import { logger } from '../utils/logger';

export class CacheService {
  private cache: NodeCache;
  private readonly HOLDER_TTL = 600; // 10 minutes
  private readonly TRANSACTION_TTL = 300; // 5 minutes
  private readonly METRIC_TTL = 600; // 10 minutes

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

  /**
   * Set custom key-value pair in cache
   */
  set(key: string, value: any, ttl: number = 600): void {
    this.cache.set(key, value, ttl);
    logger.debug(`Cache set: ${key}`);
  }

  /**
   * Get custom key from cache
   */
  get(key: string): any {
    return this.cache.get(key) || null;
  }
}

let instance: CacheService;

export function getCacheService(): CacheService {
  if (!instance) {
    instance = new CacheService();
  }
  return instance;
}
