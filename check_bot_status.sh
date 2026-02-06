#!/bin/bash

# Simple bot status checker
BASE_URL="https://nft-tracking.onrender.com"

echo "🔍 NFT Tracking Bot - Status Check"
echo "==================================="
echo ""

# Check health
echo "📊 Health Status:"
curl -k -s "$BASE_URL/health" 2>&1 | head -c 200
echo ""
echo ""

# Check bot status
echo "🤖 Bot Status:"
curl -k -s "$BASE_URL/status" 2>&1 | head -c 300
echo ""
echo ""

# Check debug (recent requests)
echo "📨 Recent Webhook Requests:"
curl -k -s "$BASE_URL/debug" 2>&1 | head -c 400
echo ""
echo ""

# Check current time
echo "⏰ Timestamp: $(date)"
