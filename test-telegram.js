const axios = require('axios');

const TELEGRAM_BOT_TOKEN = '8541824250:AAG0nKwCp7y1SZzUcFoGYYZr-EXh-lx9o2E';
const TELEGRAM_CHAT_ID = '83436260';

const message = `🧪 <b>Test от Claude Code</b>

Telegram integration работает! ✅

Это тестовое сообщение для проверки интеграции с Telegram Bot API.`;

console.log('Sending test message to Telegram...');

axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
  chat_id: TELEGRAM_CHAT_ID,
  text: message,
  parse_mode: 'HTML'
})
.then(res => {
  console.log('✅ SUCCESS! Telegram message sent!');
  console.log('Message ID:', res.data.result.message_id);
  console.log('Chat ID:', res.data.result.chat.id);
  console.log('\n📱 Проверьте Telegram - должно прийти сообщение!');
})
.catch(err => {
  console.error('❌ ERROR sending Telegram message:');
  if (err.response) {
    console.error('Status:', err.response.status);
    console.error('Error:', err.response.data);
  } else {
    console.error(err.message);
  }
});
