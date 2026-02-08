/**
 * Alert Type Definitions
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
