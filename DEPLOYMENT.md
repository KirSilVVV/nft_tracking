# Deployment Guide: NFT Tracking Bot on Render

## ✅ Current Status

- ✅ Telegram bot fully implemented with 6 commands
- ✅ Backend services integrated (Blockchain, Analytics, Caching)
- ✅ Real-time notification system ready
- ✅ Code compiled and tested locally
- ✅ All code pushed to GitHub (main branch)
- ✅ render.yaml configuration ready

## 🚀 Deploy to Render (5 minutes)

### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub account
3. Authorize Render to access your GitHub repositories

### Step 2: Create Web Service

1. Click **New +** button
2. Select **Web Service**
3. Select repository: `nft_tracking`
4. Connect repository

### Step 3: Configure Deployment

Fill in the following:

- **Name**: `nft-tracking-bot`
- **Environment**: `Node`
- **Region**: Choose closest to you
- **Branch**: `main`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Instance Type**: `Free` (or `Standard` for better uptime)

### Step 4: Add Environment Variables

Click **Environment** and add these variables:

```
TELEGRAM_BOT_TOKEN     = 8541824250:AAG0nKwCp7y1SZzUcFoGYYZr-EXh-lx9o2E
ALCHEMY_API_KEY        = 6V3IJ-j9_8g_VJK9G9k0i
NFT_CONTRACT_ADDRESS   = 0x60E4d786628Fea6478F785A6d7e704777c86a7c6
ALCHEMY_NETWORK        = eth-mainnet
NODE_ENV               = production
LOG_LEVEL              = info
```

### Step 5: Deploy

1. Click **Create Web Service**
2. Wait for build to complete (2-3 minutes)
3. Check logs to verify bot is running

You should see:
```
✅ Telegram bot initialized
🔄 Starting blockchain monitoring...
✅ Bot is running!
```

### Step 6: Test the Bot

1. Find bot in Telegram (search for bot name or use deep link)
2. Send `/start` command
3. Try other commands: `/holders`, `/whales`, `/metrics`, `/recent`

## 📊 Expected Output

### /start
```
🎨 NFT Analytics Bot - MAYC

Добро пожаловать! Я помогу вам отслеживать Mutant Ape Yacht Club коллекцию!
...
```

### /holders
```
🏆 Топ держатели MAYC (страница 1)

1. 0x1234...5678
   📦 542 NFT (5.42%)
...
```

### /whales
```
🐋 Киты (10+ NFT)

📊 Всего китов: 49
...
```

### /metrics
```
📊 Метрики за 24 часа

Транзакций: 150
Объем: 1,250.75 ETH
...
```

## ⚙️ Configuration

### Free Tier Limitations
- Service spins down after 15 min inactivity
- First request after sleep = 30-60 sec delay
- Solution: Keep-alive service or upgrade to Standard ($7/month)

### Uptime Solution
To prevent spin-down, add a keep-alive service:

1. Use [UptimeRobot](https://uptimerobot.com/) - free
2. Ping your bot URL every 10 minutes
3. This keeps the service warm

Example URL to ping:
```
https://your-service-name.onrender.com/
```

## 🔄 Update Bot

To update the bot after code changes:

1. Push changes to GitHub:
   ```bash
   git add -A
   git commit -m "Update bot"
   git push origin main
   ```

2. Render will automatically redeploy within 1-2 minutes

## 📱 Using the Bot

### Commands
- `/start` - Welcome & help
- `/holders` - Top 50 NFT holders
- `/whales` - Whale addresses (10+ NFT)
- `/metrics` - Trading metrics (24h/7d/30d)
- `/recent` - Last 10 transactions
- `/subscribe` - Manage alert subscriptions
- `/help` - Detailed help

### Features
- Real-time whale activity alerts
- Large sale notifications (>20 ETH)
- Activity spike detection
- New whale entry detection
- Customizable subscriptions

## 🐛 Troubleshooting

### Bot not responding
**Solution**:
- Check TELEGRAM_BOT_TOKEN is correct
- Check Render logs for errors
- Restart service

### "Failed to get data" error
**Solution**:
- Verify ALCHEMY_API_KEY is valid
- Check API rate limits in Alchemy dashboard
- Wait and retry

### Service keeps crashing
**Solution**:
- Check logs in Render dashboard
- Verify all environment variables are set
- Check Node.js version compatibility

### Slow responses
**Solution**:
- This is normal on free tier (cold start)
- Upgrade to Standard plan for better performance
- Implement keep-alive to reduce cold starts

## 📈 Monitoring

### View Logs
1. Go to Render dashboard
2. Select your service
3. Click **Logs** tab
4. Real-time logs will appear

### Check Status
1. Service page shows:
   - Status (Running, Building, Crashed)
   - Last deploy time
   - Active connections

### Collect Metrics
The bot logs include:
- Command execution times
- Error rates
- Cache hit rates
- Active users

## 🔐 Security Notes

- Never commit `.env` with real tokens
- Use Render's environment variable system
- Rotate keys periodically
- Monitor for unauthorized access in logs

## 📞 Support

- **Render Issues**: Check Render docs at render.com/docs
- **Telegram Bot Issues**: Check Telegram Bot API docs
- **Blockchain Issues**: Check Alchemy docs
- **Code Issues**: Check GitHub issue tracker

## ✨ Next Steps

After deployment:

1. **Share with users**: Send bot link on Telegram
2. **Monitor**: Check logs regularly
3. **Gather feedback**: Ask users about features
4. **Improve**: Add more commands/features based on feedback
5. **Scale**: Upgrade to paid plan if needed

## 📊 Success Metrics

After deployment, you can track:
- Number of active users
- Commands used most frequently
- Error rates
- Response times
- Cache hit rates

---

**Deployment ready!** 🚀

Your bot will be live at:
```
https://nft-tracking-bot.onrender.com
```

Find it in Telegram by searching for the bot username or using the deep link.
