#!/bin/bash

# Render Log Monitor Script
# Usage: ./monitor_logs.sh

SERVICE_ID="srv-d62qomsr85hc739qiml0"
API_KEY="rnd_sz2srqVpeSwyXXDBcDMG5wcR57oT"

echo "🔍 NFT Tracking Bot - Log Monitor"
echo "=================================="
echo "Service ID: $SERVICE_ID"
echo "URL: https://nft-tracking.onrender.com"
echo ""

# Get health status
echo "📊 Health Status:"
curl -k -s https://nft-tracking.onrender.com/health | head -c 200
echo ""
echo ""

# Get latest 10 events from Render API
echo "📅 Recent Events:"
curl -k -s -H "Authorization: Bearer $API_KEY" \
  "https://api.render.com/v1/services/$SERVICE_ID/events?limit=10" | \
  python3 -m json.tool 2>/dev/null | head -100

echo ""
echo "✅ Monitor complete. Check the Render Dashboard for real-time logs:"
echo "https://dashboard.render.com/web/srv-d62qomsr85hc739qiml0"
