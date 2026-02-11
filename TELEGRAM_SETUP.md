# Настройка Telegram уведомлений

## 1. Получить TELEGRAM_BOT_TOKEN

### Шаг 1: Создать бота через @BotFather
1. Откройте Telegram и найдите **@BotFather**
2. Отправьте команду `/newbot` (если создаёте нового) или `/mybots` (для существующих)
3. Следуйте инструкциям: придумайте имя и username для бота
4. **Скопируйте токен** формата: `7583716058:AAGxxx...xxxxx`

### Пример:
```
BotFather: Congratulations! Here is your token:
7583716058:AAGxxx_your_token_here_xxxxx

Keep your token secure and store it safely, it can be used by anyone to control your bot.
```

---

## 2. Получить TELEGRAM_CHAT_ID

### Способ 1 (самый простой):
1. Найдите в Telegram бота **@userinfobot**
2. Напишите ему `/start`
3. Он ответит вашим **chat_id** (например: `123456789`)

### Способ 2 (через API):
1. Напишите **вашему боту** любое сообщение (например `/start`)
2. Откройте в браузере:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
3. Найдите в JSON: `"chat":{"id":123456789}`

---

## 3. Добавить переменные на Render

### В настройках Render (Dashboard → Environment):
```bash
TELEGRAM_BOT_TOKEN=7583716058:AAGxxx_your_actual_token_here
TELEGRAM_CHAT_ID=123456789
```

### Локально (в backend/.env):
```bash
TELEGRAM_BOT_TOKEN=7583716058:AAGxxx_your_actual_token_here
TELEGRAM_CHAT_ID=123456789
NOTIFY_ALL_TRANSACTIONS=true
```

---

## 4. Тестирование

### Тест через API:
```bash
curl -X POST https://nft-tracking-h9ex.onrender.com/api/alerts/test-notification \
  -H "Content-Type: application/json" \
  -d '{"channel": "telegram", "message": "🧪 Test from API - Hello!"}'
```

### Ожидаемый результат:
- В Telegram придёт сообщение: **"🧪 Test Notification - Test from API - Hello!"**

---

## 5. Режим тестирования (NOTIFY_ALL_TRANSACTIONS)

Когда `NOTIFY_ALL_TRANSACTIONS=true`, каждая транзакция MAYC будет отправлять уведомление:

**Пример уведомления:**
```
🐋 MAYC Transaction [WHALE]

🎨 Token: #5873
📝 Type: TRANSFER
📤 From: 0x8d847...1df3 🐋
📥 To: 0x0e2175...41be
🔗 TX: View on Etherscan

Real-time blockchain monitoring
```

**Когда отключить:**
- После успешного тестирования установите `NOTIFY_ALL_TRANSACTIONS=false`
- Тогда уведомления будут приходить только по Alert правилам

---

## 6. WebSocket статус (🟢 Live)

### Проблема: "🔴 Connecting..."
**Причина:** Frontend не может подключиться к WebSocket

### Решение:
Frontend `.env` обновлён на production URL:
```bash
REACT_APP_WS_URL=wss://nft-tracking-h9ex.onrender.com
```

После деплоя на Render:
1. Откройте https://nftai.one/transactions
2. Статус должен показывать **🟢 Live**
3. Новые транзакции появятся автоматически каждые ~12 секунд

---

## 7. Troubleshooting

### Telegram не отправляет:
```bash
# Проверить логи Render:
# Должно быть: "✅ Telegram notifications enabled"
# Если: "⚠️ Telegram notifications disabled" → проверьте TELEGRAM_BOT_TOKEN
```

### WebSocket не подключается:
```bash
# Проверить что Render env содержит:
WS_PORT=6255

# И что frontend использует wss:// (не ws://)
REACT_APP_WS_URL=wss://nft-tracking-h9ex.onrender.com
```

### Нет уведомлений на транзакции:
```bash
# Проверить что установлено:
NOTIFY_ALL_TRANSACTIONS=true

# Проверить логи - должно быть:
# "📨 Transaction notification sent: Token #5873"
```

---

## 8. Переход на Production Alerts

После тестирования:

1. **Отключить NOTIFY_ALL_TRANSACTIONS:**
   ```bash
   NOTIFY_ALL_TRANSACTIONS=false
   ```

2. **Создать Alert правила** через UI или API:
   ```bash
   POST /api/alerts/rules
   {
     "name": "Whale Activity Alert",
     "type": "whale",
     "condition": "above",
     "threshold": 0,
     "channels": ["telegram"]
   }
   ```

3. Теперь уведомления будут приходить только когда:
   - Whale активность > threshold
   - Floor price упадёт/вырастет выше порога
   - Volume превысит threshold
   - И т.д.

---

**Готово!** 🚀
