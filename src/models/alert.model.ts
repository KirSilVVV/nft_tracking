/**
 * Alert Model - Type definitions for Smart Alerts system
 */

export enum AlertType {
  LARGE_SALE = 'large_sale',
  WHALE_BUY = 'whale_buy',
  WHALE_SELL = 'whale_sell',
  FLOOR_PRICE_CHANGE = 'floor_price_change',
  PUMP_DETECTION = 'pump_detection',
  DUMP_DETECTION = 'dump_detection',
  RARE_LISTING = 'rare_listing',
  UNUSUAL_ACTIVITY = 'unusual_activity',
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  timestamp: string;
  title: string;
  message: string;
  data: Record<string, any>;
  metadata?: {
    tokenId?: number;
    address?: string;
    priceETH?: number;
    txHash?: string;
    collection?: string;
  };
}

export interface AlertCondition {
  type: AlertType;
  enabled: boolean;
  threshold?: number;
  params?: Record<string, any>;
}

// Default alert thresholds
export const DEFAULT_ALERT_THRESHOLDS = {
  largeSale: 5.0, // ETH
  floorPriceChange: 10, // %
  pumpDetection: {
    salesCount: 10, // sales in window
    timeWindowMinutes: 15,
    priceIncrease: 20, // %
  },
  dumpDetection: {
    salesCount: 10,
    timeWindowMinutes: 15,
    priceDecrease: 15, // %
  },
  whaleThreshold: 20, // NFTs
  rarityThreshold: 1, // % (top 1% rarity)
};
