/**
 * Alert Service - Manages alert rules, triggers, and notifications
 */

import {
  AlertRule,
  AlertHistory,
  AlertStats,
  CreateAlertRequest,
  UpdateAlertRequest,
  AlertStatus,
} from '../models/alert.model';
import { logger } from '../utils/logger';
import { getNotificationService } from './notification.service';

class AlertService {
  private rules: Map<string, AlertRule> = new Map();
  private history: AlertHistory[] = [];

  constructor() {
    this.initializeMockData();
  }

  /**
   * Initialize with some mock alert rules for demonstration
   */
  private initializeMockData(): void {
    const mockRules: AlertRule[] = [
      {
        id: '1',
        name: 'Floor Price Below 4 ETH',
        type: 'price',
        condition: 'below',
        threshold: 4.0,
        currentValue: 4.12,
        status: 'active',
        channels: ['telegram', 'email'],
        createdAt: new Date('2026-02-08T10:00:00Z'),
        triggerCount: 0,
      },
      {
        id: '2',
        name: 'Whale Buys 10+ NFTs',
        type: 'whale',
        condition: 'above',
        threshold: 10,
        currentValue: 0,
        status: 'active',
        channels: ['telegram', 'push'],
        createdAt: new Date('2026-02-07T15:30:00Z'),
        lastTriggered: new Date('2026-02-09T08:45:00Z'),
        triggerCount: 3,
      },
      {
        id: '3',
        name: 'Daily Volume > 100 ETH',
        type: 'volume',
        condition: 'above',
        threshold: 100,
        currentValue: 89.4,
        status: 'active',
        channels: ['telegram'],
        createdAt: new Date('2026-02-06T09:00:00Z'),
        lastTriggered: new Date('2026-02-08T14:20:00Z'),
        triggerCount: 5,
      },
      {
        id: '4',
        name: 'Floor Price Above 5 ETH',
        type: 'price',
        condition: 'above',
        threshold: 5.0,
        currentValue: 4.12,
        status: 'paused',
        channels: ['email'],
        createdAt: new Date('2026-02-05T12:00:00Z'),
        triggerCount: 0,
      },
    ];

    mockRules.forEach((rule) => this.rules.set(rule.id, rule));

    // Mock history
    this.history = [
      {
        id: 'h1',
        ruleId: '2',
        ruleName: 'Whale Buys 10+ NFTs',
        type: 'whale',
        message: 'pranksy.eth bought 15 MAYC in single transaction',
        value: 15,
        threshold: 10,
        triggeredAt: new Date('2026-02-09T08:45:00Z'),
        acknowledged: true,
      },
      {
        id: 'h2',
        ruleId: '3',
        ruleName: 'Daily Volume > 100 ETH',
        type: 'volume',
        message: '24h volume reached 142.5 ETH (+42.5%)',
        value: 142.5,
        threshold: 100,
        triggeredAt: new Date('2026-02-08T14:20:00Z'),
        acknowledged: true,
      },
      {
        id: 'h3',
        ruleId: '2',
        ruleName: 'Whale Buys 10+ NFTs',
        type: 'whale',
        message: 'whale.eth accumulated 12 MAYC over 3 hours',
        value: 12,
        threshold: 10,
        triggeredAt: new Date('2026-02-07T18:15:00Z'),
        acknowledged: false,
      },
    ];
  }

  /**
   * Get all alert rules
   */
  getAllRules(): AlertRule[] {
    return Array.from(this.rules.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Get alert rule by ID
   */
  getRule(id: string): AlertRule | undefined {
    return this.rules.get(id);
  }

  /**
   * Create new alert rule
   */
  createRule(request: CreateAlertRequest): AlertRule {
    const id = Date.now().toString();
    const rule: AlertRule = {
      id,
      ...request,
      status: 'active',
      createdAt: new Date(),
      triggerCount: 0,
    };

    this.rules.set(id, rule);
    logger.info(`Created alert rule: ${rule.name} (${id})`);

    return rule;
  }

  /**
   * Update alert rule
   */
  updateRule(id: string, update: UpdateAlertRequest): AlertRule | null {
    const rule = this.rules.get(id);
    if (!rule) {
      logger.warn(`Alert rule not found: ${id}`);
      return null;
    }

    const updated: AlertRule = {
      ...rule,
      ...update,
    };

    this.rules.set(id, updated);
    logger.info(`Updated alert rule: ${id}`);

    return updated;
  }

  /**
   * Delete alert rule
   */
  deleteRule(id: string): boolean {
    const deleted = this.rules.delete(id);
    if (deleted) {
      logger.info(`Deleted alert rule: ${id}`);
    }
    return deleted;
  }

  /**
   * Toggle alert rule status (active/paused)
   */
  toggleRule(id: string): AlertRule | null {
    const rule = this.rules.get(id);
    if (!rule) return null;

    const newStatus: AlertStatus = rule.status === 'active' ? 'paused' : 'active';
    return this.updateRule(id, { status: newStatus });
  }

  /**
   * Get alert statistics
   */
  getStats(): AlertStats {
    const allRules = this.getAllRules();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      totalRules: allRules.length,
      activeRules: allRules.filter((r) => r.status === 'active').length,
      triggeredToday: this.history.filter(
        (h) => h.triggeredAt >= todayStart
      ).length,
      triggeredThisWeek: this.history.filter(
        (h) => h.triggeredAt >= weekStart
      ).length,
    };
  }

  /**
   * Get alert history
   */
  getHistory(limit: number = 50): AlertHistory[] {
    return this.history
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
      .slice(0, limit);
  }

  /**
   * Acknowledge alert in history
   */
  acknowledgeAlert(id: string): boolean {
    const alert = this.history.find((h) => h.id === id);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Clear old history (older than 30 days)
   */
  clearOldHistory(): number {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const before = this.history.length;
    this.history = this.history.filter((h) => h.triggeredAt >= thirtyDaysAgo);
    const cleared = before - this.history.length;

    if (cleared > 0) {
      logger.info(`Cleared ${cleared} old alert history items`);
    }

    return cleared;
  }

  /**
   * Check if alert should trigger (called by monitoring system)
   */
  checkTrigger(ruleId: string, currentValue: number): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule || rule.status !== 'active') return false;

    let shouldTrigger = false;

    switch (rule.condition) {
      case 'above':
        shouldTrigger = currentValue > rule.threshold;
        break;
      case 'below':
        shouldTrigger = currentValue < rule.threshold;
        break;
      case 'equals':
        shouldTrigger = Math.abs(currentValue - rule.threshold) < 0.01;
        break;
      case 'change':
        // For percentage change alerts
        if (rule.currentValue) {
          const change = Math.abs(
            ((currentValue - rule.currentValue) / rule.currentValue) * 100
          );
          shouldTrigger = change >= rule.threshold;
        }
        break;
    }

    if (shouldTrigger) {
      this.triggerAlert(ruleId, currentValue);
    }

    // Update current value
    rule.currentValue = currentValue;
    return shouldTrigger;
  }

  /**
   * Trigger an alert (add to history and send notifications)
   */
  private triggerAlert(ruleId: string, value: number): void {
    const rule = this.rules.get(ruleId);
    if (!rule) return;

    // Update rule
    rule.lastTriggered = new Date();
    rule.triggerCount += 1;

    // Add to history
    const historyItem: AlertHistory = {
      id: `h${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      type: rule.type,
      message: this.generateAlertMessage(rule, value),
      value,
      threshold: rule.threshold,
      triggeredAt: new Date(),
      acknowledged: false,
    };

    this.history.unshift(historyItem);
    logger.info(`Alert triggered: ${rule.name} (value: ${value})`);

    // Send notifications via configured channels
    this.sendNotifications(rule, historyItem);
  }

  /**
   * Send notifications for triggered alert
   */
  private async sendNotifications(rule: AlertRule, historyItem: AlertHistory): Promise<void> {
    try {
      const notificationService = getNotificationService();
      await notificationService.sendNotifications(rule, historyItem);
    } catch (error) {
      logger.error(`Failed to send notifications for alert: ${rule.name}`, error);
    }
  }

  /**
   * Generate human-readable alert message
   */
  private generateAlertMessage(rule: AlertRule, value: number): string {
    switch (rule.type) {
      case 'price':
        return `Floor price ${rule.condition} ${rule.threshold} ETH (current: ${value} ETH)`;
      case 'whale':
        return `Whale activity detected: ${value} NFTs ${rule.condition} threshold of ${rule.threshold}`;
      case 'volume':
        return `Trading volume ${rule.condition} ${rule.threshold} ETH (current: ${value} ETH)`;
      case 'listing':
        return `New listing detected: ${value} items`;
      default:
        return `Alert triggered for ${rule.name}`;
    }
  }
}

// Singleton instance
let alertServiceInstance: AlertService | null = null;

export function getAlertService(): AlertService {
  if (!alertServiceInstance) {
    alertServiceInstance = new AlertService();
  }
  return alertServiceInstance;
}

export default AlertService;
