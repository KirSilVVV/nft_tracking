import { Transaction, WhaleActivity } from '../models/transaction.model';
import { Holder } from '../models/holder.model';
import { NFTBot } from '../bot/bot';
import { logger } from '../utils/logger';

export class NotificationService {
  private bot: NFTBot;
  private lastNotifiedWhales: Set<string> = new Set();
  private lastNotifiedLargeSales: Set<string> = new Set();

  constructor(bot: NFTBot) {
    this.bot = bot;
  }

  /**
   * Handle new transfer event
   */
  async handleNewTransfer(transaction: Transaction, holders: Holder[]): Promise<void> {
    try {
      // Check for whale activity
      const toHolder = holders.find((h) => h.address.toLowerCase() === transaction.to.toLowerCase());
      const fromHolder = holders.find((h) => h.address.toLowerCase() === transaction.from.toLowerCase());

      if (toHolder && toHolder.count >= 10) {
        // Whale is buying
        const notificationKey = `${transaction.to}_buy_${transaction.blockNumber}`;
        if (!this.lastNotifiedWhales.has(notificationKey)) {
          this.lastNotifiedWhales.add(notificationKey);
          await this.bot.notifyWhaleActivity(transaction.to, 'buy', [transaction.tokenId], toHolder.count);

          // Clean up old notifications
          if (this.lastNotifiedWhales.size > 100) {
            const arr = Array.from(this.lastNotifiedWhales);
            this.lastNotifiedWhales = new Set(arr.slice(-50));
          }
        }
      }

      if (fromHolder && fromHolder.count >= 10) {
        // Whale is selling
        const notificationKey = `${transaction.from}_sell_${transaction.blockNumber}`;
        if (!this.lastNotifiedWhales.has(notificationKey)) {
          this.lastNotifiedWhales.add(notificationKey);
          await this.bot.notifyWhaleActivity(transaction.from, 'sell', [transaction.tokenId], fromHolder.count);

          // Clean up old notifications
          if (this.lastNotifiedWhales.size > 100) {
            const arr = Array.from(this.lastNotifiedWhales);
            this.lastNotifiedWhales = new Set(arr.slice(-50));
          }
        }
      }

      // Check for large sales
      if (transaction.priceETH && transaction.priceETH > 20 && transaction.type === 'sale') {
        const notificationKey = `${transaction.txHash}`;
        if (!this.lastNotifiedLargeSales.has(notificationKey)) {
          this.lastNotifiedLargeSales.add(notificationKey);
          await this.bot.notifyLargeSale(transaction.tokenId, transaction.priceETH, transaction.from, transaction.to);

          // Clean up old notifications
          if (this.lastNotifiedLargeSales.size > 100) {
            const arr = Array.from(this.lastNotifiedLargeSales);
            this.lastNotifiedLargeSales = new Set(arr.slice(-50));
          }
        }
      }
    } catch (error) {
      logger.error('Error handling new transfer', error);
    }
  }

  /**
   * Check for unusual activity spikes
   */
  async checkActivitySpike(recentTransactions: Transaction[]): Promise<void> {
    try {
      // Get transaction count in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentHour = recentTransactions.filter((t) => t.timestamp >= oneHourAgo);

      // Get average from last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentDay = recentTransactions.filter((t) => t.timestamp >= oneDayAgo);

      const averagePerHour = recentDay.length / 24;
      const currentHourCount = recentHour.length;

      // If current hour has 2x more transactions than average, it's a spike
      if (currentHourCount > averagePerHour * 2 && averagePerHour > 0) {
        const subscribers = this.bot.getSubscribersForEvent('spikes');

        if (subscribers.length > 0) {
          const message = `
📈 *Всплеск активности!*

Транзакций за последний час: *${currentHourCount}*
Средний показатель: ${averagePerHour.toFixed(0)}/час
Увеличение: *${(((currentHourCount - averagePerHour) / averagePerHour) * 100).toFixed(0)}%*
          `;

          for (const sub of subscribers) {
            try {
              await this.bot.sendMessage(sub.chatId, message, { parse_mode: 'Markdown' });
            } catch (error) {
              logger.error(`Error notifying ${sub.chatId}`, error);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error checking activity spike', error);
    }
  }

  /**
   * Check for new whales (addresses that just exceeded 10 NFT threshold)
   */
  async checkNewWhales(holders: Holder[], previousHolders: Map<string, Holder>): Promise<void> {
    try {
      const newWhales = holders.filter((holder) => {
        const prev = previousHolders.get(holder.address.toLowerCase());
        return holder.count >= 10 && (!prev || prev.count < 10);
      });

      if (newWhales.length > 0) {
        const subscribers = this.bot.getSubscribersForEvent('new_whales');

        for (const whale of newWhales) {
          for (const sub of subscribers) {
            try {
              const message = `
⭐ *Новый кит!*

Адрес: \`${whale.address}\`
NFT: *${whale.count}*
Процент коллекции: *${whale.percentageOfCollection?.toFixed(2)}%*
              `;

              await this.bot.sendMessage(sub.chatId, message, { parse_mode: 'Markdown' });
            } catch (error) {
              logger.error(`Error notifying new whale`, error);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Error checking new whales', error);
    }
  }
}

let instance: NotificationService;

export function initNotificationService(bot: NFTBot): NotificationService {
  if (!instance) {
    instance = new NotificationService(bot);
  }
  return instance;
}

export function getNotificationService(): NotificationService {
  if (!instance) {
    throw new Error('NotificationService not initialized');
  }
  return instance;
}
