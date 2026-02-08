/**
 * Email Service - Send alert notifications via email
 */

import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import { Alert, AlertSeverity } from '../models/alert.model';

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter | null = null;
  private enabled: boolean = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private initialize() {
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    const emailFrom = process.env.EMAIL_FROM || emailUser;

    if (!emailHost || !emailUser || !emailPassword) {
      logger.warn('Email service not configured (missing EMAIL_HOST, EMAIL_USER, or EMAIL_PASSWORD)');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailPort === 465, // true for 465, false for other ports
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
        tls: {
          // Allow self-signed certificates (for corporate proxies/antiviruses)
          rejectUnauthorized: false,
        },
      });

      this.enabled = true;
      logger.info(`✅ Email service initialized (${emailHost}:${emailPort})`);
    } catch (error) {
      logger.error('Failed to initialize email service', error);
    }
  }

  /**
   * Check if email service is available
   */
  isEnabled(): boolean {
    return this.enabled && this.transporter !== null;
  }

  /**
   * Send test email
   */
  async sendTestEmail(to: string): Promise<boolean> {
    if (!this.isEnabled()) {
      logger.warn('Email service not enabled');
      return false;
    }

    try {
      const info = await this.transporter!.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject: '🚨 MAYC Smart Alerts - Test Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">🐵 MAYC Smart Alerts</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">NFT Whale Tracker</p>
            </div>

            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">✅ Email Alerts are Working!</h2>

              <p style="color: #666; line-height: 1.6;">
                This is a test email from your MAYC NFT Alert System. You will receive notifications here when:
              </p>

              <ul style="color: #666; line-height: 1.8;">
                <li>💰 Large sales occur (>5 ETH)</li>
                <li>🐋 Whales buy or sell NFTs</li>
                <li>📊 Floor price changes significantly</li>
                <li>📈 Pump/dump patterns detected</li>
              </ul>

              <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #555;">
                  <strong>Time sent:</strong> ${new Date().toLocaleString()}<br>
                  <strong>Status:</strong> ✅ Active and monitoring
                </p>
              </div>

              <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                MAYC Whale Tracker | Powered by Alchemy & OpenSea APIs
              </p>
            </div>
          </div>
        `,
      });

      logger.info(`✅ Test email sent successfully: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error('Failed to send test email', error);
      return false;
    }
  }

  /**
   * Send alert notification email
   */
  async sendAlertEmail(to: string, alert: Alert): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      const severityColor = this.getSeverityColor(alert.severity);
      const severityLabel = alert.severity.toUpperCase();

      const info = await this.transporter!.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject: `🚨 ${alert.title} - MAYC Alert`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: ${severityColor}; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0;">${alert.title}</h1>
              <span style="background: rgba(255,255,255,0.2); color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 10px; display: inline-block;">
                ${severityLabel}
              </span>
            </div>

            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin-top: 0;">
                ${alert.message}
              </p>

              ${this.getAlertDetails(alert)}

              ${this.getActionButtons(alert)}

              <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                Received at ${new Date(alert.timestamp).toLocaleString()}<br>
                MAYC Whale Tracker | Alert ID: ${alert.id.slice(0, 8)}
              </p>
            </div>
          </div>
        `,
      });

      logger.info(`📧 Alert email sent: ${alert.title} (${info.messageId})`);
      return true;
    } catch (error) {
      logger.error('Failed to send alert email', error);
      return false;
    }
  }

  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.INFO:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case AlertSeverity.WARNING:
        return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      case AlertSeverity.CRITICAL:
        return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  }

  private getAlertDetails(alert: Alert): string {
    let details = '<div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">';

    if (alert.metadata?.tokenId !== undefined) {
      details += `<p style="margin: 5px 0; color: #555;"><strong>Token ID:</strong> #${alert.metadata.tokenId}</p>`;
    }

    if (alert.metadata?.priceETH !== undefined) {
      details += `<p style="margin: 5px 0; color: #555;"><strong>Price:</strong> ${alert.metadata.priceETH.toFixed(4)} ETH</p>`;
    }

    if (alert.metadata?.address) {
      details += `<p style="margin: 5px 0; color: #555; word-break: break-all;"><strong>Address:</strong> ${alert.metadata.address}</p>`;
    }

    details += '</div>';
    return details;
  }

  private getActionButtons(alert: Alert): string {
    let buttons = '<div style="margin: 20px 0;">';

    if (alert.metadata?.tokenId !== undefined) {
      const tokenId = alert.metadata.tokenId;
      buttons += `
        <a href="https://opensea.io/assets/ethereum/0x60e4d786628fea6478f785a6d7e704777c86a7c6/${tokenId}"
           style="display: inline-block; background: #2081e2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px; margin-bottom: 10px;">
          View on OpenSea
        </a>
      `;
    }

    if (alert.metadata?.txHash) {
      buttons += `
        <a href="https://etherscan.io/tx/${alert.metadata.txHash}"
           style="display: inline-block; background: #21325b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-bottom: 10px;">
          View on Etherscan
        </a>
      `;
    }

    buttons += '</div>';
    return buttons;
  }
}

export function getEmailService(): EmailService {
  return EmailService.getInstance();
}
