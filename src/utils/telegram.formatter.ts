import { Holder } from '../models/holder.model';
import { TransactionMetrics, Transaction } from '../models/transaction.model';

export class TelegramFormatter {
  static formatHolders(holders: Holder[], page: number = 1, perPage: number = 10): string {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const pageHolders = holders.slice(start, end);

    let message = `🏆 *Топ держатели MAYC* (страница ${page})\n\n`;

    pageHolders.forEach((holder, index) => {
      const rank = start + index + 1;
      const shortAddr = `${holder.address.slice(0, 6)}...${holder.address.slice(-4)}`;
      const percentage = holder.percentageOfCollection?.toFixed(2) || '0.00';
      message += `${rank}. \`${shortAddr}\`\n`;
      message += `   📦 ${holder.count} NFT (${percentage}%)\n\n`;
    });

    const totalPages = Math.ceil(holders.length / perPage);
    if (totalPages > 1) {
      message += `\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\n`;
      message += `Страница ${page} из ${totalPages}`;
    }

    return message;
  }

  static formatWhales(whales: Holder[]): string {
    let message = `🐋 *Киты* (10+ NFT)\n\n`;
    message += `📊 Всего китов: ${whales.length}\n\n`;

    const top10 = whales.slice(0, 10);
    top10.forEach((whale, index) => {
      const shortAddr = `${whale.address.slice(0, 6)}...${whale.address.slice(-4)}`;
      const percentage = whale.percentageOfCollection?.toFixed(2) || '0.00';
      message += `${index + 1}. \`${shortAddr}\` - ${whale.count} NFT (${percentage}%)\n`;
    });

    if (whales.length > 10) {
      message += `\n... и ещё ${whales.length - 10} китов`;
    }

    return message;
  }

  static formatDistribution(distribution: any): string {
    return `
📈 *Распределение владения*

🔹 С 1 NFT: ${distribution.single}
🔸 2-5 NFT: ${distribution.small}
🔶 6-10 NFT: ${distribution.medium}
🔴 10+ NFT (киты): ${distribution.whales}
    `;
  }

  static formatMetrics(metrics: TransactionMetrics, period: string): string {
    const periodDisplay = {
      '24h': '24 часа',
      '7d': '7 дней',
      '30d': '30 дней',
    }[period] || period;

    let message = `📊 *Метрики за ${periodDisplay}*\n\n`;
    message += `Транзакций: \`${metrics.transactionCount}\`\n`;
    message += `Объем: \`${metrics.volume.toFixed(2)} ETH\`\n`;

    if (metrics.avgPrice) {
      message += `Средняя цена: \`${metrics.avgPrice.toFixed(2)} ETH\`\n`;
    }
    if (metrics.medianPrice) {
      message += `Медиана: \`${metrics.medianPrice.toFixed(2)} ETH\`\n`;
    }
    if (metrics.floorPrice) {
      message += `Floor price: \`${metrics.floorPrice.toFixed(2)} ETH\`\n`;
    }

    message += `\nПокупателей: \`${metrics.uniqueBuyers}\`\n`;
    message += `Продавцов: \`${metrics.uniqueSellers}\`\n`;

    if (metrics.topTransaction) {
      message += `\nТоп сделка:\n`;
      message += `Token #${metrics.topTransaction.tokenId}: \`${metrics.topTransaction.priceETH.toFixed(2)} ETH\``;
    }

    return message;
  }

  static formatRecent(transactions: Transaction[]): string {
    if (transactions.length === 0) {
      return '📭 Нет транзакций';
    }

    let message = `🔄 *Последние ${Math.min(10, transactions.length)} транзакций*\n\n`;

    transactions.slice(0, 10).forEach((tx, index) => {
      const fromShort = `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`;
      const toShort = `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`;
      const typeEmoji = tx.type === 'sale' ? '💰' : '↔️';

      message += `${index + 1}. ${typeEmoji} Token #${tx.tokenId}\n`;
      message += `   From: \`${fromShort}\`\n`;
      message += `   To: \`${toShort}\`\n`;

      if (tx.priceETH) {
        message += `   Price: \`${tx.priceETH.toFixed(2)} ETH\`\n`;
      }

      message += '\n';
    });

    return message;
  }

  static formatStart(): string {
    return `
🎨 *NFT Analytics Bot - MAYC*

Добро пожаловать! Я помогу вам отслеживать Mutant Ape Yacht Club коллекцию в реальном времени.

📊 *Доступные команды:*

/holders - 🏆 Топ держатели
/whales - 🐋 Киты (10+ NFT)
/metrics - 📈 Торговые метрики
/recent - 🔄 Последние сделки
/subscribe - 🔔 Подписка на алерты
/help - ℹ️ Помощь

Используйте inline-кнопки для навигации и фильтрации данных!
    `;
  }

  static formatHelp(): string {
    return `
ℹ️ *Справка*

**/holders** - Показывает топ-50 держателей MAYC по количеству NFT
Используйте кнопки для переключения страниц.

**/whales** - Список "китов" - адресов с 10+ NFT
Можно фильтровать по количеству NFT.

**/metrics [период]** - Торговые метрики за выбранный период
Периоды: 24h (24 часа), 7d (7 дней), 30d (30 дней)

**/recent** - Последние 10 транзакций с информацией о цене

**/subscribe** - Настройка подписки на алерты
Получайте уведомления о:
- Активности китов (10+ NFT)
- Крупных сделках (>20 ETH)
- Новых входящих китов

**/help** - Эта справка

*Что такое кит?*
Адрес с 10 или более NFT из коллекции MAYC.

*Обновление данных*
Кэш обновляется каждые 10 минут. Нажимайте "🔄 Обновить" для форсированного обновления.
    `;
  }

  static formatWhaleAlert(address: string, action: 'buy' | 'sell', tokenIds: number[], totalNFTs: number): string {
    const actionEmoji = action === 'buy' ? '🟢' : '🔴';
    const actionText = action === 'buy' ? 'ПОКУПКА' : 'ПРОДАЖА';

    return `
${actionEmoji} *Активность кита!*

Адрес: \`${address}\`
Действие: *${actionText}*
Токены: \`${tokenIds.slice(0, 5).join(', ')}${tokenIds.length > 5 ? '...' : ''}\`
Всего NFT у кита: *${totalNFTs}*
    `;
  }

  static formatLargeSale(tokenId: number, priceETH: number, from: string, to: string): string {
    const fromShort = `${from.slice(0, 6)}...${from.slice(-4)}`;
    const toShort = `${to.slice(0, 6)}...${to.slice(-4)}`;

    return `
💰 *Крупная сделка!*

Token: \`#${tokenId}\`
Цена: *${priceETH.toFixed(2)} ETH*

От: \`${fromShort}\`
Кому: \`${toShort}\`
    `;
  }

  static formatSubscribeMenu(): string {
    return `
🔔 *Настройка подписки на алерты*

Выберите события, о которых вы хотите получать уведомления:

🐋 Активность китов (10+ NFT)
💰 Крупные сделки (>20 ETH)
📈 Всплески активности
⭐ Новые входящие киты

Используйте кнопки ниже для управления подпиской.
    `;
  }

  static getHoldersKeyboard(page: number, totalPages: number): any {
    const buttons = [];

    if (page > 1) {
      buttons.push([
        { text: '⬅️ Назад', callback_data: `holders_page_${page - 1}` },
      ]);
    }

    if (page < totalPages) {
      buttons.push([
        { text: 'Далее ➡️', callback_data: `holders_page_${page + 1}` },
      ]);
    }

    buttons.push([
      { text: '🔄 Обновить', callback_data: 'holders_refresh' },
      { text: '📊 Статистика', callback_data: 'distribution' },
    ]);

    return {
      inline_keyboard: buttons,
    };
  }

  static getMetricsKeyboard(): any {
    return {
      inline_keyboard: [
        [
          { text: '24h', callback_data: 'metrics_24h' },
          { text: '7d', callback_data: 'metrics_7d' },
          { text: '30d', callback_data: 'metrics_30d' },
        ],
        [
          { text: '🔄 Обновить', callback_data: 'metrics_refresh' },
        ],
      ],
    };
  }

  static getSubscribeKeyboard(subscribed: boolean[]): any {
    return {
      inline_keyboard: [
        [
          { text: `${subscribed[0] ? '✅' : '❌'} Киты`, callback_data: 'sub_whales' },
          { text: `${subscribed[1] ? '✅' : '❌'} Крупные сделки`, callback_data: 'sub_large' },
        ],
        [
          { text: `${subscribed[2] ? '✅' : '❌'} Всплески`, callback_data: 'sub_spikes' },
          { text: `${subscribed[3] ? '✅' : '❌'} Новые киты`, callback_data: 'sub_new_whales' },
        ],
        [
          { text: '✅ Включить все', callback_data: 'sub_all' },
          { text: '❌ Отключить все', callback_data: 'sub_none' },
        ],
      ],
    };
  }

  /**
   * Format top whales from Whale API response
   */
  static formatTopWhales(whales: any[]): string {
    let message = `🐋 *Топ 10 Китов MAYC*\n\n`;

    whales.slice(0, 10).forEach((whale, index) => {
      const addr = whale.address || '0x...';
      const shortAddr = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
      const count = whale.nftCount || 0;
      const percentage = ((count / 10000) * 100).toFixed(2); // Approximate % of 10k collection
      const value = whale.estimatedValueETH || 0;

      message += `${index + 1}. \`${shortAddr}\`\n`;
      message += `   📦 NFT: ${count} (${percentage}%)\n`;
      message += `   💰 Стоимость: ${value.toFixed(2)} ETH\n`;

      if (whale.ensName) {
        message += `   📛 ENS: ${whale.ensName}\n`;
      }
      message += `\n`;
    });

    return message;
  }

  /**
   * Format extended top whales list
   */
  static formatTopWhalesExtended(whales: any[]): string {
    let message = `🐋 *Топ 50 Китов MAYC*\n\n`;

    whales.forEach((whale, index) => {
      const addr = whale.address || '0x...';
      const shortAddr = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
      const count = whale.nftCount || 0;

      message += `${index + 1}. \`${shortAddr}\` - ${count} NFT\n`;

      if ((index + 1) % 10 === 0) {
        message += `\n`;
      }
    });

    return message;
  }

  /**
   * Format detailed whale info
   */
  static formatWhaleDetails(whale: any): string {
    const addr = whale.address || '0x...';
    const count = whale.nftCount || 0;
    const value = whale.estimatedValueETH || 0;
    const ethBalance = whale.ethBalance || 0;
    const tokenIds = whale.nftIds?.slice(0, 10) || [];

    let message = `🐋 *Детали Кита*\n\n`;
    message += `*Адрес:* \`${addr}\`\n`;

    if (whale.ensName) {
      message += `*ENS:* ${whale.ensName}\n`;
    }

    message += `\n📊 *Статистика*\n`;
    message += `NFT: ${count}\n`;
    message += `Стоимость (ETH): ${value.toFixed(2)}\n`;
    message += `Баланс ETH: ${ethBalance.toFixed(4)}\n`;
    message += `Рейтинг: #${whale.rank}\n`;

    if (tokenIds.length > 0) {
      message += `\n*Примеры токенов:* ${tokenIds.join(', ')}`;
      if (whale.nftIds && whale.nftIds.length > 10) {
        message += ` ... и ещё ${whale.nftIds.length - 10}`;
      }
    }

    return message;
  }

  /**
   * Format collection statistics
   */
  static formatCollectionStats(analytics: any): string {
    const stats = analytics.statistics || {};
    const dist = analytics.distribution || {};

    let message = `📊 *Статистика MAYC Коллекции*\n\n`;

    message += `*Общее*\n`;
    message += `Всего держателей: ${stats.totalHolders || 0}\n`;
    message += `Всего NFT: ${stats.totalNFTs || 0}\n`;
    message += `Среднее на держателя: ${stats.averagePerHolder?.toFixed(2) || 0}\n`;
    message += `Медиана: ${stats.medianPerHolder || 0}\n`;

    message += `\n*Распределение*\n`;
    message += `1 NFT: ${dist.single || 0}\n`;
    message += `2-5 NFT: ${dist.small || 0}\n`;
    message += `6-10 NFT: ${dist.medium || 0}\n`;
    message += `10+ NFT (киты): ${dist.whales || 0}\n`;

    message += `\n*Концентрация*\n`;
    message += `Топ 90 владеют: ${analytics.whale90Concentration?.toFixed(2) || 0}%\n`;

    return message;
  }
}
