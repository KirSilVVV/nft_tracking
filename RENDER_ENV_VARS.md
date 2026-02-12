# Render Environment Variables

## Backend Service (nft-tracking-h9ex.onrender.com)

Добавьте эти переменные в **Render Dashboard → Environment**:

```bash
# Alchemy API
ALCHEMY_API_KEY=6V3IJ-j9_8g_VJK9G9k0i
ALCHEMY_NETWORK=eth-mainnet

# NFT Contract
NFT_CONTRACT_ADDRESS=0x60E4d786628Fea6478F785A6d7e704777c86a7c6

# OpenSea API
OPENSEA_API_KEY=a603241f212641f7a790a3ad277e8a79

# Server Configuration
PORT=6252
WS_PORT=6255
LOG_LEVEL=info

# Telegram Notifications
TELEGRAM_BOT_TOKEN=<your_telegram_bot_token>
TELEGRAM_CHAT_ID=<your_telegram_chat_id>

# SendGrid Email Notifications
SENDGRID_API_KEY=<your_sendgrid_api_key>
FROM_EMAIL=MAYC Alerts <alerts@nftai.one>
TO_EMAIL=<your_email@example.com>

# Test Mode (для тестов - уведомление на каждую транзакцию)
NOTIFY_ALL_TRANSACTIONS=true

# Alert Webhook (опционально)
ALERT_WEBHOOK_URL=https://your-webhook-url.com/alerts
```

---

## Frontend Service (nftai.one)

Добавьте эти переменные в **Render Dashboard → Environment** для frontend:

```bash
# API URL (production backend)
REACT_APP_API_URL=https://nft-tracking-h9ex.onrender.com/api/whales

# WebSocket URL (production WebSocket)
REACT_APP_WS_URL=wss://nft-tracking-h9ex.onrender.com

# Frontend Port
PORT=4100
```

---

## Как обновить env vars на Render:

1. Зайдите в **Render Dashboard**
2. Выберите сервис (backend или frontend)
3. Перейдите в **Environment**
4. Добавьте/обновите переменные
5. Нажмите **Save Changes**
6. Render автоматически сделает redeploy

---

## После обновления TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID:

### Тест 1: Проверить что Telegram работает
```bash
curl -X POST https://nft-tracking-h9ex.onrender.com/api/alerts/test-notification \
  -H "Content-Type: application/json" \
  -d '{"channel": "telegram", "message": "Test message"}'
```

**Ожидаемый результат:** Сообщение придёт в Telegram

### Тест 2: Проверить WebSocket
Откройте: https://nftai.one/transactions

**Ожидаемый результат:** Статус показывает **🟢 Live** (не 🔴 Connecting...)

### Тест 3: Проверить уведомления на транзакции
При `NOTIFY_ALL_TRANSACTIONS=true` каждая новая MAYC транзакция (каждые ~12 секунд) будет отправлять Telegram уведомление.

**Когда всё работает:** Установите `NOTIFY_ALL_TRANSACTIONS=false` чтобы получать уведомления только по Alert правилам.

---

## Важно:

- `.env` файлы НЕ коммитятся в Git (в .gitignore)
- Все секретные данные (токены, API keys) хранятся только на Render
- После изменения env vars Render автоматически делает redeploy (~2-3 минуты)
