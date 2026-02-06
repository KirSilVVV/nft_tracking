import TelegramBot from 'node-telegram-bot-api';
import { getAnalyticsService } from '../services/analytics.service';
import { getBlockchainService } from '../services/blockchain.service';
import { getCacheService } from '../services/cache.service';
import { TelegramFormatter } from '../utils/telegram.formatter';
import { logger } from '../utils/logger';
import { Holder } from '../models/holder.model';

export interface UserSubscription {
  chatId: number;
  userId: number;
  whales: boolean;
  largeSales: boolean;
  spikes: boolean;
  newWhales: boolean;
}

export class NFTBot {
  private bot: TelegramBot;
  private analyticsService = getAnalyticsService();
  private blockchainService = getBlockchainService();
  private cacheService = getCacheService();
  private subscriptions: Map<number, UserSubscription> = new Map();
  private userPages: Map<number, number> = new Map();

  constructor(token: string) {
    // Initialize bot without internal HTTP server
    // Let Express handle webhook routing instead
    this.bot = new TelegramBot(token);

    this.setupCommands();
    this.setupCallbackQueries();
    logger.info('🔗 Telegram bot initialized in webhook mode (Express handler)');
  }

  /**
   * Handle webhook updates from Telegram
   */
  handleWebhookUpdate(update: any): void {
    // Telegram sends updates as { update_id, message/callback_query/etc }
    this.bot.processUpdate(update);
  }

  private setupCommands(): void {
    // /start command
    this.bot.onText(/\/start/, (msg) => this.handleStart(msg));

    // /help command
    this.bot.onText(/\/help/, (msg) => this.handleHelp(msg));

    // /holders command
    this.bot.onText(/\/holders/, (msg) => this.handleHolders(msg));

    // /whales command
    this.bot.onText(/\/whales/, (msg) => this.handleWhales(msg));

    // /metrics command with optional period
    this.bot.onText(/\/metrics\s*(24h|7d|30d)?/, (msg, match) => {
      const period = match?.[1] || '24h';
      this.handleMetrics(msg, period);
    });

    // /recent command
    this.bot.onText(/\/recent/, (msg) => this.handleRecent(msg));

    // /subscribe command
    this.bot.onText(/\/subscribe/, (msg) => this.handleSubscribe(msg));

    logger.info('Commands setup completed');
  }

  private setupCallbackQueries(): void {
    this.bot.on('callback_query', async (query) => {
      const { data, from, message } = query;

      logger.debug(`Callback query: ${data} from user ${from.id}`);

      if (!message) return;

      try {
        if (data?.startsWith('holders_page_')) {
          const page = parseInt(data.split('_')[2]);
          await this.updateHoldersMessage(message.chat.id, message.message_id, page);
        } else if (data === 'holders_refresh') {
          this.cacheService.clearKey('topHolders');
          const page = this.userPages.get(message.chat.id) || 1;
          await this.updateHoldersMessage(message.chat.id, message.message_id, page);
        } else if (data === 'distribution') {
          await this.sendDistribution(message.chat.id);
        } else if (data?.startsWith('metrics_')) {
          const period = data.split('_')[1];
          await this.updateMetricsMessage(message.chat.id, message.message_id, period);
        } else if (data?.startsWith('sub_')) {
          const subType = data.split('_')[1];
          await this.updateSubscription(message.chat.id, message.message_id, subType);
        }

        await this.bot.answerCallbackQuery(query.id);
      } catch (error) {
        logger.error('Error handling callback query', error);
        await this.bot.answerCallbackQuery(query.id, {
          text: 'Ошибка при обработке запроса',
          show_alert: true,
        });
      }
    });

    logger.info('Callback queries setup completed');
  }

  private async handleStart(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const text = TelegramFormatter.formatStart();

    try {
      await this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      logger.error('Error sending start message', error);
    }
  }

  private async handleHelp(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const text = TelegramFormatter.formatHelp();

    try {
      await this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      logger.error('Error sending help message', error);
    }
  }

  private async handleHolders(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    try {
      // Fetch recent data only (last 10,000 blocks = ~2.3 days)
      // This avoids excessive API calls and rate limiting for historical data
      const events = await this.blockchainService.getAllTransferEvents(0);
      const allHolders = this.analyticsService.buildHoldersList(events);
      const topHolders = this.analyticsService.getTopHolders(allHolders, 50);

      // Cache for pagination
      this.cacheService.set(`holders_${chatId}`, topHolders);
      this.userPages.set(chatId, 1);

      const text = TelegramFormatter.formatHolders(topHolders, 1, 10);
      const keyboard = TelegramFormatter.getHoldersKeyboard(1, Math.ceil(topHolders.length / 10));

      await this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } catch (error) {
      logger.error('Error handling holders command', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка при получении данных');
    }
  }

  private async handleWhales(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    try {
      // Fetch data
      const events = await this.blockchainService.getAllTransferEvents(0);
      const allHolders = this.analyticsService.buildHoldersList(events);
      const whales = allHolders.filter((h) => h.count >= 10);

      const text = TelegramFormatter.formatWhales(whales);

      await this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      logger.error('Error handling whales command', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка при получении данных');
    }
  }

  private async handleMetrics(msg: TelegramBot.Message, period: string = '24h'): Promise<void> {
    const chatId = msg.chat.id;

    try {
      // Parse period
      const hours =
        period === '7d' ? 168 : period === '30d' ? 720 : 24;

      // Fetch data
      const allEvents = await this.blockchainService.getAllTransferEvents(0);
      const inWindow = this.analyticsService.getTransactionsInWindow(allEvents, hours);
      const metrics = this.analyticsService.calculateMetricsForPeriod(inWindow);

      const text = TelegramFormatter.formatMetrics(metrics, period);
      const keyboard = TelegramFormatter.getMetricsKeyboard();

      await this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } catch (error) {
      logger.error('Error handling metrics command', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка при получении данных');
    }
  }

  private async handleRecent(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    try {
      // Fetch data
      const allEvents = await this.blockchainService.getAllTransferEvents(0);
      const recent = this.analyticsService.getTransactionsInWindow(allEvents, 24);

      const text = TelegramFormatter.formatRecent(recent);

      await this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      logger.error('Error handling recent command', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка при получении данных');
    }
  }

  private async handleSubscribe(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const userId = msg.from?.id || 0;

    // Initialize subscription if not exists
    if (!this.subscriptions.has(chatId)) {
      this.subscriptions.set(chatId, {
        chatId,
        userId,
        whales: false,
        largeSales: false,
        spikes: false,
        newWhales: false,
      });
    }

    const sub = this.subscriptions.get(chatId)!;
    const text = TelegramFormatter.formatSubscribeMenu();
    const keyboard = TelegramFormatter.getSubscribeKeyboard([
      sub.whales,
      sub.largeSales,
      sub.spikes,
      sub.newWhales,
    ]);

    try {
      await this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } catch (error) {
      logger.error('Error handling subscribe command', error);
    }
  }

  private async updateHoldersMessage(chatId: number, messageId: number, page: number): Promise<void> {
    try {
      const holders: Holder[] = this.cacheService.get(`holders_${chatId}`) || [];
      const totalPages = Math.ceil(holders.length / 10);

      if (page < 1 || page > totalPages) return;

      this.userPages.set(chatId, page);

      const text = TelegramFormatter.formatHolders(holders, page, 10);
      const keyboard = TelegramFormatter.getHoldersKeyboard(page, totalPages);

      await this.bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } catch (error) {
      logger.error('Error updating holders message', error);
    }
  }

  private async updateMetricsMessage(chatId: number, messageId: number, period: string): Promise<void> {
    try {
      const hours = period === '7d' ? 168 : period === '30d' ? 720 : 24;

      const allEvents = await this.blockchainService.getAllTransferEvents(0);
      const inWindow = this.analyticsService.getTransactionsInWindow(allEvents, hours);
      const metrics = this.analyticsService.calculateMetricsForPeriod(inWindow);

      const text = TelegramFormatter.formatMetrics(metrics, period);
      const keyboard = TelegramFormatter.getMetricsKeyboard();

      await this.bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } catch (error) {
      logger.error('Error updating metrics message', error);
    }
  }

  private async updateSubscription(chatId: number, messageId: number, subType: string): Promise<void> {
    try {
      if (!this.subscriptions.has(chatId)) {
        this.subscriptions.set(chatId, {
          chatId,
          userId: 0,
          whales: false,
          largeSales: false,
          spikes: false,
          newWhales: false,
        });
      }

      const sub = this.subscriptions.get(chatId)!;

      if (subType === 'whales') sub.whales = !sub.whales;
      else if (subType === 'large') sub.largeSales = !sub.largeSales;
      else if (subType === 'spikes') sub.spikes = !sub.spikes;
      else if (subType === 'new_whales') sub.newWhales = !sub.newWhales;
      else if (subType === 'all') {
        sub.whales = true;
        sub.largeSales = true;
        sub.spikes = true;
        sub.newWhales = true;
      } else if (subType === 'none') {
        sub.whales = false;
        sub.largeSales = false;
        sub.spikes = false;
        sub.newWhales = false;
      }

      const text = TelegramFormatter.formatSubscribeMenu();
      const keyboard = TelegramFormatter.getSubscribeKeyboard([
        sub.whales,
        sub.largeSales,
        sub.spikes,
        sub.newWhales,
      ]);

      await this.bot.editMessageText(text, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });
    } catch (error) {
      logger.error('Error updating subscription', error);
    }
  }

  private async sendDistribution(chatId: number): Promise<void> {
    try {
      const events = await this.blockchainService.getAllTransferEvents(0);
      const allHolders = this.analyticsService.buildHoldersList(events);
      const stats = this.analyticsService.calculateDistribution(allHolders);

      const text = TelegramFormatter.formatDistribution(stats.distribution);

      await this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
      });
    } catch (error) {
      logger.error('Error sending distribution', error);
    }
  }

  /**
   * Send notification to subscriber
   */
  async notifyWhaleActivity(address: string, action: 'buy' | 'sell', tokenIds: number[], totalNFTs: number): Promise<void> {
    const text = TelegramFormatter.formatWhaleAlert(address, action, tokenIds, totalNFTs);

    for (const [, sub] of this.subscriptions) {
      if (sub.whales) {
        try {
          await this.bot.sendMessage(sub.chatId, text, {
            parse_mode: 'Markdown',
          });
        } catch (error) {
          logger.error(`Error sending notification to ${sub.chatId}`, error);
        }
      }
    }
  }

  /**
   * Send large sale notification
   */
  async notifyLargeSale(tokenId: number, priceETH: number, from: string, to: string): Promise<void> {
    const text = TelegramFormatter.formatLargeSale(tokenId, priceETH, from, to);

    for (const [, sub] of this.subscriptions) {
      if (sub.largeSales) {
        try {
          await this.bot.sendMessage(sub.chatId, text, {
            parse_mode: 'Markdown',
          });
        } catch (error) {
          logger.error(`Error sending notification to ${sub.chatId}`, error);
        }
      }
    }
  }

  /**
   * Get subscribers for a specific event
   */
  getSubscribersForEvent(eventType: 'whales' | 'large' | 'spikes' | 'new_whales'): UserSubscription[] {
    const subscribers: UserSubscription[] = [];

    for (const [, sub] of this.subscriptions) {
      if (eventType === 'whales' && sub.whales) subscribers.push(sub);
      else if (eventType === 'large' && sub.largeSales) subscribers.push(sub);
      else if (eventType === 'spikes' && sub.spikes) subscribers.push(sub);
      else if (eventType === 'new_whales' && sub.newWhales) subscribers.push(sub);
    }

    return subscribers;
  }

  /**
   * Send message to specific chat
   */
  async sendMessage(chatId: number, text: string, options?: any): Promise<void> {
    try {
      await this.bot.sendMessage(chatId, text, options || { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error(`Error sending message to ${chatId}`, error);
    }
  }

  /**
   * Set webhook URL for Telegram bot
   */
  async setWebhook(url: string): Promise<void> {
    try {
      // Clear any existing webhook first
      await this.bot.deleteWebHook();
      logger.info('🗑️ Cleared existing webhook');

      // Set new webhook URL
      await this.bot.setWebHook(url);
      logger.info(`✅ Webhook set to ${url}`);
    } catch (error) {
      logger.error(`Failed to set webhook: ${url}`, error);
      throw error;
    }
  }

  /**
   * Close bot gracefully
   */
  close(): void {
    // Don't call stopPolling for webhook mode
    logger.info('Telegram bot stopped');
  }
}
