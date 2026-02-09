/**
 * Alert Types - Frontend type definitions for alerts
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
  createdAt: Date | string;
  lastTriggered?: Date | string;
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
  triggeredAt: Date | string;
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

export interface AlertRulesResponse {
  success: boolean;
  count: number;
  rules: AlertRule[];
  timestamp: Date | string;
}

export interface AlertHistoryResponse {
  success: boolean;
  count: number;
  history: AlertHistory[];
  timestamp: Date | string;
}

export interface AlertStatsResponse {
  success: boolean;
  stats: AlertStats;
  timestamp: Date | string;
}
