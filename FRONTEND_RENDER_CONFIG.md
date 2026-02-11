# Frontend Render Configuration

## ⚠️ CRITICAL: Render Environment Variables

The frontend WebSocket connection requires these environment variables to be set in **Render Dashboard** (not in `.env` file):

### Required Variables:

```bash
REACT_APP_API_URL=https://nft-tracking-h9ex.onrender.com/api/whales
REACT_APP_WS_URL=wss://nft-tracking-h9ex.onrender.com
PORT=4100
```

## How to Update on Render:

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select the **frontend service** (nftai.one)
3. Go to **Environment** tab
4. Add/update the variables above
5. Click **Save Changes**
6. Render will automatically trigger a **rebuild and redeploy**

## Why This Is Required:

- React embeds `process.env.REACT_APP_*` variables **at build time**
- The `.env` file only works for **local development**
- On Render, environment variables must be set in the **Dashboard**
- After changing env vars, Render **rebuilds** the app with new values

## Current Issue:

- ✅ Backend WebSocket working: `wss://nft-tracking-h9ex.onrender.com`
- ✅ Backend detecting transactions (2 events in block 24435697)
- ✅ Telegram notifications working
- ❌ Frontend shows "🔴 Connecting..." instead of "🟢 Live"
- **Root cause**: Frontend was built without `REACT_APP_WS_URL` variable

## Verification After Deploy:

1. Open browser console on https://nftai.one/transactions
2. Check WebSocket connection status
3. Should see: `WebSocket connection to 'wss://nft-tracking-h9ex.onrender.com' succeeded`
4. Status should change to: **🟢 Live**
5. New transactions should appear every ~12 seconds

## Testing Locally:

To test WebSocket locally with production backend:

```bash
cd frontend

# Update .env for local testing
echo "REACT_APP_WS_URL=wss://nft-tracking-h9ex.onrender.com" >> .env

# Start dev server
npm start

# Open http://localhost:4100/transactions
# Should connect to production backend WebSocket
```

---

**Last Updated**: 2026-02-11
**Status**: Waiting for Render env vars to be set
