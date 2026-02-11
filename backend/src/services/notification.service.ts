/**
 * NotificationService - Send alert notifications via multiple channels
 */

import axios from 'axios';
import { logger } from '../utils/logger';
import { AlertRule, AlertHistory, AlertChannel } from '../models/alert.model';

export class NotificationService {
  private static instance: NotificationService;
  private telegramBotToken: string | null = null;
  private telegramChatId: string | null = null;

  private constructor() {
    this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || null;
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID || null;

    if (this.telegramBotToken) {
      logger.info('✅ Telegram notifications enabled');
    } else {
      logger.warn('⚠️  Telegram notifications disabled (TELEGRAM_BOT_TOKEN not set)');
    }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Send notifications for triggered alert
   */
  async sendNotifications(rule: AlertRule, historyItem: AlertHistory): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const channel of rule.channels) {
      switch (channel) {
        case 'telegram':
          promises.push(this.sendTelegramNotification(rule, historyItem));
          break;
        case 'email':
          promises.push(this.sendEmailNotification(rule, historyItem));
          break;
        case 'webhook':
          promises.push(this.sendWebhookNotification(rule, historyItem));
          break;
        case 'push':
          logger.debug('Push notifications not yet implemented');
          break;
        default:
          logger.warn(`Unknown notification channel: ${channel}`);
      }
    }

    // Send all notifications in parallel
    await Promise.allSettled(promises);
  }

  /**
   * Send Telegram notification
   */
  private async sendTelegramNotification(rule: AlertRule, historyItem: AlertHistory): Promise<void> {
    if (!this.telegramBotToken) {
      logger.warn('Telegram notification skipped: TELEGRAM_BOT_TOKEN not configured');
      return;
    }

    if (!this.telegramChatId) {
      logger.warn('Telegram notification skipped: TELEGRAM_CHAT_ID not configured');
      return;
    }

    try {
      const message = this.formatTelegramMessage(rule, historyItem);
      const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;

      await axios.post(url, {
        chat_id: this.telegramChatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });

      logger.info(`📨 Telegram notification sent for alert: ${rule.name}`);
    } catch (error) {
      logger.error('Failed to send Telegram notification', error);
    }
  }

  /**
   * Format Telegram message with HTML
   */
  private formatTelegramMessage(rule: AlertRule, historyItem: AlertHistory): string {
    const emoji = this.getAlertEmoji(rule.type);
    const timestamp = new Date(historyItem.triggeredAt).toLocaleString('en-US', {
      timeZone: 'UTC',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    return `
${emoji} <b>Alert Triggered: ${rule.name}</b>

📋 <b>Type:</b> ${this.capitalizeFirst(rule.type)}
⚖️ <b>Condition:</b> ${this.capitalizeFirst(rule.condition)} ${rule.threshold}
📊 <b>Current Value:</b> ${historyItem.value}
💬 <b>Message:</b> ${historyItem.message}
🕐 <b>Time:</b> ${timestamp} UTC

<i>Alert ID: ${rule.id}</i>
    `.trim();
  }

  /**
   * Get emoji for alert type
   */
  private getAlertEmoji(type: string): string {
    const emojiMap: Record<string, string> = {
      price: '💰',
      whale: '🐋',
      volume: '📈',
      listing: '🏷️',
    };
    return emojiMap[type] || '🔔';
  }

  /**
   * Send Email notification
   */
  private async sendEmailNotification(rule: AlertRule, historyItem: AlertHistory): Promise<void> {
    // TODO: Implement email sending via SMTP or SendGrid
    logger.info(`📧 Email notification would be sent for alert: ${rule.name}`);
    logger.debug('Email notifications not yet implemented - use Telegram for now');
  }

  /**
   * Send Webhook notification
   */
  private async sendWebhookNotification(rule: AlertRule, historyItem: AlertHistory): Promise<void> {
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;

    if (!webhookUrl) {
      logger.warn('Webhook notification skipped: ALERT_WEBHOOK_URL not configured');
      return;
    }

    try {
      await axios.post(webhookUrl, {
        alert: {
          ruleId: rule.id,
          ruleName: rule.name,
          type: rule.type,
          condition: rule.condition,
          threshold: rule.threshold,
          currentValue: historyItem.value,
          message: historyItem.message,
          triggeredAt: historyItem.triggeredAt,
        },
      });

      logger.info(`🔗 Webhook notification sent for alert: ${rule.name}`);
    } catch (error) {
      logger.error('Failed to send webhook notification', error);
    }
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Test notification send (for debugging)
   */
  async sendTestNotification(channel: AlertChannel, message: string): Promise<boolean> {
    try {
      if (channel === 'telegram') {
        if (!this.telegramBotToken || !this.telegramChatId) {
          throw new Error('Telegram not configured');
        }

        const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
        await axios.post(url, {
          chat_id: this.telegramChatId,
          text: `🧪 Test Notification\n\n${message}`,
          parse_mode: 'HTML',
        });

        logger.info('✅ Telegram test notification sent successfully');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to send test notification', error);
      return false;
    }
  }
}

// Singleton instance
let notificationServiceInstance: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (!notificationServiceInstance) {
    notificationServiceInstance = NotificationService.getInstance();
  }
  return notificationServiceInstance;
}

export default NotificationService;
