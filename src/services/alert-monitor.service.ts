/**
 * Alert Monitor Service
 * Coordinates all alert detectors and broadcasts alerts via WebSocket
 */

import { logger } from '../utils/logger';
import { Alert, AlertType, AlertSeverity, DEFAULT_ALERT_THRESHOLDS } from '../models/alert.model';
import { getOpenSeaProvider, NFTSaleEvent } from '../providers/opensea.provider';
import { getCacheService } from './cache.service';
import { getEmailService } from './email.service';
import { v4 as uuidv4 } from 'uuid';

export class AlertMonitorService {
  private static instance: AlertMonitorService;
  private alertCallbacks: Array<(alert: Alert) => void> = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  private readonly MAYC_CONTRACT = '0x60E4d786628Fea6478F785A6d7e704777c86a7c6';
  private readonly COLLECTION_SLUG = 'mutant-ape-yacht-club';
  private readonly MONITORING_INTERVAL_MS = 30000; // Check every 30 seconds

  private constructor() {
    logger.info('AlertMonitorService initialized');
  }

  static getInstance(): AlertMonitorService {
    if (!AlertMonitorService.instance) {
      AlertMonitorService.instance = new AlertMonitorService();
    }
    return AlertMonitorService.instance;
  }

  /**
   * Register callback to receive alerts
   */
  onAlert(callback: (alert: Alert) => void) {
    this.alertCallbacks.push(callback);
    logger.info(`Alert callback registered (total: ${this.alertCallbacks.length})`);
  }

  /**
   * Broadcast alert to all subscribers
   */
  private broadcastAlert(alert: Alert) {
    logger.info(`🚨 Alert: [${alert.severity.toUpperCase()}] ${alert.title}`);

    // WebSocket broadcast to all connected clients
    for (const callback of this.alertCallbacks) {
      try {
        callback(alert);
      } catch (error) {
        logger.error('Failed to broadcast alert to callback', error);
      }
    }

    // Send email notification (async, don't wait)
    this.sendEmailNotification(alert).catch(err => {
      logger.error('Failed to send email notification', err);
    });

    // Store in cache (last 100 alerts, 1 hour TTL)
    const recentAlerts = this.getRecentAlerts();
    recentAlerts.unshift(alert);
    const trimmed = recentAlerts.slice(0, 100);
    getCacheService().set('recent_alerts', trimmed, 3600);
  }

  /**
   * Send email notification for alert
   */
  private async sendEmailNotification(alert: Alert): Promise<void> {
    const emailService = getEmailService();

    if (!emailService.isEnabled()) {
      return;
    }

    const recipientEmail = process.env.ALERT_EMAIL_TO;
    if (!recipientEmail) {
      logger.warn('ALERT_EMAIL_TO not configured, skipping email notification');
      return;
    }

    try {
      await emailService.sendAlertEmail(recipientEmail, alert);
      logger.info(`📧 Email notification sent for alert: ${alert.title}`);
    } catch (error) {
      logger.error('Failed to send alert email', error);
    }
  }

  /**
   * Get recent alerts from cache
   */
  getRecentAlerts(): Alert[] {
    return getCacheService().get<Alert[]>('recent_alerts') || [];
  }

  /**
   * Start monitoring for alerts
   */
  startMonitoring() {
    if (this.isMonitoring) {
      logger.warn('Alert monitoring already started');
      return;
    }

    logger.info('🚨 Starting alert monitoring system');
    this.isMonitoring = true;

    // Initial check
    this.checkForAlerts();

    // Schedule periodic checks
    this.monitoringInterval = setInterval(() => {
      this.checkForAlerts();
    }, this.MONITORING_INTERVAL_MS);

    logger.info(`Alert monitoring running (interval: ${this.MONITORING_INTERVAL_MS}ms)`);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    logger.info('Alert monitoring stopped');
  }

  /**
   * Check for all alert conditions
   */
  private async checkForAlerts() {
    try {
      const openSeaProvider = getOpenSeaProvider();

      if (!openSeaProvider.isAvailable()) {
        logger.warn('OpenSea API not available - skipping alert check');
        return;
      }

      // Fetch recent sales (last 50)
      const recentSales = await openSeaProvider.getCollectionSales(this.MAYC_CONTRACT, 50);

      if (recentSales.length === 0) {
        return;
      }

      // Get collection stats for floor price tracking
      const stats = await openSeaProvider.getCollectionStats(this.COLLECTION_SLUG);

      // Run all detectors in parallel
      await Promise.all([
        this.detectLargeSales(recentSales),
        this.detectWhaleActivity(recentSales),
        this.detectFloorPriceChange(stats),
        this.detectPumpDump(recentSales),
      ]);
    } catch (error) {
      logger.error('Error in alert monitoring', error);
    }
  }

  /**
   * Detect large sales (>5 ETH)
   */
  private async detectLargeSales(sales: NFTSaleEvent[]) {
    const threshold = DEFAULT_ALERT_THRESHOLDS.largeSale;
    const lastCheckKey = 'alert_last_check_large_sales';
    const lastCheck = getCacheService().get<number>(lastCheckKey) || 0;

    for (const sale of sales) {
      const saleTimestamp = new Date(sale.timestamp).getTime();

      // Skip if already processed
      if (saleTimestamp <= lastCheck) continue;

      if (sale.priceETH >= threshold) {
        const alert: Alert = {
          id: uuidv4(),
          type: AlertType.LARGE_SALE,
          severity: sale.priceETH >= threshold * 2 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
          timestamp: sale.timestamp,
          title: `Large Sale: ${sale.priceETH.toFixed(2)} ETH`,
          message: `MAYC #${sale.tokenId} sold for ${sale.priceETH.toFixed(2)} ETH`,
          data: { sale },
          metadata: {
            tokenId: sale.tokenId,
            priceETH: sale.priceETH,
            txHash: sale.txHash,
            collection: 'MAYC',
          },
        };

        this.broadcastAlert(alert);
      }
    }

    // Update last check timestamp
    if (sales.length > 0) {
      const latestSale = sales[0];
      getCacheService().set(lastCheckKey, new Date(latestSale.timestamp).getTime(), 3600);
    }
  }

  /**
   * Detect whale activity (buy/sell by holders with 20+ NFTs)
   */
  private async detectWhaleActivity(sales: NFTSaleEvent[]) {
    const whaleThreshold = DEFAULT_ALERT_THRESHOLDS.whaleThreshold;
    const lastCheckKey = 'alert_last_check_whale_activity';
    const lastCheck = getCacheService().get<number>(lastCheckKey) || 0;

    // Get current whales (from cache or blockchain)
    const whalesData = getCacheService().get<any>('whale_holders');
    if (!whalesData) return;

    const whaleAddresses = new Set(
      Object.entries(whalesData)
        .filter(([_, count]) => (count as number) >= whaleThreshold)
        .map(([address]) => address.toLowerCase())
    );

    for (const sale of sales) {
      const saleTimestamp = new Date(sale.timestamp).getTime();
      if (saleTimestamp <= lastCheck) continue;

      const isBuyerWhale = whaleAddresses.has(sale.to.toLowerCase());
      const isSellerWhale = whaleAddresses.has(sale.from.toLowerCase());

      if (isBuyerWhale) {
        const alert: Alert = {
          id: uuidv4(),
          type: AlertType.WHALE_BUY,
          severity: AlertSeverity.INFO,
          timestamp: sale.timestamp,
          title: `🐋 Whale Buy`,
          message: `Whale acquired MAYC #${sale.tokenId} for ${sale.priceETH.toFixed(2)} ETH`,
          data: { sale, whaleAddress: sale.to },
          metadata: {
            tokenId: sale.tokenId,
            address: sale.to,
            priceETH: sale.priceETH,
            txHash: sale.txHash,
          },
        };
        this.broadcastAlert(alert);
      }

      if (isSellerWhale) {
        const alert: Alert = {
          id: uuidv4(),
          type: AlertType.WHALE_SELL,
          severity: AlertSeverity.WARNING,
          timestamp: sale.timestamp,
          title: `🐋 Whale Sell`,
          message: `Whale sold MAYC #${sale.tokenId} for ${sale.priceETH.toFixed(2)} ETH`,
          data: { sale, whaleAddress: sale.from },
          metadata: {
            tokenId: sale.tokenId,
            address: sale.from,
            priceETH: sale.priceETH,
            txHash: sale.txHash,
          },
        };
        this.broadcastAlert(alert);
      }
    }

    if (sales.length > 0) {
      const latestSale = sales[0];
      getCacheService().set(lastCheckKey, new Date(latestSale.timestamp).getTime(), 3600);
    }
  }

  /**
   * Detect significant floor price changes (>10%)
   */
  private async detectFloorPriceChange(stats: any) {
    if (!stats || !stats.floorPrice) return;

    const currentFloor = stats.floorPrice;
    const lastFloorKey = 'alert_last_floor_price';
    const lastFloor = getCacheService().get<number>(lastFloorKey);

    if (lastFloor) {
      const change = ((currentFloor - lastFloor) / lastFloor) * 100;
      const threshold = DEFAULT_ALERT_THRESHOLDS.floorPriceChange;

      if (Math.abs(change) >= threshold) {
        const alert: Alert = {
          id: uuidv4(),
          type: AlertType.FLOOR_PRICE_CHANGE,
          severity: Math.abs(change) >= threshold * 2 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
          timestamp: new Date().toISOString(),
          title: `Floor Price ${change > 0 ? 'Surge' : 'Drop'}: ${Math.abs(change).toFixed(1)}%`,
          message: `MAYC floor price ${change > 0 ? 'increased' : 'decreased'} from ${lastFloor.toFixed(2)} to ${currentFloor.toFixed(2)} ETH`,
          data: { oldFloor: lastFloor, newFloor: currentFloor, changePercent: change },
          metadata: { collection: 'MAYC' },
        };
        this.broadcastAlert(alert);
      }
    }

    // Always update cached floor price
    getCacheService().set(lastFloorKey, currentFloor, 3600);
  }

  /**
   * Detect pump/dump patterns (rapid price movement)
   */
  private async detectPumpDump(sales: NFTSaleEvent[]) {
    if (sales.length < 10) return;

    const { salesCount, timeWindowMinutes, priceIncrease } = DEFAULT_ALERT_THRESHOLDS.pumpDetection;
    const { priceDecrease } = DEFAULT_ALERT_THRESHOLDS.dumpDetection;

    const now = Date.now();
    const windowMs = timeWindowMinutes * 60 * 1000;

    // Get sales in time window
    const recentSales = sales.filter(
      (s) => now - new Date(s.timestamp).getTime() <= windowMs
    );

    if (recentSales.length < salesCount) return;

    // Calculate price trend
    const prices = recentSales.map((s) => s.priceETH);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const firstPrice = prices[prices.length - 1];
    const lastPrice = prices[0];
    const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;

    // Pump detection
    if (priceChange >= priceIncrease) {
      const alert: Alert = {
        id: uuidv4(),
        type: AlertType.PUMP_DETECTION,
        severity: AlertSeverity.CRITICAL,
        timestamp: new Date().toISOString(),
        title: `⚠️ Pump Detected: +${priceChange.toFixed(1)}%`,
        message: `${recentSales.length} sales in ${timeWindowMinutes}min, price up ${priceChange.toFixed(1)}% (${firstPrice.toFixed(2)} → ${lastPrice.toFixed(2)} ETH)`,
        data: { salesCount: recentSales.length, priceChange, avgPrice, sales: recentSales.slice(0, 5) },
        metadata: { collection: 'MAYC' },
      };
      this.broadcastAlert(alert);
    }

    // Dump detection
    if (priceChange <= -priceDecrease) {
      const alert: Alert = {
        id: uuidv4(),
        type: AlertType.DUMP_DETECTION,
        severity: AlertSeverity.CRITICAL,
        timestamp: new Date().toISOString(),
        title: `⚠️ Dump Detected: ${priceChange.toFixed(1)}%`,
        message: `${recentSales.length} sales in ${timeWindowMinutes}min, price down ${Math.abs(priceChange).toFixed(1)}% (${firstPrice.toFixed(2)} → ${lastPrice.toFixed(2)} ETH)`,
        data: { salesCount: recentSales.length, priceChange, avgPrice, sales: recentSales.slice(0, 5) },
        metadata: { collection: 'MAYC' },
      };
      this.broadcastAlert(alert);
    }
  }
}

export function getAlertMonitorService(): AlertMonitorService {
  return AlertMonitorService.getInstance();
}
