/**
 * Alert Model - Data structures for price and whale alerts
 */

export type AlertType = 'price' | 'whale' | 'volume' | 'listing';
export type AlertCondition = 'above' | 'below' | 'equals' | 'change';
export type AlertChannel = 'telegram' | 'email' | 'webhook' | 'push';
export type AlertStatus = 'active' | 'paused' | 'triggered';

export interface AlertRule {
  id: string;
  name: string;
  type: AlertType;
  condition: AlertCondition;
  threshold: number;
  currentValue?: number;
  status: AlertStatus;
  channels: AlertChannel[];
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

export interface AlertHistory {
  id: string;
  ruleId: string;
  ruleName: string;
  type: AlertType;
  message: string;
  value: number;
  threshold: number;
  triggeredAt: Date;
  acknowledged: boolean;
}

export interface AlertStats {
  totalRules: number;
  activeRules: number;
  triggeredToday: number;
  triggeredThisWeek: number;
}

export interface CreateAlertRequest {
  name: string;
  type: AlertType;
  condition: AlertCondition;
  threshold: number;
  channels: AlertChannel[];
}

export interface UpdateAlertRequest {
  name?: string;
  condition?: AlertCondition;
  threshold?: number;
  status?: AlertStatus;
  channels?: AlertChannel[];
}
