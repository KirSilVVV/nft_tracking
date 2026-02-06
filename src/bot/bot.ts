import TelegramBot from 'node-telegram-bot-api';
import { getAnalyticsService } from '../services/analytics.service';
import { getBlockchainService } from '../services/blockchain.service';
import { getCacheService } from '../services/cache.service';
import { getWhaleService } from '../services/whale.service';
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
  private whaleService = getWhaleService();
  private subscriptions: Map<number, UserSubscription> = new Map();
  private userPages: Map<number, number> = new Map();

  constructor(token: string) {
    // Initialize bot without internal HTTP server
    // Let Express handle webhook routing instead
    logger.info('🚀 NFTBot constructor: Initializing TelegramBot...');

    this.bot = new TelegramBot(token);
    logger.info('✅ TelegramBot instance created');

    logger.info('🚀 NFTBot constructor: Setting up commands...');
    this.setupCommands();
    logger.info('✅ Commands setup completed');

    logger.info('🚀 NFTBot constructor: Setting up callback queries...');
    this.setupCallbackQueries();
    logger.info('✅ Callback queries setup completed');

    logger.info('✅ 🔗 Telegram bot fully initialized in webhook mode (Express handler)');
  }

  /**
   * Handle webhook updates from Telegram
   */
  handleWebhookUpdate(update: any): void {
    // Telegram sends updates as { update_id, message/callback_query/etc }
    try {
      logger.info(`📥 [WEBHOOK] Received update: ${JSON.stringify(update).substring(0, 100)}...`);

      if (update.message) {
        logger.info(`📨 [WEBHOOK] Message update: text="${update.message.text}", chat_id=${update.message.chat.id}`);
      } else if (update.callback_query) {
        logger.info(`📨 [WEBHOOK] Callback update: data="${update.callback_query.data}", user_id=${update.callback_query.from.id}`);
      } else {
        logger.info(`📨 [WEBHOOK] Other update type: ${Object.keys(update).join(', ')}`);
      }

      logger.info('📨 [WEBHOOK] Calling bot.processUpdate()...');
      this.bot.processUpdate(update);
      logger.info('✅ [WEBHOOK] processUpdate() completed');
    } catch (error) {
      logger.error('❌ [WEBHOOK] Error processing webhook update:', error);
    }
  }

  private setupCommands(): void {
    logger.info('🔧 Setting up command handlers...');

    // /start command
    this.bot.onText(/\/start/, (msg) => {
      logger.info('✅ /start command handler triggered');
      this.handleStart(msg);
    });

    // /help command
    this.bot.onText(/\/help/, (msg) => {
      logger.info('✅ /help command handler triggered');
      this.handleHelp(msg);
    });

    // /holders command
    this.bot.onText(/\/holders/, (msg) => {
      logger.info('✅ /holders command handler triggered');
      this.handleHolders(msg).catch(err => logger.error('Unhandled error in handleHolders', err));
    });

    // /whales command
    this.bot.onText(/\/whales/, (msg) => {
      logger.info('✅ /whales command handler triggered');
      this.handleWhales(msg).catch(err => logger.error('Unhandled error in handleWhales', err));
    });

    // /metrics command with optional period
    this.bot.onText(/\/metrics\s*(24h|7d|30d)?/, (msg, match) => {
      logger.info('✅ /metrics command handler triggered');
      const period = match?.[1] || '24h';
      this.handleMetrics(msg, period).catch(err => logger.error('Unhandled error in handleMetrics', err));
    });

    // /recent command
    this.bot.onText(/\/recent/, (msg) => {
      logger.info('✅ /recent command handler triggered');
      this.handleRecent(msg).catch(err => logger.error('Unhandled error in handleRecent', err));
    });

    // /subscribe command
    this.bot.onText(/\/subscribe/, (msg) => {
      logger.info('✅ /subscribe command handler triggered');
      this.handleSubscribe(msg).catch(err => logger.error('Unhandled error in handleSubscribe', err));
    });

    // /top command - Top 10 whales
    this.bot.onText(/\/top\b/, (msg) => {
      logger.info('✅ /top command handler triggered');
      this.handleTop(msg).catch(err => logger.error('Unhandled error in handleTop', err));
    });

    // /top50 command - Top 50 whales
    this.bot.onText(/\/top50/, (msg) => {
      logger.info('✅ /top50 command handler triggered');
      this.handleTop50(msg).catch(err => logger.error('Unhandled error in handleTop50', err));
    });

    // /whale <address> command - Search specific whale
    this.bot.onText(/\/whale\s+(\S+)/, (msg, match) => {
      logger.info('✅ /whale command handler triggered');
      const address = match?.[1] || '';
      this.handleWhaleSearch(msg, address).catch(err => logger.error('Unhandled error in handleWhaleSearch', err));
    });

    // /floor command - Floor price
    this.bot.onText(/\/floor/, (msg) => {
      logger.info('✅ /floor command handler triggered');
      this.handleFloor(msg).catch(err => logger.error('Unhandled error in handleFloor', err));
    });

    // /refresh command - Admin cache refresh
    this.bot.onText(/\/refresh/, (msg) => {
      logger.info('✅ /refresh command handler triggered');
      this.handleRefresh(msg).catch(err => logger.error('Unhandled error in handleRefresh', err));
    });

    // /stats command - Collection statistics
    this.bot.onText(/\/stats/, (msg) => {
      logger.info('✅ /stats command handler triggered');
      this.handleStats(msg).catch(err => logger.error('Unhandled error in handleStats', err));
    });

    logger.info('✅ All commands registered successfully');
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
      logger.info(`🔍 handleHolders() called for chat ${chatId}`);

      // Check if we have cached data (full history)
      const cachedHolders = this.cacheService.get('topHolders');
      logger.info(`📊 Cache check: topHolders = ${cachedHolders ? cachedHolders.length + ' items' : 'null/empty'}`);

      if (cachedHolders && cachedHolders.length > 0) {
        // Use cached full data immediately
        logger.info(`✅ Using full cached data: ${cachedHolders.length} holders`);
        this.userPages.set(chatId, 1);

        const text = TelegramFormatter.formatHolders(cachedHolders, 1, 10);
        const keyboard = TelegramFormatter.getHoldersKeyboard(1, Math.ceil(cachedHolders.length / 10));

        await this.bot.sendMessage(chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        });
        logger.info('✅ Cached holders data sent');

        // Continue updating full history in background
        this.updateHoldersCacheInBackground();
        return;
      }

      // No full cache - fetch recent data for immediate response
      logger.info('🔄 Fetching recent events for immediate display...');
      const statusMsg = await this.bot.sendMessage(chatId, '⏳ Загружаю данные о топ держателях (последние блоки)...');

      try {
        // Fetch recent 2000 blocks (~60-90 seconds = ~1.5 minutes at 3sec/request)
        logger.info('📥 Starting getRecentTransferEvents...');
        const recentEvents = await this.blockchainService.getRecentTransferEvents(2000);
        logger.info(`✅ Got ${recentEvents.length} recent events`);

        // Build holders from recent data
        logger.info('🔨 Building holders list from recent events...');
        const holders = this.analyticsService.buildHoldersList(recentEvents);
        const topHolders = this.analyticsService.getTopHolders(holders, 50);
        logger.info(`✅ Got ${topHolders.length} top holders from recent data`);

        // Update message with results
        this.userPages.set(chatId, 1);
        const text = TelegramFormatter.formatHolders(topHolders, 1, 10);
        const keyboard = TelegramFormatter.getHoldersKeyboard(1, Math.ceil(topHolders.length / 10));

        try {
          await this.bot.editMessageText(text, {
            chat_id: chatId,
            message_id: statusMsg.message_id,
            parse_mode: 'Markdown',
            reply_markup: keyboard,
          });
          logger.info('✅ Updated status message with holders data');
        } catch (editErr) {
          logger.warn('Could not edit message, sending new message instead', editErr);
          await this.bot.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: keyboard,
          });
        }

        // Send info about background update
        await this.bot.sendMessage(chatId, '📊 *Дополнительная информация*:\n\nЭтот результат основан на последних блоках.\nПолная история загружается в фоне и будет доступна через несколько минут.', {
          parse_mode: 'Markdown',
        });

      } catch (fetchErr) {
        logger.error('❌ Error fetching recent events:', fetchErr);
        await this.bot.editMessageText('❌ Ошибка при загрузке данных. Попробуйте позже.', {
          chat_id: chatId,
          message_id: statusMsg.message_id,
        });
        return;
      }

      // Update cache in background with FULL history (don't await)
      logger.info('🔄 Starting full history background update...');
      this.updateHoldersCacheInBackground();

    } catch (error) {
      logger.error('❌ Error handling holders command:', error);
      try {
        await this.bot.sendMessage(chatId, '❌ Ошибка при получении данных');
      } catch (sendErr) {
        logger.error('❌ Failed to send error message', sendErr);
      }
    }
  }

  /**
   * Update holders cache in the background without blocking
   */
  private updateHoldersCacheInBackground(): void {
    // Fire and forget - don't await
    setImmediate(async () => {
      try {
        logger.info('🔄 [BG] Starting background cache update for holders...');

        logger.info('🔄 [BG] Calling getAllTransferEvents...');
        const events = await this.blockchainService.getAllTransferEvents(0);
        logger.info(`🔄 [BG] Got ${events.length} events from blockchain`);

        logger.info('🔄 [BG] Building holders list...');
        const allHolders = this.analyticsService.buildHoldersList(events);
        logger.info(`🔄 [BG] Built ${allHolders.length} unique holders`);

        logger.info('🔄 [BG] Getting top 50 holders...');
        const topHolders = this.analyticsService.getTopHolders(allHolders, 50);
        logger.info(`🔄 [BG] Got top ${topHolders.length} holders`);

        logger.info('🔄 [BG] Setting cache...');
        this.cacheService.set('topHolders', topHolders, 3600); // Cache for 1 hour
        logger.info(`✅ [BG] Holders cache updated with ${topHolders.length} holders`);
      } catch (error) {
        logger.error('❌ [BG] Error updating holders cache in background:', error);
      }
    });
  }

  /**
   * Update events cache in the background without blocking
   */
  private updateEventsCacheInBackground(): void {
    // Fire and forget - don't await
    setImmediate(async () => {
      try {
        logger.info('Starting background cache update for events...');
        const events = await this.blockchainService.getAllTransferEvents(0);

        this.cacheService.set('recentEvents', events, 3600); // Cache for 1 hour
        logger.info(`✅ Events cache updated with ${events.length} events`);
      } catch (error) {
        logger.error('Error updating events cache in background', error);
      }
    });
  }

  private async handleWhales(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    try {
      logger.info(`/whales command from chat ${chatId}`);

      const topHolders = this.cacheService.get('topHolders');

      if (!topHolders || topHolders.length === 0) {
        logger.info('No cached holders for whales command');
        await this.bot.sendMessage(chatId, '⏳ Загружаю данные о китах...\n\nПопробуйте еще раз через минуту.');
        this.updateHoldersCacheInBackground();
        return;
      }

      const whales = topHolders.filter((h: Holder) => h.count >= 10);
      const text = TelegramFormatter.formatWhales(whales);

      await this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
      });

      // Update in background
      this.updateHoldersCacheInBackground();

    } catch (error) {
      logger.error('Error handling whales command', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка при получении данных');
    }
  }

  private async handleMetrics(msg: TelegramBot.Message, period: string = '24h'): Promise<void> {
    const chatId = msg.chat.id;

    try {
      logger.info(`/metrics command from chat ${chatId}, period: ${period}`);

      // Parse period
      const hours =
        period === '7d' ? 168 : period === '30d' ? 720 : 24;

      // Check cache for recent events
      const allEvents = this.cacheService.get('recentEvents') || [];

      if (!allEvents || allEvents.length === 0) {
        await this.bot.sendMessage(chatId, `⏳ Загружаю метрики за ${period}...\n\nПопробуйте еще раз через минуту.`);
        this.updateEventsCacheInBackground();
        return;
      }

      const inWindow = this.analyticsService.getTransactionsInWindow(allEvents, hours);
      const metrics = this.analyticsService.calculateMetricsForPeriod(inWindow);

      const text = TelegramFormatter.formatMetrics(metrics, period);
      const keyboard = TelegramFormatter.getMetricsKeyboard();

      await this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
      });

      // Update in background
      this.updateEventsCacheInBackground();

    } catch (error) {
      logger.error('Error handling metrics command', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка при получении данных');
    }
  }

  private async handleRecent(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    try {
      logger.info(`/recent command from chat ${chatId}`);

      const allEvents = this.cacheService.get('recentEvents') || [];

      if (!allEvents || allEvents.length === 0) {
        await this.bot.sendMessage(chatId, '⏳ Загружаю недавние транзакции...\n\nПопробуйте еще раз через минуту.');
        this.updateEventsCacheInBackground();
        return;
      }

      const recent = this.analyticsService.getTransactionsInWindow(allEvents, 24);

      const text = TelegramFormatter.formatRecent(recent);

      await this.bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
      });

      // Update in background
      this.updateEventsCacheInBackground();

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
   * Handle /top command - Top 10 whales
   */
  private async handleTop(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    try {
      const statusMsg = await this.bot.sendMessage(chatId, '⏳ Загружаю топ 10 китов...');

      const response = await this.whaleService.getTopWhales(10);
      const whales = response.whales || [];

      if (whales.length === 0) {
        await this.bot.editMessageText('❌ Не удалось получить данные о китах', {
          chat_id: chatId,
          message_id: statusMsg.message_id,
        });
        return;
      }

      const text = TelegramFormatter.formatTopWhales(whales);

      await this.bot.editMessageText(text, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown',
      });
    } catch (error) {
      logger.error('Error handling /top command', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка при получении данных о китах');
    }
  }

  /**
   * Handle /top50 command - Top 50 whales
   */
  private async handleTop50(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    try {
      const statusMsg = await this.bot.sendMessage(chatId, '⏳ Загружаю топ 50 китов...');

      const response = await this.whaleService.getTopWhales(50);
      const whales = response.whales || [];

      if (whales.length === 0) {
        await this.bot.editMessageText('❌ Не удалось получить данные о китах', {
          chat_id: chatId,
          message_id: statusMsg.message_id,
        });
        return;
      }

      const text = TelegramFormatter.formatTopWhalesExtended(whales);

      await this.bot.editMessageText(text, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown',
      });
    } catch (error) {
      logger.error('Error handling /top50 command', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка при получении данных о китах');
    }
  }

  /**
   * Handle /whale <address> command - Search specific whale
   */
  private async handleWhaleSearch(msg: TelegramBot.Message, address: string): Promise<void> {
    const chatId = msg.chat.id;

    try {
      // Validate address format
      if (!address.match(/^0x[a-fA-F0-9]{40}$/i)) {
        await this.bot.sendMessage(chatId, '❌ Некорректный формат адреса. Используйте: /whale 0x...');
        return;
      }

      const statusMsg = await this.bot.sendMessage(chatId, `⏳ Ищу кита по адресу ${address.substring(0, 10)}...`);

      const result = await this.whaleService.searchWhale(address);

      if (!result.found || !result.whale) {
        await this.bot.editMessageText(`❌ Кит с адресом ${address.substring(0, 10)}... не найден`, {
          chat_id: chatId,
          message_id: statusMsg.message_id,
        });
        return;
      }

      const text = TelegramFormatter.formatWhaleDetails(result.whale);

      await this.bot.editMessageText(text, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown',
      });
    } catch (error) {
      logger.error('Error handling /whale command', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка при поиске кита');
    }
  }

  /**
   * Handle /floor command - Floor price
   */
  private async handleFloor(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    try {
      const stats = await this.whaleService.getStats();

      if (!stats || !stats.data) {
        await this.bot.sendMessage(chatId, '❌ Не удалось получить данные о floor price');
        return;
      }

      const floorPrice = stats.data.floorPrice || 'N/A';
      const text = `
🏷️ *Floor Price MAYC*

Текущая цена: ${floorPrice} ETH

Обновлено: ${new Date().toLocaleTimeString('ru-RU')}
      `;

      await this.bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Error handling /floor command', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка при получении floor price');
    }
  }

  /**
   * Handle /refresh command - Admin cache refresh
   */
  private async handleRefresh(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;
    const adminId = process.env.TELEGRAM_ADMIN_ID || '';

    try {
      // Check if user is admin
      if (adminId && msg.from?.id.toString() !== adminId) {
        await this.bot.sendMessage(chatId, '❌ Доступ запрещен. Команда только для администратора.');
        return;
      }

      const statusMsg = await this.bot.sendMessage(chatId, '⏳ Очищаю кэш...');

      const result = await this.whaleService.refreshCache();

      await this.bot.editMessageText('✅ Кэш успешно очищен. Данные будут обновлены при следующем запросе.', {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown',
      });
    } catch (error) {
      logger.error('Error handling /refresh command', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка при очистке кэша');
    }
  }

  /**
   * Handle /stats command - Collection statistics
   */
  private async handleStats(msg: TelegramBot.Message): Promise<void> {
    const chatId = msg.chat.id;

    try {
      const statusMsg = await this.bot.sendMessage(chatId, '⏳ Загружаю статистику коллекции...');

      const analytics = await this.whaleService.getAnalytics();

      if (!analytics) {
        await this.bot.editMessageText('❌ Не удалось получить статистику', {
          chat_id: chatId,
          message_id: statusMsg.message_id,
        });
        return;
      }

      const text = TelegramFormatter.formatCollectionStats(analytics);

      await this.bot.editMessageText(text, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: 'Markdown',
      });
    } catch (error) {
      logger.error('Error handling /stats command', error);
      await this.bot.sendMessage(chatId, '❌ Ошибка при получении статистики');
    }
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
