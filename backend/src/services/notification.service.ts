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
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || 'alerts@nft-tracker.ai';
    const toEmail = process.env.TO_EMAIL;

    if (!sendgridApiKey || !toEmail) {
      logger.warn('Email notification skipped: SENDGRID_API_KEY or TO_EMAIL not configured');
      return;
    }

    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(sendgridApiKey);

      const emoji = this.getAlertEmoji(rule.type);
      const subject = `${emoji} ${rule.name} Alert`;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0B0B10; color: #F0F0F5; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #1a1a1f 0%, #0f0f13 100%); padding: 24px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #F5A623;">
            <h2 style="margin: 0 0 12px; color: #F5A623;">${emoji} ${rule.name}</h2>
            <p style="margin: 0; font-size: 14px; color: #9494A8;">Alert Triggered • ${new Date(historyItem.triggeredAt).toLocaleString()}</p>
          </div>

          <div style="background: #14141A; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 16px; color: #F0F0F5; font-size: 16px;">Alert Details</h3>
            <div style="margin-bottom: 12px;">
              <span style="color: #9494A8;">Type:</span>
              <span style="color: #F0F0F5; font-weight: 600; margin-left: 8px;">${rule.type}</span>
            </div>
            <div style="margin-bottom: 12px;">
              <span style="color: #9494A8;">Condition:</span>
              <span style="color: #F0F0F5; font-weight: 600; margin-left: 8px;">${rule.condition} ${rule.threshold}</span>
            </div>
            <div style="margin-bottom: 12px;">
              <span style="color: #9494A8;">Current Value:</span>
              <span style="color: #F5A623; font-weight: 700; margin-left: 8px;">${historyItem.value}</span>
            </div>
            <div style="padding-top: 12px; border-top: 1px solid #1E1E24;">
              <p style="margin: 0; color: #F0F0F5; line-height: 1.6;">${historyItem.message}</p>
            </div>
          </div>

          <div style="text-align: center; padding: 16px 0;">
            <a href="https://nftai.one/alerts" style="display: inline-block; background: #F5A623; color: #0B0B10; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              View All Alerts →
            </a>
          </div>

          <div style="text-align: center; padding-top: 16px; border-top: 1px solid #1E1E24; margin-top: 20px;">
            <p style="margin: 0; font-size: 12px; color: #6B6B7B;">
              NFT Tracker AI • Mutant Ape Yacht Club Analytics<br>
              <a href="https://nftai.one" style="color: #F5A623; text-decoration: none;">nftai.one</a>
            </p>
          </div>
        </div>
      `;

      const msg = {
        to: toEmail,
        from: fromEmail,
        subject,
        html: htmlContent,
      };

      await sgMail.send(msg);
      logger.info(`✅ Email notification sent to ${toEmail}: ${rule.name}`);
    } catch (error: any) {
      logger.error('Failed to send email notification', error);
      if (error.response) {
        logger.error('SendGrid error details:', error.response.body);
      }
    }
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

      if (channel === 'email') {
        return await this.sendTransactionEmail(message);
      }

      return false;
    } catch (error) {
      logger.error('Failed to send test notification', error);
      return false;
    }
  }

  /**
   * Send transaction notification email (optimized for real-time alerts)
   */
  private async sendTransactionEmail(message: string): Promise<boolean> {
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || 'MAYC Alerts <alerts@nftai.one>';
    const toEmail = process.env.TO_EMAIL;

    if (!sendgridApiKey || !toEmail) {
      logger.warn('Email notification skipped: SENDGRID_API_KEY or TO_EMAIL not configured');
      return false;
    }

    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(sendgridApiKey);

      // Parse emoji from message for subject
      const emojiMatch = message.match(/^(🐋|💰|🔄)/);
      const emoji = emojiMatch ? emojiMatch[1] : '🔔';

      // Extract token ID for subject
      const tokenMatch = message.match(/Token:<\/b> #(\d+)/);
      const tokenId = tokenMatch ? tokenMatch[1] : 'Unknown';

      const subject = `${emoji} MAYC #${tokenId} Transaction`;

      // Convert Telegram HTML to Email HTML (more styled)
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0B0B10; color: #F0F0F5; padding: 20px; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #1a1a1f 0%, #0f0f13 100%); padding: 24px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #F5A623;">
            ${message.replace(/\n/g, '<br>').replace(/<code>/g, '<span style="font-family: monospace; background: #14141A; padding: 2px 6px; border-radius: 4px;">').replace(/<\/code>/g, '</span>')}
          </div>
          <div style="text-align: center; padding-top: 16px; border-top: 1px solid #1E1E24;">
            <p style="margin: 0; font-size: 12px; color: #6B6B7B;">
              NFT Tracker AI • Real-time MAYC Monitoring<br>
              <a href="https://nftai.one" style="color: #F5A623; text-decoration: none;">nftai.one</a>
            </p>
          </div>
        </div>
      `;

      const msg = {
        to: toEmail,
        from: fromEmail,
        subject,
        html: emailHtml,
      };

      await sgMail.send(msg);
      logger.info(`✅ Transaction email sent to ${toEmail}: Token #${tokenId}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to send transaction email', error);
      if (error.response) {
        logger.error('SendGrid error details:', error.response.body);
      }
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
